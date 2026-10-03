import { describe, expect, it, mock } from 'bun:test';
import JSZip from 'jszip';

const P0_USER_ID = '11111111-1111-4111-8111-111111111111';
const P0_STRANGER_ID = '22222222-2222-4222-8222-222222222222';
const BOOM_MARKER = 'P0-BOOM-MARKER-9f3c';

// Same mock.module conventions as e2e-slides-flow / deploy / embed tests:
// auth + s3 + db doubles registered before the app module loads.
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
    if (token === 'p0-token') {
      return { id: P0_USER_ID, roles: { slides: 'editor' } };
    }
    if (token === 'p0-stranger-token') {
      return { id: P0_STRANGER_ID, roles: { slides: 'viewer' } };
    }
    throw new Error('Token verification failed: invalid token');
  },
}));

mock.module('@/lib/s3', () => ({
  uploadS3Object: async (key: string) => key,
  getS3Object: async (key: string) => ({
    body: new TextEncoder().encode('<h1>Hello</h1>'),
    contentType: key.endsWith('.js')
      ? 'application/javascript; charset=utf-8'
      : 'text/html; charset=utf-8',
  }),
  deleteS3Object: async () => {},
  deleteS3Prefix: async () => {},
  getPresignedUrl: async (key: string) => `http://localhost/s3/${key}`,
  ensureBucketExists: async () => {},
  getMimeType: (filePath: string) => {
    if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
    if (filePath.endsWith('.js'))
      return 'application/javascript; charset=utf-8';
    return 'application/octet-stream';
  },
}));

let mockPresentations: Record<string, unknown>[] = [];
let mockVersions: Record<string, unknown>[] = [];
let mockOrgMembers: Record<string, unknown>[] = [];
let dbFailureMode: 'none' | 'invalid-uuid' | 'unique' | 'boom' = 'none';
let presentationSeq = 0;

