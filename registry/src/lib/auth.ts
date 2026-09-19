import { createRemoteJWKSet, jwtVerify } from 'jose';
import { config } from '@/config';
import type { JWTPayload, UserContext } from '@/types';

let jwksClient: ReturnType<typeof createRemoteJWKSet> | null = null;
const SUBAPP_NAME = 'registry';

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

/**
 * Validates an IdP personal access token by forwarding it to the IdP userinfo
 * endpoint. PATs are opaque (`unsareport_pat_*`) and can only be validated by
 * the IdP, which owns the token hashes.
 *
 * @param token - Bearer PAT string to validate.
 * @returns User context with IdP identity and role list.
 * @throws Error if the PAT is invalid, revoked, or the IdP is unreachable.
 */
export async function verifyPAT(token: string): Promise<UserContext> {
  const meUrl = `${config.idpIssuer.replace(/\/+$/, '')}/v1/me`;
  let res: Response;
  try {
    res = await fetch(meUrl, {
      headers: { Authorization: `Bearer ${token}` },
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
    roles?: Record<string, string> | string[];
  };

  if (!data.user?.id) {
    throw new Error('IdP returned no user identity');
  }

  let roles: string[] = [];
  if (Array.isArray(data.roles)) {
    roles = data.roles;
  } else if (data.roles && typeof data.roles === 'object') {
    const roleMap = data.roles as Record<string, string>;
    const registryRole = roleMap[SUBAPP_NAME];
    if (typeof registryRole === 'string' && registryRole.length > 0) {
      roles.push(registryRole);
    }
  }

  return {
    id: data.user.id,
    email: data.user.email,
    roles,
  };
}

/**
 * Verifies a JWT token or PAT using the configured Identity Provider.
 *
 * @param token - Bearer JWT or PAT string to verify.
 * @returns Decoded user context containing user ID, optional email, and assigned roles.
 * @throws Error if JWT verification fails or subject claims are missing.
 */
export async function verifyJWT(token: string): Promise<UserContext> {
  if (token.startsWith('unsareport_pat_')) {
    return verifyPAT(token);
  }

  try {
    const JWKS = getJWKS();
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: config.idpIssuer,
    });

    const jwtPayload = payload as unknown as JWTPayload;

    if (!jwtPayload.sub) {
      throw new Error('JWT subject (sub) missing');
    }
    let roles: string[] = [];
    if (Array.isArray(jwtPayload.roles)) {
      roles = jwtPayload.roles;
    } else if (jwtPayload.roles && typeof jwtPayload.roles === 'object') {
      const roleMap = jwtPayload.roles as Record<string, string>;
      const registryRole = roleMap[SUBAPP_NAME];
      if (typeof registryRole === 'string' && registryRole.length > 0) {
        roles.push(registryRole);
      }
    }

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
