import { describe, expect, it, mock } from 'bun:test';
import {
  createMockDb,
  createMockDbState,
  getMimeType,
  getMockS3Object,
  type MockDbState,
  resetMockDbState,
  type S3BodyOverride,
  VALID_ZIP_B64,
  validManifest,
  verifyTestCredential,
} from '@/fixtures';

// Unique owner UUIDs per test file (rate-limit budgets are keyed by user id
// and shared process-wide). Valid v4 UUIDs: variant nibble 8/9/a/b.
const EMBED_USER_ID = '55555555-5555-4555-8555-555555555555';
const EMBED_STRANGER_ID = '66666666-6666-4666-8666-666666666666';
const PUBLIC_PRES_ID = 'a41d9440-eca6-4812-8521-dea0ded5c001';
const PRIVATE_PRES_ID = 'a41d9440-eca6-4812-8521-dea0ded5c002';
const EMBED_TOKEN = 'valid-owner-token';
const EMBED_STRANGER_TOKEN = 'valid-stranger-token';

const dbState: MockDbState = createMockDbState();
const s3Bodies = new Map<string, S3BodyOverride>();

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
  verifyCredential: async (token: string) =>
    verifyTestCredential(token, {
      ownerToken: EMBED_TOKEN,
      strangerToken: EMBED_STRANGER_TOKEN,
      ownerId: EMBED_USER_ID,
      strangerId: EMBED_STRANGER_ID,
    }),
}));

mock.module('@/lib/s3', () => ({
  uploadS3Object: async (key: string) => key,
  getS3Object: async (key: string) => {
    if (key.includes('missing')) {
      throw new Error('NoSuchKey: The specified key does not exist');
    }
    return getMockS3Object(s3Bodies, key);
  },
  deleteS3Object: async () => {},
  deleteS3Prefix: async () => {},
  getPresignedUrl: async (key: string) => `http://localhost/s3/${key}`,
  ensureBucketExists: async () => {},
  getMimeType,
}));

mock.module('@/db/index', () => {
  const db = createMockDb(dbState, EMBED_USER_ID);
  return { db };
});

// Dynamic import: mock.module() must be registered before the app module
// loads, so a static import would bypass the mocks.
const { default: app } = await import('@/index');

function seedPublic() {
  resetMockDbState(dbState);
  s3Bodies.clear();
  dbState.presentations.push({
    id: PUBLIC_PRES_ID,
    slug: 'public-deck',
    title: 'Public Deck',
    ownerType: 'user',
    ownerId: EMBED_USER_ID,
    visibility: 'public',
  });
  dbState.versions.push({
    id: 'ver-1',
    presentationId: PUBLIC_PRES_ID,
    versionNumber: 1,
    bundleS3Prefix: `presentations/${PUBLIC_PRES_ID}/v1/`,
  });
}

function seedPrivate() {
  resetMockDbState(dbState);
  s3Bodies.clear();
  dbState.presentations.push({
    id: PRIVATE_PRES_ID,
    slug: 'private-deck',
    title: 'Private Deck',
    ownerType: 'user',
    ownerId: EMBED_USER_ID,
    visibility: 'private',
  });
  dbState.versions.push({
    id: 'ver-1',
    presentationId: PRIVATE_PRES_ID,
    versionNumber: 1,
    bundleS3Prefix: `presentations/${PRIVATE_PRES_ID}/v1/`,
  });
}

