import { describe, expect, it, mock } from 'bun:test';
import { getTableName } from 'drizzle-orm';
import JSZip from 'jszip';
import * as schema from '@/db/schema';
import { emailToScopeSlug } from '@/lib/slug';

const USER_A_ID = '10000000-0000-4000-8000-000000000001';
const USER_A_EMAIL = 'alice.dev+test@example.com';

const USER_B_ID = '20000000-0000-4000-8000-000000000002';
const USER_B_EMAIL = 'bob@example.com';

const ADMIN_ID = '90000000-0000-4000-8000-000000000009';
const ADMIN_EMAIL = 'admin@unsareport.org';

const VALID_TOKEN = 'valid-token';
const ADMIN_TOKEN = 'admin-token';
const B_TOKEN = 'b-token';
const CHARLIE_TOKEN = 'charlie-token';

let currentUser = {
  id: USER_A_ID,
  email: USER_A_EMAIL,
  roles: { registry: 'user' },
};

const mockScopes: Record<string, unknown>[] = [];
const mockMembers: Record<string, unknown>[] = [];
const mockInvitations: Record<string, unknown>[] = [];
const mockFiles: Record<string, unknown>[] = [];
const mockRequests: Record<string, unknown>[] = [];
const mockPackages: Record<string, unknown>[] = [];
const mockVersions: Record<string, unknown>[] = [];

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

type DbTable = Parameters<typeof getTableName>[0];

type SelectQuery = Promise<Record<string, unknown>[]> & {
  innerJoin: () => SelectQuery;
  where: (cond: unknown) => SelectQuery;
  orderBy: () => SelectQuery;
  limit: (n: number) => Promise<Record<string, unknown>[]>;
};

function createMockQuery(tableName: string): SelectQuery {
  let activeFilters: { col: string; val: unknown }[] = [];

  const getRows = (): Record<string, unknown>[] => {
    let source: Record<string, unknown>[] = [];
    if (tableName === 'scopes') source = [...mockScopes];
    else if (tableName === 'scope_members') source = [...mockMembers];
    else if (tableName === 'scope_invitations') source = [...mockInvitations];
    else if (tableName === 'scope_files') source = [...mockFiles];
    else if (tableName === 'scope_requests') source = [...mockRequests];
    else if (tableName === 'packages') source = [...mockPackages];
    else if (tableName === 'package_versions') source = [...mockVersions];

    if (activeFilters.length > 0) {
      return source.filter((r) => rowMatches(r, activeFilters));
    }
    return source;
  };

  const build = (limitedTo?: number): SelectQuery => {
    const rows =
      limitedTo === undefined ? getRows() : getRows().slice(0, limitedTo);
    return Object.assign(Promise.resolve(rows), {
      innerJoin: () => build(limitedTo),
      where: (cond: unknown) => {
        activeFilters = extractFilters(cond);
        return build(limitedTo);
      },
      orderBy: () => build(limitedTo),
      limit: (n: number) => build(n),
    });
  };
  return build();
}

const mockDb = {
  select: () => ({
    from: (table: DbTable) => createMockQuery(getTableName(table)),
  }),
  insert: (table: DbTable) => ({
    values: (values: unknown) => {
      const name = getTableName(table);
      if (name === 'scopes') {
        mockScopes.push(values as Record<string, unknown>);
      } else if (name === 'scope_members') {
        mockMembers.push(values as Record<string, unknown>);
      } else if (name === 'scope_invitations') {
        mockInvitations.push(values as Record<string, unknown>);
      } else if (name === 'scope_files') {
        mockFiles.push(values as Record<string, unknown>);
      } else if (name === 'scope_requests') {
        mockRequests.push(values as Record<string, unknown>);
      } else if (name === 'packages') {
        mockPackages.push(values as Record<string, unknown>);
      } else if (name === 'package_versions') {
        mockVersions.push(values as Record<string, unknown>);
      }
      return Object.assign(Promise.resolve(), {
        onConflictDoUpdate: () => Promise.resolve(),
      });
    },
  }),
  update: (table: DbTable) => ({
    set: (values: Record<string, unknown>) => ({
      where: (cond: unknown) => {
        const name = getTableName(table);
        const filters = extractFilters(cond);
        let list: Record<string, unknown>[] = [];
        if (name === 'scope_requests') list = mockRequests;
        else if (name === 'scope_invitations') list = mockInvitations;
        else if (name === 'scopes') list = mockScopes;
        else if (name === 'scope_members') list = mockMembers;

        for (const item of list) {
          if (rowMatches(item, filters)) {
            Object.assign(item, values);
          }
        }
        return Promise.resolve();
      },
    }),
  }),
  delete: (_table: DbTable) => ({
    where: () => Promise.resolve(),
  }),
};

