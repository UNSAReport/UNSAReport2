import { describe, expect, test } from 'bun:test';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import {
  createPAT,
  createRefreshToken,
  listUserPATs,
  revokePAT,
  revokeRefreshToken,
  verifyAndRotateRefreshToken,
  verifyPAT,
} from '@/lib/tokens';

describe('Refresh Token & PAT Lifecycle', () => {
  let testUserId: string;

  test('setup test user', async () => {
    const [u] = await db
      .insert(users)
      .values({
        email: `token_test_${Date.now()}@unsareport.org`,
        name: 'Token Tester',
      })
      .returning();
    testUserId = u.id;
    expect(testUserId).toBeDefined();
  });

  describe('Refresh Token', () => {
    test('create, rotate, and revoke refresh token', async () => {
      const rfToken = await createRefreshToken(testUserId);
      expect(rfToken.startsWith('unsareport_rf_')).toBe(true);

      const rotated = await verifyAndRotateRefreshToken(rfToken);
      expect(rotated.userId).toBe(testUserId);
      expect(rotated.newRefreshToken).toBeDefined();
      expect(rotated.newRefreshToken).not.toBe(rfToken);

      await expect(verifyAndRotateRefreshToken(rfToken)).rejects.toThrow(
        'Invalid or expired refresh token',
      );

      const revoked = await revokeRefreshToken(rotated.newRefreshToken);
      expect(revoked).toBe(true);

      await expect(
        verifyAndRotateRefreshToken(rotated.newRefreshToken),
      ).rejects.toThrow();
    });
  });

  describe('Personal Access Token (PAT)', () => {
    test('create, verify, update last_used_at, list, and revoke PAT', async () => {
      const scopes = ['registry', 'slides'];
      const { token, pat } = await createPAT(testUserId, 'Laptop CLI', scopes);

      expect(token.startsWith('unsareport_pat_')).toBe(true);
      expect(pat.name).toBe('Laptop CLI');
      expect(pat.scopes).toEqual(scopes);

      const verified = await verifyPAT(token);
      expect(verified).not.toBeNull();
      expect(verified?.user.id).toBe(testUserId);
      expect(verified?.pat.name).toBe('Laptop CLI');
      expect(verified?.pat.lastUsedAt).toBeDefined();

      const pats = await listUserPATs(testUserId);
      expect(pats.length).toBeGreaterThan(0);
      expect(pats.some((p) => p.id === pat.id)).toBe(true);

      const revoked = await revokePAT(testUserId, pat.id);
      expect(revoked).toBe(true);

      const verifiedAfterRevoke = await verifyPAT(token);
      expect(verifiedAfterRevoke).toBeNull();
    });
  });

  describe('Invalid behavior', () => {
    test('verifyPAT returns null for garbage tokens', async () => {
      expect(await verifyPAT('garbage-token')).toBeNull();
      expect(
        await verifyPAT(
          'unsareport_pat_0000000000000000000000000000000000000000000000000000000000000000',
        ),
      ).toBeNull();
    });

    test('revokePAT rejects revoke by non-owner', async () => {
      const { token, pat } = await createPAT(testUserId, 'Ownership PAT');
      expect(await revokePAT(crypto.randomUUID(), pat.id)).toBe(false);
      expect(await verifyPAT(token)).not.toBeNull();
      expect(await revokePAT(testUserId, pat.id)).toBe(true);
      expect(await verifyPAT(token)).toBeNull();
    });

    test('listUserPATs returns empty list for user without PATs', async () => {
      const [fresh] = await db
        .insert(users)
        .values({
          email: `empty_pats_${Date.now()}@unsareport.org`,
          name: 'Empty Pats',
        })
        .returning();
      expect(await listUserPATs(fresh.id)).toEqual([]);
    });

    test('double revoke returns false the second time', async () => {
      const { pat } = await createPAT(testUserId, 'Double Revoke PAT');
      expect(await revokePAT(testUserId, pat.id)).toBe(true);
      expect(await revokePAT(testUserId, pat.id)).toBe(false);
    });
  });
});
