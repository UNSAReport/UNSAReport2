import { describe, expect, test } from 'bun:test';
import { signAccessToken, verifyAccessToken } from '@/lib/jwt';
import {
  generateRSAKeyPair,
  getAllActivePublicKeys,
  getOrGenerateActiveKey,
  rotateKeys,
} from '@/lib/keys';

describe('RSA Key Management', () => {
  test('generateRSAKeyPair creates valid RSA 2048 key pair in PEM format', async () => {
    const keyPair = await generateRSAKeyPair();
    expect(keyPair.kid).toBeDefined();
    expect(keyPair.kid.startsWith('key_')).toBe(true);
    expect(keyPair.publicKeyPem).toContain('-----BEGIN PUBLIC KEY-----');
    expect(keyPair.privateKeyPem).toContain('-----BEGIN PRIVATE KEY-----');
  });

  test('getOrGenerateActiveKey returns or creates active key', async () => {
    const activeKey = await getOrGenerateActiveKey();
    expect(activeKey).toBeDefined();
    expect(activeKey.active).toBe(true);
    expect(activeKey.kid).toBeDefined();
  });

  test('getAllActivePublicKeys returns JWKS key structures', async () => {
    const jwks = await getAllActivePublicKeys();
    expect(Array.isArray(jwks)).toBe(true);
    expect(jwks.length).toBeGreaterThan(0);

    const [firstKey] = jwks;
    expect(firstKey.kty).toBe('RSA');
    expect(firstKey.use).toBe('sig');
    expect(firstKey.alg).toBe('RS256');
    expect(firstKey.kid).toBeDefined();
    expect(firstKey.n).toBeDefined();
    expect(firstKey.e).toBeDefined();
  });

  test('rotateKeys deactivates old active key and creates a new active key', async () => {
    const oldKey = await getOrGenerateActiveKey();
    const newKey = await rotateKeys();

    expect(newKey.kid).not.toBe(oldKey.kid);
    expect(newKey.active).toBe(true);

    const activeKeys = await getAllActivePublicKeys();
    expect(activeKeys.some((k) => k.kid === newKey.kid)).toBe(true);
    expect(activeKeys.some((k) => k.kid === oldKey.kid)).toBe(false);
  });

  test('getOrGenerateActiveKey is idempotent across calls', async () => {
    const first = await getOrGenerateActiveKey();
    const second = await getOrGenerateActiveKey();
    expect(first.kid).toBe(second.kid);
  });

  test('token signed before rotation still verifies with old key', async () => {
    const before = await getOrGenerateActiveKey();
    const token = await signAccessToken({
      sub: '123e4567-e89b-12d3-a456-426614174000',
      email: 'oldkey@unsareport.org',
      name: 'Old Key Holder',
    });
    const rotated = await rotateKeys();
    expect(rotated.kid).not.toBe(before.kid);
    const verified = await verifyAccessToken(token);
    expect(verified.sub).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(verified.email).toBe('oldkey@unsareport.org');
  });

  test('double rotation leaves only the latest key active', async () => {
    const first = await rotateKeys();
    const second = await rotateKeys();
    expect(second.kid).not.toBe(first.kid);
    const active = await getAllActivePublicKeys();
    expect(active.some((k) => k.kid === second.kid)).toBe(true);
    expect(active.some((k) => k.kid === first.kid)).toBe(false);
  });
});
