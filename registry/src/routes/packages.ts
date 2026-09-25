import { createHash } from 'node:crypto';
import { DEFAULT_PACKAGES_LIMIT } from '@unsa/schemas/constants';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import JSZip from 'jszip';
import { config } from '@/config';
import { db } from '@/db';
import {
  packageDependencies,
  packageFiles,
  packages,
  packageTags,
  packageVersions,
  scopeMembers,
  scopes,
  tags,
  trustedUsers,
} from '@/db/schema';
import { checkCircularDependencies } from '@/lib/dependency-resolver';
import {
  requestPackageName,
  scopedNameRoute,
  unscopedNameRoute,
} from '@/lib/package-name';
import {
  buildAndUploadZipArchive,
  deleteS3Object,
  uploadS3Object,
} from '@/lib/s3';
import {
  expandGlobs,
  normalizeArchivePath,
  parseUnsareportToml,
  validateUnsareportToml,
} from '@/lib/unsareport-toml';
import { optionalAuth, requireAuth } from '@/middleware/auth';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PayloadTooLargeError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
} from '@/middleware/error-handler';
import type { HonoEnv } from '@/types';

const packagesRouter = new Hono<HonoEnv>();

packagesRouter.get('/', optionalAuth, async (c) => {
  const q = (c.req.query('q') ?? c.req.query('search'))?.trim();
  const tagFilter = c.req.query('tag')?.trim();
  const statusFilter = c.req.query('status')?.trim() || 'approved';
  const limit = Math.min(
    Number.parseInt(c.req.query('limit') || '20', 10),
    DEFAULT_PACKAGES_LIMIT,
  );
  const offset = Math.max(Number.parseInt(c.req.query('offset') || '0', 10), 0);

  const user = c.get('user');
  const isAdmin = user?.roles.registry === 'admin';

  const conditions = [];

  if (statusFilter === 'approved' || (statusFilter === 'all' && !isAdmin)) {
    conditions.push(eq(packages.status, 'approved'));
  } else if (!isAdmin) {
    if (user) {
      conditions.push(
        and(eq(packages.status, statusFilter), eq(packages.authorId, user.id)),
      );
    } else {
      conditions.push(eq(packages.status, 'approved'));
    }
  } else if (statusFilter !== 'all') {
    conditions.push(eq(packages.status, statusFilter));
  }

  if (q) {
    conditions.push(
      sql`(
        to_tsvector('spanish', coalesce(${packages.name}, '') || ' ' || coalesce(${packages.displayName}, '') || ' ' || coalesce(${packages.description}, ''))
        @@ websearch_to_tsquery('spanish', ${q})
        OR to_tsvector('english', coalesce(${packages.name}, '') || ' ' || coalesce(${packages.displayName}, '') || ' ' || coalesce(${packages.description}, ''))
        @@ websearch_to_tsquery('english', ${q})
        OR ${packages.name} ILIKE ${`%${q}%`}
        OR ${packages.displayName} ILIKE ${`%${q}%`}
      )`,
    );
  }

  if (tagFilter) {
    const matchingTag = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.name, tagFilter.toLowerCase()))
      .limit(1);

    if (matchingTag.length > 0) {
      const pkgIdsWithTag = await db
        .select({ packageId: packageTags.packageId })
        .from(packageTags)
        .where(eq(packageTags.tagId, matchingTag[0].id));

      const ids = pkgIdsWithTag.map((pt) => pt.packageId);
      if (ids.length === 0) {
        return c.json({ total: 0, packages: [] });
      }
      conditions.push(inArray(packages.id, ids));
    } else {
      return c.json({ total: 0, packages: [] });
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select()
    .from(packages)
    .where(whereClause)
    .orderBy(desc(packages.updatedAt))
    .limit(limit)
    .offset(offset);

  const packageList = await Promise.all(
    results.map(async (pkg) => {
      const tagRows = await db
        .select({ name: tags.name, displayName: tags.displayName })
        .from(packageTags)
        .innerJoin(tags, eq(packageTags.tagId, tags.id))
        .where(eq(packageTags.packageId, pkg.id));

      const versionConditions = [eq(packageVersions.packageId, pkg.id)];
      if (!isAdmin) {
        versionConditions.push(eq(packageVersions.status, 'approved'));
      }
      const versionRows = await db
        .select({ version: packageVersions.version })
        .from(packageVersions)
        .where(and(...versionConditions))
        .orderBy(desc(packageVersions.createdAt));

      const versionList = versionRows.map((v) => v.version);
      let effectiveVersion = '';
      if (
        pkg.latestVersion !== null &&
        pkg.latestVersion !== undefined &&
        pkg.latestVersion !== ''
      ) {
        effectiveVersion = pkg.latestVersion;
      } else if (versionList.length > 0) {
        effectiveVersion = versionList[0];
      } else {
        effectiveVersion = '';
      }

      return {
        ...pkg,
        version: effectiveVersion,
        versions: versionList,
        tags: tagRows.map((t) => t.name),
      };
    }),
  );

  return c.json({
    total: packageList.length,
    offset,
    limit,
    packages: packageList,
  });
});

