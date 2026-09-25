import { and, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '@/db';
import {
  packages,
  packageVersions,
  scopeMembers,
  scopeRequests,
  scopes,
  trustedUsers,
} from '@/db/schema';
import {
  requestPackageName,
  scopedNameRoute,
  unscopedNameRoute,
} from '@/lib/package-name';
import { requireAuth, requireRole } from '@/middleware/auth';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/middleware/error-handler';
import type { HonoEnv } from '@/types';

const adminRouter = new Hono<HonoEnv>();

adminRouter.use('*', requireAuth, requireRole('registry', 'admin'));

adminRouter.get('/pending', async (c) => {
  const pendingRows = await db
    .select({
      packageId: packages.id,
      name: packages.name,
      displayName: packages.displayName,
      authorId: packages.authorId,
      versionId: packageVersions.id,
      version: packageVersions.version,
      fileCount: packageVersions.fileCount,
      createdAt: packageVersions.createdAt,
    })
    .from(packageVersions)
    .innerJoin(packages, eq(packageVersions.packageId, packages.id))
    .where(eq(packageVersions.status, 'pending'))
    .orderBy(desc(packageVersions.createdAt));

  return c.json({ pending: pendingRows });
});

adminRouter.on(
  'POST',
  [
    unscopedNameRoute('/packages', '/:version/approve'),
    scopedNameRoute('/packages', '/:version/approve'),
  ],
  async (c) => {
    const name = requestPackageName(c.req.param());
    const version = c.req.param('version') ?? '';

    const pkgList = await db
      .select()
      .from(packages)
      .where(eq(packages.name, name))
      .limit(1);

    if (pkgList.length === 0) {
      throw new NotFoundError(`Package '${name}' not found`);
    }

    const pkg = pkgList[0];

    const verList = await db
      .select()
      .from(packageVersions)
      .where(
        and(
          eq(packageVersions.packageId, pkg.id),
          eq(packageVersions.version, version),
        ),
      )
      .limit(1);

    if (verList.length === 0) {
      throw new NotFoundError(
        `Version '${version}' not found for package '${name}'`,
      );
    }

    const ver = verList[0];
    const now = new Date();

    await db
      .update(packageVersions)
      .set({
        status: 'approved',
        approvedAt: now,
        rejectionReason: null,
      })
      .where(eq(packageVersions.id, ver.id));

    await db
      .update(packages)
      .set({
        status: 'approved',
        latestVersion: version,
        updatedAt: now,
      })
      .where(eq(packages.id, pkg.id));

    return c.json({
      message: `Version '${version}' of package '${name}' approved successfully`,
    });
  },
);

adminRouter.on(
  'POST',
  [
    unscopedNameRoute('/packages', '/:version/reject'),
    scopedNameRoute('/packages', '/:version/reject'),
  ],
  async (c) => {
    const name = requestPackageName(c.req.param());
    const version = c.req.param('version') ?? '';

    let body: Record<string, unknown> = {};
    if ((c.req.header('content-type') || '').includes('application/json')) {
      try {
        body = (await c.req.json()) as Record<string, unknown>;
      } catch {
        throw new ValidationError('Malformed JSON body');
      }
    }

    const reason = (body.reason as string) || 'No reason provided';

    const pkgList = await db
      .select()
      .from(packages)
      .where(eq(packages.name, name))
      .limit(1);

    if (pkgList.length === 0) {
      throw new NotFoundError(`Package '${name}' not found`);
    }

    const pkg = pkgList[0];

    const verList = await db
      .select()
      .from(packageVersions)
      .where(
        and(
          eq(packageVersions.packageId, pkg.id),
          eq(packageVersions.version, version),
        ),
      )
      .limit(1);

    if (verList.length === 0) {
      throw new NotFoundError(
        `Version '${version}' not found for package '${name}'`,
      );
    }

    const ver = verList[0];
    const now = new Date();

    await db
      .update(packageVersions)
      .set({
        status: 'rejected',
        rejectionReason: reason,
      })
      .where(eq(packageVersions.id, ver.id));

    const approvedCount = await db
      .select({ id: packageVersions.id })
      .from(packageVersions)
      .where(
        and(
          eq(packageVersions.packageId, pkg.id),
          eq(packageVersions.status, 'approved'),
        ),
      );

    if (approvedCount.length === 0) {
      await db
        .update(packages)
        .set({
          status: 'rejected',
          rejectionReason: reason,
          updatedAt: now,
        })
        .where(eq(packages.id, pkg.id));
    }

    return c.json({
      message: `Version '${version}' of package '${name}' rejected`,
      reason,
    });
  },
);

adminRouter.get('/trusted', async (c) => {
  const users = await db.select().from(trustedUsers);
  return c.json({ trustedUsers: users });
});

adminRouter.post('/trusted', async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new UnauthorizedError();
  }

  let body: Record<string, unknown>;
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    throw new ValidationError('Invalid JSON body');
  }

  if (!body.userId || typeof body.userId !== 'string') {
    throw new ValidationError('Field "userId" (UUID) is required', {
      field: 'userId',
    });
  }

  const targetUserId = body.userId.trim();

  const existing = await db
    .select()
    .from(trustedUsers)
    .where(eq(trustedUsers.userId, targetUserId))
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError(`User '${targetUserId}' is already a trusted user`);
  }

  const now = new Date();

  await db.insert(trustedUsers).values({
    userId: targetUserId,
    grantedBy: user.id,
    createdAt: now,
  });

  return c.json(
    {
      userId: targetUserId,
      grantedBy: user.id,
      createdAt: now,
    },
    201,
  );
});

