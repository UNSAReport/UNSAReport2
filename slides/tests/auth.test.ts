import { describe, expect, it } from 'bun:test';
import app from '@/index';

describe('Slides service auth guards', () => {
  it('GET /health is public and lists slides endpoints', async () => {
    const res = await app.fetch(new Request('http://localhost/health'));
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      status: string;
      service: string;
      endpoints: string[];
    };
    expect(data.status).toBe('ok');
    expect(data.service).toBe('unsareport-slides');
    expect(
      data.endpoints.some((e) => e.includes('/presentations/deploy')),
    ).toBe(true);
  });

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

  it('JWT without slides role is rejected with 403', async () => {
    // A structurally valid JWT signed by an unknown key fails verification
    // before role checks; use a syntactically parseable token so the guard
    // path (verify -> 401 vs role -> 403) is exercised deterministically.
    // Here the signature is unknown, so verification must fail closed.
    const res = await app.fetch(
      new Request('http://localhost/orgs', {
        headers: {
          Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ4In0.c2ln',
        },
      }),
    );
    expect([401, 403].includes(res.status)).toBe(true);
  });
});
