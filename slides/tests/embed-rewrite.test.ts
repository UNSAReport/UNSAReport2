import { describe, expect, it, mock } from 'bun:test';

const REWRITE_USER_ID = '11111111-1111-4111-8111-111111111111';
const REWRITE_PRES_ID = 'a41d9440-eca6-4812-8521-dea0ded5c055';

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
      return { id: REWRITE_USER_ID, roles: { slides: 'editor' } };
    }
    throw new Error('Token verification failed: invalid token');
  },
}));

const assets = new Map<string, string>();

mock.module('@/lib/s3', () => ({
  uploadS3Object: async (key: string) => key,
  getS3Object: async (key: string) => {
    const body = assets.get(key);
    if (body === undefined) {
      throw new Error('NoSuchKey: The specified key does not exist');
    }
    return {
      body: new TextEncoder().encode(body),
      contentType: key.endsWith('.js')
        ? 'application/javascript; charset=utf-8'
        : 'text/html; charset=utf-8',
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
    return 'application/octet-stream';
  },
}));

let mockPresentations: Record<string, unknown>[] = [];
let mockVersions: Record<string, unknown>[] = [];

mock.module('@/db/index', () => {
  const db = {
    select: () => ({
      from: (table: unknown) => {
        const name =
          typeof table === 'object' && table !== null
            ? String(
                (table as Record<symbol, unknown>)[Symbol.for('drizzle:Name')],
              )
            : '';
        const items =
          name === 'presentation_versions'
            ? mockVersions
            : name === 'org_members'
              ? []
              : mockPresentations;
        return {
          where: () => {
            const promise = Promise.resolve(items);
            return Object.assign(promise, {
              limit: () => Promise.resolve(items),
            });
          },
        };
      },
    }),
  };
  return { db };
});

// Dynamic import: mock.module() must be registered before the app module
// loads, so a static import would bypass the mocks.
const { default: app } = await import('@/index');

function seedPublic() {
  mockPresentations = [
    {
      id: REWRITE_PRES_ID,
      slug: 'rewrite-deck',
      title: 'Rewrite Deck',
      ownerType: 'user',
      ownerId: REWRITE_USER_ID,
      visibility: 'public',
    },
  ];
  mockVersions = [
    {
      id: 'ver-rewrite-1',
      presentationId: REWRITE_PRES_ID,
      versionNumber: 1,
      bundleS3Prefix: `presentations/${REWRITE_PRES_ID}/v1/`,
    },
  ];
  assets.clear();
}

function embedUrl(file: string): string {
  return `http://localhost/embed/${REWRITE_PRES_ID}/v1/${file}`;
}

describe('Embed asset rewrite regression', () => {
  it('rewrites root-absolute /assets/x.js script refs in HTML', async () => {
    seedPublic();
    assets.set(
      `presentations/${REWRITE_PRES_ID}/v1/index.html`,
      '<html><head></head><body><script src="/assets/x.js"></script></body></html>',
    );
    assets.set(
      `presentations/${REWRITE_PRES_ID}/v1/assets/x.js`,
      'console.log("x");',
    );

    const res = await app.fetch(new Request(embedUrl('index.html')));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('src="./assets/x.js"');
    expect(text).not.toContain('src="/assets/x.js"');
  });

  it('rewrites public-dir /img.png refs in HTML', async () => {
    seedPublic();
    assets.set(
      `presentations/${REWRITE_PRES_ID}/v1/index.html`,
      '<html><head></head><body><img src="/img.png"></body></html>',
    );

    const res = await app.fetch(new Request(embedUrl('index.html')));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('src="./img.png"');
    expect(text).not.toContain('src="/img.png"');
  });

  it('rewrites minified imageUrl:"/x.png" refs in JS', async () => {
    seedPublic();
    assets.set(
      `presentations/${REWRITE_PRES_ID}/v1/main.js`,
      'const c={imageUrl:"/x.png"};',
    );

    const res = await app.fetch(new Request(embedUrl('main.js')));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('imageUrl:"./x.png"');
    expect(text).not.toContain('imageUrl:"/x.png"');
  });

  it('rewrites escaped imageUrl:\\"/x.png\\" refs in minified JS', async () => {
    seedPublic();
    assets.set(
      `presentations/${REWRITE_PRES_ID}/v1/main.js`,
      'const c={imageUrl:\\"/x.png\\"};',
    );

    const res = await app.fetch(new Request(embedUrl('main.js')));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('imageUrl:\\"./x.png\\"');
  });

  it('leaves absolute https:// URLs untouched', async () => {
    seedPublic();
    assets.set(
      `presentations/${REWRITE_PRES_ID}/v1/index.html`,
      '<html><head></head><body><script src="https://cdn.example.com/x.js"></script><img src="https://img.example.com/a.png"></body></html>',
    );
    assets.set(
      `presentations/${REWRITE_PRES_ID}/v1/main.js`,
      'const c={imageUrl:"https://img.example.com/x.png"};',
    );

    const htmlRes = await app.fetch(new Request(embedUrl('index.html')));
    expect(htmlRes.status).toBe(200);
    const html = await htmlRes.text();
    expect(html).toContain('src="https://cdn.example.com/x.js"');
    expect(html).toContain('src="https://img.example.com/a.png"');

    const jsRes = await app.fetch(new Request(embedUrl('main.js')));
    expect(jsRes.status).toBe(200);
    const js = await jsRes.text();
    expect(js).toContain('imageUrl:"https://img.example.com/x.png"');
  });

  it('anchors HTML with <base href="./"> under the embed prefix', async () => {
    seedPublic();
    assets.set(
      `presentations/${REWRITE_PRES_ID}/v1/index.html`,
      '<html><head><title>t</title></head><body>hi</body></html>',
    );

    const res = await app.fetch(new Request(embedUrl('index.html')));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('<base href="./">');
  });
});
