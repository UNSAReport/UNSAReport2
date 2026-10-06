import { describe, expect, it, mock } from 'bun:test';

const E2E_USER_ID = '11111111-1111-4111-8111-111111111111';
const E2E_PRESENTATION_ID = 'b52e0551-fdb7-4923-9632-efb1efe6d010';
const E2E_SLUG = 'e2e-academic-research';

// Mock Auth
mock.module('@/lib/auth', () => ({
  stripBearer: (authHeader: string | null | undefined) => {
    if (authHeader?.startsWith('Bearer ') !== true) return null;
    const token = authHeader.slice(7);
    if (!token || token[0] === ' ' || token[0] === '\t') return null;
    return token;
  },
  verifyCredential: async (token: string) => {
    if (token === 'e2e-author-token') {
      return { id: E2E_USER_ID, roles: { slides: 'editor' } };
    }
    throw new Error('Invalid token');
  },
}));

// In-memory S3 storage simulation
const s3Store = new Map<string, { body: Uint8Array; contentType: string }>();

mock.module('@/lib/s3', () => ({
  ensureBucketExists: async () => {},
  uploadS3Object: async (
    key: string,
    body: Uint8Array,
    contentType = 'application/octet-stream',
  ) => {
    s3Store.set(key, { body, contentType });
    return key;
  },
  getS3Object: async (key: string) => {
    const item = s3Store.get(key);
    if (!item) throw new Error(`NoSuchKey: ${key}`);
    return item;
  },
  deleteS3Object: async (key: string) => {
    s3Store.delete(key);
  },
  deleteS3Prefix: async (prefix: string) => {
    for (const k of s3Store.keys()) {
      if (k.startsWith(prefix)) s3Store.delete(k);
    }
  },
  getPresignedUrl: async (key: string) => `http://localhost/s3/${key}`,
  getMimeType: (filePath: string) => {
    if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
    if (filePath.endsWith('.js'))
      return 'application/javascript; charset=utf-8';
    if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
    if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
    return 'application/octet-stream';
  },
}));

// In-memory DB state
interface StoredPresentation {
  id: string;
  slug: string;
  title: string;
  description?: string;
  visibility: 'public' | 'unlisted' | 'private' | 'org';
  ownerType: 'user' | 'organization';
  ownerId: string;
  activeVersion: number;
}

interface StoredVersion {
  id: string;
  presentationId: string;
  versionNumber: number;
  bundleS3Prefix: string;
  bundleSizeBytes: number;
  buildHash?: string;
  manifest: Record<string, unknown>;
}

const presentationsDb: StoredPresentation[] = [];
const versionsDb: StoredVersion[] = [];

mock.module('@/db/index', () => {
  const db = {
    select: () => ({
      from: (table: Record<string, unknown> | unknown) => {
        const tableName =
          typeof table === 'object' && table !== null
            ? (table as Record<symbol, unknown>)[Symbol.for('drizzle:Name')]
            : '';

        const getItems = () => {
          if (tableName === 'presentation_versions') return versionsDb;
          if (tableName === 'presentations') return presentationsDb;
          return [];
        };

        return {
          where: () => {
            const items = getItems();
            const promise = Promise.resolve(items);
            return Object.assign(promise, {
              limit: (n: number) => Promise.resolve(items.slice(0, n)),
            });
          },
        };
      },
    }),
    insert: (table: Record<string, unknown> | unknown) => {
      const tableName =
        typeof table === 'object' && table !== null
          ? (table as Record<symbol, unknown>)[Symbol.for('drizzle:Name')]
          : '';

      return {
        values: (record: Record<string, unknown>) => {
          if (tableName === 'presentations') {
            presentationsDb.push({
              id: E2E_PRESENTATION_ID,
              slug: record.slug as string,
              title: record.title as string,
              description: record.description as string,
              visibility: record.visibility as
                | 'public'
                | 'unlisted'
                | 'private'
                | 'org',
              ownerType: record.ownerType as 'user' | 'organization',
              ownerId: record.ownerId as string,
              activeVersion: (record.activeVersion as number) || 1,
            });
            return Object.assign(Promise.resolve(undefined), {
              returning: () => Promise.resolve([{ id: E2E_PRESENTATION_ID }]),
            });
          }
          if (tableName === 'presentation_versions') {
            versionsDb.push({
              id: 'ver-e2e-1',
              presentationId: record.presentationId as string,
              versionNumber: (record.versionNumber as number) || 1,
              bundleS3Prefix: record.bundleS3Prefix as string,
              bundleSizeBytes: (record.bundleSizeBytes as number) || 1024,
              buildHash: record.buildHash as string,
              manifest: record.manifest as Record<string, unknown>,
            });
            return Object.assign(Promise.resolve(undefined), {
              returning: () => Promise.resolve([{ id: 'ver-e2e-1' }]),
            });
          }
          return Object.assign(Promise.resolve(undefined), {
            returning: () => Promise.resolve([]),
          });
        },
      };
    },
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
  };
  return { db };
});

const { default: app } = await import('@/index');