mock.module('@/db', () => ({
  db: mockDb,
  schema,
}));

mock.module('@/lib/auth', () => ({
  verifyJWT: async (token: string) => {
    if (
      token !== VALID_TOKEN &&
      token !== ADMIN_TOKEN &&
      token !== B_TOKEN &&
      token !== CHARLIE_TOKEN
    ) {
      throw new Error('Invalid authentication token');
    }
    return currentUser;
  },
  stripBearer: (header: string | null | undefined) => {
    if (header?.startsWith('Bearer ') !== true) {
      return null;
    }
    const token = header.slice(7);
    if (token.length === 0 || token[0] === ' ' || token[0] === '\t') {
      return null;
    }
    return token;
  },
}));

mock.module('@/lib/s3', () => ({
  ensureBucketExists: async () => {},
  uploadS3Object: async (key: string) => key,
  getPresignedUrl: async (key: string) => `http://localhost/s3-mock/${key}`,
  deleteS3Object: async () => {},
  buildAndUploadZipArchive: async (key: string) => key,
}));

const { default: app } = await import('@/index');

describe('Scope slug derivation', () => {
  it('converts email to deterministic full slug', () => {
    expect(emailToScopeSlug('user.name+tag@domain.co.uk')).toBe(
      '@user-name-tag-domain-co-uk',
    );
    expect(emailToScopeSlug('John.Doe@unsareport.org')).toBe(
      '@john-doe-unsareport-org',
    );
  });
});