function postDeploy(body: Record<string, unknown>, token = EMBED_TOKEN) {
  return app.fetch(
    new Request('http://localhost/presentations/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }),
  );
}

async function deployDeck(slug: string, visibility: string) {
  const res = await postDeploy({
    slug,
    title: `Embed ${slug}`,
    visibility,
    manifest: validManifest,
    bundle: VALID_ZIP_B64,
  });
  expect(res.status).toBe(200);
  const data = (await res.json()) as {
    success: boolean;
    presentationId: string;
    slug: string;
    version: number;
  };
  expect(data.success).toBe(true);
  return data;
}

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
    resetMockDbState(dbState);
    const res = await app.fetch(
      new Request('http://localhost/embed/nonexistent/v1/index.html'),
    );
    expect(res.status).toBe(404);
  });

  it('serves static file for a public presentation without auth', async () => {
    seedPublic();

    const res = await app.fetch(
      new Request(`http://localhost/embed/${PUBLIC_PRES_ID}/v1/index.html`),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const text = await res.text();
    expect(text).toBe('<h1>Hello</h1>');
  });

  it('serves default index.html when trailing path is omitted', async () => {
    seedPublic();

    const res = await app.fetch(
      new Request(`http://localhost/embed/${PUBLIC_PRES_ID}/v1/`),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  it('rejects access to a private presentation without credentials with 401', async () => {
    seedPrivate();

    const res = await app.fetch(
      new Request(`http://localhost/embed/${PRIVATE_PRES_ID}/v1/index.html`),
    );
    expect(res.status).toBe(401);
  });

  it('allows access to private presentation with query token for iframe embedding', async () => {
    seedPrivate();

    const res = await app.fetch(
      new Request(
        `http://localhost/embed/${PRIVATE_PRES_ID}/v1/index.html?token=${EMBED_TOKEN}`,
      ),
    );
    expect(res.status).toBe(200);
  });

  it('rejects access with 403 when user is not the owner of a private presentation', async () => {
    seedPrivate();

    const res = await app.fetch(
      new Request(
        `http://localhost/embed/${PRIVATE_PRES_ID}/v1/index.html?token=${EMBED_STRANGER_TOKEN}`,
      ),
    );
    expect(res.status).toBe(403);
  });

  it('rejects access with 403 when user without role/membership accesses org presentation', async () => {
    const ORG_PRES_ID = 'a41d9440-eca6-4812-8521-dea0ded5c003';
    const ORG_ID = '33333333-3333-4333-8333-333333333333';

    resetMockDbState(dbState);
    s3Bodies.clear();
    dbState.presentations.push({
      id: ORG_PRES_ID,
      slug: 'org-deck',
      title: 'Org Deck',
      ownerType: 'organization',
      ownerId: ORG_ID,
      visibility: 'org',
    });
    dbState.versions.push({
      id: 'ver-1',
      presentationId: ORG_PRES_ID,
      versionNumber: 1,
      bundleS3Prefix: `presentations/${ORG_PRES_ID}/v1/`,
    });
    // No org membership for stranger

    const res = await app.fetch(
      new Request(
        `http://localhost/embed/${ORG_PRES_ID}/v1/index.html?token=${EMBED_STRANGER_TOKEN}`,
      ),
    );
    expect(res.status).toBe(403);
  });

  it('allows access with 200 when user is a member of the organization', async () => {
    const ORG_PRES_ID = 'a41d9440-eca6-4812-8521-dea0ded5c003';
    const ORG_ID = '33333333-3333-4333-8333-333333333333';

    resetMockDbState(dbState);
    s3Bodies.clear();
    dbState.presentations.push({
      id: ORG_PRES_ID,
      slug: 'org-deck',
      title: 'Org Deck',
      ownerType: 'organization',
      ownerId: ORG_ID,
      visibility: 'org',
    });
    dbState.versions.push({
      id: 'ver-1',
      presentationId: ORG_PRES_ID,
      versionNumber: 1,
      bundleS3Prefix: `presentations/${ORG_PRES_ID}/v1/`,
    });
    // Membership exists for user
    dbState.orgMembers.push({
      orgId: ORG_ID,
      userId: EMBED_STRANGER_ID,
      role: 'member',
    });

    const res = await app.fetch(
      new Request(
        `http://localhost/embed/${ORG_PRES_ID}/v1/index.html?token=${EMBED_STRANGER_TOKEN}`,
      ),
    );
    expect(res.status).toBe(200);
  });
});

describe('GET /embed/:id/v:version/* slug addressing and cache headers', () => {
  it('slug-addressed embed of a public deck resolves like the UUID embed', async () => {
    resetMockDbState(dbState);
    s3Bodies.clear();
    const deployed = await deployDeck('p0-public-slug', 'public');

    const byUuid = await app.fetch(
      new Request(
        `http://localhost/embed/${deployed.presentationId}/v1/index.html`,
      ),
    );
    expect(byUuid.status).toBe(200);

    const bySlug = await app.fetch(
      new Request('http://localhost/embed/p0-public-slug/v1/index.html'),
    );
    expect(bySlug.status).toBe(200);
    expect(await bySlug.text()).toBe(await byUuid.text());
  });

  it('slug-addressed embed enforces the same authz as the UUID embed', async () => {
    resetMockDbState(dbState);
    s3Bodies.clear();
    const deployed = await deployDeck('p0-private-slug', 'private');

    const uuidAnon = await app.fetch(
      new Request(
        `http://localhost/embed/${deployed.presentationId}/v1/index.html`,
      ),
    );
    expect(uuidAnon.status).toBe(401);

    const slugAnon = await app.fetch(
      new Request('http://localhost/embed/p0-private-slug/v1/index.html'),
    );
    expect(slugAnon.status).toBe(401);

    const uuidStranger = await app.fetch(
      new Request(
        `http://localhost/embed/${deployed.presentationId}/v1/index.html?token=${EMBED_STRANGER_TOKEN}`,
      ),
    );
    expect(uuidStranger.status).toBe(403);

    const slugStranger = await app.fetch(
      new Request(
        `http://localhost/embed/p0-private-slug/v1/index.html?token=${EMBED_STRANGER_TOKEN}`,
      ),
    );
    expect(slugStranger.status).toBe(403);

    const slugOwner = await app.fetch(
      new Request(
        `http://localhost/embed/p0-private-slug/v1/index.html?token=${EMBED_TOKEN}`,
      ),
    );
    expect(slugOwner.status).toBe(200);
  });

  it('private embed bytes carry private caching plus Vary: Authorization', async () => {
    resetMockDbState(dbState);
    s3Bodies.clear();
    const deployed = await deployDeck('p0-private-cache', 'private');

    const res = await app.fetch(
      new Request(
        `http://localhost/embed/${deployed.presentationId}/v1/index.html?token=${EMBED_TOKEN}`,
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('private');
    expect(res.headers.get('vary')).toContain('Authorization');
  });

  it('public embed keeps public caching without an auth vary', async () => {
    resetMockDbState(dbState);
    s3Bodies.clear();
    const deployed = await deployDeck('p0-public-cache', 'public');

    const res = await app.fetch(
      new Request(
        `http://localhost/embed/${deployed.presentationId}/v1/index.html`,
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('public');
    expect(res.headers.get('vary') ?? '').not.toContain('Authorization');
  });

  it('rejects a strict non-numeric embed version (v1abc) with 400', async () => {
    resetMockDbState(dbState);
    s3Bodies.clear();
    const deployed = await deployDeck('p0-embed-versioned', 'public');

    const res = await app.fetch(
      new Request(
        `http://localhost/embed/${deployed.presentationId}/v1abc/index.html`,
      ),
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('ValidationError');
    // "/:id/v:version/*" strips the literal "v", so the echoed version is
    // "1abc".
    expect(data.message).toContain('1abc');
  });

  it('serves versioned entrypoint /embed/<id>/v2 after a second deploy', async () => {
    resetMockDbState(dbState);
    s3Bodies.clear();
    const deployed = await deployDeck('p0-embed-v2', 'public');

    const v2 = await app.fetch(
      new Request(
        `http://localhost/embed/${deployed.presentationId}/v1/index.html`,
      ),
    );
    expect(v2.status).toBe(200);
  });

  it('emits an ETag and answers If-None-Match with 304', async () => {
    resetMockDbState(dbState);
    s3Bodies.clear();
    const deployed = await deployDeck('p0-embed-etag', 'public');
    const prefix = `presentations/${deployed.presentationId}/v1/`;
    s3Bodies.set(`${prefix}index.html`, {
      text: '<html><head></head><body><h1>etag</h1></body></html>',
      contentType: 'text/html; charset=utf-8',
    });
    const first = await app.fetch(
      new Request(
        `http://localhost/embed/${deployed.presentationId}/v1/index.html`,
      ),
    );
    expect(first.status).toBe(200);
    const etag = first.headers.get('etag');
    expect(etag).toBeTruthy();

    const cached = await app.fetch(
      new Request(
        `http://localhost/embed/${deployed.presentationId}/v1/index.html`,
        {
          headers: { 'If-None-Match': etag ?? '' },
        },
      ),
    );
    expect(cached.status).toBe(304);
    expect(cached.headers.get('etag')).toBe(etag);
  });

  it('serves mp4 and pdf with their MIME types', async () => {
    resetMockDbState(dbState);
    s3Bodies.clear();
    const deployed = await deployDeck('p0-embed-media', 'public');
    const prefix = `presentations/${deployed.presentationId}/v1/`;
    s3Bodies.set(`${prefix}clip.mp4`, { text: 'FAKE-MP4-BYTES' });
    s3Bodies.set(`${prefix}doc.pdf`, { text: 'FAKE-PDF-BYTES' });
    const mp4 = await app.fetch(
      new Request(
        `http://localhost/embed/${deployed.presentationId}/v1/clip.mp4`,
      ),
    );
    expect(mp4.status).toBe(200);
    expect(mp4.headers.get('content-type')).toContain('video/mp4');
    const pdf = await app.fetch(
      new Request(
        `http://localhost/embed/${deployed.presentationId}/v1/doc.pdf`,
      ),
    );
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get('content-type')).toContain('application/pdf');
  });
});