adminRouter.delete('/trusted/:userId', async (c) => {
  const targetUserId = c.req.param('userId');

  const existing = await db
    .select()
    .from(trustedUsers)
    .where(eq(trustedUsers.userId, targetUserId))
    .limit(1);

  if (existing.length === 0) {
    throw new NotFoundError(`Trusted user '${targetUserId}' not found`);
  }

  await db.delete(trustedUsers).where(eq(trustedUsers.userId, targetUserId));

  return c.json({
    message: `Trusted status revoked for user '${targetUserId}'`,
  });
});

adminRouter.get('/scopes/requests', async (c) => {
  const requests = await db
    .select()
    .from(scopeRequests)
    .where(eq(scopeRequests.status, 'pending'))
    .orderBy(desc(scopeRequests.createdAt));
  return c.json({ requests });
});

adminRouter.post('/scopes/requests/:id/approve', async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new UnauthorizedError('Missing authentication');
  }
  const id = c.req.param('id');

  const reqRows = await db
    .select()
    .from(scopeRequests)
    .where(and(eq(scopeRequests.id, id), eq(scopeRequests.status, 'pending')))
    .limit(1);

  if (reqRows.length === 0) {
    throw new NotFoundError(`Pending scope request "${id}" not found`);
  }
  const request = reqRows[0];

  const existingScope = await db
    .select({ id: scopes.id })
    .from(scopes)
    .where(eq(scopes.name, request.scopeName))
    .limit(1);

  if (existingScope.length > 0) {
    throw new ConflictError(
      `Scope "${request.scopeName}" already exists in registry`,
    );
  }

  const now = new Date();
  const scopeId = crypto.randomUUID();

  await db.insert(scopes).values({
    id: scopeId,
    name: request.scopeName,
    description: `Scope approved for reason: ${request.reason}`,
    ownerId: request.requestedBy,
    scopeType: 'custom',
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(scopeMembers).values({
    id: crypto.randomUUID(),
    scopeId,
    userId: request.requestedBy,
    role: 'admin',
    createdAt: now,
    updatedAt: now,
  });

  await db
    .update(scopeRequests)
    .set({
      status: 'approved',
      reviewedBy: user.id,
      reviewedAt: now,
    })
    .where(eq(scopeRequests.id, id));

  return c.json({
    message: `Scope request for "${request.scopeName}" approved`,
    scope: {
      id: scopeId,
      name: request.scopeName,
      ownerId: request.requestedBy,
    },
  });
});

adminRouter.post('/scopes/requests/:id/reject', async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new UnauthorizedError('Missing authentication');
  }
  const id = c.req.param('id');

  let body: { reason?: string } = {};
  if ((c.req.header('content-type') || '').includes('application/json')) {
    try {
      body = (await c.req.json()) as { reason?: string };
    } catch {
      throw new ValidationError('Malformed JSON body');
    }
  }
  const rejectionReason = body.reason?.trim() ?? 'Rejected by admin';

  const reqRows = await db
    .select()
    .from(scopeRequests)
    .where(and(eq(scopeRequests.id, id), eq(scopeRequests.status, 'pending')))
    .limit(1);

  if (reqRows.length === 0) {
    throw new NotFoundError(`Pending scope request "${id}" not found`);
  }

  const now = new Date();
  await db
    .update(scopeRequests)
    .set({
      status: 'rejected',
      reviewedBy: user.id,
      reviewedAt: now,
      rejectionReason,
    })
    .where(eq(scopeRequests.id, id));

  return c.json({
    message: `Scope request "${id}" rejected`,
    rejectionReason,
  });
});

adminRouter.post('/scopes', async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new UnauthorizedError('Missing authentication');
  }
  let body: { name?: string; description?: string; ownerId?: string };
  try {
    body = (await c.req.json()) as {
      name?: string;
      description?: string;
      ownerId?: string;
    };
  } catch {
    throw new ValidationError('Malformed JSON body');
  }

  const name = body.name?.trim();
  if (name?.startsWith('@') !== true) {
    throw new ValidationError(
      'Field "name" is required and must start with "@"',
      { field: 'name' },
    );
  }

  const existing = await db
    .select({ id: scopes.id })
    .from(scopes)
    .where(eq(scopes.name, name))
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError(`Scope "${name}" already exists`);
  }

  const ownerId = body.ownerId?.trim() || user.id;
  const scopeId = crypto.randomUUID();
  const now = new Date();

  await db.insert(scopes).values({
    id: scopeId,
    name,
    description: body.description?.trim() || `Admin-created scope ${name}`,
    ownerId,
    scopeType: 'custom',
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(scopeMembers).values({
    id: crypto.randomUUID(),
    scopeId,
    userId: ownerId,
    role: 'admin',
    createdAt: now,
    updatedAt: now,
  });

  return c.json(
    {
      scope: {
        id: scopeId,
        name,
        description: body.description,
        ownerId,
        scopeType: 'custom',
      },
    },
    201,
  );
});

export default adminRouter;
