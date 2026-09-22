import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '@/db';
import { packageFiles, packages, packageVersions } from '@/db/schema';
import { resolveDependencyTree } from '@/lib/dependency-resolver';
import {
  requestPackageName,
  scopedNameRoute,
  unscopedNameRoute,
} from '@/lib/package-name';
import { getPresignedUrl } from '@/lib/s3';
import { normalizeArchivePath } from '@/lib/unsareport-toml';
import { NotFoundError, ValidationError } from '@/middleware/error-handler';
import type { DependencyResolveRequest, HonoEnv } from '@/types';

const downloadRouter = new Hono<HonoEnv>();

type Section = 'components' | 'templates';

function parseSection(c: {
  req: { query: (name: string) => string | undefined };
}): Section {
  const raw = c.req.query('section')?.trim().toLowerCase();
  if (!raw || raw === 'components') return 'components';
  if (raw === 'templates') return 'templates';
  throw new ValidationError(
    `Unknown section '${c.req.query('section')}'; expected 'components' or 'templates'`,
    { field: 'section' },
  );
}

downloadRouter.on(
  'GET',
  [
    unscopedNameRoute('', '/:version/files'),
    scopedNameRoute('', '/:version/files'),
  ],
  async (c) => {
    const name = requestPackageName(c.req.param());
    const version = c.req.param('version') ?? '';
    const section = parseSection(c);

    const pkgList = await db
      .select({ id: packages.id })
      .from(packages)
      .where(eq(packages.name, name))
      .limit(1);

    if (pkgList.length === 0) {
      throw new NotFoundError(`Package '${name}' not found`);
    }

    const verList = await db
      .select({ id: packageVersions.id, status: packageVersions.status })
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

    const filesRows = await db
      .select({
        path: packageFiles.path,
        section: packageFiles.section,
        size: packageFiles.size,
        checksum: packageFiles.checksum,
      })
      .from(packageFiles)
      .where(
        and(
          eq(packageFiles.versionId, verList[0].id),
          eq(packageFiles.section, section),
        ),
      );

    return c.json({
      package: name,
      version,
      section,
      files: filesRows,
    });
  },
);

downloadRouter.on(
  'GET',
  [
    unscopedNameRoute('', '/:version/files/*'),
    scopedNameRoute('', '/:version/files/*'),
  ],
  async (c) => {
    const name = requestPackageName(c.req.param());
    const version = c.req.param('version') ?? '';
    const filePath = c.req.param('*');
    const hasSectionParam = c.req.query('section') !== undefined;
    const section = parseSection(c);

    if (!filePath) {
      throw new ValidationError('File path is required');
    }

    const pkgList = await db
      .select({ id: packages.id })
      .from(packages)
      .where(eq(packages.name, name))
      .limit(1);

    if (pkgList.length === 0) {
      throw new NotFoundError(`Package '${name}' not found`);
    }

    const verList = await db
      .select({ id: packageVersions.id, status: packageVersions.status })
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

    const cleanPath = normalizeArchivePath(filePath);
    if (!cleanPath) {
      throw new ValidationError(
        `File path '${filePath}' is not a valid relative path`,
      );
    }

    const fileList = await db
      .select({
        s3Key: packageFiles.s3Key,
        section: packageFiles.section,
        checksum: packageFiles.checksum,
      })
      .from(packageFiles)
      .where(
        and(
          eq(packageFiles.versionId, verList[0].id),
          eq(packageFiles.path, cleanPath),
        ),
      )
      .limit(1);

    if (fileList.length === 0) {
      throw new NotFoundError(
        `File '${cleanPath}' not found in package '${name}' version '${version}'`,
      );
    }
    if (hasSectionParam && fileList[0].section !== section) {
      throw new NotFoundError(
        `File '${cleanPath}' is not in section '${section}' of package '${name}' version '${version}'`,
      );
    }

    const presignedUrl = await getPresignedUrl(fileList[0].s3Key);

    const accept = c.req.header('Accept') || '';
    if (accept.includes('application/json')) {
      return c.json({
        url: presignedUrl,
        checksum: fileList[0].checksum,
      });
    }

    return c.redirect(presignedUrl, 302);
  },
);

downloadRouter.on(
  'GET',
  [
    unscopedNameRoute('', '/:version/archive'),
    scopedNameRoute('', '/:version/archive'),
  ],
  async (c) => {
    const name = requestPackageName(c.req.param());
    const version = c.req.param('version') ?? '';
    const section = parseSection(c);

    const pkgList = await db
      .select({ id: packages.id })
      .from(packages)
      .where(eq(packages.name, name))
      .limit(1);

    if (pkgList.length === 0) {
      throw new NotFoundError(`Package '${name}' not found`);
    }

    const verList = await db
      .select({
        id: packageVersions.id,
        archiveS3Key: packageVersions.archiveS3Key,
        componentsS3Key: packageVersions.componentsS3Key,
        templatesS3Key: packageVersions.templatesS3Key,
        status: packageVersions.status,
      })
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
    const archiveKey =
      section === 'templates'
        ? ver.templatesS3Key
        : (ver.componentsS3Key ?? ver.archiveS3Key);
    if (!archiveKey) {
      throw new NotFoundError(
        `Section '${section}' has no archive for package '${name}' version '${version}'`,
      );
    }

    const presignedUrl = await getPresignedUrl(archiveKey);

    return c.json({
      package: name,
      version,
      section,
      archive_url: presignedUrl,
    });
  },
);

downloadRouter.post('/resolve', async (c) => {
  let body: DependencyResolveRequest;
  try {
    body = await c.req.json();
  } catch {
    throw new ValidationError('Invalid JSON body');
  }

  if (
    !body?.packages ||
    typeof body.packages !== 'object' ||
    Object.keys(body.packages).length === 0
  ) {
    throw new ValidationError(
      'Field "packages" must be a non-empty object mapping package names to semver ranges',
      { field: 'packages' },
    );
  }

  const resolved = await resolveDependencyTree(body.packages);

  return c.json({ resolved });
});

export default downloadRouter;
