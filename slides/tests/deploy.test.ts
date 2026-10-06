import { describe, expect, it, mock } from 'bun:test';
import JSZip from 'jszip';
import {
  createMockDb,
  createMockDbState,
  getMimeType,
  getMockS3Object,
  type MockDbState,
  rawStoredZipB64,
  resetMockDbState,
  VALID_ZIP_B64,
  validManifest,
  verifyTestCredential,
  zipToB64,
} from '@/fixtures';

// Unique owner UUID per test file: the deploy rate-limit map is keyed by
// user id and shared process-wide, so files must not share budget owners.
const DEPLOY_USER_ID = '44444444-4444-4444-8444-444444444444';
const CREATED_PRESENTATION_ID = 'a41d9440-eca6-4812-8521-dea0ded5c033';
const DEPLOY_TOKEN = 'deploy-token';
const STRANGER_TOKEN = 'deploy-stranger-token';
const RATE_PREFIX = 'deploy-rate-';
// First minted ID must equal CREATED_PRESENTATION_ID (...c033): reset keeps
// the sequence running so IDs stay unique across tests in this file.
const dbState: MockDbState = { ...createMockDbState(), sequence: 32 };
const s3Bodies = new Map<string, { text: string; contentType?: string }>();

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
      ownerToken: DEPLOY_TOKEN,
      strangerToken: STRANGER_TOKEN,
      rateIsolatedPrefix: RATE_PREFIX,
    }),
}));

mock.module('@/lib/s3', () => ({
  uploadS3Object: async (key: string) => key,
  getS3Object: async (key: string) => getMockS3Object(s3Bodies, key),
  deleteS3Object: async () => {},
  deleteS3Prefix: async () => {},
  getPresignedUrl: async (key: string) => `http://localhost/s3/${key}`,
  ensureBucketExists: async () => {},
  getMimeType,
}));

mock.module('@/db/index', () => {
  const db = createMockDb(dbState, DEPLOY_USER_ID);
  return { db };
});

const { default: app } = await import('@/index');