describe('Scopes API', () => {
  it('auto-provisions personal scope on user request', async () => {
    currentUser = {
      id: USER_A_ID,
      email: USER_A_EMAIL,
      roles: { registry: 'user' },
    };
    const res = await app.fetch(
      new Request('http://localhost/v1/scopes', {
        headers: { Authorization: 'Bearer valid-token' },
      }),
    );
    expect(res.status).toBe(200);
    const personalSlug = emailToScopeSlug(USER_A_EMAIL);
    const createdScope = mockScopes.find((s) => s.name === personalSlug);
    expect(createdScope).toBeDefined();
    expect(createdScope?.ownerId).toBe(USER_A_ID);
  });

  it('submits a custom scope request', async () => {
    currentUser = {
      id: USER_A_ID,
      email: USER_A_EMAIL,
      roles: { registry: 'user' },
    };
    const res = await app.fetch(
      new Request('http://localhost/v1/scopes/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          scopeName: '@unsareport',
          reason: 'Official UNSAReport component library',
        }),
      }),
    );
    expect(res.status).toBe(201);
    const req = mockRequests.find((r) => r.scopeName === '@unsareport');
    expect(req).toBeDefined();
    expect(req?.status).toBe('pending');
  });

  it('admin approves scope request', async () => {
    currentUser = {
      id: ADMIN_ID,
      email: ADMIN_EMAIL,
      roles: { registry: 'admin' },
    };
    const pending = mockRequests[0];
    const res = await app.fetch(
      new Request(
        `http://localhost/v1/admin/scopes/requests/${pending.id}/approve`,
        {
          method: 'POST',
          headers: { Authorization: 'Bearer admin-token' },
        },
      ),
    );
    expect(res.status).toBe(200);
    const approvedScope = mockScopes.find((s) => s.name === '@unsareport');
    expect(approvedScope).toBeDefined();
  });

  it('pushes scope contents with tsconfig.json', async () => {
    currentUser = {
      id: USER_A_ID,
      email: USER_A_EMAIL,
      roles: { registry: 'user' },
    };
    const zip = new JSZip();
    zip.file(
      'tsconfig.json',
      JSON.stringify({
        compilerOptions: { paths: { '@unsareport/*': ['./*'] } },
      }),
    );
    const zipBuf = await zip.generateAsync({ type: 'uint8array' });

    const form = new FormData();
    form.append(
      'manifest',
      `
[project]
config_version = 1

[scope]
name = "@unsareport"
description = "Official UNSAReport scope"
files = ["tsconfig.json"]
`,
    );
    form.append(
      'files',
      new File([zipBuf as unknown as BlobPart], 'scope.zip'),
    );

    const res = await app.fetch(
      new Request('http://localhost/v1/scopes/@unsareport/contents', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: form,
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { scope: { files: string[] } };
    expect(body.scope.files).toEqual(['tsconfig.json']);
  });

  it('allows scope admin to invite contributor and contributor to publish', async () => {
    currentUser = {
      id: USER_A_ID,
      email: USER_A_EMAIL,
      roles: { registry: 'user' },
    };
    const invRes = await app.fetch(
      new Request('http://localhost/v1/scopes/@unsareport/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({ email: USER_B_EMAIL, role: 'contributor' }),
      }),
    );
    expect(invRes.status).toBe(201);
    const invData = (await invRes.json()) as { invitation: { id: string } };

    currentUser = {
      id: USER_B_ID,
      email: USER_B_EMAIL,
      roles: { registry: 'user' },
    };
    const acceptRes = await app.fetch(
      new Request(
        `http://localhost/v1/scopes/invitations/${invData.invitation.id}/accept`,
        {
          method: 'POST',
          headers: { Authorization: 'Bearer b-token' },
        },
      ),
    );
    expect(acceptRes.status).toBe(200);

    const zip = new JSZip();
    zip.file('lib.typ', '#let x = 1');
    const zipBuf = await zip.generateAsync({ type: 'uint8array' });

    const form = new FormData();
    form.append(
      'manifest',
      `
[project]
config_version = 1

[package]
name = "@unsareport/epis-lab"
version = "0.1.0"

[components]
files = ["lib.typ"]
`,
    );
    form.append(
      'components',
      new File([zipBuf as unknown as BlobPart], 'archive.zip'),
    );

    const pubRes = await app.fetch(
      new Request('http://localhost/v1/packages', {
        method: 'POST',
        headers: { Authorization: 'Bearer b-token' },
        body: form,
      }),
    );
    expect(pubRes.status).toBe(201);
  });

  it('rejects publishing to a scope without membership', async () => {
    currentUser = {
      id: '30000000-0000-4000-8000-000000000003',
      email: 'charlie@other.com',
      roles: { registry: 'user' },
    };
    const zip = new JSZip();
    zip.file('lib.typ', '#let x = 1');
    const zipBuf = await zip.generateAsync({ type: 'uint8array' });

    const form = new FormData();
    form.append(
      'manifest',
      `
[project]
config_version = 1

[package]
name = "@unsareport/unauthorized-pkg"
version = "0.1.0"

[components]
files = ["lib.typ"]
`,
    );
    form.append(
      'components',
      new File([zipBuf as unknown as BlobPart], 'archive.zip'),
    );

    const pubRes = await app.fetch(
      new Request('http://localhost/v1/packages', {
        method: 'POST',
        headers: { Authorization: 'Bearer charlie-token' },
        body: form,
      }),
    );
    expect(pubRes.status).toBe(403);
  });

  it('strictly rejects unscoped packages', async () => {
    currentUser = {
      id: USER_A_ID,
      email: USER_A_EMAIL,
      roles: { registry: 'user' },
    };
    const zip = new JSZip();
    zip.file('lib.typ', '#let x = 1');
    const zipBuf = await zip.generateAsync({ type: 'uint8array' });

    const form = new FormData();
    form.append(
      'manifest',
      `
[project]
config_version = 1

[package]
name = "unscoped-pkg"
version = "0.1.0"

[components]
files = ["lib.typ"]
`,
    );
    form.append(
      'components',
      new File([zipBuf as unknown as BlobPart], 'archive.zip'),
    );

    const pubRes = await app.fetch(
      new Request('http://localhost/v1/packages', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: form,
      }),
    );
    expect(pubRes.status).toBe(400);
    const body = (await pubRes.json()) as { message: string };
    expect(body.message).toMatch(/Unscoped packages are not allowed/);
  });
});

