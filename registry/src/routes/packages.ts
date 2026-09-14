import { createHash } from 'node:crypto';
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
  tags,
  trustedUsers,
} from '@/db/schema';
import { checkCircularDependencies } from '@/lib/dependency-resolver';
import { validateManifest } from '@/lib/manifest';
import {
  buildAndUploadZipArchive,
  deleteS3Object,
  uploadS3Object,
} from '@/lib/s3';
import { optionalAuth, requireAuth } from '@/middleware/auth';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
} from '@/middleware/error-handler';
import type { HonoEnv } from '@/types';

const packagesRouter = new Hono<HonoEnv>();

/**
 * Route handler for searching and listing packages with optional search query, tag filtering, and pagination.
 */
packagesRouter.get('/', optionalAuth, async (c) => {
  const q = (c.req.query('q') ?? c.req.query('search'))?.trim();
  const tagFilter = c.req.query('tag')?.trim();
  const statusFilter = c.req.query('status')?.trim() || 'approved';
  const limit = Math.min(
    Number.parseInt(c.req.query('limit') || '20', 10),
    100,
  );
  const offset = Math.max(Number.parseInt(c.req.query('offset') || '0', 10), 0);

  const user = c.get('user');
  const isAdmin = user?.roles.includes('admin');

  const conditions = [];

  if (statusFilter === 'approved') {
    conditions.push(eq(packages.status, 'approved'));
  } else if (!isAdmin) {
    if (user) {
      conditions.push(
        and(eq(packages.status, statusFilter), eq(packages.authorId, user.id)),
      );
    } else {
      conditions.push(eq(packages.status, 'approved'));
    }
  } else {
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

      return {
        ...pkg,
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

/**
 * Route handler for fetching package metadata, associated tags, and available version strings.
 */
packagesRouter.get('/:name', async (c) => {
  const name = c.req.param('name').toLowerCase();

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
});

/**
 * Route handler for listing all registered version entries for a given package name.
 */
packagesRouter.get('/:name/versions', async (c) => {
  const name = c.req.param('name').toLowerCase();

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
      entry: packageVersions.entry,
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
});

/**
 * Route handler for fetching detailed metadata, file list, and declared dependencies for a specific package version.
 */
packagesRouter.get('/:name/:version', async (c) => {
  const name = c.req.param('name').toLowerCase();
  const version = c.req.param('version');

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
    entry: ver.entry,
    status: ver.status,
    rejectionReason: ver.rejectionReason,
    fileCount: ver.fileCount,
    createdAt: ver.createdAt,
    approvedAt: ver.approvedAt,
    files: filesRows,
    dependencies: dependenciesObject,
  });
});

/**
 * Route handler for publishing a new package version with .zip archive payload.
 */
packagesRouter.post('/', requireAuth, async (c) => {
  const user = c.get('user');
  if (!user) {
    throw new UnauthorizedError();
  }

  const formData = await c.req.parseBody({ all: true });

  let archiveFile: File | null = null;
  if (formData.file instanceof File) {
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
      { field: 'file' },
    );
  }

  const rawZipBuffer = Buffer.from(await archiveFile.arrayBuffer());
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(rawZipBuffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ValidationError(`Failed to read ZIP archive: ${msg}`, {
      field: 'file',
    });
  }

  const zipFileNames = Object.keys(zip.files).filter(
    (name) => !zip.files[name].dir,
  );

  let manifestEntryName: string | null = null;
  let rootPrefix = '';

  if (zip.file('manifest.json')) {
    manifestEntryName = 'manifest.json';
    rootPrefix = '';
  } else {
    const candidate = zipFileNames.find((name) =>
      name.endsWith('/manifest.json'),
    );
    if (candidate) {
      manifestEntryName = candidate;
      rootPrefix = candidate.substring(
        0,
        candidate.length - 'manifest.json'.length,
      );
    }
  }

  if (!manifestEntryName) {
    throw new ValidationError(
      'ZIP archive must contain "manifest.json" at root or in top-level directory',
      { field: 'manifest' },
    );
  }

  const manifestFile = zip.file(manifestEntryName);
  if (!manifestFile) {
    throw new ValidationError('Could not read "manifest.json" from ZIP', {
      field: 'manifest',
    });
  }

  let rawManifest: unknown;
  try {
    const manifestText = await manifestFile.async('text');
    rawManifest = JSON.parse(manifestText);
  } catch {
    throw new ValidationError('Invalid JSON in "manifest.json"', {
      field: 'manifest',
    });
  }

  const zipPaths = zipFileNames.map((p) =>
    rootPrefix && p.startsWith(rootPrefix) ? p.slice(rootPrefix.length) : p,
  );

  const manifest = validateManifest(rawManifest, zipPaths);

  const fileEntries: { path: string; buffer: Buffer; content: Buffer }[] = [];
  for (const filePath of manifest.files) {
    const zipPath = `${rootPrefix}${filePath}`;
    const zipEntry = zip.file(zipPath);
    if (!zipEntry) {
      throw new ValidationError(
        `Declared file "${filePath}" not found in ZIP archive`,
        { field: 'files' },
      );
    }
    const fileBuffer = await zipEntry.async('nodebuffer');
    fileEntries.push({
      path: filePath,
      buffer: fileBuffer,
      content: fileBuffer,
    });
  }

  const existingPkg = await db
    .select()
    .from(packages)
    .where(eq(packages.name, manifest.name))
    .limit(1);

  let packageId: string;

  if (existingPkg.length > 0) {
    if (existingPkg[0].authorId !== user.id && !user.roles.includes('admin')) {
      throw new ForbiddenError(
        `Package '${manifest.name}' is owned by another user`,
      );
    }
    packageId = existingPkg[0].id;

    const existingVer = await db
      .select({ id: packageVersions.id })
      .from(packageVersions)
      .where(
        and(
          eq(packageVersions.packageId, packageId),
          eq(packageVersions.version, manifest.version),
        ),
      )
      .limit(1);

    if (existingVer.length > 0) {
      throw new ConflictError(
        `Version '${manifest.version}' already exists for package '${manifest.name}'`,
      );
    }
  } else {
    packageId = crypto.randomUUID();
  }

  if (manifest.dependencies) {
    for (const depName of Object.keys(manifest.dependencies)) {
      const depPkg = await db
        .select({ id: packages.id })
        .from(packages)
        .where(eq(packages.name, depName))
        .limit(1);

      if (depPkg.length === 0) {
        throw new ValidationError(
          `Declared dependency '${depName}' does not exist in registry`,
          { field: `dependencies.${depName}` },
        );
      }
    }

    await checkCircularDependencies(manifest.name, manifest.dependencies);
  }

  const resolvedTagIds: string[] = [];
  if (manifest.tags && manifest.tags.length > 0) {
    for (const tagName of manifest.tags) {
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

  const isAdmin = user.roles.includes('admin');
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
  const s3Prefix = `packages/${packageId}/${manifest.version}/`;
  const archiveS3Key = `${s3Prefix}archive.zip`;

  const fileRecords: {
    id: string;
    versionId: string;
    path: string;
    size: number;
    checksum: string;
    s3Key: string;
  }[] = [];

  for (const file of fileEntries) {
    const fileS3Key = `${s3Prefix}${file.path}`;
    const checksum = createHash('sha256').update(file.buffer).digest('hex');

    await uploadS3Object(fileS3Key, file.buffer);

    fileRecords.push({
      id: crypto.randomUUID(),
      versionId,
      path: file.path,
      size: file.buffer.length,
      checksum,
      s3Key: fileS3Key,
    });
  }

  const archiveFiles = [...fileEntries];
  if (!archiveFiles.some((f) => f.path === 'manifest.json')) {
    const manifestBuffer = Buffer.from(JSON.stringify(rawManifest, null, 2));
    archiveFiles.push({
      path: 'manifest.json',
      buffer: manifestBuffer,
      content: manifestBuffer,
    });
  }
  await buildAndUploadZipArchive(archiveS3Key, archiveFiles);

  const now = new Date();
  if (existingPkg.length === 0) {
    await db.insert(packages).values({
      id: packageId,
      name: manifest.name,
      displayName: manifest.displayName || manifest.name,
      description: manifest.description,
      authorId: user.id,
      latestVersion: initialStatus === 'approved' ? manifest.version : null,
      status: initialStatus,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    await db
      .update(packages)
      .set({
        displayName: manifest.displayName || existingPkg[0].displayName,
        description: manifest.description || existingPkg[0].description,
        latestVersion:
          initialStatus === 'approved'
            ? manifest.version
            : existingPkg[0].latestVersion,
        updatedAt: now,
      })
      .where(eq(packages.id, packageId));
  }

  await db.insert(packageVersions).values({
    id: versionId,
    packageId,
    version: manifest.version,
    entry: manifest.entry || null,
    status: initialStatus,
    s3Key: s3Prefix,
    archiveS3Key,
    fileCount: fileRecords.length,
    createdAt: now,
    approvedAt: initialStatus === 'approved' ? now : null,
  });

  if (fileRecords.length > 0) {
    await db.insert(packageFiles).values(fileRecords);
  }

  if (manifest.dependencies) {
    const depRecords = Object.entries(manifest.dependencies).map(
      ([depName, range]) => ({
        id: crypto.randomUUID(),
        versionId,
        dependencyName: depName,
        versionRange: range,
      }),
    );
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
      package: manifest.name,
      version: manifest.version,
      status: initialStatus,
      approved: isApproved,
    },
    201,
  );
});

/**
 * Route handler for updating details of a pending package version owned by the user.
 */
packagesRouter.put('/:name/:version', requireAuth, async (c) => {
  const name = c.req.param('name').toLowerCase();
  const version = c.req.param('version');
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

  if (pkg.authorId !== user.id && !user.roles.includes('admin')) {
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

  if (ver.status !== 'pending' && !user.roles.includes('admin')) {
    throw new ForbiddenError(
      `Cannot modify package version '${version}' with status '${ver.status}'`,
    );
  }

  const body = (await c.req.json()) as Record<string, unknown>;

  if (body.entry !== undefined) {
    await db
      .update(packageVersions)
      .set({ entry: body.entry as string })
      .where(eq(packageVersions.id, ver.id));
  }

  return c.json({ message: 'Version updated successfully' });
});

/**
 * Route handler for deleting a package version and its associated S3 files (requires admin authentication).
 */
packagesRouter.delete('/:name/:version', requireAuth, async (c) => {
  const name = c.req.param('name').toLowerCase();
  const version = c.req.param('version');
  const user = c.get('user');
  if (!user) {
    throw new UnauthorizedError();
  }

  if (!user.roles.includes('admin')) {
    throw new ForbiddenError('Admin role required to delete a package version');
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
  await deleteS3Object(ver.archiveS3Key);

  await db.delete(packageVersions).where(eq(packageVersions.id, ver.id));

  return c.json({ message: `Version '${version}' of '${name}' deleted` });
});

export default packagesRouter;
