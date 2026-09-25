import { describe, expect, it, mock } from 'bun:test';
import { getTableName } from 'drizzle-orm';
import * as schema from '@/db/schema';

const GARBAGE_TOKEN = 'garbage-token-xyz';

const mockTags: Record<string, unknown>[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'slides',
    displayName: 'Slides',
    parentId: null,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'pitch',
    displayName: 'Pitch',
    parentId: '11111111-1111-4111-8111-111111111111',
  },
];

const mockPackages: Record<string, unknown>[] = [
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'typst-cover',
    displayName: 'Typst Cover',
    description: 'Cover template',
    authorId: '44444444-4444-4444-8444-444444444444',
    latestVersion: '1.0.0',
    status: 'approved',
  },
];

const mockPackageTags: Record<string, unknown>[] = [
  {
    packageId: '33333333-3333-4333-8333-333333333333',
    tagId: '11111111-1111-4111-8111-111111111111',
  },
];

const mockPackageVersions: Record<string, unknown>[] = [
  {
    id: '55555555-5555-4555-8555-555555555555',
    packageId: '33333333-3333-4333-8333-333333333333',
    version: '1.0.0',
    status: 'approved',
    createdAt: new Date(),
  },
];

function extractFilters(condition: unknown): { col: string; val: unknown }[] {
  const filters: { col: string; val: unknown }[] = [];
  if (!condition || typeof condition !== 'object') return filters;
  if (!('queryChunks' in condition)) return filters;
  const rawChunks = condition.queryChunks;
  if (!Array.isArray(rawChunks)) return filters;
  const items = rawChunks as {
    name?: unknown;
    value?: unknown;
    queryChunks?: unknown;
  }[];
  for (let i = 0; i < items.length; i++) {
    const current = items[i];
    const ahead = items[i + 2];
    if (current?.name !== undefined && ahead?.value !== undefined) {
      filters.push({ col: current.name as string, val: ahead.value });
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
    const camelCol = col.replace(/_([a-z])/g, (_, g: string) =>
      g.toUpperCase(),
    );
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

type MockQuery = Promise<Record<string, unknown>[]> & {
  innerJoin: () => MockQuery;
  where: (cond: unknown) => MockQuery;
  orderBy: () => MockQuery;
  limit: (n: number) => MockQuery;
  offset: () => MockQuery;
};

function createMockQuery(tableName: string): MockQuery {
  let activeFilters: { col: string; val: unknown }[] = [];
  let limitedTo: number | undefined;
  const getRows = (): Record<string, unknown>[] => {
    let source: Record<string, unknown>[] = [];
    if (tableName === 'tags') {
      source = [...mockTags];
    } else if (tableName === 'packages') {
      source = [...mockPackages];
    } else if (tableName === 'package_tags') {
      source = [...mockPackageTags];
    } else if (tableName === 'package_versions') {
      source = [...mockPackageVersions];
    } else {
      throw new Error(`Unhandled mock table in query: ${tableName}`);
    }
    if (activeFilters.length > 0) {
      return source.filter((r) => rowMatches(r, activeFilters));
    }
    return source;
  };
  const build = (): MockQuery => {
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
};

mock.module('@/db', () => ({
  db: mockDb,
  schema,
}));

mock.module('@/lib/auth', () => ({
  verifyJWT: async (token: string) => {
    if (token === GARBAGE_TOKEN) {
      throw new Error('Invalid authentication token');
    }
    return {
      id: '00000000-0000-4000-8000-000000000001',
      email: 'test@example.com',
      roles: {},
    };
  },
  stripBearer: (h: string | null | undefined) => {
    if (h?.startsWith('Bearer ') !== true) {
      return null;
    }
    const token = h.slice(7);
    if (token.length === 0 || token[0] === ' ' || token[0] === '\t') {
      return null;
    }
    return token;
  },
}));

const { default: app } = await import('@/index');

describe('App API Routes', () => {
  it('GET /health returns health status', async () => {
    const res = await app.fetch(new Request('http://localhost/health'));
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      status: string;
      service: string;
      endpoints: string[];
    };
    expect(data.status).toBe('ok');
    expect(data.service).toBe('unsareport-registry');
    expect(Array.isArray(data.endpoints)).toBe(true);
  });

  it('POST /v1/resolve returns 400 for empty body', async () => {
    const res = await app.fetch(
      new Request('http://localhost/v1/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('ValidationError');
  });

  it('GET /v1/tags returns seeded tags with nested children', async () => {
    const res = await app.fetch(new Request('http://localhost/v1/tags'));
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      tags: {
        id: string;
        name: string;
        displayName: string;
        children: { id: string; name: string }[];
      }[];
    };
    expect(Array.isArray(data.tags)).toBe(true);
    expect(data.tags).toHaveLength(1);
    expect(data.tags[0].name).toBe('slides');
    expect(data.tags[0].children).toHaveLength(1);
    expect(data.tags[0].children[0].name).toBe('pitch');
  });

  it('GET /v1/packages returns seeded packages matching search', async () => {
    const res = await app.fetch(
      new Request('http://localhost/v1/packages?search=typst'),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      total: number;
      packages: {
        id: string;
        name: string;
        status: string;
        version: string;
        versions: string[];
      }[];
    };
    expect(data.total).toBe(1);
    expect(Array.isArray(data.packages)).toBe(true);
    expect(data.packages).toHaveLength(1);
    expect(data.packages[0].name).toBe('typst-cover');
    expect(data.packages[0].status).toBe('approved');
    expect(data.packages[0].version).toBe('1.0.0');
    expect(data.packages[0].versions).toEqual(['1.0.0']);
  });

  it('POST /v1/packages rejects unauthorized request with 401', async () => {
    const res = await app.fetch(
      new Request('http://localhost/v1/packages', {
        method: 'POST',
      }),
    );
    expect(res.status).toBe(401);
  });
});

describe('App invalid behavior', () => {
  it('POST /v1/resolve returns 400 for malformed JSON', async () => {
    const res = await app.fetch(
      new Request('http://localhost/v1/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{not json',
      }),
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('ValidationError');
  });

  it('POST /v1/packages returns 401 for garbage Bearer token', async () => {
    const res = await app.fetch(
      new Request('http://localhost/v1/packages', {
        method: 'POST',
        headers: { Authorization: `Bearer ${GARBAGE_TOKEN}` },
      }),
    );
    expect(res.status).toBe(401);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('UnauthorizedError');
  });

  it('GET unknown route returns 404', async () => {
    const res = await app.fetch(
      new Request('http://localhost/no-such-route-xyz'),
    );
    expect(res.status).toBe(404);
  });
});
