import { createRemoteJWKSet, jwtVerify } from 'jose';
import { config } from '@/config';
import type { SlidesUser } from '@/types';

let jwksClient: ReturnType<typeof createRemoteJWKSet> | null = null;

/**
 * Initializes and caches the remote JSON Web Key Set (JWKS) client instance for IDP token verification.
 *
 * @returns Remote JWKS set client instance.
 */
function getJWKS() {
  if (!jwksClient) {
    jwksClient = createRemoteJWKSet(new URL(config.idpJwksUrl));
  }
  return jwksClient;
}

interface IdPMeResponse {
  user: { id: string; email?: string; name?: string };
  auth_type: 'jwt' | 'pat';
  roles: Record<string, string>;
}

/**
 * Verifies a JWT access token using the configured Identity Provider's JWKS and issuer.
 * Roles come from the `roles` claim record keyed by sub-app (see `user_roles` in the IdP).
 *
 * @param token - Bearer JWT string to verify.
 * @returns Slides user context with IdP identity and role map.
 * @throws Error if JWT verification fails or subject claims are missing.
 */
export async function verifyJWT(token: string): Promise<SlidesUser> {
  try {
    const JWKS = getJWKS();
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: config.idpIssuer,
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
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Token verification failed: ${errorMessage}`);
  }
}

/**
 * Validates an IdP personal access token by forwarding it to the IdP userinfo
 * endpoint. PATs are opaque (`unsareport_pat_*`) and can only be validated by
 * the IdP, which owns the token hashes.
 *
 * @param token - Bearer PAT string to validate.
 * @returns Slides user context with IdP identity and role map.
 * @throws Error if the PAT is invalid, revoked, or the IdP is unreachable.
 */
export async function verifyPAT(token: string): Promise<SlidesUser> {
  let res: Response;
  try {
    res = await fetch(config.idpMeUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`IdP unreachable: ${errorMessage}`);
  }

  if (!res.ok) {
    throw new Error('Invalid or revoked PAT');
  }

  const data = (await res.json()) as IdPMeResponse;
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

/**
 * Verifies either credential type the ecosystem issues: IdP JWTs via JWKS,
 * IdP PATs via the IdP userinfo endpoint.
 *
 * @param token - Raw bearer token string.
 * @returns Slides user context with IdP identity and role map.
 */
export async function verifyCredential(token: string): Promise<SlidesUser> {
  if (token.startsWith('unsareport_pat_')) {
    return verifyPAT(token);
  }
  return verifyJWT(token);
}
