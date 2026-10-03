import { describe, expect, it, mock } from 'bun:test';
import { SlideManifestSchema } from '@unsa/schemas/manifest';

const NOTES_USER_ID = '11111111-1111-4111-8111-111111111111';
const NOTES_PRESENTATION_ID = 'a41d9440-eca6-4812-8521-dea0ded5c044';
const NOTES_SLUG = 'notes-deck';

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
    if (token === 'notes-token') {
      return { id: NOTES_USER_ID, roles: { slides: 'editor' } };
    }
    throw new Error('Token verification failed: invalid token');
  },
}));

mock.module('@/lib/s3', () => ({
  uploadS3Object: async (key: string) => key,
  getS3Object: async (key: string) => ({
    body: new TextEncoder().encode('<h1>notes</h1>'),
    contentType: 'text/html; charset=utf-8',
    key,
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

interface StoredPresentation {
  id: string;
  slug: string;
  title: string;
  description?: string;
  visibility: string;
  ownerType: 'user' | 'organization';
  ownerId: string;
  activeVersion: number;
}

interface StoredVersion {
  id: string;
  presentationId: string;
  versionNumber: number;
  entrypointUrl: string;
  manifest: Record<string, unknown>;
  bundleS3Prefix: string;
  bundleSizeBytes: number;
  buildHash?: string;
  deployedBy: string;
}

const presentationsDb: StoredPresentation[] = [];
const versionsDb: StoredVersion[] = [];

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
        const getItems = () => {
          if (name === 'presentation_versions') return versionsDb;
          if (name === 'presentations') return presentationsDb;
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
    insert: (table: unknown) => {
      const name =
        typeof table === 'object' && table !== null
          ? String(
              (table as Record<symbol, unknown>)[Symbol.for('drizzle:Name')],
            )
          : '';
      return {
        values: (record: Record<string, unknown>) => {
          if (name === 'presentations') {
            presentationsDb.push({
              id: NOTES_PRESENTATION_ID,
              slug: record.slug as string,
              title: record.title as string,
              description: record.description as string,
              visibility: (record.visibility as string) || 'private',
              ownerType: record.ownerType as 'user' | 'organization',
              ownerId: record.ownerId as string,
              activeVersion: (record.activeVersion as number) || 1,
            });
            return Object.assign(Promise.resolve(undefined), {
              returning: () => Promise.resolve([{ id: NOTES_PRESENTATION_ID }]),
            });
          }
          if (name === 'presentation_versions') {
            versionsDb.push({
              id: 'ver-notes-1',
              presentationId: record.presentationId as string,
              versionNumber: (record.versionNumber as number) || 1,
              entrypointUrl: record.entrypointUrl as string,
              manifest: record.manifest as Record<string, unknown>,
              bundleS3Prefix: record.bundleS3Prefix as string,
              bundleSizeBytes: (record.bundleSizeBytes as number) || 1,
              buildHash: record.buildHash as string,
              deployedBy: record.deployedBy as string,
            });
            return Object.assign(Promise.resolve(undefined), {
              returning: () => Promise.resolve([{ id: 'ver-notes-1' }]),
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

// Dynamic import: mock.module() must be registered before the app module
// loads, so a static import would bypass the mocks.
const { default: app } = await import('@/index');

const manifestWithNotes = {
  name: 'notes-deck',
  title: 'Notes Deck',
  slides: [{ id: 'intro', index: 0, title: 'Intro' }],
  notes: {
    intro: 'Greet the jury and state the thesis.',
    outro: 'Thank everyone for attending.',
  },
};

describe('Speaker notes slice', () => {
  it('manifest schema accepts notes and defaults to {} when absent', () => {
    const withNotes = SlideManifestSchema.safeParse(manifestWithNotes);
    expect(withNotes.success).toBe(true);
    if (withNotes.success) {
      expect(withNotes.data.notes).toEqual(manifestWithNotes.notes);
    }

    const legacy = SlideManifestSchema.safeParse({
      name: 'legacy',
      title: 'Legacy',
      slides: [],
    });
    expect(legacy.success).toBe(true);
    if (legacy.success) {
      expect(legacy.data.notes).toEqual({});
    }
  });

  it('deploy persists manifest notes on the version record', async () => {
    const res = await app.fetch(
      new Request('http://localhost/presentations/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer notes-token',
        },
        body: JSON.stringify({
          slug: NOTES_SLUG,
          title: 'Notes Deck',
          visibility: 'private',
          manifest: manifestWithNotes,
          bundle:
            'UEsDBAoAAAAAAHGkQ10neOmFDgAAAA4AAAAKAAAAaW5kZXguaHRtbDxoMT5IZWxsbzwvaDE+UEsBAhQACgAAAAAAcaRDXSd46YUOAAAADgAAAAoAAAAAAAAAAAAAAAAAAAAAAGluZGV4Lmh0bWxQSwUGAAAAAAEAAQA4AAAANgAAAAAA',
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(versionsDb.length).toBe(1);
    expect(versionsDb[0]?.manifest).toMatchObject({
      notes: manifestWithNotes.notes,
    });
  });

  it('GET /:id resolves the human slug as well as the UUID', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/presentations/${NOTES_SLUG}`, {
        headers: { Authorization: 'Bearer notes-token' },
      }),
    );
    expect(res.status).toBe(200);
  });

  it('GET /:id returns versions with top-level notes', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/presentations/${NOTES_PRESENTATION_ID}`, {
        headers: { Authorization: 'Bearer notes-token' },
      }),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      versions: Array<{
        versionNumber: number;
        manifest: Record<string, unknown>;
        notes?: Record<string, string>;
      }>;
    };
    expect(data.versions.length).toBe(1);
    expect(data.versions[0]?.versionNumber).toBe(1);
    expect(data.versions[0]?.notes).toEqual(manifestWithNotes.notes);
  });

  it('GET /:id returns {} notes for legacy manifests without notes', async () => {
    const stored = versionsDb[0];
    if (!stored) throw new Error('expected a stored version');
    stored.manifest = { name: 'legacy', title: 'Legacy', slides: [] };

    const res = await app.fetch(
      new Request(`http://localhost/presentations/${NOTES_PRESENTATION_ID}`, {
        headers: { Authorization: 'Bearer notes-token' },
      }),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      versions: Array<{ notes?: Record<string, string> }>;
    };
    expect(data.versions[0]?.notes).toEqual({});
  });
});