mock.module('@/db/index', () => {
  const db = {
    select: () => ({
      from: (table: Record<string, unknown> | unknown) => {
        const name =
          typeof table === 'object' && table !== null
            ? String(
                (table as Record<symbol, unknown>)[Symbol.for('drizzle:Name')],
              )
            : '';
        const getItems = () => {
          if (name === 'presentation_versions') return mockVersions;
          if (name === 'org_members') return mockOrgMembers;
          return mockPresentations;
        };
        return {
          where: () => {
            if (dbFailureMode === 'invalid-uuid') {
              throw new Error('invalid input syntax for type uuid: "abc"');
            }
            if (dbFailureMode === 'boom') {
              throw new Error(
                `driver exploded ${BOOM_MARKER} conn postgres://internal/db`,
              );
            }
            const items = getItems();
            const promise = Promise.resolve(items);
            return Object.assign(promise, {
              limit: (n: number) => Promise.resolve(items.slice(0, n)),
            });
          },
        };
      },
    }),
    insert: (table: Record<string, unknown> | unknown) => ({
      values: (record: Record<string, unknown>) => {
        if (dbFailureMode === 'unique') {
          throw new Error(
            'duplicate key value violates unique constraint "owner_slug_uniq" (23505)',
          );
        }
        const insertName =
          typeof table === 'object' && table !== null
            ? String(
                (table as Record<symbol, unknown>)[Symbol.for('drizzle:Name')],
              )
            : '';
        if (insertName === 'presentations') {
          presentationSeq += 1;
          const id = `a41d9440-eca6-4812-8521-dea0ded5c0${String(presentationSeq).padStart(2, '0')}`;
          mockPresentations.push({
            id,
            slug: record.slug,
            title: record.title,
            description: record.description,
            visibility: record.visibility ?? 'private',
            ownerType: record.ownerType ?? 'user',
            ownerId: record.ownerId ?? P0_USER_ID,
          });
          return Object.assign(Promise.resolve(undefined), {
            returning: () => Promise.resolve([{ id }]),
          });
        }
        mockVersions.push({
          id: `ver-p0-${presentationSeq}`,
          presentationId: record.presentationId,
          versionNumber: record.versionNumber ?? 1,
          bundleS3Prefix: record.bundleS3Prefix,
          bundleSizeBytes: record.bundleSizeBytes ?? 1024,
          buildHash: record.buildHash,
          manifest: record.manifest,
          deployedBy: record.deployedBy,
        });
        return Object.assign(Promise.resolve(undefined), {
          returning: () =>
            Promise.resolve([{ id: `ver-p0-${presentationSeq}` }]),
        });
      },
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
    delete: () => ({
      where: () => Promise.resolve(),
    }),
  };
  return { db };
});

// Dynamic import: mock.module() must be registered before the app module
// loads, so a static import would bypass the mocks.
const { default: app } = await import('@/index');

const validManifest = {
  name: 'p0-deck',
  title: 'P0 Deck',
  slides: [{ id: 'intro', index: 0, title: 'Intro' }],
};

// Valid ZIP containing index.html (same fixture shape as deploy.test.ts).
const VALID_ZIP_B64 =
  'UEsDBAoAAAAAAHGkQ10neOmFDgAAAA4AAAAKAAAAaW5kZXguaHRtbDxoMT5IZWxsbzwvaDE+UEsBAhQACgAAAAAAcaRDXSd46YUOAAAADgAAAAoAAAAAAAAAAAAAAAAAAAAAAGluZGV4Lmh0bWxQSwUGAAAAAAEAAQA4AAAANgAAAAAA';

function resetDb() {
  mockPresentations = [];
  mockVersions = [];
  mockOrgMembers = [];
  dbFailureMode = 'none';
}

function postDeploy(body: Record<string, unknown>, token = 'p0-token') {
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
    title: `P0 ${slug}`,
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

function authHeaders(token = 'p0-token') {
  return { Authorization: `Bearer ${token}` };
}

describe('P0 regressions: bundle validation', () => {
  it('rejects a garbage (non-ZIP) bundle with 400', async () => {
    resetDb();
    const garbageB64 = Buffer.from(
      'this is definitely not a zip archive',
      'utf-8',
    ).toString('base64');
    const res = await postDeploy({
      slug: 'p0-garbage',
      title: 'P0 Garbage',
      visibility: 'private',
      manifest: validManifest,
      bundle: garbageB64,
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('ValidationError');
  });

  it('rejects a 0-byte bundle with 400', async () => {
    resetDb();
    const res = await postDeploy({
      slug: 'p0-empty',
      title: 'P0 Empty',
      visibility: 'private',
      manifest: validManifest,
      bundle: '',
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('ValidationError');
    expect(data.message).toContain('empty');
  });

  it('rejects a ZIP without index.html with 400', async () => {
    resetDb();
    const zip = new JSZip();
    zip.file('main.js', 'console.log("no entrypoint here");');
    const noIndexB64 = (
      await zip.generateAsync({ type: 'nodebuffer' })
    ).toString('base64');
    const res = await postDeploy({
      slug: 'p0-no-index',
      title: 'P0 No Index',
      visibility: 'private',
      manifest: validManifest,
      bundle: noIndexB64,
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('ValidationError');
    expect(data.message).toContain('index.html');
  });
});

describe('P0 regressions: unknown-id management routes', () => {
  it('PATCH /presentations/abc returns 404, not 500', async () => {
    resetDb();
    const res = await app.fetch(
      new Request('http://localhost/presentations/abc', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ title: 'Renamed' }),
      }),
    );
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('NotFoundError');
  });

  it('DELETE /presentations/abc returns 404, not 500', async () => {
    resetDb();
    const res = await app.fetch(
      new Request('http://localhost/presentations/abc', {
        method: 'DELETE',
        headers: authHeaders(),
      }),
    );
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('NotFoundError');
  });
});

describe('P0 regressions: slug-addressed reads', () => {
  it('slug-addressed GET detail resolves the same presentation as UUID', async () => {
    resetDb();
    const deployed = await deployDeck('p0-visible-deck', 'public');

    const byUuid = await app.fetch(
      new Request(`http://localhost/presentations/${deployed.presentationId}`, {
        headers: authHeaders(),
      }),
    );
    expect(byUuid.status).toBe(200);
    const uuidBody = (await byUuid.json()) as {
      presentation: { id: string; slug: string };
    };

    const bySlug = await app.fetch(
      new Request('http://localhost/presentations/p0-visible-deck', {
        headers: authHeaders(),
      }),
    );
    expect(bySlug.status).toBe(200);
    const slugBody = (await bySlug.json()) as {
      presentation: { id: string; slug: string };
    };

    expect(slugBody.presentation.id).toBe(uuidBody.presentation.id);
    expect(slugBody.presentation.id).toBe(deployed.presentationId);
    expect(slugBody.presentation.slug).toBe('p0-visible-deck');
  });

  it('slug-addressed embed of a public deck resolves like the UUID embed', async () => {
    resetDb();
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
    resetDb();
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
        `http://localhost/embed/${deployed.presentationId}/v1/index.html?token=p0-stranger-token`,
      ),
    );
    expect(uuidStranger.status).toBe(403);

    const slugStranger = await app.fetch(
      new Request(
        'http://localhost/embed/p0-private-slug/v1/index.html?token=p0-stranger-token',
      ),
    );
    expect(slugStranger.status).toBe(403);

    const slugOwner = await app.fetch(
      new Request(
        'http://localhost/embed/p0-private-slug/v1/index.html?token=p0-token',
      ),
    );
    expect(slugOwner.status).toBe(200);
  });
});

describe('P0 regressions: embed cache parity', () => {
  it('private embed bytes carry private caching plus Vary: Authorization', async () => {
    resetDb();
    const deployed = await deployDeck('p0-private-cache', 'private');

    const res = await app.fetch(
      new Request(
        `http://localhost/embed/${deployed.presentationId}/v1/index.html?token=p0-token`,
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('private');
    expect(res.headers.get('vary')).toContain('Authorization');
  });

  it('public embed keeps public caching without an auth vary', async () => {
    resetDb();
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
});

describe('P0 regressions: error bodies never echo driver text', () => {
  it('invalid-uuid driver text maps to a generic 404', async () => {
    resetDb();
    dbFailureMode = 'invalid-uuid';
    try {
      const res = await app.fetch(
        new Request(
          'http://localhost/presentations/a41d9440-eca6-4812-8521-dea0ded5c099',
          { headers: authHeaders() },
        ),
      );
      expect(res.status).toBe(404);
      const data = (await res.json()) as { error: string; message: string };
      expect(data.error).toBe('NotFoundError');
      expect(data.message).toBe('Presentation not found');
      expect(JSON.stringify(data)).not.toContain('invalid input syntax');
    } finally {
      dbFailureMode = 'none';
    }
  });

  it('unique-violation driver text maps to a generic 409', async () => {
    resetDb();
    dbFailureMode = 'unique';
    try {
      const res = await postDeploy({
        slug: 'p0-conflict',
        title: 'P0 Conflict',
        visibility: 'private',
        manifest: validManifest,
        bundle: VALID_ZIP_B64,
      });
      expect(res.status).toBe(409);
      const data = (await res.json()) as { error: string; message: string };
      expect(data.error).toBe('ConflictError');
      const raw = JSON.stringify(data);
      expect(raw).not.toContain('duplicate key');
      expect(raw).not.toContain('owner_slug_uniq');
      expect(raw).not.toContain('23505');
    } finally {
      dbFailureMode = 'none';
    }
  });

  it('unexpected failures return a generic 500 without driver text', async () => {
    resetDb();
    dbFailureMode = 'boom';
    try {
      const res = await app.fetch(
        new Request(
          'http://localhost/presentations/a41d9440-eca6-4812-8521-dea0ded5c099',
          { headers: authHeaders() },
        ),
      );
      expect(res.status).toBe(500);
      const data = (await res.json()) as { error: string; message: string };
      expect(data.error).toBe('InternalServerError');
      expect(data.message).toBe('An unexpected internal server error occurred');
      const raw = JSON.stringify(data);
      expect(raw).not.toContain(BOOM_MARKER);
      expect(raw).not.toContain('postgres://');
    } finally {
      dbFailureMode = 'none';
    }
  });
});
