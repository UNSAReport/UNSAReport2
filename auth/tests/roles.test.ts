import { beforeAll, describe, expect, test } from 'bun:test';
import { config } from '@/config';
import { db } from '@/db/index';
import { type User, users } from '@/db/schema';
import app from '@/index';
import { getUserRoles, signAccessToken, verifyAccessToken } from '@/lib/jwt';

interface RoleItem {
  id: string;
  userId: string;
  subApp: string;
  role: string;
}

describe('Role Management Endpoints & Integration', () => {
  let userA: User;
  let userB: User;
  let jwtTokenUserB: string;

  beforeAll(async () => {
    const [uA] = await db
      .insert(users)
      .values({
        email: `roles_user_a_${Date.now()}@unsareport.org`,
        name: 'User A',
      })
      .returning();
    userA = uA;

    const [uB] = await db
      .insert(users)
      .values({
        email: `roles_user_b_${Date.now()}@unsareport.org`,
        name: 'User B',
      })
      .returning();
    userB = uB;

    jwtTokenUserB = await signAccessToken({
      sub: userB.id,
      email: userB.email,
      name: userB.name,
      roles: {},
    });
  });

  test('1. Assign role to user — success', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': config.adminApiKey,
        },
        body: JSON.stringify({
          userId: userA.id,
          subApp: 'npm-registry',
          role: 'admin',
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.role.userId).toBe(userA.id);
    expect(body.role.subApp).toBe('npm-registry');
    expect(body.role.role).toBe('admin');
  });

  test('2. Assign role — duplicate (upsert updates role)', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': config.adminApiKey,
        },
        body: JSON.stringify({
          userId: userA.id,
          subApp: 'npm-registry',
          role: 'admin',
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.role.role).toBe('admin');
  });

  test('3. Revoke role — success', async () => {
    await app.fetch(
      new Request('http://localhost:3000/v1/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': config.adminApiKey,
        },
        body: JSON.stringify({
          userId: userB.id,
          subApp: 'slides',
          role: 'user',
        }),
      }),
    );

    const res = await app.fetch(
      new Request('http://localhost:3000/v1/roles', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': config.adminApiKey,
        },
        body: JSON.stringify({
          userId: userB.id,
          subApp: 'slides',
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('4. Revoke role — not found', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/roles', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': config.adminApiKey,
        },
        body: JSON.stringify({
          userId: userB.id,
          subApp: 'non-existent-app',
        }),
      }),
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Not Found');
  });

  test('5. List roles for sub-app — returns all users with roles', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/roles/npm-registry', {
        headers: {
          'X-Admin-Key': config.adminApiKey,
        },
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.subApp).toBe('npm-registry');
    expect(Array.isArray(body.roles)).toBe(true);
    expect(body.roles.some((r: RoleItem) => r.userId === userA.id)).toBe(true);
  });

  test('6. List roles for user — returns all sub-app roles', async () => {
    const res = await app.fetch(
      new Request(`http://localhost:3000/v1/roles/user/${userA.id}`, {
        headers: {
          'X-Admin-Key': config.adminApiKey,
        },
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe(userA.id);
    expect(Array.isArray(body.roles)).toBe(true);
    expect(
      body.roles.some(
        (r: RoleItem) => r.subApp === 'npm-registry' && r.role === 'admin',
      ),
    ).toBe(true);
  });

  test('7. Non-admin attempting admin operation — 403', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/roles', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwtTokenUserB}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userB.id,
          subApp: 'npm-registry',
          role: 'user',
        }),
      }),
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  test('8. Admin-key bypass — success', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/roles', {
        method: 'POST',
        headers: {
          'X-Admin-Key': config.adminApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userB.id,
          subApp: 'analytics',
          role: 'admin',
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('9. Assigned roles surface in JWT, /v1/me and /v1/roles/me', async () => {
    const rolesA = await getUserRoles(userA.id);
    const token = await signAccessToken({
      sub: userA.id,
      email: userA.email,
      name: userA.name,
      roles: rolesA,
    });

    const verified = await verifyAccessToken(token);
    expect(verified.roles).toBeDefined();
    expect(verified.roles['npm-registry']).toBe('admin');

    const meRes = await app.fetch(
      new Request('http://localhost:3000/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(meRes.status).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.roles).toBeDefined();
    expect(meBody.roles['npm-registry']).toBe('admin');

    const rolesRes = await app.fetch(
      new Request('http://localhost:3000/v1/roles/me', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(rolesRes.status).toBe(200);
    const rolesBody = await rolesRes.json();
    expect(rolesBody.roles).toBeDefined();
    expect(rolesBody.roles['npm-registry']).toBe('admin');
  });

  test('12. /v1/roles/users searches and returns registered users with roles', async () => {
    const res = await app.fetch(
      new Request(
        `http://localhost:3000/v1/roles/users?q=${encodeURIComponent(userA.email)}`,
        {
          headers: {
            'X-Admin-Key': config.adminApiKey,
          },
        },
      ),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      users: Array<{
        id: string;
        email: string;
        name: string;
        roles: RoleItem[];
      }>;
    };
    expect(Array.isArray(body.users)).toBe(true);
    const found = body.users.find((u) => u.id === userA.id);
    expect(found).toBeDefined();
    expect(found?.email).toBe(userA.email);
    expect(Array.isArray(found?.roles)).toBe(true);
  });

  test('13. Assign role rejects invalid enum with 400', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': config.adminApiKey,
        },
        body: JSON.stringify({
          userId: userA.id,
          subApp: 'npm-registry',
          role: 'superuser',
        }),
      }),
    );
    expect(res.status).toBe(400);
  });

  test('14. Assign role to nonexistent user returns 404', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': config.adminApiKey,
        },
        body: JSON.stringify({
          userId: crypto.randomUUID(),
          subApp: 'npm-registry',
          role: 'user',
        }),
      }),
    );
    expect(res.status).toBe(404);
  });

  test('15. Non-admin self-escalation returns 403', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/roles', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwtTokenUserB}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userB.id,
          subApp: 'slides',
          role: 'admin',
        }),
      }),
    );
    expect(res.status).toBe(403);
  });

  test('16. DELETE role without body returns 400', async () => {
    const res = await app.fetch(
      new Request('http://localhost:3000/v1/roles', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': config.adminApiKey,
        },
      }),
    );
    expect(res.status).toBe(400);
  });
});
