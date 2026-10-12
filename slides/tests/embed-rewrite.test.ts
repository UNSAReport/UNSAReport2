import { describe, expect, it, mock } from 'bun:test';
import {
  createMockDb,
  createMockDbState,
  getMimeType,
  getMockS3Object,
  type MockDbState,
  type S3BodyOverride,
  verifyTestCredential,
} from '@/fixtures';

// Unique owner UUID per test file (rate-limit budgets are keyed by user id
// and shared process-wide).
const REWRITE_USER_ID = '77777777-7777-4777-8777-777777777777';
const REWRITE_PRES_ID = 'a41d9440-eca6-4812-8521-dea0ded5c055';
const REWRITE_TOKEN = 'valid-owner-token';

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
      ownerToken: REWRITE_TOKEN,
      strangerToken: 'rewrite-stranger-token',
      ownerId: REWRITE_USER_ID,
    }),
}));

mock.module('@/lib/s3', () => ({
  uploadS3Object: async (key: string) => key,
  getS3Object: async (key: string) => {
    const body = s3Bodies.get(key)?.text;
    if (body === undefined) {
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
  const db = createMockDb(dbState, REWRITE_USER_ID);
  return { db };
});

// Dynamic import: mock.module() must be registered before the app module
// loads, so a static import would bypass the mocks.
const { default: app } = await import('@/index');

function seedPublic() {
  dbState.presentations = [
    {
      id: REWRITE_PRES_ID,
      slug: 'rewrite-deck',
      title: 'Rewrite Deck',
      ownerType: 'user',
      ownerId: REWRITE_USER_ID,
      visibility: 'public',
    },
  ];
  dbState.versions = [
    {
      id: 'ver-rewrite-1',
      presentationId: REWRITE_PRES_ID,
      versionNumber: 1,
      bundleS3Prefix: `presentations/${REWRITE_PRES_ID}/v1/`,
    },
  ];
  s3Bodies.clear();
}

function embedUrl(file: string): string {
  return `http://localhost/embed/${REWRITE_PRES_ID}/v1/${file}`;
}

describe('Embed asset rewrite regression', () => {
  it('rewrites root-absolute /assets/x.js script refs in HTML', async () => {
    seedPublic();
    s3Bodies.set(`presentations/${REWRITE_PRES_ID}/v1/index.html`, {
      text: '<html><head></head><body><script src="/assets/x.js"></script></body></html>',
    });
    s3Bodies.set(`presentations/${REWRITE_PRES_ID}/v1/assets/x.js`, {
      text: 'console.log("x");',
    });

    const res = await app.fetch(new Request(embedUrl('index.html')));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('src="./assets/x.js"');
    expect(text).not.toContain('src="/assets/x.js"');
  });

  it('rewrites public-dir /img.png refs in HTML', async () => {
    seedPublic();
    s3Bodies.set(`presentations/${REWRITE_PRES_ID}/v1/index.html`, {
      text: '<html><head></head><body><img src="/img.png"></body></html>',
    });

    const res = await app.fetch(new Request(embedUrl('index.html')));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('src="./img.png"');
    expect(text).not.toContain('src="/img.png"');
  });

  it('rewrites minified imageUrl:"/x.png" refs in JS', async () => {
    seedPublic();
    s3Bodies.set(`presentations/${REWRITE_PRES_ID}/v1/main.js`, {
      text: 'const c={imageUrl:"/x.png"};',
    });

    const res = await app.fetch(new Request(embedUrl('main.js')));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('imageUrl:"./x.png"');
    expect(text).not.toContain('imageUrl:"/x.png"');
  });

  it('rewrites escaped imageUrl:\\"/x.png\\" refs in minified JS', async () => {
    seedPublic();
    s3Bodies.set(`presentations/${REWRITE_PRES_ID}/v1/main.js`, {
      text: 'const c={imageUrl:\\"/x.png\\"};',
    });

    const res = await app.fetch(new Request(embedUrl('main.js')));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('imageUrl:\\"./x.png\\"');
  });

  it('leaves absolute https:// URLs untouched', async () => {
    seedPublic();
    s3Bodies.set(`presentations/${REWRITE_PRES_ID}/v1/index.html`, {
      text: '<html><head></head><body><script src="https://cdn.example.com/x.js"></script><img src="https://img.example.com/a.png"></body></html>',
    });
    s3Bodies.set(`presentations/${REWRITE_PRES_ID}/v1/main.js`, {
      text: 'const c={imageUrl:"https://img.example.com/x.png"};',
    });

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
    s3Bodies.set(`presentations/${REWRITE_PRES_ID}/v1/index.html`, {
      text: '<html><head><title>t</title></head><body>hi</body></html>',
    });

    const res = await app.fetch(new Request(embedUrl('index.html')));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('<base href="./">');
  });
});

describe('Embed rewrite of root-absolute refs and stylesheets', () => {
  it('rewrites root-absolute href/src, srcset and CSS url() under the embed prefix', async () => {
    seedPublic();
    s3Bodies.set(`presentations/${REWRITE_PRES_ID}/v1/index.html`, {
      text: '<html><head><link href="/main.css"></head><body><img srcset="/img-480.png 480w"><script src="/main.js"></script><style>.hero{background:url(/bg.png)}</style></body></html>',
      contentType: 'text/html; charset=utf-8',
    });
    const res = await app.fetch(new Request(embedUrl('index.html')));
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('./main.css');
    expect(html).toContain('./main.js');
    expect(html).toContain('./img-480.png');
    expect(html).toContain('url(./bg.png)');
    expect(html).not.toContain('src="/main.js"');
  });

  it('rewrites url(/x) inside stylesheets', async () => {
    seedPublic();
    s3Bodies.set(`presentations/${REWRITE_PRES_ID}/v1/main.css`, {
      text: 'p{background:url("/fonts/a.woff2")}',
      contentType: 'text/css; charset=utf-8',
    });
    const res = await app.fetch(new Request(embedUrl('main.css')));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/css');
    expect(await res.text()).toContain('./fonts/a.woff2');
  });

  it('rewrites root-absolute imageUrl refs inside JS bundles', async () => {
    seedPublic();
    s3Bodies.set(`presentations/${REWRITE_PRES_ID}/v1/main.js`, {
      text: "const u={imageUrl:'/img.png'};",
      contentType: 'application/javascript; charset=utf-8',
    });
    const res = await app.fetch(new Request(embedUrl('main.js')));
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('./img.png');
  });
});