packagesRouter.on(
  'GET',
  [unscopedNameRoute(''), scopedNameRoute('')],
  async (c) => {
    const name = requestPackageName(c.req.param());

    const pkgList = await db
      .select()
      .from(packages)
      .where(eq(packages.name, name))
      .limit(1);

    if (pkgList.length === 0) {
      throw new NotFoundError(`Package '${name}' not found`);
    }

    const pkg = pkgList[0];

    const tagRows = await db
      .select({ name: tags.name, displayName: tags.displayName })
      .from(packageTags)
      .innerJoin(tags, eq(packageTags.tagId, tags.id))
      .where(eq(packageTags.packageId, pkg.id));

    const versionRows = await db
      .select({
        version: packageVersions.version,
        status: packageVersions.status,
        createdAt: packageVersions.createdAt,
      })
      .from(packageVersions)
      .where(eq(packageVersions.packageId, pkg.id))
      .orderBy(desc(packageVersions.createdAt));

    return c.json({
      ...pkg,
      tags: tagRows.map((t) => t.name),
      versions: versionRows.map((v) => v.version),
    });
  },
);

packagesRouter.on(
  'GET',
  [unscopedNameRoute('', '/versions'), scopedNameRoute('', '/versions')],
  async (c) => {
    const name = requestPackageName(c.req.param());

    const pkgList = await db
      .select({ id: packages.id })
      .from(packages)
      .where(eq(packages.name, name))
      .limit(1);

    if (pkgList.length === 0) {
      throw new NotFoundError(`Package '${name}' not found`);
    }

    const versionRows = await db
      .select({
        id: packageVersions.id,
        version: packageVersions.version,
        status: packageVersions.status,
        fileCount: packageVersions.fileCount,
        createdAt: packageVersions.createdAt,
        approvedAt: packageVersions.approvedAt,
      })
      .from(packageVersions)
      .where(eq(packageVersions.packageId, pkgList[0].id))
      .orderBy(desc(packageVersions.createdAt));

    return c.json({
      package: name,
      versions: versionRows,
    });
  },
);

