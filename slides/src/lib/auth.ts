import { createRemoteJWKSet, jwtVerify } from 'jose';
import { config } from '@/config';
import type { SlidesUser } from '@/types';

export function stripBearer(
  authHeader: string | null | undefined,
): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
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

interface IdPMeResponse {
  user: { id: string; email?: string; name?: string };
  auth_type: 'jwt' | 'pat';
  roles: Record<string, string>;
}

// Network outages, JWKS-fetch failures, and IdP timeouts are transient
// infrastructure problems, not bad credentials. Callers map these to 503
// (via err.name === 'AuthUpstreamError'); everything else stays a 401.

export async function verifyJWT(token: string): Promise<SlidesUser> {
  try {
    const JWKS = jwksClient;
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: config.idpIssuer,
      audience: config.audience,
      clockTolerance: 5,
    });

    const sub = payload.sub;
    if (!sub) {
      throw new Error('JWT subject (sub) missing');
    }

    const roles =
      payload.roles && typeof payload.roles === 'object'
        ? (payload.roles as Record<string, string>)
        : {};

    return {
      id: sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      name: typeof payload.name === 'string' ? payload.name : undefined,
      roles,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      const code = (err as Error & { code?: unknown }).code;
      const message = err.message || '';
      const isUpstream =
        code === 'ERR_JWKS_TIMEOUT' ||
        err.name === 'TimeoutError' ||
        message.includes('Expected 200 OK from the JSON Web Key Set') ||
        message.includes('Failed to parse the JSON Web Key Set') ||
        /fetch failed|Failed to fetch|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EAI_AGAIN|ENETUNREACH|network error|Load failed/i.test(
          message,
        );
      if (isUpstream) {
        const upstream = new Error(`IdP unreachable: ${message}`);
        upstream.name = 'AuthUpstreamError';
        throw upstream;
      }
    }
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Token verification failed: ${errorMessage}`);
  }
}

export async function verifyPAT(token: string): Promise<SlidesUser> {
  let res: Response;
  try {
    res = await fetch(config.idpMeUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(config.idpTimeoutMs),
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const upstream = new Error(`IdP unreachable: ${errorMessage}`);
    upstream.name = 'AuthUpstreamError';
    throw upstream;
  }

  if (!res.ok) {
    throw new Error('Invalid or revoked PAT');
  }

  let data: IdPMeResponse;
  try {
    data = (await res.json()) as IdPMeResponse;
  } catch {
    throw new Error('IdP returned an invalid response');
  }
  if (!data.user?.id) {
    throw new Error('IdP returned no user identity');
  }

  return {
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
    roles: data.roles || {},
  };
}

export async function verifyCredential(token: string): Promise<SlidesUser> {
  if (token.startsWith('unsareport_pat_')) {
    return verifyPAT(token);
  }
  return verifyJWT(token);
}
