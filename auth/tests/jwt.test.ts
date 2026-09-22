import { describe, expect, test } from 'bun:test';
import { importPKCS8, SignJWT, UnsecuredJWT } from 'jose';
import { config } from '@/config';
import { signAccessToken, verifyAccessToken } from '@/lib/jwt';
import { getOrGenerateActiveKey, rotateKeys } from '@/lib/keys';

describe('JWT Access Token Signing and Verification', () => {
  const dummyUser = {
    sub: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@unsareport.org',
    name: 'Test Student',
    picture: 'https://example.com/pic.jpg',
  };

  test('signAccessToken generates a valid JWT with correct claims', async () => {
    const token = await signAccessToken(dummyUser);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const verified = await verifyAccessToken(token);
    expect(verified.sub).toBe(dummyUser.sub);
    expect(verified.email).toBe(dummyUser.email);
    expect(verified.name).toBe(dummyUser.name);
    expect(verified.picture).toBe(dummyUser.picture);
    expect(verified.iss).toBe(config.idpIssuer);
    expect(verified.type).toBe('access');
    expect(verified.jti).toBeDefined();
    expect(verified.exp).toBeGreaterThan(verified.iat);
  });

  test('verifyAccessToken can verify token signed prior to key rotation', async () => {
    const token = await signAccessToken(dummyUser);

    await rotateKeys();

    const verified = await verifyAccessToken(token);
    expect(verified.sub).toBe(dummyUser.sub);
  });

  test('verifyAccessToken fails on tampered token', async () => {
    const token = await signAccessToken(dummyUser);
    const parts = token.split('.');
    const tampered = `${parts[0]}.${parts[1]}.tampered_signature`;

    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });

  test('verifyAccessToken rejects expired tokens', async () => {
    const activeKey = await getOrGenerateActiveKey();
    const privateKey = await importPKCS8(
      activeKey.privateKey,
      activeKey.algorithm || 'RS256',
    );
    const expired = await new SignJWT({
      sub: dummyUser.sub,
      email: dummyUser.email,
      name: dummyUser.name,
      type: 'access',
    })
      .setProtectedHeader({
        alg: activeKey.algorithm || 'RS256',
        kid: activeKey.kid,
        typ: 'JWT',
      })
      .setIssuer(config.idpIssuer)
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(privateKey);
    await expect(verifyAccessToken(expired)).rejects.toThrow();
  });

  test('verifyAccessToken rejects wrong issuer', async () => {
    const activeKey = await getOrGenerateActiveKey();
    const privateKey = await importPKCS8(
      activeKey.privateKey,
      activeKey.algorithm || 'RS256',
    );
    const foreign = await new SignJWT({
      sub: dummyUser.sub,
      email: dummyUser.email,
      name: dummyUser.name,
      type: 'access',
    })
      .setProtectedHeader({
        alg: activeKey.algorithm || 'RS256',
        kid: activeKey.kid,
        typ: 'JWT',
      })
      .setIssuer('https://evil.example.com')
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(privateKey);
    await expect(verifyAccessToken(foreign)).rejects.toThrow();
  });

  test('verifyAccessToken rejects non-access type claim', async () => {
    const activeKey = await getOrGenerateActiveKey();
    const privateKey = await importPKCS8(
      activeKey.privateKey,
      activeKey.algorithm || 'RS256',
    );
    const refresh = await new SignJWT({
      sub: dummyUser.sub,
      email: dummyUser.email,
      name: dummyUser.name,
      type: 'refresh',
    })
      .setProtectedHeader({
        alg: activeKey.algorithm || 'RS256',
        kid: activeKey.kid,
        typ: 'JWT',
      })
      .setIssuer(config.idpIssuer)
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(privateKey);
    await expect(verifyAccessToken(refresh)).rejects.toThrow(
      'Invalid token type claim',
    );
  });

  test('verifyAccessToken rejects empty and garbage tokens', async () => {
    await expect(verifyAccessToken('')).rejects.toThrow();
    await expect(verifyAccessToken('not-a-jwt')).rejects.toThrow();
    await expect(verifyAccessToken('a.b.c')).rejects.toThrow();
  });

  test('verifyAccessToken rejects alg none tokens', async () => {
    const unsigned = new UnsecuredJWT({
      sub: dummyUser.sub,
      email: dummyUser.email,
      type: 'access',
    })
      .setIssuer(config.idpIssuer)
      .setIssuedAt()
      .setExpirationTime('15m')
      .encode();
    await expect(verifyAccessToken(unsigned)).rejects.toThrow();
  });
});