packagesRouter.on(
  'GET',
  [unscopedNameRoute('', '/:version'), scopedNameRoute('', '/:version')],
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

    const verList = await db
      .select()
      .from(packageVersions)
      .where(
        and(
          eq(packageVersions.packageId, pkgList[0].id),
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

    const filesRows = await db
      .select({
        path: packageFiles.path,
        section: packageFiles.section,
        size: packageFiles.size,
        checksum: packageFiles.checksum,
      })
      .from(packageFiles)
      .where(eq(packageFiles.versionId, ver.id));

    const depsRows = await db
      .select({
        dependencyName: packageDependencies.dependencyName,
        versionRange: packageDependencies.versionRange,
      })
      .from(packageDependencies)
      .where(eq(packageDependencies.versionId, ver.id));

    const dependenciesObject: Record<string, string> = {};
    for (const dep of depsRows) {
      dependenciesObject[dep.dependencyName] = dep.versionRange;
    }

    return c.json({
      package: name,
      displayName: pkgList[0].displayName,
      description: pkgList[0].description,
      authorId: pkgList[0].authorId,
      version: ver.version,
      status: ver.status,
      rejectionReason: ver.rejectionReason,
      fileCount: ver.fileCount,
      createdAt: ver.createdAt,
      approvedAt: ver.approvedAt,
      files: filesRows,
      dependencies: dependenciesObject,
    });
  },
);

packagesRouter.post('/', requireAuth, async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new UnauthorizedError();
  }

  const formData = await c.req.parseBody({ all: true });

  let pkgText: string | null = null;
  const manifestField =
    formData.manifest ?? formData['unsareport.toml'] ?? formData.pkg;
  if (typeof manifestField === 'string') {
    pkgText = manifestField;
  } else if (manifestField instanceof File) {
    pkgText = await manifestField.text();
  }

  let archiveFile: File | null = null;
  if (formData.components instanceof File) {
    archiveFile = formData.components;
  } else if (formData.file instanceof File) {
    archiveFile = formData.file;
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
      'Missing package archive file (.zip) in multipart request',
      { field: 'components' },
    );
  }
  const rawZipBuffer = Buffer.from(await archiveFile.arrayBuffer());
  if (rawZipBuffer.length > config.maxArchiveBytes) {
    throw new PayloadTooLargeError(
      `Package archive exceeds the ${config.maxArchiveBytes} byte limit`,
      { field: 'components', limit: config.maxArchiveBytes },
    );
  }
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(rawZipBuffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ValidationError(`Failed to read ZIP archive: ${msg}`, {
      field: 'components',
    });
  }

  if (!pkgText || pkgText.trim().length === 0) {
    throw new ValidationError(
      'Missing unsareport.toml document in the "manifest" or "unsareport.toml" multipart field',
      { field: 'manifest' },
    );
  }

  const zipBuffers = new Map<string, Buffer>();
  const zipPaths: string[] = [];
  for (const [entryName, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const normalized = normalizeArchivePath(entryName);
    if (normalized === null || normalized.startsWith('__MACOSX/')) {
      throw new ValidationError(
        `ZIP entry "${entryName}" escapes the package root or is not a relative path`,
        { field: 'components' },
      );
    }
    zipPaths.push(normalized);
    zipBuffers.set(normalized, await entry.async('nodebuffer'));
  }

  const rawPkg = parseUnsareportToml(pkgText);
  const pkg = validateUnsareportToml(rawPkg, {
    presentFiles: zipPaths,
    readFile: (path) => {
      const buf = zipBuffers.get(path);
      if (!buf) return undefined;
      if (!path.endsWith('.typ')) return undefined;
      return buf.toString('utf8');
    },
  });

  if (!pkg.name || !pkg.version) {
    throw new ValidationError(
      'unsareport.toml requires a [package] table to publish a package',
      { field: 'package' },
    );
  }

  if (!pkg.name.startsWith('@')) {
    throw new ValidationError(
      'Unscoped packages are not allowed. Please publish under your personal scope (@<slug>) or request a custom scope.',
      { field: 'package.name' },
    );
  }

  const slashIndex = pkg.name.indexOf('/');
  const scopeName =
    slashIndex === -1 ? pkg.name : pkg.name.slice(0, slashIndex);

  const scopeRows = await db
    .select()
    .from(scopes)
    .where(eq(scopes.name, scopeName))
    .limit(1);

  if (scopeRows.length === 0) {
    throw new ForbiddenError(
      `Scope "${scopeName}" does not exist in registry. You must create or request the scope before publishing.`,
    );
  }
  const scope = scopeRows[0];

  const isSysAdmin = user.roles.registry === 'admin';
  const isOwner = scope.ownerId === user.id;
  let isAuthorized = isSysAdmin || isOwner;

  if (!isAuthorized) {
    const memberRows = await db
      .select({ role: scopeMembers.role })
      .from(scopeMembers)
      .where(
        and(
          eq(scopeMembers.scopeId, scope.id),
          eq(scopeMembers.userId, user.id),
        ),
      )
      .limit(1);
    if (
      memberRows.length > 0 &&
      (memberRows[0].role === 'admin' || memberRows[0].role === 'contributor')
    ) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    throw new ForbiddenError(
      `User is not authorized to publish packages under scope "${scopeName}". Contributor or admin membership is required.`,
    );
  }

  const componentPaths = expandGlobs(pkg.componentGlobs, zipPaths);
  const templatePaths = expandGlobs(pkg.templateGlobs, zipPaths);
  const templateOnly = templatePaths.filter((p) => !componentPaths.includes(p));
  const overlap = templatePaths.filter((p) => componentPaths.includes(p));
  if (overlap.length > 0) {
    throw new ValidationError(
      `unsareport.toml [components] and [templates] globs overlap on "${overlap[0]}"; a file belongs to exactly one section`,
      { field: 'templates.files' },
    );
  }

  const existingPkg = await db
    .select()
    .from(packages)
    .where(eq(packages.name, pkg.name))
    .limit(1);

  let packageId: string;

  if (existingPkg.length > 0) {
    if (existingPkg[0].authorId !== user.id && !isAuthorized) {
      throw new ForbiddenError(
        `Package '${pkg.name}' is owned by another user`,
      );
    }
    packageId = existingPkg[0].id;

    const existingVer = await db
      .select({ id: packageVersions.id })
      .from(packageVersions)
      .where(
        and(
          eq(packageVersions.packageId, packageId),
          eq(packageVersions.version, pkg.version),
        ),
      )
      .limit(1);

    if (existingVer.length > 0) {
      throw new ConflictError(
        `Version '${pkg.version}' already exists for package '${pkg.name}'`,
      );
    }
  } else {
    packageId = crypto.randomUUID();
  }

  const declaredDeps: Record<string, string> = pkg.dependencies ?? {};

  if (Object.keys(declaredDeps).length > 0) {
    for (const depName of Object.keys(declaredDeps)) {
      const depPkg = await db
        .select({ id: packages.id })
        .from(packages)
        .where(eq(packages.name, depName))
        .limit(1);

      if (depPkg.length === 0) {
        throw new ValidationError(
          `unsareport.toml [dependencies] package '${depName}' does not exist in registry`,
          { field: `dependencies.${depName}` },
        );
      }
    }

    await checkCircularDependencies(pkg.name, declaredDeps);
  }

  const resolvedTagIds: string[] = [];
  if (pkg.tags && pkg.tags.length > 0) {
    for (const tagName of pkg.tags) {
      const normalizedTagName = tagName.trim().toLowerCase();
      const tagRows = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.name, normalizedTagName))
        .limit(1);

      let tagId: string;
      if (tagRows.length > 0) {
        tagId = tagRows[0].id;
      } else {
        tagId = crypto.randomUUID();
        const displayName =
          normalizedTagName.charAt(0).toUpperCase() +
          normalizedTagName.slice(1);
        await db.insert(tags).values({
          id: tagId,
          name: normalizedTagName,
          displayName,
          parentId: null,
          createdAt: new Date(),
        });
      }
      resolvedTagIds.push(tagId);
    }
  }

  const isAdmin = user.roles.registry === 'admin';
  const isTrusted = await db
    .select({ userId: trustedUsers.userId })
    .from(trustedUsers)
    .where(eq(trustedUsers.userId, user.id))
    .limit(1);

  const isApproved = isAdmin || isTrusted.length > 0;
  const initialStatus = isApproved ? 'approved' : 'pending';

  if (initialStatus === 'pending') {
    const userPendingVersions = await db
      .select({ id: packageVersions.id })
      .from(packageVersions)
      .innerJoin(packages, eq(packageVersions.packageId, packages.id))
      .where(
        and(
          eq(packages.authorId, user.id),
          eq(packageVersions.status, 'pending'),
        ),
      );

    if (userPendingVersions.length >= config.maxPendingPackages) {
      throw new RateLimitError(
        `Pending packages limit reached (max: ${config.maxPendingPackages}). Please wait for admin approval.`,
      );
    }
  }

  const versionId = crypto.randomUUID();
  const s3Prefix = `packages/${packageId}/${pkg.version}/`;
  const componentsS3Key = `${s3Prefix}components.zip`;
  const templatesS3Key = `${s3Prefix}templates.zip`;

  const fileRecords: {
    id: string;
    versionId: string;
    path: string;
    section: string;
    size: number;
    checksum: string;
    s3Key: string;
  }[] = [];

  const sectionOf = (path: string): string =>
    componentPaths.includes(path) ? 'components' : 'templates';
  const publishPaths = [...componentPaths, ...templateOnly];

  for (const path of publishPaths) {
    const buffer = zipBuffers.get(path);
    if (!buffer) {
      throw new ValidationError(
        `Declared file "${path}" not found in ZIP archive`,
        {
          field: 'components',
        },
      );
    }
    const fileS3Key = `${s3Prefix}${path}`;
    const checksum = createHash('sha256').update(buffer).digest('hex');

    await uploadS3Object(fileS3Key, buffer);

    fileRecords.push({
      id: crypto.randomUUID(),
      versionId,
      path,
      section: sectionOf(path),
      size: buffer.length,
      checksum,
      s3Key: fileS3Key,
    });
  }

  const componentsArchive = [
    ...componentPaths.map((path) => ({
      path,
      content: zipBuffers.get(path) as Buffer,
    })),
    { path: 'unsareport.toml', content: Buffer.from(pkgText, 'utf8') },
  ];
  await buildAndUploadZipArchive(componentsS3Key, componentsArchive);

  let storedTemplatesS3Key: string | null = null;
  if (templateOnly.length > 0) {
    const templatesArchive = templateOnly.map((path) => ({
      path,
      content: zipBuffers.get(path) as Buffer,
    }));
    await buildAndUploadZipArchive(templatesS3Key, templatesArchive);
    storedTemplatesS3Key = templatesS3Key;
  }

  const now = new Date();
  if (existingPkg.length === 0) {
    await db.insert(packages).values({
      id: packageId,
      name: pkg.name,
      displayName: pkg.displayName || pkg.name,
      description: pkg.description,
      authorId: user.id,
      latestVersion: initialStatus === 'approved' ? pkg.version : null,
      status: initialStatus,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    await db
      .update(packages)
      .set({
        displayName: pkg.displayName || existingPkg[0].displayName,
        description: pkg.description || existingPkg[0].description,
        latestVersion:
          initialStatus === 'approved'
            ? pkg.version
            : existingPkg[0].latestVersion,
        updatedAt: now,
      })
      .where(eq(packages.id, packageId));
  }

  await db.insert(packageVersions).values({
    id: versionId,
    packageId,
    version: pkg.version,
    status: initialStatus,
    s3Key: s3Prefix,
    archiveS3Key: componentsS3Key,
    componentsS3Key,
    templatesS3Key: storedTemplatesS3Key,
    fileCount: fileRecords.length,
    createdAt: now,
    approvedAt: initialStatus === 'approved' ? now : null,
  });

  if (fileRecords.length > 0) {
    await db.insert(packageFiles).values(fileRecords);
  }

  if (Object.keys(declaredDeps).length > 0) {
    const depRecords = Object.entries(declaredDeps).map(([depName, range]) => ({
      id: crypto.randomUUID(),
      versionId,
      dependencyName: depName,
      versionRange: range,
    }));
    if (depRecords.length > 0) {
      await db.insert(packageDependencies).values(depRecords);
    }
  }

  if (resolvedTagIds.length > 0) {
    for (const tagId of resolvedTagIds) {
      await db
        .insert(packageTags)
        .values({ packageId, tagId })
        .onConflictDoNothing();
    }
  }

  return c.json(
    {
      message: 'Package version uploaded successfully',
      package: pkg.name,
      version: pkg.version,
      status: initialStatus,
      approved: isApproved,
      sections: {
        components: componentPaths.length,
        templates: templateOnly.length,
      },
    },
    201,
  );
});

