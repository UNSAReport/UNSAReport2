import { describe, expect, it, mock } from 'bun:test';

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
    if (token === 'valid-no-roles-token') {
      return { id: '11111111-1111-4111-8111-111111111111', roles: {} };
    }
    throw new Error('Token verification failed: invalid token');
  },
}));
const { default: app } = await import('@/index');

describe('Slides service auth guards', () => {
  it('POST /presentations/deploy without credentials returns 401', async () => {
    const res = await app.fetch(
      new Request('http://localhost/presentations/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('GET /presentations without credentials returns 401', async () => {
    const res = await app.fetch(new Request('http://localhost/presentations'));
    expect(res.status).toBe(401);
  });

  it('GET /orgs without credentials returns 401', async () => {
    const res = await app.fetch(new Request('http://localhost/orgs'));
    expect(res.status).toBe(401);
  });

  it('malformed Bearer token returns 401 without reaching handlers', async () => {
    const res = await app.fetch(
      new Request('http://localhost/presentations/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer not-a-jwt',
        },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('valid JWT without slides role is rejected with 403', async () => {
    const res = await app.fetch(
      new Request('http://localhost/orgs', {
        headers: {
          Authorization: 'Bearer valid-no-roles-token',
        },
      }),
    );
    expect(res.status).toBe(403);
  });
});
