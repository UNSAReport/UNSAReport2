import { describe, expect, it, mock } from 'bun:test';
import { eq, getTableName } from 'drizzle-orm';
import JSZip from 'jszip';
import * as schema from '@/db/schema';

const MOCK_USER_ID = '00000000-0000-4000-8000-000000000001';
const MOCK_USER_EMAIL = 'publisher@example.com';
const MOCK_USER_ROLE = 'user';
const MOCK_PRESIGNED_BASE_URL = 'http://localhost/s3-mock';

const TABLE_PACKAGES = 'packages';
const TABLE_PACKAGE_VERSIONS = 'package_versions';
const TABLE_PACKAGE_FILES = 'package_files';
const TABLE_TRUSTED_USERS = 'trusted_users';
const TABLE_TAGS = 'tags';
const TABLE_PACKAGE_TAGS = 'package_tags';
const TABLE_PACKAGE_DEPENDENCIES = 'package_dependencies';
const TABLE_SCOPES = 'scopes';
const TABLE_SCOPE_MEMBERS = 'scope_members';

let mockPackages: Record<string, unknown>[] = [];
let mockVersions: Record<string, unknown>[] = [];
let mockFiles: Record<string, unknown>[] = [];
let mockScopes: Record<string, unknown>[] = [
  {
    id: '00000000-0000-4000-8000-000000000010',
    name: '@xxx',
    ownerId: MOCK_USER_ID,
    scopeType: 'custom',
  },
];
let mockScopeMembers: Record<string, unknown>[] = [
  {
    id: '00000000-0000-4000-8000-000000000011',
    scopeId: '00000000-0000-4000-8000-000000000010',
    userId: MOCK_USER_ID,
    role: 'admin',
  },
];

function createMockQuery(tableName: string) {
  const getRows = (): Record<string, unknown>[] => {
    if (tableName === TABLE_PACKAGES) {
      return [...mockPackages];
    }
    if (tableName === TABLE_PACKAGE_VERSIONS) {
      return [...mockVersions];
    }
    if (tableName === TABLE_PACKAGE_FILES) {
      return [...mockFiles];
    }
    if (tableName === TABLE_SCOPES) {
      return [...mockScopes];
    }
    if (tableName === TABLE_SCOPE_MEMBERS) {
      return [...mockScopeMembers];
    }
    if (
      tableName === TABLE_TRUSTED_USERS ||
      tableName === TABLE_TAGS ||
      tableName === TABLE_PACKAGE_TAGS ||
      tableName === TABLE_PACKAGE_DEPENDENCIES
    ) {
      return [];
    }
    throw new Error(`Unhandled mock table in query: ${tableName}`);
  };

  const query = {
    innerJoin: () => query,
    where: () => query,
    orderBy: () => query,
    limit: (n: number) => ({
      // biome-ignore lint/suspicious/noThenProperty: Query builder is a thenable representing a Drizzle query
      then: (
        resolve?: (value: Record<string, unknown>[]) => unknown,
        reject?: (reason: unknown) => unknown,
      ) => {
        try {
          const sliced = getRows().slice(0, n);
          return Promise.resolve(resolve ? resolve(sliced) : sliced);
        } catch (err) {
          if (reject) {
            return Promise.resolve(reject(err));
          }
          throw err;
        }
      },
    }),
    // biome-ignore lint/suspicious/noThenProperty: Query builder is a thenable representing a Drizzle query
    then: (
      resolve?: (value: Record<string, unknown>[]) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => {
      try {
        const rows = getRows();
        return Promise.resolve(resolve ? resolve(rows) : rows);
      } catch (err) {
        if (reject) {
          return Promise.resolve(reject(err));
        }
        throw err;
      }
    },
  };

  return query;
}

const mockDb = {
  select: (_fields?: unknown) => ({
    from: (table: Parameters<typeof getTableName>[0]) =>
      createMockQuery(getTableName(table)),
  }),
  insert: (table: Parameters<typeof getTableName>[0]) => ({
    values: (values: unknown) => {
      const tableName = getTableName(table);
      if (tableName === TABLE_PACKAGES) {
        mockPackages.push(values as Record<string, unknown>);
      } else if (tableName === TABLE_PACKAGE_VERSIONS) {
        mockVersions.push(values as Record<string, unknown>);
      } else if (tableName === TABLE_PACKAGE_FILES) {
        if (Array.isArray(values)) {
          mockFiles.push(...(values as Record<string, unknown>[]));
        } else {
          mockFiles.push(values as Record<string, unknown>);
        }
      } else {
        throw new Error(`Unhandled mock table in insert: ${tableName}`);
      }
      return Promise.resolve();
    },
  }),
  delete: (table: Parameters<typeof getTableName>[0]) => ({
    where: () => {
      const tableName = getTableName(table);
      if (tableName === TABLE_PACKAGES) {
        mockPackages = [];
        mockVersions = [];
        mockFiles = [];
      } else {
        throw new Error(`Unhandled mock table in delete: ${tableName}`);
      }
      return Promise.resolve();
    },
  }),
};

mock.module('@/db', () => ({
  db: mockDb,
  schema,
}));

mock.module('@/lib/auth', () => ({
  verifyJWT: async () => ({
    id: MOCK_USER_ID,
    email: MOCK_USER_EMAIL,
    roles: [MOCK_USER_ROLE],
  }),
}));

mock.module('@/lib/s3', () => ({
  ensureBucketExists: async () => {},
  uploadS3Object: async (key: string) => key,
  getPresignedUrl: async (key: string) => `${MOCK_PRESIGNED_BASE_URL}/${key}`,
  deleteS3Object: async () => {},
  buildAndUploadZipArchive: async (key: string) => key,
  s3Client: {},
  s3PresignClient: {},
}));

// Dynamic import: mock.module must register before the app graph loads,
// and static imports hoist above it. Test-only module-loading boundary.
const { default: app } = await import('@/index');
const { db } = await import('@/db');
const { packages } = schema;

async function buildZip(entries: Record<string, string>): Promise<File> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(entries)) {
    zip.file(path, content);
  }
  const buffer = await zip.generateAsync({ type: 'arraybuffer' });
  return new File([buffer], 'components.zip', { type: 'application/zip' });
}