packagesRouter.on(
  'PUT',
  [unscopedNameRoute('', '/:version'), scopedNameRoute('', '/:version')],
  requireAuth,
  async (c) => {
    const name = requestPackageName(c.req.param());
    const version = c.req.param('version') ?? '';
    const user = c.get('user');
    if (!user) {
      throw new UnauthorizedError();
    }

    const pkgList = await db
      .select()
      .from(packages)
      .where(eq(packages.name, name))
      .limit(1);

    if (pkgList.length === 0) {
      throw new NotFoundError(`Package '${name}' not found`);
    }

    const pkg = pkgList[0];

    if (pkg.authorId !== user.id && user.roles.registry !== 'admin') {
      throw new ForbiddenError(`You are not the owner of package '${name}'`);
    }

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

    if (ver.status !== 'pending' && user.roles.registry !== 'admin') {
      throw new ForbiddenError(
        `Cannot modify package version '${version}' with status '${ver.status}'`,
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await c.req.json()) as Record<string, unknown>;
    } catch {
      throw new ValidationError('Invalid JSON body');
    }

    const hasDisplayName = body.displayName !== undefined;
    const hasDescription = body.description !== undefined;

    if (
      (!hasDisplayName && !hasDescription) ||
      (hasDisplayName && typeof body.displayName !== 'string') ||
      (hasDescription && typeof body.description !== 'string')
    ) {
      throw new ValidationError(
        'At least one of "displayName" or "description" (string) is required',
        { fields: ['displayName', 'description'] },
      );
    }

    const displayName =
      typeof body.displayName === 'string' ? body.displayName.trim() : null;
    const description =
      typeof body.description === 'string' ? body.description.trim() : null;

    if (hasDisplayName && displayName !== null && displayName.length === 0) {
      throw new ValidationError('"displayName" must be a non-empty string', {
        field: 'displayName',
      });
    }

    const updates: { displayName?: string; description?: string | null } = {};
    if (hasDisplayName && displayName !== null) {
      updates.displayName = displayName;
    }
    if (hasDescription) {
      updates.description = description === '' ? null : description;
    }

    await db
      .update(packages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(packages.id, pkg.id));

    return c.json({
      message: 'Version updated successfully',
      displayName: updates.displayName ?? pkg.displayName,
      description:
        updates.description !== undefined
          ? updates.description
          : pkg.description,
    });
  },
);

