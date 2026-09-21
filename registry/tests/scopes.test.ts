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

let currentUser = {
  id: USER_A_ID,
  email: USER_A_EMAIL,
  roles: ['user'],
};

const mockScopes: Record<string, unknown>[] = [];
const mockMembers: Record<string, unknown>[] = [];
const mockInvitations: Record<string, unknown>[] = [];
const mockFiles: Record<string, unknown>[] = [];
const mockRequests: Record<string, unknown>[] = [];
const mockPackages: Record<string, unknown>[] = [];
const mockVersions: Record<string, unknown>[] = [];

function extractFilters(condition: any): { col: string; val: unknown }[] {
  const filters: { col: string; val: unknown }[] = [];
  if (!condition) return filters;
  const chunks = condition.queryChunks || [];
  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i]?.name !== undefined && chunks[i + 2]?.value !== undefined) {
      filters.push({ col: chunks[i].name, val: chunks[i + 2].value });
    } else if (chunks[i]?.queryChunks) {
      filters.push(...extractFilters(chunks[i]));
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
    const snakeCol = col.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
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

  const query: any = {
    innerJoin: () => query,
    where: (cond: any) => {
      activeFilters = extractFilters(cond);
      return query;
    },
    orderBy: () => query,
    limit: (n: number) => ({
      then: (resolve?: (val: unknown) => unknown) => {
        const rows = getRows().slice(0, n);
        return Promise.resolve(resolve ? resolve(rows) : rows);
      },
    }),
    then: (resolve?: (val: unknown) => unknown) => {
      const rows = getRows();
      return Promise.resolve(resolve ? resolve(rows) : rows);
    },
  };
  return query;
}

const mockDb = {
  select: () => ({
    from: (table: unknown) => createMockQuery(getTableName(table as any)),
  }),
  insert: (table: unknown) => ({
    values: (values: unknown) => {
      const name = getTableName(table as any);
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
      return {
        onConflictDoUpdate: () => Promise.resolve(),
        then: (resolve?: () => unknown) =>
          Promise.resolve(resolve ? resolve() : undefined),
      };
    },
  }),
  update: (table: unknown) => ({
    set: (values: Record<string, unknown>) => ({
      where: (cond: any) => {
        const name = getTableName(table as any);
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
  delete: (table: unknown) => ({
    where: () => Promise.resolve(),
  }),
};

mock.module('@/db', () => ({
  db: mockDb,
  schema,
}));

mock.module('@/lib/auth', () => ({
  verifyJWT: async () => currentUser,
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
    expect(emailToScopeSlug('user.name+tag@domain.co.uk')).toBe('@user-name-tag-domain-co-uk');
    expect(emailToScopeSlug('John.Doe@unsareport.org')).toBe('@john-doe-unsareport-org');
  });
});

describe('Scopes API', () => {
  it('auto-provisions personal scope on user request', async () => {
    currentUser = { id: USER_A_ID, email: USER_A_EMAIL, roles: ['user'] };
    const res = await app.fetch(new Request('http://localhost/v1/scopes', {
      headers: { Authorization: 'Bearer valid-token' },
    }));
    expect(res.status).toBe(200);
    const personalSlug = emailToScopeSlug(USER_A_EMAIL);
    const createdScope = mockScopes.find((s) => s.name === personalSlug);
    expect(createdScope).toBeDefined();
    expect(createdScope?.ownerId).toBe(USER_A_ID);
  });

  it('submits a custom scope request', async () => {
    currentUser = { id: USER_A_ID, email: USER_A_EMAIL, roles: ['user'] };
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
    currentUser = { id: ADMIN_ID, email: ADMIN_EMAIL, roles: ['admin'] };
    const pending = mockRequests[0];
    const res = await app.fetch(
      new Request(`http://localhost/v1/admin/scopes/requests/${pending.id}/approve`, {
        method: 'POST',
        headers: { Authorization: 'Bearer admin-token' },
      }),
    );
    expect(res.status).toBe(200);
    const approvedScope = mockScopes.find((s) => s.name === '@unsareport');
    expect(approvedScope).toBeDefined();
  });

  it('pushes scope contents with tsconfig.json', async () => {
    currentUser = { id: USER_A_ID, email: USER_A_EMAIL, roles: ['user'] };
    const zip = new JSZip();
    zip.file('tsconfig.json', JSON.stringify({ compilerOptions: { paths: { '@unsareport/*': ['./*'] } } }));
    const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });

    const form = new FormData();
    form.append('manifest', `
[project]
config_version = 1

[scope]
name = "@unsareport"
description = "Official UNSAReport scope"
files = ["tsconfig.json"]
`);
    form.append('files', new File([zipBuf], 'scope.zip'));

    const res = await app.fetch(
      new Request('http://localhost/v1/scopes/@unsareport/contents', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: form,
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.scope.files).toEqual(['tsconfig.json']);
  });

  it('allows scope admin to invite contributor and contributor to publish', async () => {
    currentUser = { id: USER_A_ID, email: USER_A_EMAIL, roles: ['user'] };
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
    const invData = (await invRes.json()) as any;

    currentUser = { id: USER_B_ID, email: USER_B_EMAIL, roles: ['user'] };
    const acceptRes = await app.fetch(
      new Request(`http://localhost/v1/scopes/invitations/${invData.invitation.id}/accept`, {
        method: 'POST',
        headers: { Authorization: 'Bearer b-token' },
      }),
    );
    expect(acceptRes.status).toBe(200);

    // Contributor publishes to @unsareport/epis-lab
    const zip = new JSZip();
    zip.file('lib.typ', '#let x = 1');
    const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });

    const form = new FormData();
    form.append('manifest', `
[project]
config_version = 1

[package]
name = "@unsareport/epis-lab"
version = "0.1.0"

[components]
files = ["lib.typ"]
`);
    form.append('components', new File([zipBuf], 'archive.zip'));

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
    currentUser = { id: '30000000-0000-4000-8000-000000000003', email: 'charlie@other.com', roles: ['user'] };
    const zip = new JSZip();
    zip.file('lib.typ', '#let x = 1');
    const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });

    const form = new FormData();
    form.append('manifest', `
[project]
config_version = 1

[package]
name = "@unsareport/unauthorized-pkg"
version = "0.1.0"

[components]
files = ["lib.typ"]
`);
    form.append('components', new File([zipBuf], 'archive.zip'));

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
    currentUser = { id: USER_A_ID, email: USER_A_EMAIL, roles: ['user'] };
    const zip = new JSZip();
    zip.file('lib.typ', '#let x = 1');
    const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });

    const form = new FormData();
    form.append('manifest', `
[project]
config_version = 1

[package]
name = "unscoped-pkg"
version = "0.1.0"

[components]
files = ["lib.typ"]
`);
    form.append('components', new File([zipBuf], 'archive.zip'));

    const pubRes = await app.fetch(
      new Request('http://localhost/v1/packages', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: form,
      }),
    );
    expect(pubRes.status).toBe(400);
    const body = (await pubRes.json()) as any;
    expect(body.message).toMatch(/Unscoped packages are not allowed/);
  });
});
