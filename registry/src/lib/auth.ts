import { createRemoteJWKSet, jwtVerify } from 'jose';
import { config } from '@/config';
import type { JWTPayload, UserContext } from '@/types';

export function stripBearer(
  authHeader: string | null | undefined,
): string | null {
  if (authHeader?.startsWith('Bearer ') !== true) {
    return null;
  }
  const token = authHeader.slice(7);
  if (token.length === 0 || token[0] === ' ' || token[0] === '\t') {
    return null;
  }
  return token;
}

const jwksClient = createRemoteJWKSet(new URL(config.idpJwksUrl), {
  timeoutDuration: config.idpTimeoutMs,
});

export async function verifyPAT(token: string): Promise<UserContext> {
  const meUrl = `${config.idpIssuer.replace(/\/+$/, '')}/v1/me`;
  let res: Response;
  try {
    res = await fetch(meUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(config.idpTimeoutMs),
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`IdP unreachable: ${errorMessage}`);
  }

  if (!res.ok) {
    throw new Error('Invalid or revoked PAT');
  }

  const data = (await res.json()) as {
    user?: { id: string; email?: string; name?: string };
    roles?: Record<string, string>;
  };

  if (!data.user?.id) {
    throw new Error('IdP returned no user identity');
  }

  const roles: Record<string, string> =
    data.roles && typeof data.roles === 'object' ? data.roles : {};

  return {
    id: data.user.id,
    email: data.user.email,
    roles,
  };
}

export async function verifyJWT(token: string): Promise<UserContext> {
  if (token.startsWith('unsareport_pat_')) {
    return verifyPAT(token);
  }

  try {
    const JWKS = jwksClient;
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: config.idpIssuer,
    });

    const jwtPayload = payload as unknown as JWTPayload;

    if (!jwtPayload.sub) {
      throw new Error('JWT subject (sub) missing');
    }
    const roles: Record<string, string> =
      jwtPayload.roles && typeof jwtPayload.roles === 'object'
        ? jwtPayload.roles
        : {};

    return {
      id: jwtPayload.sub,
      email: jwtPayload.email,
      roles,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Token verification failed: ${errorMessage}`);
  }
}