describe('E2E Slides Lifecycle: init → dev → deploy → web viewing', () => {
  it('executes the full end-to-end presentation workflow successfully', async () => {
    // -------------------------------------------------------------
    // Step 1: Init / Scaffold simulation
    // -------------------------------------------------------------
    const sampleManifest = {
      name: 'academic-thesis',
      title: 'Investigación Académica UNSA 2026',
      description:
        'Presentación de grado académico con Reveal.js y layouts estructurados',
      theme: 'unsa-dark',
      slides: [
        {
          id: 'slide-0',
          index: 0,
          layout: 'hero-split',
          title: 'Portada y Tesis',
          notes: 'Presentar el título de la investigación y saludar al jurado.',
        },
        {
          id: 'slide-1',
          index: 1,
          layout: 'bento-4',
          title: 'Metodología Experimental',
          notes: 'Explicar las 4 fases metodológicas en el layout bento.',
        },
      ],
    };

    expect(sampleManifest.slides.length).toBe(2);
    expect(sampleManifest.theme).toBe('unsa-dark');

    // -------------------------------------------------------------
    // Step 2 & 3: Build & Deploy via multipart/form-data
    // -------------------------------------------------------------
    // Mock files in S3 that would be extracted from the uploaded ZIP bundle
    const mockHtml = `<!DOCTYPE html><html><head><title>${sampleManifest.title}</title></head><body><div class="reveal"><div class="slides"><h1>${sampleManifest.title}</h1></div></div></body></html>`;
    const mockJs = `console.log("Initialized Reveal.js with unsa-dark theme");`;
    const prefix = `presentations/${E2E_PRESENTATION_ID}/v1/`;

    // Seed the S3 store to simulate unzipping during deploy
    s3Store.set(`${prefix}index.html`, {
      body: new TextEncoder().encode(mockHtml),
      contentType: 'text/html; charset=utf-8',
    });
    s3Store.set(`${prefix}main.js`, {
      body: new TextEncoder().encode(mockJs),
      contentType: 'application/javascript; charset=utf-8',
    });

    const formData = new FormData();
    formData.append('slug', E2E_SLUG);
    formData.append('title', sampleManifest.title);
    formData.append('description', sampleManifest.description);
    formData.append('visibility', 'public');
    formData.append('manifest', JSON.stringify(sampleManifest));
    // Minimal valid ZIP (index.html + main.js + valid central directory)
    formData.append(
      'bundle',
      new Blob(
        [
          new Uint8Array(
            Buffer.from(
              'UEsDBAoAAAAAAAGkQ118+Oq0yAAAAMgAAAAKAAAAaW5kZXguaHRtbDwhRE9DVFlQRSBodG1sPjxodG1sPjxoZWFkPjx0aXRsZT5JbnZlc3RpZ2FjacOzbiBBY2Fkw6ltaWNhIFVOU0EgMjAyNjwvdGl0bGU+PC9oZWFkPjxib2R5PjxkaXYgY2xhc3M9InJldmVhbCI+PGRpdiBjbGFzcz0ic2xpZGVzIj48aDE+SW52ZXN0aWdhY2nDs24gQWNhZMOpbWljYSBVTlNBIDIwMjY8L2gxPjwvZGl2PjwvZGl2PjwvYm9keT48L2h0bWw+UEsDBAoAAAAAAAGkQ12g9TYlOgAAADoAAAAHAAAAbWFpbi5qc2NvbnNvbGUubG9nKCJJbml0aWFsaXplZCBSZXZlYWwuanMgd2l0aCB1bnNhLWRhcmsgdGhlbWUiKTtQSwECFAAKAAAAAAABpENdfPjqtMgAAADIAAAACgAAAAAAAAAAAAAAAAAAAAAAaW5kZXguaHRtbFBLAQIUAAoAAAAAAAGkQ12g9TYlOgAAADoAAAAHAAAAAAAAAAAAAAAAAPAAAABtYWluLmpzUEsFBgAAAAACAAIAbQAAAE8BAAAAAA==',
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

    const deployRes = await app.fetch(
      new Request('http://localhost/presentations/deploy', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer e2e-author-token',
        },
        body: formData,
      }),
    );

    expect(deployRes.status).toBe(200);
    const deployBody = (await deployRes.json()) as {
      success: boolean;
      presentationId: string;
      slug: string;
      version: number;
      url: string;
    };

    expect(deployBody.success).toBe(true);
    expect(deployBody.presentationId).toBe(E2E_PRESENTATION_ID);
    expect(deployBody.slug).toBe(E2E_SLUG);
    expect(deployBody.version).toBe(1);

    // -------------------------------------------------------------
    // Step 4: Web Viewer & Embed Retrieval
    // -------------------------------------------------------------
    // Fetch the HTML entrypoint for the sandboxed iframe
    const embedHtmlRes = await app.fetch(
      new Request(
        `http://localhost/embed/${E2E_PRESENTATION_ID}/v1/index.html`,
      ),
    );
    expect(embedHtmlRes.status).toBe(200);
    expect(embedHtmlRes.headers.get('content-type')).toContain('text/html');
    expect(embedHtmlRes.headers.get('cache-control')).toContain('max-age=0');
    const htmlText = await embedHtmlRes.text();
    expect(htmlText).toContain('Investigación Académica UNSA 2026');

    // Fetch the companion JS bundle
    const embedJsRes = await app.fetch(
      new Request(`http://localhost/embed/${E2E_PRESENTATION_ID}/v1/main.js`),
    );
    expect(embedJsRes.status).toBe(200);
    expect(embedJsRes.headers.get('content-type')).toContain('javascript');
    expect(embedJsRes.headers.get('cache-control')).toContain(
      'max-age=31536000',
    );
    const jsText = await embedJsRes.text();
    expect(jsText).toContain('unsa-dark');
  });
});
