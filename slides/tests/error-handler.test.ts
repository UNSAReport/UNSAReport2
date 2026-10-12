import { describe, expect, it, mock } from 'bun:test';
import {
  BOOM_MARKER,
  createMockDb,
  createMockDbState,
  getMimeType,
  getMockS3Object,
  type MockDbState,
  type S3BodyOverride,
  VALID_ZIP_B64,
  validManifest,
  verifyTestCredential,
} from '@/fixtures';

const ERROR_TOKEN = 'error-token';
const ERROR_STRANGER_TOKEN = 'error-stranger-token';
// Unique owner UUID per test file (rate-limit budgets are keyed by user id
// and shared process-wide).
const ERROR_USER_ID = '88888888-8888-4888-8888-888888888888';

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
      ownerToken: ERROR_TOKEN,
      strangerToken: ERROR_STRANGER_TOKEN,
      ownerId: ERROR_USER_ID,
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
  const db = createMockDb(dbState, ERROR_USER_ID);
  return { db };
});

// Dynamic import: mock.module() must be registered before the app module
// loads, so a static import would bypass the mocks.
const { default: app } = await import('@/index');

function authHeaders(token = ERROR_TOKEN) {
  return { Authorization: `Bearer ${token}` };
}

function postDeploy(body: Record<string, unknown>, token = ERROR_TOKEN) {
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

describe('Error responses never echo driver text', () => {
  it('invalid-uuid driver text maps to a generic 404', async () => {
    dbState.presentations = [];
    dbState.versions = [];
    dbState.orgMembers = [];
    dbState.failureMode = 'invalid-uuid';
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
      dbState.failureMode = 'none';
    }
  });

  it('unique-violation driver text maps to a generic 409', async () => {
    dbState.presentations = [];
    dbState.versions = [];
    dbState.orgMembers = [];
    dbState.failureMode = 'unique';
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
      dbState.failureMode = 'none';
    }
  });

  it('unexpected failures return a generic 500 without driver text', async () => {
    dbState.presentations = [];
    dbState.versions = [];
    dbState.orgMembers = [];
    dbState.failureMode = 'boom';
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
      dbState.failureMode = 'none';
    }
  });
});
