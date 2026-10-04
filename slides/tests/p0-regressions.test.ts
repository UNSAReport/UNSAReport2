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
    // P1 budget isolation: POST /presentations/deploy is rate-limited to
    // 20/min per user (module-level, rate check runs before validation),
    // so each P1 deploy-validation case gets its own user + window.
    if (token.startsWith('p1-token-')) {
      return {
        id: `p1-user-${token.slice('p1-token-'.length)}`,
        roles: { slides: 'editor' },
      };
    }
    throw new Error('Token verification failed: invalid token');
  },
}));

// Per-key S3 body overrides for the P1 embed tests below (empty by default,
// so all pre-existing cases keep the canned '<h1>Hello</h1>' body).
const mockS3Bodies = new Map<
  string,
  { text: string; contentType?: string; eTag?: string }
>();

mock.module('@/lib/s3', () => ({
  uploadS3Object: async (key: string) => key,
  getS3Object: async (key: string) => {
    const override = mockS3Bodies.get(key);
    if (override) {
      return {
        body: new TextEncoder().encode(override.text),
        contentType: override.contentType,
        eTag: override.eTag,
      };
    }
    return {
      body: new TextEncoder().encode('<h1>Hello</h1>'),
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
    if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
    if (filePath.endsWith('.mp4')) return 'video/mp4';
    if (filePath.endsWith('.pdf')) return 'application/pdf';
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
          entrypointUrl: record.entrypointUrl,
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

// ---------------------------------------------------------------------------
// P1 additions (audit/slides-functionality): pins for the P1+P2 hardening
// pass. New blocks only — nothing above is modified.
//
// NOTE on deploy budgeting: POST /presentations/deploy is rate-limited to 20
// requests/min per user (in-memory, module-level in the route, and the
// check runs BEFORE validation). `p1-token-<case>` mock users (see the
// @/lib/auth double above) give every P1 deploy-validation case its own
// window, while GET-only cases push full-shape mock rows directly. Only
// the three real p0-token deploys below (thumbnail, versions, shared embed
// deck) plus the 9 P0 posts count against the p0-token window, so the
// rate-limit block still ends in 429.

async function zipToB64(
  build: (zip: JSZip) => void,
  genOpts?: {
    compression?: 'STORE' | 'DEFLATE';
    compressionOptions?: { level: number };
  },
): Promise<string> {
  const zip = new JSZip();
  build(zip);
  const buf = await zip.generateAsync({ type: 'nodebuffer', ...genOpts });
  return Buffer.from(buf as unknown as Uint8Array).toString('base64');
}

// JSZip normalizes `..` segments on load, so a JSZip-built traversal
// fixture never contains `..` when the route re-reads it. This crafts a
// minimal stored (no-compression) ZIP by hand with correct CRC32/sizes.
let rawZipCrcTable: Uint32Array | null = null;
function crc32Bytes(buf: Uint8Array): number {
  let table = rawZipCrcTable;
  if (!table) {
    table = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1)
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    rawZipCrcTable = table;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function rawStoredZipB64(entries: { name: string; text: string }[]): string {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const pushU16 = (arr: number[], v: number) => {
    arr.push(v & 0xff, (v >>> 8) & 0xff);
  };
  const pushU32 = (arr: number[], v: number) => {
    arr.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
  };
  for (const { name, text } of entries) {
    const nameBytes = enc.encode(name);
    const dataBytes = enc.encode(text);
    const crc = crc32Bytes(dataBytes);
    const local: number[] = [];
    pushU32(local, 0x04034b50);
    pushU16(local, 20);
    pushU16(local, 0);
    pushU16(local, 0);
    pushU16(local, 0);
    pushU16(local, 0);
    pushU32(local, crc);
    pushU32(local, dataBytes.length);
    pushU32(local, dataBytes.length);
    pushU16(local, nameBytes.length);
    pushU16(local, 0);
    const localHead = new Uint8Array(local);
    chunks.push(localHead, nameBytes, dataBytes);
    const cen: number[] = [];
    pushU32(cen, 0x02014b50);
    pushU16(cen, 20);
    pushU16(cen, 20);
    pushU16(cen, 0);
    pushU16(cen, 0);
    pushU16(cen, 0);
    pushU16(cen, 0);
    pushU32(cen, crc);
    pushU32(cen, dataBytes.length);
    pushU32(cen, dataBytes.length);
    pushU16(cen, nameBytes.length);
    pushU16(cen, 0);
    pushU16(cen, 0);
    pushU16(cen, 0);
    pushU16(cen, 0);
    pushU32(cen, 0);
    pushU32(cen, offset);
    central.push(new Uint8Array(cen), nameBytes);
    offset += localHead.length + nameBytes.length + dataBytes.length;
  }
  const centralSize = central.reduce((n, c) => n + c.length, 0);
  const end: number[] = [];
  pushU32(end, 0x06054b50);
  pushU16(end, 0);
  pushU16(end, 0);
  pushU16(end, entries.length);
  pushU16(end, entries.length);
  pushU32(end, centralSize);
  pushU32(end, offset);
  pushU16(end, 0);
  const total = offset + centralSize + end.length;
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of [...chunks, ...central, new Uint8Array(end)]) {
    out.set(c, at);
    at += c.length;
  }
  return Buffer.from(out).toString('base64');
}

describe('P1 regressions: zip-bomb caps', () => {
  it('rejects an oversize single file with 413', async () => {
    resetDb();
    const bigB64 = await zipToB64((zip) => {
      zip.file('index.html', '<h1>hi</h1>');
      // 26 MiB > 25 MiB per-file cap; stored uncompressed so the archive
      // stays under the 50 MiB declared-archive cap and the per-file 413
      // (not the archive check) is what fires.
      zip.file('big.bin', Buffer.alloc(26 * 1024 * 1024, 1));
    });
    const res = await postDeploy(
      {
        slug: 'p1-big-file',
        title: 'P1 Big File',
        visibility: 'private',
        manifest: validManifest,
        bundle: bigB64,
      },
      'p1-token-big',
    );
    expect(res.status).toBe(413);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('AppError');
    expect(data.message).toContain('per-file limit');
  });

  it('rejects a file-count flood with 413', async () => {
    resetDb();
    const floodB64 = await zipToB64((zip) => {
      zip.file('index.html', '<h1>hi</h1>');
      for (let i = 0; i < 2005; i += 1) {
        zip.file(`filler-${i}.txt`, 'x');
      }
    });
    const res = await postDeploy(
      {
        slug: 'p1-count-flood',
        title: 'P1 Count Flood',
        visibility: 'private',
        manifest: validManifest,
        bundle: floodB64,
      },
      'p1-token-count',
    );
    expect(res.status).toBe(413);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('AppError');
    expect(data.message).toContain('2000');
  });

  it('rejects an uncompressed-total flood with 413', async () => {
    resetDb();
    // 8 x 25 MiB (exactly at the per-file cap, so no per-file 413) + 1 byte
    // pad = 200 MiB + 1 byte > 200 MiB total cap. Zeros under DEFLATE level 1
    // keep the transfer tiny while the server still walks 200 MiB of real
    // uncompressed bytes.
    const totalB64 = await zipToB64(
      (zip) => {
        zip.file('index.html', '<h1>hi</h1>');
        const chunk = Buffer.alloc(25 * 1024 * 1024, 0);
        for (let i = 0; i < 8; i += 1) {
          zip.file(`blob-${i}.bin`, chunk);
        }
        zip.file('pad.txt', 'x');
      },
      { compression: 'DEFLATE', compressionOptions: { level: 1 } },
    );
    const res = await postDeploy(
      {
        slug: 'p1-total-flood',
        title: 'P1 Total Flood',
        visibility: 'private',
        manifest: validManifest,
        bundle: totalB64,
      },
      'p1-token-total',
    );
    expect(res.status).toBe(413);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('AppError');
    expect(data.message).toContain('total uncompressed');
  });

  it('rejects a declared Content-Length over 60 MiB with 413', async () => {
    resetDb();
    const res = await app.fetch(
      new Request('http://localhost/presentations/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': String(70 * 1024 * 1024),
          ...authHeaders('p1-token-length'),
        },
        body: JSON.stringify({
          slug: 'p1-declared-huge',
          title: 'P1 Declared Huge',
          visibility: 'private',
          manifest: validManifest,
          bundle: VALID_ZIP_B64,
        }),
      }),
    );
    expect(res.status).toBe(413);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('AppError');
    expect(data.message).toContain('exceeds');
  });
});

describe('P1 regressions: deploy input validation', () => {
  it('rejects an invalid base64 bundle with 400 naming the bundle', async () => {
    resetDb();
    const res = await postDeploy(
      {
        slug: 'p1-bad-b64',
        title: 'P1 Bad B64',
        visibility: 'private',
        manifest: validManifest,
        bundle: '!!!not-base64!!!',
      },
      'p1-token-b64',
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('ValidationError');
    expect(data.message).toContain('bundle');
  });

  it('neutralizes a ".." zip entry (JSZip normalizes it; route never serves outside the prefix)', async () => {
    resetDb();
    // JSZip normalizes `../evil.txt` to `evil.txt` on load (verified), so the
    // route's `..` guard cannot observe it through this library path — the
    // guarantee asserted here is containment: no entry escapes the prefix.
    const traversalB64 = rawStoredZipB64([
      { name: 'index.html', text: '<h1>hi</h1>' },
      { name: '../evil.txt', text: 'escape' },
    ]);
    const res = await postDeploy(
      {
        slug: 'p1-traversal',
        title: 'P1 Traversal',
        visibility: 'private',
        manifest: validManifest,
        bundle: traversalB64,
      },
      'p1-token-traversal',
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      presentationId: string;
      version: number;
    };
    const evil = await app.fetch(
      new Request(
        `http://localhost/embed/${data.presentationId}/v${data.version}/evil.txt?token=p1-token-traversal`,
      ),
    );
    expect([200, 404]).toContain(evil.status);
    const outside = await app.fetch(
      new Request(
        `http://localhost/embed/${data.presentationId}/v${data.version}/../evil.txt?token=p1-token-traversal`,
      ),
    );
    expect([400, 404]).toContain(outside.status);
  });

  it('rejects a malformed orgSlug with 400', async () => {
    resetDb();
    const res = await postDeploy(
      {
        slug: 'p1-bad-org',
        title: 'P1 Bad Org',
        visibility: 'private',
        orgSlug: 'BAD_SLUG!!',
        manifest: validManifest,
        bundle: VALID_ZIP_B64,
      },
      'p1-token-orgslug',
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('ValidationError');
    expect(data.message).toContain('orgSlug');
  });
});

describe('P1 regressions: multipart manifest File part', () => {
  it('deploys 200 when the manifest arrives as a File part', async () => {
    resetDb();
    const formData = new FormData();
    formData.append('slug', 'p1-multipart-file');
    formData.append('title', 'P1 Multipart File');
    formData.append('visibility', 'public');
    formData.append(
      'manifest',
      new Blob([JSON.stringify(validManifest)], { type: 'application/json' }),
      'manifest.json',
    );
    formData.append(
      'bundle',
      new Blob([Buffer.from(VALID_ZIP_B64, 'base64')], {
        type: 'application/zip',
      }),
      'bundle.zip',
    );
    const res = await app.fetch(
      new Request('http://localhost/presentations/deploy', {
        method: 'POST',
        headers: authHeaders('p1-token-multipart'),
        body: formData,
      }),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      success: boolean;
      presentationId: string;
      slug: string;
      version: number;
    };
    expect(data.success).toBe(true);
    expect(data.slug).toBe('p1-multipart-file');
    expect(data.version).toBe(1);
  });
});

describe('P1 regressions: viewer write gate + thumbnail null', () => {
  it('viewer-token deploy/PATCH stay 403 while editor PATCH thumbnailUrl null clears', async () => {
    resetDb();
    const viewerDeploy = await postDeploy(
      {
        slug: 'p1-viewer-deploy',
        title: 'P1 Viewer Deploy',
        visibility: 'private',
        manifest: validManifest,
        bundle: VALID_ZIP_B64,
      },
      'p0-stranger-token',
    );
    expect(viewerDeploy.status).toBe(403);
    const viewerDeployBody = (await viewerDeploy.json()) as {
      error: string;
    };
    expect(viewerDeployBody.error).toBe('ForbiddenError');

    const deployed = await deployDeck('p1-thumb-deck', 'private');

    const viewerPatch = await app.fetch(
      new Request(`http://localhost/presentations/${deployed.presentationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders('p0-stranger-token'),
        },
        body: JSON.stringify({ thumbnailUrl: null }),
      }),
    );
    expect(viewerPatch.status).toBe(403);

    // null must pass validation (a non-nullable url schema would 400) and
    // return the updated presentation.
    const cleared = await app.fetch(
      new Request(`http://localhost/presentations/${deployed.presentationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ thumbnailUrl: null }),
      }),
    );
    expect(cleared.status).toBe(200);
    const clearedBody = (await cleared.json()) as {
      presentation: { id: string };
    };
    expect(clearedBody.presentation.id).toBe(deployed.presentationId);

    const garbageUrl = await app.fetch(
      new Request(`http://localhost/presentations/${deployed.presentationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ thumbnailUrl: 'not-a-url' }),
      }),
    );
    expect(garbageUrl.status).toBe(400);
  });

  it('org admin (non-viewer member) PATCHes an org deck 200 while viewer gets 403', async () => {
    resetDb();
    const orgDeckId = 'a41d9440-eca6-4812-8521-dea0ded5c071';
    mockPresentations.push({
      id: orgDeckId,
      slug: 'p1-org-deck',
      title: 'P1 Org Deck',
      description: null,
      visibility: 'private',
      ownerType: 'organization',
      ownerId: 'org-p1',
      activeVersion: 1,
      thumbnailUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockOrgMembers.push({
      orgId: 'org-p1',
      userId: P0_USER_ID,
      role: 'admin',
    });

    const adminPatch = await app.fetch(
      new Request(`http://localhost/presentations/${orgDeckId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ title: 'P1 Org Deck Renamed' }),
      }),
    );
    expect(adminPatch.status).toBe(200);

    const viewerPatch = await app.fetch(
      new Request(`http://localhost/presentations/${orgDeckId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders('p0-stranger-token'),
        },
        body: JSON.stringify({ title: 'P1 Viewer Rename' }),
      }),
    );
    expect(viewerPatch.status).toBe(403);
    const viewerBody = (await viewerPatch.json()) as { error: string };
    expect(viewerBody.error).toBe('ForbiddenError');
  });
});

describe('P1 regressions: listing pagination + third-owner public deck', () => {
  it('honors limit/offset and lists a public deck from a third owner', async () => {
    resetDb();
    // Rows pushed directly: the db double ignores WHERE, so listing
    // semantics (dedupe + in-memory slice) are exercised without spending
    // deploy rate-budget.
    mockPresentations.push(
      {
        id: 'a41d9440-eca6-4812-8521-dea0ded5c081',
        slug: 'p1-page-a',
        title: 'P1 Page A',
        description: null,
        visibility: 'private',
        ownerType: 'user',
        ownerId: P0_USER_ID,
        activeVersion: 1,
        thumbnailUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'a41d9440-eca6-4812-8521-dea0ded5c082',
        slug: 'p1-page-b',
        title: 'P1 Page B',
        description: null,
        visibility: 'private',
        ownerType: 'user',
        ownerId: P0_USER_ID,
        activeVersion: 1,
        thumbnailUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'a41d9440-eca6-4812-8521-dea0ded5c083',
        slug: 'p1-third-public',
        title: 'P1 Third Public',
        description: null,
        visibility: 'public',
        ownerType: 'user',
        ownerId: '33333333-3333-4333-8333-333333333333',
        activeVersion: 1,
        thumbnailUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    );
    // Listing route is GET /presentations (no trailing slash): Hono has no
    // `/presentations/` route, so a trailing slash 404s.
    const full = await app.fetch(
      new Request('http://localhost/presentations', {
        headers: authHeaders(),
      }),
    );
    expect(full.status).toBe(200);
    const fullBody = (await full.json()) as {
      presentations: { id: string; slug: string; ownerId: string }[];
    };
    expect(fullBody.presentations.length).toBe(3);
    const third = fullBody.presentations.find(
      (p) => p.slug === 'p1-third-public',
    );
    expect(third).toBeDefined();
    expect(third?.ownerId).toBe('33333333-3333-4333-8333-333333333333');

    const page = await app.fetch(
      new Request('http://localhost/presentations?limit=1&offset=1', {
        headers: authHeaders(),
      }),
    );
    expect(page.status).toBe(200);
    const pageBody = (await page.json()) as {
      presentations: { id: string; slug: string }[];
    };
    expect(pageBody.presentations.length).toBe(1);
    expect(pageBody.presentations[0]?.id).toBe(fullBody.presentations[1]?.id);
  });
});

describe('P1 regressions: versions ascending + buildHash + versioned entrypoint', () => {
  it('lists versions ascending with buildHash and resolves /embed/<id>/vN', async () => {
    resetDb();
    const deployed = await deployDeck('p1-versions-deck', 'public');
    mockVersions.push({
      id: 'ver-p1-manual-2',
      presentationId: deployed.presentationId,
      versionNumber: 2,
      entrypointUrl: `/embed/${deployed.presentationId}/v2`,
      bundleS3Prefix: `presentations/${deployed.presentationId}/v2/`,
      bundleSizeBytes: 1024,
      buildHash: '0123456789abcdef'.repeat(4),
      manifest: validManifest,
      deployedBy: P0_USER_ID,
      createdAt: new Date(),
    });

    const detail = await app.fetch(
      new Request(`http://localhost/presentations/${deployed.presentationId}`, {
        headers: authHeaders(),
      }),
    );
    expect(detail.status).toBe(200);
    const detailBody = (await detail.json()) as {
      versions: {
        versionNumber: number;
        entrypointUrl: string;
        buildHash: string | null;
        notes: unknown;
      }[];
    };
    expect(detailBody.versions.length).toBe(2);
    expect(detailBody.versions[0]?.versionNumber).toBe(1);
    expect(detailBody.versions[1]?.versionNumber).toBe(2);
    // Versioned entrypoint contract: /embed/<id>/vN per deploy, never stale.
    expect(detailBody.versions[0]?.entrypointUrl).toBe(
      `/embed/${deployed.presentationId}/v1`,
    );
    expect(detailBody.versions[1]?.entrypointUrl).toBe(
      `/embed/${deployed.presentationId}/v2`,
    );
    for (const v of detailBody.versions) {
      expect(v.buildHash ?? '').toMatch(/^[0-9a-f]{64}$/);
      expect(v.notes).toEqual({});
    }

    const v2 = await app.fetch(
      new Request(
        `http://localhost/embed/${deployed.presentationId}/v2/index.html`,
      ),
    );
    expect(v2.status).toBe(200);
  });
});

describe('P1 regressions: embed versioning, rewrites, types, etag', () => {
  // No resetDb in this block: all tests share the single public deck
  // deployed below (one rate-budget spend for six GET-only pins).
  const EMBED_DECK = 'p1-embed-shared';
  let embedDeckId = '';
  let embedPrefix = '';

  it('sets up the shared public deck', async () => {
    resetDb();
    mockS3Bodies.clear();
    const deployed = await deployDeck(EMBED_DECK, 'public');
    embedDeckId = deployed.presentationId;
    embedPrefix = `presentations/${embedDeckId}/v1/`;
    expect(embedDeckId.length).toBeGreaterThan(0);
  });

  it('rejects a strict non-numeric embed version (v1abc) with 400', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/embed/${embedDeckId}/v1abc/index.html`),
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('ValidationError');
    // "/:id/v:version/*" strips the literal "v", so the echoed version is
    // "1abc".
    expect(data.message).toContain('1abc');
  });

  it('rewrites root-absolute href/src, srcset and CSS url() under the embed prefix', async () => {
    mockS3Bodies.set(`${embedPrefix}index.html`, {
      text: '<html><head><link href="/main.css"></head><body><img srcset="/img-480.png 480w"><script src="/main.js"></script><style>.hero{background:url(/bg.png)}</style></body></html>',
      contentType: 'text/html; charset=utf-8',
    });
    const res = await app.fetch(
      new Request(`http://localhost/embed/${embedDeckId}/v1/index.html`),
    );
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('./main.css');
    expect(html).toContain('./main.js');
    expect(html).toContain('./img-480.png');
    expect(html).toContain('url(./bg.png)');
    expect(html).not.toContain('src="/main.js"');
  });

  it('rewrites url(/x) inside stylesheets', async () => {
    mockS3Bodies.set(`${embedPrefix}main.css`, {
      text: 'p{background:url("/fonts/a.woff2")}',
      contentType: 'text/css; charset=utf-8',
    });
    const res = await app.fetch(
      new Request(`http://localhost/embed/${embedDeckId}/v1/main.css`),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/css');
    expect(await res.text()).toContain('./fonts/a.woff2');
  });

  it('rewrites root-absolute imageUrl refs inside JS bundles', async () => {
    mockS3Bodies.set(`${embedPrefix}main.js`, {
      text: "const u={imageUrl:'/img.png'};",
      contentType: 'application/javascript; charset=utf-8',
    });
    const res = await app.fetch(
      new Request(`http://localhost/embed/${embedDeckId}/v1/main.js`),
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('./img.png');
  });

  it('serves mp4 and pdf with their MIME types', async () => {
    mockS3Bodies.set(`${embedPrefix}clip.mp4`, { text: 'FAKE-MP4-BYTES' });
    mockS3Bodies.set(`${embedPrefix}doc.pdf`, { text: 'FAKE-PDF-BYTES' });
    const mp4 = await app.fetch(
      new Request(`http://localhost/embed/${embedDeckId}/v1/clip.mp4`),
    );
    expect(mp4.status).toBe(200);
    expect(mp4.headers.get('content-type')).toContain('video/mp4');
    const pdf = await app.fetch(
      new Request(`http://localhost/embed/${embedDeckId}/v1/doc.pdf`),
    );
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get('content-type')).toContain('application/pdf');
  });

  it('emits an ETag and answers If-None-Match with 304', async () => {
    mockS3Bodies.set(`${embedPrefix}index.html`, {
      text: '<html><head></head><body><h1>etag</h1></body></html>',
      contentType: 'text/html; charset=utf-8',
    });
    const first = await app.fetch(
      new Request(`http://localhost/embed/${embedDeckId}/v1/index.html`),
    );
    expect(first.status).toBe(200);
    const etag = first.headers.get('etag');
    expect(etag).toBeTruthy();

    const cached = await app.fetch(
      new Request(`http://localhost/embed/${embedDeckId}/v1/index.html`, {
        headers: { 'If-None-Match': etag ?? '' },
      }),
    );
    expect(cached.status).toBe(304);
    expect(cached.headers.get('etag')).toBe(etag);
  });
});

describe('P1 regressions: deploy rate limit', () => {
  it('21 rapid deploys end in 429', async () => {
    const statuses: number[] = [];
    let lastBody: { error?: string; message?: string } = {};
    for (let i = 0; i < 21; i += 1) {
      const res = await postDeploy({
        slug: `p1-rl-${i}`,
        title: `P1 RL ${i}`,
        visibility: 'private',
        manifest: validManifest,
        bundle: VALID_ZIP_B64,
      });
      statuses.push(res.status);
      lastBody = (await res.json()) as { error?: string; message?: string };
    }
    expect(statuses[statuses.length - 1]).toBe(429);
    expect(lastBody.error).toBe('RateLimitError');
    expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
  });
});
