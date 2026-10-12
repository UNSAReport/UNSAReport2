import { describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { db } from '@/db/index';
import { oauthAccounts, userRoles } from '@/db/schema';
import { signAccessToken, verifyAccessToken } from '@/lib/jwt';
import { upsertOAuthUser } from '@/lib/oauth';
import { getUserRoles } from '@/lib/roles';

describe('OAuth Registration & Default Sub-App Roles Provisioning', () => {
  test('New OAuth user receives default roles for all subapps', async () => {
    const uniqueEmail = `new_oauth_user_${Date.now()}@unsareport.org`;
    const provider = 'google';
    const providerId = `gid_${Date.now()}`;

    const user = await upsertOAuthUser(provider, {
      providerId,
      email: uniqueEmail,
      name: 'New Registered User',
      picture: 'https://example.com/avatar.png',
    });

    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.email).toBe(uniqueEmail);

    // Verify oauth_accounts entry
    const [oauthRecord] = await db
      .select()
      .from(oauthAccounts)
      .where(eq(oauthAccounts.userId, user.id));
    expect(oauthRecord).toBeDefined();
    expect(oauthRecord.provider).toBe(provider);
    expect(oauthRecord.providerId).toBe(providerId);

    // Verify userRoles table directly
    const dbRoles = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, user.id));
    expect(dbRoles.length).toBeGreaterThanOrEqual(2);

    const rolesMap = await getUserRoles(user.id);
    expect(rolesMap.registry).toBe('user');
    expect(rolesMap.slides).toBe('user');

    // Verify signed access token claims
    const token = await signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      roles: rolesMap,
    });
    const verified = await verifyAccessToken(token);
    expect(verified.roles).toBeDefined();
    expect(verified.roles.registry).toBe('user');
    expect(verified.roles.slides).toBe('user');
  });

  test('Existing OAuth user login preserves existing roles and does not duplicate', async () => {
    const uniqueEmail = `existing_oauth_user_${Date.now()}@unsareport.org`;
    const provider = 'github';
    const providerId = `ghid_${Date.now()}`;

    const initialUser = await upsertOAuthUser(provider, {
      providerId,
      email: uniqueEmail,
      name: 'Initial Name',
      picture: undefined,
    });

    // Elevate registry role to admin
    await db
      .update(userRoles)
      .set({ role: 'admin' })
      .where(eq(userRoles.userId, initialUser.id));

    // Second login / profile update
    const updatedUser = await upsertOAuthUser(provider, {
      providerId,
      email: uniqueEmail,
      name: 'Updated Name',
      picture: 'https://example.com/new.png',
    });

    expect(updatedUser.id).toBe(initialUser.id);
    expect(updatedUser.name).toBe('Updated Name');

    const rolesAfterLogin = await getUserRoles(initialUser.id);
    expect(rolesAfterLogin.registry).toBe('admin');
  });
});