function postDeploy(body: Record<string, unknown>, token = DEPLOY_TOKEN) {
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

function authHeaders(token = DEPLOY_TOKEN) {
  return { Authorization: `Bearer ${token}` };
}

async function deployDeck(slug: string, visibility: string, token?: string) {
  const res = await postDeploy(
    {
      slug,
      title: `Deploy ${slug}`,
      visibility,
      manifest: validManifest,
      bundle: VALID_ZIP_B64,
    },
    // One budget window per deck: the route allows 20 deploys/min per
    // user, and this file performs more deploys than that in total.
    token ?? `${RATE_PREFIX}deck-${slug}`,
  );
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

describe('POST /presentations/deploy', () => {
  it('deploys a bundle with 200 and returns presentation coordinates', async () => {
    resetMockDbState(dbState);
    const res = await postDeploy({
      slug: 'demo-deck',
      title: 'Demo Deck',
      visibility: 'private',
      manifest: validManifest,
      bundle:
        'UEsDBAoAAAAAAHGkQ10neOmFDgAAAA4AAAAKAAAAaW5kZXguaHRtbDxoMT5IZWxsbzwvaDE+UEsBAhQACgAAAAAAcaRDXSd46YUOAAAADgAAAAoAAAAAAAAAAAAAAAAAAAAAAGluZGV4Lmh0bWxQSwUGAAAAAAEAAQA4AAAANgAAAAAA',
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      success: boolean;
      presentationId: string;
      slug: string;
      version: number;
      url: string;
    };
    expect(data.success).toBe(true);
    expect(data.presentationId).toBe(CREATED_PRESENTATION_ID);
    expect(data.slug).toBe('demo-deck');
    expect(data.version).toBe(1);
    expect(data.url).toBe(
      `http://localhost:9876/presentations/${CREATED_PRESENTATION_ID}`,
    );
  });

  it('rejects a missing bundle with 400', async () => {
    resetMockDbState(dbState);
    const res = await postDeploy({
      slug: 'demo-deck',
      title: 'Demo Deck',
      manifest: validManifest,
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe('ValidationError');
  });

  it('rejects a slug longer than 100 chars with 400', async () => {
    resetMockDbState(dbState);
    const res = await postDeploy({
      slug: 'a'.repeat(101),
      title: 'Too Long',
      manifest: validManifest,
      bundle: 'eA==',
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe('ValidationError');
  });

  it('rejects an unknown visibility with 400', async () => {
    resetMockDbState(dbState);
    const res = await postDeploy({
      slug: 'demo-deck',
      title: 'Demo Deck',
      visibility: 'galactic',
      manifest: validManifest,
      bundle: 'eA==',
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe('ValidationError');
  });

  it('deploys a bundle via multipart/form-data', async () => {
    resetMockDbState(dbState);
    const formData = new FormData();
    formData.append('slug', 'multipart-deck');
    formData.append('title', 'Multipart Deck');
    formData.append('visibility', 'public');
    formData.append(
      'bundle',
      new Blob(
        [
          new Uint8Array(
            Buffer.from(
              'UEsDBAoAAAAAAHGkQ10neOmFDgAAAA4AAAAKAAAAaW5kZXguaHRtbDxoMT5IZWxsbzwvaDE+UEsBAhQACgAAAAAAcaRDXSd46YUOAAAADgAAAAoAAAAAAAAAAAAAAAAAAAAAAGluZGV4Lmh0bWxQSwUGAAAAAAEAAQA4AAAANgAAAAAA',
              'base64',
            ),
          ),
        ],
        {
          type: 'application/zip',
        },
      ),
      'bundle.zip',
    );

    const res = await app.fetch(
      new Request('http://localhost/presentations/deploy', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer deploy-token',
        },
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
    expect(data.slug).toBe('multipart-deck');
    expect(data.version).toBe(1);
  });
});

describe('POST /presentations/deploy bundle validation', () => {
  it('rejects a garbage (non-ZIP) bundle with 400', async () => {
    resetMockDbState(dbState);
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
    resetMockDbState(dbState);
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
    resetMockDbState(dbState);
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

  it('rejects an invalid base64 bundle with 400 naming the bundle', async () => {
    resetMockDbState(dbState);
    const res = await postDeploy(
      {
        slug: 'p1-bad-b64',
        title: 'P1 Bad B64',
        visibility: 'private',
        manifest: validManifest,
        bundle: '!!!not-base64!!!',
      },
      `${RATE_PREFIX}b64`,
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('ValidationError');
    expect(data.message).toContain('bundle');
  });

  it('neutralizes a ".." zip entry (route never serves outside the prefix)', async () => {
    resetMockDbState(dbState);
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
      `${RATE_PREFIX}traversal`,
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      presentationId: string;
      version: number;
    };
    const evil = await app.fetch(
      new Request(
        `http://localhost/embed/${data.presentationId}/v${data.version}/evil.txt?token=${RATE_PREFIX}traversal`,
      ),
    );
    expect([200, 404]).toContain(evil.status);
    const outside = await app.fetch(
      new Request(
        `http://localhost/embed/${data.presentationId}/v${data.version}/../evil.txt?token=${RATE_PREFIX}traversal`,
      ),
    );
    expect([400, 404]).toContain(outside.status);
  });

  it('rejects a malformed orgSlug with 400', async () => {
    resetMockDbState(dbState);
    const res = await postDeploy(
      {
        slug: 'p1-bad-org',
        title: 'P1 Bad Org',
        visibility: 'private',
        orgSlug: 'BAD_SLUG!!',
        manifest: validManifest,
        bundle: VALID_ZIP_B64,
      },
      `${RATE_PREFIX}orgslug`,
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('ValidationError');
    expect(data.message).toContain('orgSlug');
  });

  it('deploys 200 when the manifest arrives as a File part', async () => {
    resetMockDbState(dbState);
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
        headers: authHeaders(`${RATE_PREFIX}multipart`),
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

describe('POST /presentations/deploy size limits', () => {
  it('rejects an oversize single file with 413', async () => {
    resetMockDbState(dbState);
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
      `${RATE_PREFIX}big`,
    );
    expect(res.status).toBe(413);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('AppError');
    expect(data.message).toContain('per-file limit');
  });

  it('rejects a file-count flood with 413', async () => {
    resetMockDbState(dbState);
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
      `${RATE_PREFIX}count`,
    );
    expect(res.status).toBe(413);
    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe('AppError');
    expect(data.message).toContain('2000');
  });

  it(
    'rejects an uncompressed-total flood with 413',
    async () => {
      resetMockDbState(dbState);
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
        `${RATE_PREFIX}total`,
      );
      expect(res.status).toBe(413);
      const data = (await res.json()) as { error: string; message: string };
      expect(data.error).toBe('AppError');
      expect(data.message).toContain('total uncompressed');
    },
    { timeout: 30000 },
  );

  it('rejects a declared Content-Length over 60 MiB with 413', async () => {
    resetMockDbState(dbState);
    const res = await app.fetch(
      new Request('http://localhost/presentations/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': String(70 * 1024 * 1024),
          ...authHeaders(`${RATE_PREFIX}length`),
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

describe('PATCH /presentations/:id access control', () => {
  it('viewer-token deploy/PATCH stay 403 while editor PATCH thumbnailUrl null clears', async () => {
    resetMockDbState(dbState);
    const viewerDeploy = await postDeploy(
      {
        slug: 'p1-viewer-deploy',
        title: 'P1 Viewer Deploy',
        visibility: 'private',
        manifest: validManifest,
        bundle: VALID_ZIP_B64,
      },
      STRANGER_TOKEN,
    );
    expect(viewerDeploy.status).toBe(403);
    const viewerDeployBody = (await viewerDeploy.json()) as {
      error: string;
    };
    expect(viewerDeployBody.error).toBe('ForbiddenError');

    const deployed = await deployDeck('p1-thumb-deck', 'private', DEPLOY_TOKEN);

    const viewerPatch = await app.fetch(
      new Request(`http://localhost/presentations/${deployed.presentationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(STRANGER_TOKEN),
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
    resetMockDbState(dbState);
    const orgDeckId = 'a41d9440-eca6-4812-8521-dea0ded5c071';
    dbState.presentations.push({
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
    dbState.orgMembers.push({
      orgId: 'org-p1',
      userId: DEPLOY_USER_ID,
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
          ...authHeaders(STRANGER_TOKEN),
        },
        body: JSON.stringify({ title: 'P1 Viewer Rename' }),
      }),
    );
    expect(viewerPatch.status).toBe(403);
    const viewerBody = (await viewerPatch.json()) as { error: string };
    expect(viewerBody.error).toBe('ForbiddenError');
  });

  it('PATCH /presentations/abc returns 404, not 500', async () => {
    resetMockDbState(dbState);
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
    resetMockDbState(dbState);
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

describe('GET /presentations listing and versions', () => {
  it('honors limit/offset and lists a public deck from a third owner', async () => {
    resetMockDbState(dbState);
    // Rows pushed directly: the db double ignores WHERE, so listing
    // semantics (dedupe + in-memory slice) are exercised without spending
    // deploy rate-budget.
    dbState.presentations.push(
      {
        id: 'a41d9440-eca6-4812-8521-dea0ded5c081',
        slug: 'p1-page-a',
        title: 'P1 Page A',
        description: null,
        visibility: 'private',
        ownerType: 'user',
        ownerId: DEPLOY_USER_ID,
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
        ownerId: DEPLOY_USER_ID,
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

  it('lists versions ascending with buildHash and resolves /embed/<id>/vN', async () => {
    resetMockDbState(dbState);
    const deployed = await deployDeck('p1-versions-deck', 'public');
    dbState.versions.push({
      id: 'ver-p1-manual-2',
      presentationId: deployed.presentationId,
      versionNumber: 2,
      entrypointUrl: `/embed/${deployed.presentationId}/v2`,
      bundleS3Prefix: `presentations/${deployed.presentationId}/v2/`,
      bundleSizeBytes: 1024,
      buildHash: '0123456789abcdef'.repeat(4),
      manifest: validManifest,
      deployedBy: DEPLOY_USER_ID,
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

  it('slug-addressed GET detail resolves the same presentation as UUID', async () => {
    resetMockDbState(dbState);
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
});

describe('POST /presentations/deploy rate limit', () => {
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