function postPublish(form: FormData) {
  return app.fetch(
    new Request('http://localhost/v1/packages', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
      body: form,
    }),
  );
}

describe('POST /v1/packages unsareport.toml gate', () => {
  it('rejects manifest.json-only uploads with 400', async () => {
    const archive = await buildZip({
      'manifest.json': JSON.stringify({
        name: 'legacy-pkg',
        version: '1.0.0',
        files: ['index.typ'],
      }),
      'index.typ': '#let x = 1',
    });
    const form = new FormData();
    form.append('file', archive);

    const res = await postPublish(form);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('ValidationError');
    expect(data.message).toMatch(/unsareport\.toml/);
  });

  it('rejects uploads with no pkg field and no manifest with 400', async () => {
    const archive = await buildZip({ 'index.typ': '#let x = 1' });
    const form = new FormData();
    form.append('components', archive);

    const res = await postPublish(form);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.message).toMatch(/Missing unsareport\.toml/);
  });

  it('rejects invalid unsareport.toml text with 400', async () => {
    const archive = await buildZip({ 'lib.typ': '#let x = 1' });
    const form = new FormData();
    form.append('manifest', '[package');
    form.append('components', archive);

    const res = await postPublish(form);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('ValidationError');
  });

  it('rejects missing archive with 400', async () => {
    const form = new FormData();
    form.append('manifest', '[project]\nconfig_version = 1\n\n[package]\nname = "@xxx/cardo"\n');

    const res = await postPublish(form);
    expect(res.status).toBe(400);
  });

  it('publishes a scoped package and serves it over slash routes', async () => {
    await db.delete(packages).where(eq(packages.name, '@xxx/yyy'));
    try {
      const pkgText = [
        '[project]',
        'config_version = 1',
        '',
        '[package]',
        'name = "@xxx/yyy"',
        'version = "0.0.1"',
        'description = "scoped round-trip"',
        '',
        '[components]',
        'files = ["lib.typ"]',
        '',
      ].join('\n');
      const archive = await buildZip({
        'lib.typ': '#let note(body) = block()[#body]\n',
      });
      const form = new FormData();
      form.append('pkg', pkgText);
      form.append('components', archive);

      const postRes = await postPublish(form);
      expect(postRes.status).toBe(201);
      const posted = (await postRes.json()) as {
        package: string;
        version: string;
      };
      expect(posted.package).toBe('@xxx/yyy');

      const getRes = await app.fetch(
        new Request('http://localhost/v1/packages/@xxx/yyy'),
      );
      expect(getRes.status).toBe(200);
      const fetched = (await getRes.json()) as { name: string };
      expect(fetched.name).toBe('@xxx/yyy');

      const verRes = await app.fetch(
        new Request('http://localhost/v1/packages/@xxx/yyy/0.0.1'),
      );
      expect(verRes.status).toBe(200);
      const ver = (await verRes.json()) as { package: string };
      expect(ver.package).toBe('@xxx/yyy');

      const versionsRes = await app.fetch(
        new Request('http://localhost/v1/packages/@xxx/yyy/versions'),
      );
      expect(versionsRes.status).toBe(200);

      const archiveRes = await app.fetch(
        new Request(
          'http://localhost/v1/@xxx/yyy/0.0.1/archive?section=components',
        ),
      );
      expect(archiveRes.status).toBe(200);
      const archiveBody = (await archiveRes.json()) as { archive_url: string };
      expect(archiveBody.archive_url.startsWith('http')).toBe(true);

      // Non-admin author hits the scoped approve twin and is refused by role
      // (403 proves the route matched; an unmatched path yields Hono's 404).
      const approveRes = await app.fetch(
        new Request(
          'http://localhost/v1/admin/packages/@xxx/yyy/0.0.1/approve',
          {
            method: 'POST',
            headers: { Authorization: 'Bearer test-token' },
          },
        ),
      );
      expect(approveRes.status).toBe(403);
    } finally {
      await db.delete(packages).where(eq(packages.name, '@xxx/yyy'));
    }
  });
});
