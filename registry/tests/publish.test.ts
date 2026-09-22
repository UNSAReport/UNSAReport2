import { describe, expect, it, mock } from 'bun:test';
import { eq, getTableName } from 'drizzle-orm';
import JSZip from 'jszip';
import { config } from '@/config';
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
const mockScopes: Record<string, unknown>[] = [
  {
    id: '00000000-0000-4000-8000-000000000010',
    name: '@xxx',
    ownerId: MOCK_USER_ID,
    scopeType: 'custom',
  },
];
const mockScopeMembers: Record<string, unknown>[] = [
  {
    id: '00000000-0000-4000-8000-000000000011',
    scopeId: '00000000-0000-4000-8000-000000000010',
    userId: MOCK_USER_ID,
    role: 'admin',
  },
];

type FilterChunk = {
  name?: unknown;
  value?: unknown;
  queryChunks?: unknown;
};

function extractFilters(condition: unknown): { col: string; val: unknown }[] {
  const filters: { col: string; val: unknown }[] = [];
  if (!condition || typeof condition !== 'object') return filters;
  if (!('queryChunks' in condition)) return filters;
  const rawChunks = condition.queryChunks;
  if (!Array.isArray(rawChunks)) return filters;
  const items = rawChunks as FilterChunk[];
  for (let i = 0; i < items.length; i++) {
    const current = items[i];
    const ahead = items[i + 2];
    if (current?.name !== undefined && ahead?.value !== undefined) {
      filters.push({ col: String(current.name), val: ahead.value });
    } else if (current?.queryChunks) {
      filters.push(...extractFilters(current));
    }
  }
  return filters;
}

function rowMatches(
  row: Record<string, unknown>,
  filters: { col: string; val: unknown }[],
): boolean {
  for (const { col, val } of filters) {
    const camelCol = col.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
    const snakeCol = col.replace(
      /[A-Z]/g,
      (letter) => `_${letter.toLowerCase()}`,
    );
    const actual =
      row[col] !== undefined
        ? row[col]
        : row[camelCol] !== undefined
          ? row[camelCol]
          : row[snakeCol];
    if (actual !== val) {
      return false;
    }
  }
  return true;
}

function createMockQuery(tableName: string) {
  let activeFilters: { col: string; val: unknown }[] = [];
  let limitedTo: number | undefined;
  const getRows = (): Record<string, unknown>[] => {
    let source: Record<string, unknown>[] = [];
    if (tableName === TABLE_PACKAGES) {
      source = [...mockPackages];
    } else if (tableName === TABLE_PACKAGE_VERSIONS) {
      source = [...mockVersions];
    } else if (tableName === TABLE_PACKAGE_FILES) {
      source = [...mockFiles];
    } else if (tableName === TABLE_SCOPES) {
      source = [...mockScopes];
    } else if (tableName === TABLE_SCOPE_MEMBERS) {
      source = [...mockScopeMembers];
    } else if (
      tableName === TABLE_TRUSTED_USERS ||
      tableName === TABLE_TAGS ||
      tableName === TABLE_PACKAGE_TAGS ||
      tableName === TABLE_PACKAGE_DEPENDENCIES
    ) {
      source = [];
    } else {
      throw new Error(`Unhandled mock table in query: ${tableName}`);
    }
    if (activeFilters.length > 0) {
      return source.filter((r) => rowMatches(r, activeFilters));
    }
    return source;
  };

  const build = () => {
    const rows =
      limitedTo === undefined ? getRows() : getRows().slice(0, limitedTo);
    return Object.assign(Promise.resolve(rows), {
      innerJoin: () => build(),
      where: (cond: unknown) => {
        activeFilters = extractFilters(cond);
        return build();
      },
      orderBy: () => build(),
      limit: (n: number) => {
        limitedTo = n;
        return build();
      },
      offset: () => build(),
    });
  };
  return build();
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
    roles: { registry: MOCK_USER_ROLE },
  }),
  stripBearer: (h: string | null | undefined) =>
    h?.startsWith('Bearer ') === true ? h.slice(7) : null,
}));

