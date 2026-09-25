import { beforeAll, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { config } from '@/config';
import { db } from '@/db/index';
import { refreshTokens, type User, users } from '@/db/schema';
import app from '@/index';
import { hashToken } from '@/lib/hash';
import { signAccessToken } from '@/lib/jwt';
import { createPAT, createRefreshToken } from '@/lib/tokens';

interface PatItem {
  id: string;
  name: string;
}

describe('IDP API Endpoints E2E', () => {
  let testUser: User;
  let jwtToken: string;
  let refreshToken: string;
  let patToken = '';
  let patId = '';

  beforeAll(async () => {
    const [u] = await db
      .insert(users)
      .values({
        email: `e2e_user_${Date.now()}@unsareport.org`,
        name: 'E2E User',
        picture: 'https://example.com/avatar.png',
      })
      .returning();
    testUser = u;

    jwtToken = await signAccessToken({
      sub: testUser.id,
      email: testUser.email,
      name: testUser.name,
      picture: testUser.picture,
    });

    refreshToken = await createRefreshToken(testUser.id);
  });

  test('GET /.well-known/jwks.json returns public keys', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/.well-known/jwks.json'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.keys)).toBe(true);
    expect(body.keys.length).toBeGreaterThan(0);
    expect(body.keys[0].kty).toBe('RSA');
  });

  test('POST /v1/keys/rotate rejects unauthorized requests', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/keys/rotate', {
        method: 'POST',
      }),
    );
    expect(res.status).toBe(401);
  });

  test('POST /v1/keys/rotate rotates key with valid admin key', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/keys/rotate', {
        method: 'POST',
        headers: {
          'X-Admin-Key': config.adminApiKey,
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.key.kid).toBeDefined();
  });

  test('GET /v1/me returns 401 without auth header', async () => {
    const res = await app.fetch(new Request('http://localhost:3000/v1/me'));
    expect(res.status).toBe(401);
  });

  test('GET /v1/me returns user details with valid JWT', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/me', {
        headers: { Authorization: `Bearer ${jwtToken}` },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.id).toBe(testUser.id);
    expect(body.user.email).toBe(testUser.email);
    expect(body.auth_type).toBe('jwt');
  });

  test('POST /v1/pat creates a new PAT', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/pat', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'CI/CD Token',
          scopes: ['registry'],
        }),
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(body.token.startsWith('unsareport_pat_')).toBe(true);
    expect(body.pat.name).toBe('CI/CD Token');
    patToken = body.token;
    patId = body.pat.id;
  });

  test('PAT authenticates /v1/me as pat', async () => {
    const meRes = await app.fetch(
      new Request('http://localhost:3000/v1/me', {
        headers: { Authorization: `Bearer ${patToken}` },
      }),
    );
    expect(meRes.status).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.user.id).toBe(testUser.id);
    expect(meBody.auth_type).toBe('pat');
  });

  test('GET /v1/pat lists created PAT', async () => {
    const listRes = await app.fetch(
      new Request('http://localhost:3000/v1/pat', {
        headers: { Authorization: `Bearer ${jwtToken}` },
      }),
    );
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.pats.some((p: PatItem) => p.id === patId)).toBe(true);
  });

  test('DELETE /v1/pat/:id revokes PAT', async () => {
    const delRes = await app.fetch(
      new Request(`http://localhost:3000/v1/pat/${patId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwtToken}` },
      }),
    );
    expect(delRes.status).toBe(200);
  });

  test('POST /v1/refresh returns new access token and refresh token', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.access_token).toBeDefined();
    expect(body.refresh_token).toBeDefined();
    expect(body.token_type).toBe('Bearer');
    expect(body.expires_in).toBe(config.accessTokenTtl);
  });

  test('POST /v1/logout revokes refresh token', async () => {
    const newRfToken = await createRefreshToken(testUser.id);
    const logoutRes = await app.fetch(
      new Request('http://localhost:3000/v1/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: newRfToken }),
      }),
    );
    expect(logoutRes.status).toBe(200);

    const refreshRes = await app.fetch(
      new Request('http://localhost:3000/v1/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: newRfToken }),
      }),
    );
    expect(refreshRes.status).toBe(401);
  });

  test('POST /v1/logout revokes PAT token', async () => {
    const { token } = await createPAT(testUser.id, 'Logout Test PAT');
    const meResBefore = await app.fetch(
      new Request('http://localhost:3000/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(meResBefore.status).toBe(200);

    const logoutRes = await app.fetch(
      new Request('http://localhost:3000/v1/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pat: token }),
      }),
    );
    expect(logoutRes.status).toBe(200);

    const meResAfter = await app.fetch(
      new Request('http://localhost:3000/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(meResAfter.status).toBe(401);
  });

  test('POST /v1/refresh rejects replayed refresh token with 401', async () => {
    const rotated = await createRefreshToken(testUser.id);
    const first = await app.fetch(
      new Request('http://localhost:3000/v1/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rotated }),
      }),
    );
    expect(first.status).toBe(200);
    const replay = await app.fetch(
      new Request('http://localhost:3000/v1/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rotated }),
      }),
    );
    expect(replay.status).toBe(401);
  });

  test('POST /v1/refresh rejects expired refresh token with 401', async () => {
    const stale = await createRefreshToken(testUser.id);
    await db
      .update(refreshTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(refreshTokens.tokenHash, hashToken(stale)));
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: stale }),
      }),
    );
    expect(res.status).toBe(401);
  });

  test('POST /v1/refresh rejects malformed body with 400', async () => {
    const missing = await app.fetch(
      new Request('http://localhost:3000/v1/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );
    expect(missing.status).toBe(400);
    const garbage = await app.fetch(
      new Request('http://localhost:3000/v1/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: 'unsareport_rf_not-a-real-token',
        }),
      }),
    );
    expect(garbage.status).toBe(401);
  });

  test('POST /v1/pat rejects non-string scopes with 400', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/pat', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Bad Scopes', scopes: 'registry' }),
      }),
    );
    expect(res.status).toBe(400);
    const mixed = await app.fetch(
      new Request('http://localhost:3000/v1/pat', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Mixed Scopes',
          scopes: ['registry', 42],
        }),
      }),
    );
    expect(mixed.status).toBe(400);
  });

  test('POST /v1/keys/rotate rejects wrong admin key with 403', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/keys/rotate', {
        method: 'POST',
        headers: { 'X-Admin-Key': 'wrong-admin-key' },
      }),
    );
    expect(res.status).toBe(403);
  });
});
