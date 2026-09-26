import { describe, expect, it, mock } from 'bun:test';

const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
const PUBLIC_PRES_ID = 'a41d9440-eca6-4812-8521-dea0ded5c001';
const PRIVATE_PRES_ID = 'a41d9440-eca6-4812-8521-dea0ded5c002';

mock.module('@/lib/auth', () => ({
  stripBearer: (authHeader: string | null | undefined) => {
    if (authHeader?.startsWith('Bearer ') !== true) {
      return null;
    }
    const token = authHeader.slice(7);
    if (token.length === 0 || token[0] === ' ' || token[0] === '\t') {
      return null;
    }
    return token;
  },
  verifyCredential: async (token: string) => {
    if (token === 'valid-owner-token') {
      return { id: TEST_USER_ID, roles: { slides: 'editor' } };
    }
    if (token === 'valid-stranger-token') {
      return { id: OTHER_USER_ID, roles: { slides: 'viewer' } };
    }
    throw new Error('Token verification failed: invalid token');
  },
}));

mock.module('@/lib/s3', () => ({
  uploadS3Object: async (key: string) => key,
  getS3Object: async (key: string) => {
    if (key.includes('missing')) {
      throw new Error('NoSuchKey: The specified key does not exist');
    }
    return {
      body: new Uint8Array([
        60, 104, 49, 62, 72, 101, 108, 108, 111, 60, 47, 104, 49, 62,
      ]),
      contentType: 'text/html; charset=utf-8',
    };
  },
  deleteS3Object: async () => {},
  deleteS3Prefix: async () => {},
  getPresignedUrl: async (key: string) => `http://localhost/s3/${key}`,
  ensureBucketExists: async () => {},
  getMimeType: (filePath: string) => {
    if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
    if (filePath.endsWith('.js'))
      return 'application/javascript; charset=utf-8';
    if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
    return 'application/octet-stream';
  },
}));

let mockPresentations: Record<string, unknown>[] = [];
let mockVersions: Record<string, unknown>[] = [];

mock.module('@/db/index', () => {
  const db = {
    select: () => ({
      from: (table: Record<string, unknown> | unknown) => ({
        where: () => ({
          limit: () => {
            const tableName =
              typeof table === 'object' && table !== null
                ? (table as Record<symbol, unknown>)[Symbol.for('drizzle:Name')]
                : '';
            if (tableName === 'presentation_versions') {
              return Promise.resolve(mockVersions);
            }
            return Promise.resolve(mockPresentations);
          },
        }),
      }),
    }),
  };
  return { db };
});

const { default: app } = await import('@/index');

describe('GET /embed/:id/v:version/*', () => {
  it('rejects path traversal with 400', async () => {
    const res = await app.fetch(
      new Request('http://localhost/embed/demo/v1/../../etc/passwd'),
    );
    expect(res.status).toBe(400);
  });

  it('rejects invalid version number with 400', async () => {
    const res = await app.fetch(
      new Request('http://localhost/embed/demo/v0/index.html'),
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when presentation does not exist', async () => {
    mockPresentations = [];
    const res = await app.fetch(
      new Request('http://localhost/embed/nonexistent/v1/index.html'),
    );
    expect(res.status).toBe(404);
  });

  it('serves static file for a public presentation without auth', async () => {
    mockPresentations = [
      {
        id: PUBLIC_PRES_ID,
        slug: 'public-deck',
        title: 'Public Deck',
        ownerType: 'user',
        ownerId: TEST_USER_ID,
        visibility: 'public',
      },
    ];
    mockVersions = [
      {
        id: 'ver-1',
        presentationId: PUBLIC_PRES_ID,
        versionNumber: 1,
        bundleS3Prefix: `presentations/${PUBLIC_PRES_ID}/v1/`,
      },
    ];

    const res = await app.fetch(
      new Request(`http://localhost/embed/${PUBLIC_PRES_ID}/v1/index.html`),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const text = await res.text();
    expect(text).toBe('<h1>Hello</h1>');
  });

  it('serves default index.html when trailing path is omitted', async () => {
    mockPresentations = [
      {
        id: PUBLIC_PRES_ID,
        slug: 'public-deck',
        title: 'Public Deck',
        ownerType: 'user',
        ownerId: TEST_USER_ID,
        visibility: 'public',
      },
    ];
    mockVersions = [
      {
        id: 'ver-1',
        presentationId: PUBLIC_PRES_ID,
        versionNumber: 1,
        bundleS3Prefix: `presentations/${PUBLIC_PRES_ID}/v1/`,
      },
    ];

    const res = await app.fetch(
      new Request(`http://localhost/embed/${PUBLIC_PRES_ID}/v1`),
    );
    expect(res.status).toBe(200);
  });

  it('rejects access to a private presentation without credentials with 401', async () => {
    mockPresentations = [
      {
        id: PRIVATE_PRES_ID,
        slug: 'private-deck',
        title: 'Private Deck',
        ownerType: 'user',
        ownerId: TEST_USER_ID,
        visibility: 'private',
      },
    ];

    const res = await app.fetch(
      new Request(`http://localhost/embed/${PRIVATE_PRES_ID}/v1/index.html`),
    );
    expect(res.status).toBe(401);
  });

  it('allows access to private presentation with query token for iframe embedding', async () => {
    mockPresentations = [
      {
        id: PRIVATE_PRES_ID,
        slug: 'private-deck',
        title: 'Private Deck',
        ownerType: 'user',
        ownerId: TEST_USER_ID,
        visibility: 'private',
      },
    ];
    mockVersions = [
      {
        id: 'ver-1',
        presentationId: PRIVATE_PRES_ID,
        versionNumber: 1,
        bundleS3Prefix: `presentations/${PRIVATE_PRES_ID}/v1/`,
      },
    ];

    const res = await app.fetch(
      new Request(
        `http://localhost/embed/${PRIVATE_PRES_ID}/v1/index.html?token=valid-owner-token`,
      ),
    );
    expect(res.status).toBe(200);
  });
});