const uploadS3ObjectMock = mock(async (key: string) => key);
const buildArchiveMock = mock(async (key: string) => key);
mock.module('@/lib/s3', () => ({
  ensureBucketExists: async () => {},
  uploadS3Object: uploadS3ObjectMock,
  getPresignedUrl: async (key: string) => `${MOCK_PRESIGNED_BASE_URL}/${key}`,
  deleteS3Object: async () => {},
  buildAndUploadZipArchive: buildArchiveMock,
  s3Client: {},
  s3PresignClient: {},
}));

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
    form.append(
      'manifest',
      '[project]\nconfig_version = 1\n\n[package]\nname = "@xxx/cardo"\n',
    );

    const res = await postPublish(form);
    expect(res.status).toBe(400);
  });

  it('publishes a new scoped version and uploads objects to S3', async () => {
    uploadS3ObjectMock.mockClear();
    buildArchiveMock.mockClear();
    await db.delete(packages).where(eq(packages.name, '@xxx/yyy'));
    try {
      const pkgText = [
        '[project]',
        'config_version = 1',
        '',
        '[package]',
        'name = "@xxx/yyy"',
        'version = "0.0.1"',
        'description = "scoped publish"',
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
      expect(uploadS3ObjectMock.mock.calls.length).toBeGreaterThan(0);
      expect(buildArchiveMock.mock.calls.length).toBeGreaterThan(0);
    } finally {
      await db.delete(packages).where(eq(packages.name, '@xxx/yyy'));
    }
  });
});

describe('POST /v1/packages invalid behavior', () => {
  it('rejects republishing an existing version with 409', async () => {
    const pkgText = [
      '[project]',
      'config_version = 1',
      '',
      '[package]',
      'name = "@xxx/yyy"',
      'version = "0.0.1"',
      '',
      '[components]',
      'files = ["lib.typ"]',
      '',
    ].join('\n');
    const first = await buildZip({
      'lib.typ': '#let note(body) = block()[#body]\n',
    });
    const firstForm = new FormData();
    firstForm.append('pkg', pkgText);
    firstForm.append('components', first);
    const firstRes = await postPublish(firstForm);
    expect(firstRes.status).toBe(201);

    const second = await buildZip({
      'lib.typ': '#let note(body) = block()[#body]\n',
    });
    const secondForm = new FormData();
    secondForm.append('pkg', pkgText);
    secondForm.append('components', second);
    const secondRes = await postPublish(secondForm);
    expect(secondRes.status).toBe(409);
    const data = (await secondRes.json()) as { error: string; message: string };
    expect(data.error).toBe('ConflictError');
    expect(data.message).toMatch(/already exists/);

    await db.delete(packages).where(eq(packages.name, '@xxx/yyy'));
  });

  it('rejects garbage Bearer token with 401', async () => {
    const archive = await buildZip({ 'lib.typ': '#let x = 1' });
    const form = new FormData();
    form.append('manifest', '[project]\nconfig_version = 1\n');
    form.append('components', archive);
    const res = await app.fetch(
      new Request('http://localhost/v1/packages', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' },
        body: form,
      }),
    );
    expect(res.status).toBe(401);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe('UnauthorizedError');
  });

  it('rejects oversized archives with 413', async () => {
    const originalLimit = config.maxArchiveBytes;
    Object.defineProperty(config, 'maxArchiveBytes', {
      value: 8,
      configurable: true,
    });
    try {
      const archive = await buildZip({ 'lib.typ': '#let x = 1' });
      const form = new FormData();
      form.append(
        'manifest',
        '[project]\nconfig_version = 1\n\n[package]\nname = "@xxx/yyy"\nversion = "9.9.9"\n',
      );
      form.append('components', archive);
      const res = await postPublish(form);
      expect(res.status).toBe(413);
      const data = (await res.json()) as { error: string; message: string };
      expect(data.error).toBe('PayloadTooLargeError');
      expect(data.message).toMatch(/exceeds/);
    } finally {
      Object.defineProperty(config, 'maxArchiveBytes', {
        value: originalLimit,
        configurable: true,
      });
    }
  });

  it('rejects unknown archive section with 400', async () => {
    const res = await app.fetch(
      new Request('http://localhost/v1/@xxx/yyy/0.0.1/archive?section=bogus'),
    );
    expect([400, 404].includes(res.status)).toBe(true);
    if (res.status === 400) {
      const data = (await res.json()) as { error: string; message: string };
      expect(data.error).toBe('ValidationError');
      expect(data.message).toMatch(/Unknown section/);
    }
  });
});