describe('Scopes invalid behavior', () => {
  it('rejects duplicate scope requests with 409', async () => {
    currentUser = {
      id: USER_A_ID,
      email: USER_A_EMAIL,
      roles: { registry: 'user' },
    };
    const payload = {
      scopeName: '@unsareport',
      reason: 'Official UNSAReport component library',
    };
    const res = await app.fetch(
      new Request('http://localhost/v1/scopes/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify(payload),
      }),
    );
    expect(res.status).toBe(409);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe('ConflictError');
  });

  it('rejects non-admin scope approval with 403', async () => {
    currentUser = {
      id: USER_A_ID,
      email: USER_A_EMAIL,
      roles: { registry: 'user' },
    };
    const pending = mockRequests[0];
    const res = await app.fetch(
      new Request(
        `http://localhost/v1/admin/scopes/requests/${pending.id}/approve`,
        {
          method: 'POST',
          headers: { Authorization: 'Bearer valid-token' },
        },
      ),
    );
    expect(res.status).toBe(403);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe('ForbiddenError');
  });

  it('rejects non-admin scope invitations with 403', async () => {
    currentUser = {
      id: USER_B_ID,
      email: USER_B_EMAIL,
      roles: { registry: 'user' },
    };
    const res = await app.fetch(
      new Request('http://localhost/v1/scopes/@unsareport/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer b-token',
        },
        body: JSON.stringify({
          email: 'mallory@other.com',
          role: 'contributor',
        }),
      }),
    );
    expect(res.status).toBe(403);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe('ForbiddenError');
  });

  it('rejects accepting a missing invitation with 404', async () => {
    currentUser = {
      id: USER_B_ID,
      email: USER_B_EMAIL,
      roles: { registry: 'user' },
    };
    const res = await app.fetch(
      new Request(
        'http://localhost/v1/scopes/invitations/00000000-0000-4000-8000-000000000099/accept',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer b-token' },
        },
      ),
    );
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe('NotFoundError');
  });

  it('rejects malformed scope requests with 400', async () => {
    currentUser = {
      id: USER_A_ID,
      email: USER_A_EMAIL,
      roles: { registry: 'user' },
    };
    const res = await app.fetch(
      new Request('http://localhost/v1/scopes/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({ scopeName: '@unsareport-fresh', reason: 'x' }),
      }),
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe('ValidationError');
  });

  it('lists pending invitations for authenticated user and for scope admin, then cancels', async () => {
    currentUser = {
      id: ADMIN_ID,
      email: ADMIN_EMAIL,
      roles: { registry: 'admin' },
    };
    const invRes = await app.fetch(
      new Request('http://localhost/v1/scopes/@unsareport/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify({
          email: 'bob@example.com',
          role: 'contributor',
        }),
      }),
    );
    expect(invRes.status).toBe(201);
    const invData = (await invRes.json()) as { invitation: { id: string } };

    currentUser = {
      id: USER_B_ID,
      email: USER_B_EMAIL,
      roles: { registry: 'user' },
    };
    const userInvsRes = await app.fetch(
      new Request('http://localhost/v1/scopes/invitations', {
        headers: { Authorization: 'Bearer b-token' },
      }),
    );
    expect(userInvsRes.status).toBe(200);
    const userInvsData = (await userInvsRes.json()) as {
      invitations: Array<{ id: string; email: string; scopeName?: string }>;
    };
    expect(
      userInvsData.invitations.some((i) => i.id === invData.invitation.id),
    ).toBe(true);

    currentUser = {
      id: ADMIN_ID,
      email: ADMIN_EMAIL,
      roles: { registry: 'admin' },
    };
    const scopeInvsRes = await app.fetch(
      new Request('http://localhost/v1/scopes/@unsareport/invitations', {
        headers: { Authorization: 'Bearer admin-token' },
      }),
    );
    expect(scopeInvsRes.status).toBe(200);
    const scopeInvsData = (await scopeInvsRes.json()) as {
      invitations: Array<{ id: string }>;
    };
    expect(
      scopeInvsData.invitations.some((i) => i.id === invData.invitation.id),
    ).toBe(true);

    currentUser = {
      id: USER_B_ID,
      email: USER_B_EMAIL,
      roles: { registry: 'user' },
    };
    const forbiddenRes = await app.fetch(
      new Request('http://localhost/v1/scopes/@unsareport/invitations', {
        headers: { Authorization: 'Bearer b-token' },
      }),
    );
    expect(forbiddenRes.status).toBe(403);

    currentUser = {
      id: ADMIN_ID,
      email: ADMIN_EMAIL,
      roles: { registry: 'admin' },
    };
    const delRes = await app.fetch(
      new Request(
        `http://localhost/v1/scopes/@unsareport/invitations/${invData.invitation.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: 'Bearer admin-token' },
        },
      ),
    );
    expect(delRes.status).toBe(200);
  });
});
