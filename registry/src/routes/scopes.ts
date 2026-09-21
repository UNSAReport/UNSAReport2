import { createHash } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import JSZip from 'jszip';
import { config } from '@/config';
import { db } from '@/db';
import {
  scopeFiles,
  scopeInvitations,
  scopeMembers,
  scopeRequests,
  scopes,
} from '@/db/schema';
import { PACKAGE_SCOPE_PART } from '@/lib/package-name';
import {
  buildAndUploadZipArchive,
  getPresignedUrl,
  uploadS3Object,
} from '@/lib/s3';
import { emailToScopeSlug } from '@/lib/slug';
import {
  expandGlobs,
  parseUnsareportToml,
  SCOPE_NAME_REGEX,
  validateUnsareportToml,
} from '@/lib/unsareport-toml';
import { optionalAuth, requireAuth } from '@/middleware/auth';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/middleware/error-handler';
import type { HonoEnv } from '@/types';

export const scopesRouter = new Hono<HonoEnv>();

/**
 * Automatically ensures that an authenticated user has their personal
 * email-slugged scope provisioned and registered in `scopes` and `scope_members`.
 */
export async function ensureUserPersonalScope(user: {
  id: string;
  email?: string;
}) {
  if (!user.email) return null;
  const scopeName = emailToScopeSlug(user.email);
  const existing = await db
    .select()
    .from(scopes)
    .where(eq(scopes.name, scopeName))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const scopeId = crypto.randomUUID();
  const now = new Date();
  await db.insert(scopes).values({
    id: scopeId,
    name: scopeName,
    description: `Personal scope for ${user.email}`,
    ownerId: user.id,
    scopeType: 'email',
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(scopeMembers).values({
    id: crypto.randomUUID(),
    scopeId,
    userId: user.id,
    role: 'admin',
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: scopeId,
    name: scopeName,
    description: `Personal scope for ${user.email}`,
    ownerId: user.id,
    scopeType: 'email',
    archiveS3Key: null,
    createdAt: now,
    updatedAt: now,
  };
}

// Auto-provision user's personal scope on any authenticated scope request
scopesRouter.use('*', optionalAuth, async (c, next) => {
  const user = c.get('user');
  if (user) {
    await ensureUserPersonalScope(user);
  }
  await next();
});

/**
 * List all scopes that the authenticated user owns or participates in.
 */
scopesRouter.get('/', requireAuth, async (c) => {
  const user = c.get('user')!;
  const userScopes = await db
    .select({
      id: scopes.id,
      name: scopes.name,
      description: scopes.description,
      ownerId: scopes.ownerId,
      scopeType: scopes.scopeType,
      role: scopeMembers.role,
      createdAt: scopes.createdAt,
      updatedAt: scopes.updatedAt,
    })
    .from(scopes)
    .innerJoin(scopeMembers, eq(scopes.id, scopeMembers.scopeId))
    .where(eq(scopeMembers.userId, user.id));

  return c.json({ scopes: userScopes });
});

/**
 * Submit a request to register a custom scope.
 */
scopesRouter.post('/requests', requireAuth, async (c) => {
  const user = c.get('user')!;
  const body = (await c.req.json().catch(() => ({}))) as {
    scopeName?: string;
    reason?: string;
  };

  const scopeName = body.scopeName?.trim();
  const reason = body.reason?.trim();

  if (!scopeName || !SCOPE_NAME_REGEX.test(scopeName)) {
    throw new ValidationError(
      'scopeName must be a valid @scope format (e.g. "@myorg")',
      { field: 'scopeName' },
    );
  }
  if (!reason || reason.length < 5) {
    throw new ValidationError(
      'reason must be a non-empty explanation (at least 5 chars)',
      { field: 'reason' },
    );
  }

  const existingScope = await db
    .select({ id: scopes.id })
    .from(scopes)
    .where(eq(scopes.name, scopeName))
    .limit(1);
  if (existingScope.length > 0) {
    throw new ConflictError(`Scope "${scopeName}" already exists`);
  }

  const pendingRequest = await db
    .select({ id: scopeRequests.id })
    .from(scopeRequests)
    .where(
      and(
        eq(scopeRequests.scopeName, scopeName),
        eq(scopeRequests.status, 'pending'),
      ),
    )
    .limit(1);
  if (pendingRequest.length > 0) {
    throw new ConflictError(
      `A pending request for "${scopeName}" is already under review`,
    );
  }

  const id = crypto.randomUUID();
  const now = new Date();
  await db.insert(scopeRequests).values({
    id,
    scopeName,
    requestedBy: user.id,
    reason,
    status: 'pending',
    createdAt: now,
  });

  return c.json(
    {
      message: 'Scope request submitted successfully and is pending review',
      request: { id, scopeName, status: 'pending', createdAt: now },
    },
    201,
  );
});

/**
 * Get details, members, and file summary for a scope.
 */
scopesRouter.get(`/:scope{${PACKAGE_SCOPE_PART}}`, async (c) => {
  const scopeName = c.req.param('scope');
  const scopeRows = await db
    .select()
    .from(scopes)
    .where(eq(scopes.name, scopeName))
    .limit(1);

  if (scopeRows.length === 0) {
    throw new NotFoundError(`Scope "${scopeName}" not found`);
  }
  const scope = scopeRows[0];

  const members = await db
    .select({
      userId: scopeMembers.userId,
      role: scopeMembers.role,
      createdAt: scopeMembers.createdAt,
    })
    .from(scopeMembers)
    .where(eq(scopeMembers.scopeId, scope.id));

  const files = await db
    .select({
      path: scopeFiles.path,
      size: scopeFiles.size,
      checksum: scopeFiles.checksum,
    })
    .from(scopeFiles)
    .where(eq(scopeFiles.scopeId, scope.id));

  return c.json({
    scope: {
      id: scope.id,
      name: scope.name,
      description: scope.description,
      ownerId: scope.ownerId,
      scopeType: scope.scopeType,
      hasArchive: !!scope.archiveS3Key,
      createdAt: scope.createdAt,
      updatedAt: scope.updatedAt,
      members,
      files,
    },
  });
});

/**
 * Upload and push scope-level contents (unsareport.toml + zip payload).
 * Requires scope admin or system admin.
 */
scopesRouter.post(
  `/:scope{${PACKAGE_SCOPE_PART}}/contents`,
  requireAuth,
  async (c) => {
    const user = c.get('user')!;
    const scopeName = c.req.param('scope');

    const scopeRows = await db
      .select()
      .from(scopes)
      .where(eq(scopes.name, scopeName))
      .limit(1);
    if (scopeRows.length === 0) {
      throw new NotFoundError(`Scope "${scopeName}" not found`);
    }
    const scope = scopeRows[0];

    // Check authorization: must be system admin, scope owner, or scope admin
    const isAdmin = user.roles.includes('admin');
    const isOwner = scope.ownerId === user.id;
    let isScopeAdmin = isOwner || isAdmin;

    if (!isScopeAdmin) {
      const memberRow = await db
        .select({ role: scopeMembers.role })
        .from(scopeMembers)
        .where(
          and(
            eq(scopeMembers.scopeId, scope.id),
            eq(scopeMembers.userId, user.id),
          ),
        )
        .limit(1);
      if (memberRow.length > 0 && memberRow[0].role === 'admin') {
        isScopeAdmin = true;
      }
    }

    if (!isScopeAdmin) {
      throw new ForbiddenError(
        `Admin role in scope "${scopeName}" is required to push scope contents`,
      );
    }

    const formData = await c.req.parseBody({ all: true });

    let manifestText: string | null = null;
    const manifestField =
      formData.manifest ??
      formData['unsareport.toml'] ??
      formData.pkg ??
      formData.config;
    if (typeof manifestField === 'string') {
      manifestText = manifestField;
    } else if (manifestField instanceof File) {
      manifestText = await manifestField.text();
    }

    if (!manifestText || manifestText.trim().length === 0) {
      throw new ValidationError(
        'Missing unsareport.toml document in the "manifest" multipart field',
        { field: 'manifest' },
      );
    }

    let archiveFile: File | null = null;
    if (formData.files instanceof File) {
      archiveFile = formData.files;
    } else if (formData.archive instanceof File) {
      archiveFile = formData.archive;
    } else {
      for (const val of Object.values(formData)) {
        if (val instanceof File) {
          archiveFile = val;
          break;
        }
      }
    }

    if (!archiveFile) {
      throw new ValidationError(
        'Missing scope archive (.zip) in multipart request',
        { field: 'files' },
      );
    }

    const rawZipBuffer = Buffer.from(await archiveFile.arrayBuffer());
    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(rawZipBuffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new ValidationError(`Failed to read ZIP archive: ${msg}`, {
        field: 'files',
      });
    }

    const zipBuffers = new Map<string, Buffer>();
    const zipPaths: string[] = [];
    for (const [entryName, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const normalized = entryName.replace(/^\.\//, '');
      if (
        normalized.length === 0 ||
        normalized.startsWith('/') ||
        normalized.includes('\\') ||
        normalized.split('/').some((seg) => seg === '..' || seg.length === 0)
      ) {
        throw new ValidationError(
          `ZIP entry "${entryName}" escapes the scope root or is not a relative path`,
          { field: 'files' },
        );
      }
      zipPaths.push(normalized);
      zipBuffers.set(normalized, await entry.async('nodebuffer'));
    }

    const rawParsed = parseUnsareportToml(manifestText);
    const doc = validateUnsareportToml(rawParsed);

    if (!doc.scope) {
      throw new ValidationError(
        'unsareport.toml must contain a [scope] table to push scope contents',
        { field: 'scope' },
      );
    }
    if (doc.scope.name !== scopeName) {
      throw new ValidationError(
        `unsareport.toml [scope] "name" ("${doc.scope.name}") does not match route scope ("${scopeName}")`,
        { field: 'scope.name' },
      );
    }

    const matchedFiles = expandGlobs(doc.scope.files, zipPaths);
    if (matchedFiles.length === 0) {
      throw new ValidationError(
        `Declared scope files did not match any files in the archive`,
        { field: 'scope.files' },
      );
    }

    const s3Prefix = `scopes/${scopeName.replace('@', '')}/`;
    const archiveS3Key = `${s3Prefix}scope.zip`;

    // Upload individual files
    await db.delete(scopeFiles).where(eq(scopeFiles.scopeId, scope.id));

    const archiveEntries: { path: string; content: Buffer }[] = [];
    for (const fPath of matchedFiles) {
      const buf = zipBuffers.get(fPath)!;
      const fileS3Key = `${s3Prefix}${fPath}`;
      const checksum = createHash('sha256').update(buf).digest('hex');

      await uploadS3Object(fileS3Key, buf);
      archiveEntries.push({ path: fPath, content: buf });

      await db.insert(scopeFiles).values({
        id: crypto.randomUUID(),
        scopeId: scope.id,
        path: fPath,
        size: buf.length,
        checksum,
        s3Key: fileS3Key,
      });
    }

    // Include unsareport.toml in the scope archive
    archiveEntries.push({
      path: 'unsareport.toml',
      content: Buffer.from(manifestText, 'utf8'),
    });

    await buildAndUploadZipArchive(archiveS3Key, archiveEntries);

    const now = new Date();
    await db
      .update(scopes)
      .set({
        archiveS3Key,
        description: doc.scope.description ?? scope.description,
        updatedAt: now,
      })
      .where(eq(scopes.id, scope.id));

    return c.json({
      message: `Successfully pushed contents to scope "${scopeName}"`,
      scope: {
        name: scopeName,
        files: matchedFiles,
        archiveS3Key,
        updatedAt: now,
      },
    });
  },
);

/**
 * Get presigned URL to download scope archive bundle.
 */
scopesRouter.get(`/:scope{${PACKAGE_SCOPE_PART}}/archive`, async (c) => {
  const scopeName = c.req.param('scope');
  const scopeRows = await db
    .select({ archiveS3Key: scopes.archiveS3Key })
    .from(scopes)
    .where(eq(scopes.name, scopeName))
    .limit(1);

  if (scopeRows.length === 0) {
    throw new NotFoundError(`Scope "${scopeName}" not found`);
  }
  const archiveKey = scopeRows[0].archiveS3Key;
  if (!archiveKey) {
    throw new NotFoundError(
      `Scope "${scopeName}" has no pushed archive or contents`,
    );
  }

  const downloadUrl = await getPresignedUrl(archiveKey);
  return c.json({ downloadUrl, archiveS3Key: archiveKey });
});

/**
 * List files in scope.
 */
scopesRouter.get(`/:scope{${PACKAGE_SCOPE_PART}}/files`, async (c) => {
  const scopeName = c.req.param('scope');
  const scopeRows = await db
    .select({ id: scopes.id })
    .from(scopes)
    .where(eq(scopes.name, scopeName))
    .limit(1);

  if (scopeRows.length === 0) {
    throw new NotFoundError(`Scope "${scopeName}" not found`);
  }

  const files = await db
    .select({
      path: scopeFiles.path,
      size: scopeFiles.size,
      checksum: scopeFiles.checksum,
    })
    .from(scopeFiles)
    .where(eq(scopeFiles.scopeId, scopeRows[0].id));

  return c.json({ files });
});

/**
 * Invite a user to a scope as admin or contributor.
 */
scopesRouter.post(
  `/:scope{${PACKAGE_SCOPE_PART}}/invitations`,
  requireAuth,
  async (c) => {
    const user = c.get('user')!;
    const scopeName = c.req.param('scope');

    const scopeRows = await db
      .select()
      .from(scopes)
      .where(eq(scopes.name, scopeName))
      .limit(1);
    if (scopeRows.length === 0) {
      throw new NotFoundError(`Scope "${scopeName}" not found`);
    }
    const scope = scopeRows[0];

    const isAdmin = user.roles.includes('admin');
    const isOwner = scope.ownerId === user.id;
    let isScopeAdmin = isOwner || isAdmin;

    if (!isScopeAdmin) {
      const memberRow = await db
        .select({ role: scopeMembers.role })
        .from(scopeMembers)
        .where(
          and(
            eq(scopeMembers.scopeId, scope.id),
            eq(scopeMembers.userId, user.id),
          ),
        )
        .limit(1);
      if (memberRow.length > 0 && memberRow[0].role === 'admin') {
        isScopeAdmin = true;
      }
    }

    if (!isScopeAdmin) {
      throw new ForbiddenError(
        `Only scope admins can invite new members to "${scopeName}"`,
      );
    }

    const body = (await c.req.json().catch(() => ({}))) as {
      email?: string;
      role?: string;
    };
    const targetEmail = body.email?.trim().toLowerCase();
    const role = body.role === 'admin' ? 'admin' : 'contributor';

    if (!targetEmail || !targetEmail.includes('@')) {
      throw new ValidationError('A valid target email address is required', {
        field: 'email',
      });
    }

    const id = crypto.randomUUID();
    const now = new Date();
    await db.insert(scopeInvitations).values({
      id,
      scopeId: scope.id,
      email: targetEmail,
      role,
      invitedBy: user.id,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    return c.json(
      {
        message: `Invitation sent to ${targetEmail} for scope ${scopeName}`,
        invitation: { id, email: targetEmail, role, status: 'pending' },
      },
      201,
    );
  },
);

/**
 * Accept a scope invitation.
 */
scopesRouter.post('/invitations/:id/accept', requireAuth, async (c) => {
  const user = c.get('user')!;
  const invitationId = c.req.param('id');

  const invRows = await db
    .select()
    .from(scopeInvitations)
    .where(
      and(
        eq(scopeInvitations.id, invitationId),
        eq(scopeInvitations.status, 'pending'),
      ),
    )
    .limit(1);

  if (invRows.length === 0) {
    throw new NotFoundError('Pending invitation not found');
  }
  const inv = invRows[0];

  if (user.email && user.email.toLowerCase() !== inv.email.toLowerCase()) {
    throw new ForbiddenError(
      `Invitation was issued for ${inv.email}, not ${user.email}`,
    );
  }

  const now = new Date();
  await db
    .update(scopeInvitations)
    .set({ status: 'accepted', updatedAt: now })
    .where(eq(scopeInvitations.id, inv.id));

  await db
    .insert(scopeMembers)
    .values({
      id: crypto.randomUUID(),
      scopeId: inv.scopeId,
      userId: user.id,
      role: inv.role,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [scopeMembers.scopeId, scopeMembers.userId],
      set: { role: inv.role, updatedAt: now },
    });

  return c.json({
    message: 'Invitation accepted successfully',
    role: inv.role,
  });
});

/**
 * Decline a scope invitation.
 */
scopesRouter.post('/invitations/:id/decline', requireAuth, async (c) => {
  const user = c.get('user')!;
  const invitationId = c.req.param('id');

  const invRows = await db
    .select()
    .from(scopeInvitations)
    .where(
      and(
        eq(scopeInvitations.id, invitationId),
        eq(scopeInvitations.status, 'pending'),
      ),
    )
    .limit(1);

  if (invRows.length === 0) {
    throw new NotFoundError('Pending invitation not found');
  }
  const inv = invRows[0];

  if (user.email && user.email.toLowerCase() !== inv.email.toLowerCase()) {
    throw new ForbiddenError(
      `Invitation was issued for ${inv.email}, not ${user.email}`,
    );
  }

  await db
    .update(scopeInvitations)
    .set({ status: 'declined', updatedAt: new Date() })
    .where(eq(scopeInvitations.id, inv.id));

  return c.json({ message: 'Invitation declined' });
});

/**
 * Remove a member from a scope.
 */
scopesRouter.delete(
  `/:scope{${PACKAGE_SCOPE_PART}}/members/:userId`,
  requireAuth,
  async (c) => {
    const user = c.get('user')!;
    const scopeName = c.req.param('scope');
    const targetUserId = c.req.param('userId');

    const scopeRows = await db
      .select()
      .from(scopes)
      .where(eq(scopes.name, scopeName))
      .limit(1);
    if (scopeRows.length === 0) {
      throw new NotFoundError(`Scope "${scopeName}" not found`);
    }
    const scope = scopeRows[0];

    if (scope.ownerId === targetUserId) {
      throw new ValidationError('Cannot remove the owner of the scope', {
        field: 'userId',
      });
    }

    const isAdmin = user.roles.includes('admin');
    const isOwner = scope.ownerId === user.id;
    let isScopeAdmin = isOwner || isAdmin;

    if (!isScopeAdmin) {
      const memberRow = await db
        .select({ role: scopeMembers.role })
        .from(scopeMembers)
        .where(
          and(
            eq(scopeMembers.scopeId, scope.id),
            eq(scopeMembers.userId, user.id),
          ),
        )
        .limit(1);
      if (memberRow.length > 0 && memberRow[0].role === 'admin') {
        isScopeAdmin = true;
      }
    }

    if (!isScopeAdmin && user.id !== targetUserId) {
      throw new ForbiddenError(
        'Only scope admins can remove members from a scope',
      );
    }

    await db
      .delete(scopeMembers)
      .where(
        and(
          eq(scopeMembers.scopeId, scope.id),
          eq(scopeMembers.userId, targetUserId),
        ),
      );

    return c.json({ message: 'Member removed successfully' });
  },
);

/**
 * Update a scope member's role (admin <-> contributor).
 */
scopesRouter.patch(
  `/:scope{${PACKAGE_SCOPE_PART}}/members/:userId`,
  requireAuth,
  async (c) => {
    const user = c.get('user')!;
    const scopeName = c.req.param('scope');
    const targetUserId = c.req.param('userId');

    const scopeRows = await db
      .select()
      .from(scopes)
      .where(eq(scopes.name, scopeName))
      .limit(1);
    if (scopeRows.length === 0) {
      throw new NotFoundError(`Scope "${scopeName}" not found`);
    }
    const scope = scopeRows[0];

    const isAdmin = user.roles.includes('admin');
    const isOwner = scope.ownerId === user.id;
    let isScopeAdmin = isOwner || isAdmin;

    if (!isScopeAdmin) {
      const memberRow = await db
        .select({ role: scopeMembers.role })
        .from(scopeMembers)
        .where(
          and(
            eq(scopeMembers.scopeId, scope.id),
            eq(scopeMembers.userId, user.id),
          ),
        )
        .limit(1);
      if (memberRow.length > 0 && memberRow[0].role === 'admin') {
        isScopeAdmin = true;
      }
    }

    if (!isScopeAdmin) {
      throw new ForbiddenError(
        'Only scope admins can change member roles in a scope',
      );
    }

    const body = (await c.req.json().catch(() => ({}))) as { role?: string };
    const role = body.role === 'admin' ? 'admin' : 'contributor';

    await db
      .update(scopeMembers)
      .set({ role, updatedAt: new Date() })
      .where(
        and(
          eq(scopeMembers.scopeId, scope.id),
          eq(scopeMembers.userId, targetUserId),
        ),
      );

    return c.json({ message: 'Member role updated successfully', role });
  },
);
