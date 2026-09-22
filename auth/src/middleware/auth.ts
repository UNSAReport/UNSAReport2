import { eq } from 'drizzle-orm';
import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { db } from '@/db/index';
import { type PersonalAccessToken, users } from '@/db/schema';
import { stripBearer } from '@/lib/bearer';
import { UnauthorizedError } from '@/lib/errors';
import { getUserRoles, verifyAccessToken } from '@/lib/jwt';
import { verifyPAT } from '@/lib/tokens';
import type { AccessTokenClaims, AuthUser, Role } from '@/types';

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
    authType: 'jwt' | 'pat';
    pat?: PersonalAccessToken;
    jwtClaims?: AccessTokenClaims;
    roles: Record<string, Role>;
    isSuperAdmin?: boolean;
  }
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const bearerToken = stripBearer(authHeader);
  let token: string | undefined;

  if (bearerToken) {
    token = bearerToken;
  } else if (!authHeader?.startsWith('Bearer ')) {
    token = getCookie(c, 'access_token') || c.req.query('access_token');
  }

  if (!token) {
    throw new UnauthorizedError('Missing access token or PAT');
  }

  if (token.startsWith('unsareport_pat_')) {
    const patResult = await verifyPAT(token);
    if (!patResult) {
      throw new UnauthorizedError('Invalid or revoked PAT');
    }
    c.set('user', patResult.user as AuthUser);
    c.set('pat', patResult.pat);
    c.set('authType', 'pat');
    c.set('roles', await getUserRoles(patResult.user.id));
    await next();
    return;
  }

  let claims: AccessTokenClaims;
  try {
    claims = await verifyAccessToken(token);
  } catch (err: unknown) {
    throw new UnauthorizedError(
      err instanceof Error ? err.message : 'Invalid access token',
    );
  }

  const [userRecord] = await db
    .select()
    .from(users)
    .where(eq(users.id, claims.sub));

  if (!userRecord) {
    throw new UnauthorizedError('User non-existent');
  }

  c.set('user', userRecord as AuthUser);
  c.set('jwtClaims', claims);
  c.set('authType', 'jwt');
  c.set('roles', claims.roles);
  await next();
};
