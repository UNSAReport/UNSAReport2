import { describe, expect, it, mock } from 'bun:test';

const DEPLOY_USER_ID = '11111111-1111-4111-8111-111111111111';
const CREATED_PRESENTATION_ID = 'a41d9440-eca6-4812-8521-dea0ded5c033';

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
    if (token === 'deploy-token') {
      return { id: DEPLOY_USER_ID, roles: { slides: 'editor' } };
    }
    throw new Error('Token verification failed: invalid token');
  },
}));

mock.module('@/db/index', () => {
  const db = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
    }),
    insert: () => ({
      values: () =>
        Object.assign(Promise.resolve(undefined), {
          returning: () => Promise.resolve([{ id: CREATED_PRESENTATION_ID }]),
        }),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
  };
  return { db };
});

const { default: app } = await import('@/index');

const validManifest = {
  name: 'demo',
  title: 'Demo',
  slides: [{ id: 'intro', index: 0, title: 'Intro' }],
};

function postDeploy(body: Record<string, unknown>, token = 'deploy-token') {
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

describe('POST /presentations/deploy', () => {
  it('deploys a bundle with 200 and returns presentation coordinates', async () => {
    const res = await postDeploy({
      slug: 'demo-deck',
      title: 'Demo Deck',
      visibility: 'private',
      manifest: validManifest,
      bundle: 'ZQ==',
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
    expect(data.url).toMatch(/demo-deck/);
  });

  it('rejects a missing bundle with 400', async () => {
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
});