packagesRouter.on(
  'DELETE',
  [unscopedNameRoute('', '/:version'), scopedNameRoute('', '/:version')],
  requireAuth,
  async (c) => {
    const name = requestPackageName(c.req.param());
    const version = c.req.param('version') ?? '';
    const user = c.get('user');
    if (!user) {
      throw new UnauthorizedError();
    }

    if (user.roles.registry !== 'admin') {
      throw new ForbiddenError(
        'Admin role required to delete a package version',
      );
    }

    const pkgList = await db
      .select()
      .from(packages)
      .where(eq(packages.name, name))
      .limit(1);

    if (pkgList.length === 0) {
      throw new NotFoundError(`Package '${name}' not found`);
    }

    const verList = await db
      .select()
      .from(packageVersions)
      .where(
        and(
          eq(packageVersions.packageId, pkgList[0].id),
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

    const fileRows = await db
      .select({ s3Key: packageFiles.s3Key })
      .from(packageFiles)
      .where(eq(packageFiles.versionId, ver.id));

    for (const f of fileRows) {
      await deleteS3Object(f.s3Key);
    }
    if (ver.componentsS3Key) {
      await deleteS3Object(ver.componentsS3Key);
    }
    if (ver.templatesS3Key) {
      await deleteS3Object(ver.templatesS3Key);
    }
    await deleteS3Object(ver.archiveS3Key);

    await db.delete(packageVersions).where(eq(packageVersions.id, ver.id));

    return c.json({ message: `Version '${version}' of '${name}' deleted` });
  },
);

export default packagesRouter;
