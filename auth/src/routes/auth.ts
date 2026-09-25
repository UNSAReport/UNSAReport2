import process from 'node:process';
import { STATE_COOKIE_SECONDS } from '@unsa/schemas/constants';
import { eq } from 'drizzle-orm';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { config } from '@/config';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { stripBearer } from '@/lib/bearer';
import {
  AppError,
  InternalServerError,
  UnauthorizedError,
  ValidationError,
} from '@/lib/errors';
import { generateRandomHex } from '@/lib/hash';
import { getUserRoles, signAccessToken } from '@/lib/jwt';
import { providerRegistry, upsertOAuthUser } from '@/lib/oauth';
import {
  createRefreshToken,
  revokePAT,
  revokeRefreshToken,
  verifyAndRotateRefreshToken,
  verifyPAT,
} from '@/lib/tokens';
import { authMiddleware } from '@/middleware/auth';

const authRouter = new Hono();

function handleOAuthRedirect(c: Context, providerName: string) {
  const provider = providerRegistry.get(providerName);
  if (!provider) {
    throw new ValidationError(`Unsupported OAuth provider: ${providerName}`);
  }

  const state = `st_${generateRandomHex(16)}`;
  setCookie(c, `oauth_state_${providerName}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: STATE_COOKIE_SECONDS,
    path: '/',
  });

  const authUrl = provider.getAuthUrl(state);
  return c.redirect(authUrl);
}

async function handleOAuthCallback(c: Context, providerName: string) {
  const provider = providerRegistry.get(providerName);
  if (!provider) {
    throw new ValidationError(`Unsupported OAuth provider: ${providerName}`);
  }

  const code = c.req.query('code');
  const state = c.req.query('state');
  const savedState = getCookie(c, `oauth_state_${providerName}`);

  deleteCookie(c, `oauth_state_${providerName}`, { path: '/' });

  if (!code) {
    throw new ValidationError('Missing authorization code');
  }

  if (savedState && state !== savedState) {
    throw new ValidationError('Invalid OAuth state parameter');
  }

  try {
    const oauthUserInfo = await provider.exchangeCode(code);
    const user = await upsertOAuthUser(providerName, oauthUserInfo);
    const roles = await getUserRoles(user.id);

    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      roles,
    });

    const refreshToken = await createRefreshToken(user.id);

    setCookie(c, 'access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: config.accessTokenTtl,
      path: '/',
    });

    setCookie(c, 'refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: config.refreshTokenTtl,
      path: '/',
    });

    const redirectUrl = new URL(config.clientRedirectUrl);
    redirectUrl.hash = `access_token=${accessToken}&token_type=Bearer&expires_in=${config.accessTokenTtl}`;

    return c.redirect(redirectUrl.toString());
  } catch (err: unknown) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new InternalServerError(
      err instanceof Error ? err.message : 'Authentication failed',
    );
  }
}

authRouter.get('/google', (c) => handleOAuthRedirect(c, 'google'));

authRouter.get('/google/callback', (c) => handleOAuthCallback(c, 'google'));

authRouter.get('/github', (c) => handleOAuthRedirect(c, 'github'));

authRouter.get('/github/callback', (c) => handleOAuthCallback(c, 'github'));

authRouter.post('/refresh', async (c) => {
  let body: { refresh_token?: string } = {};
  if ((c.req.header('content-type') || '').includes('application/json')) {
    try {
      body = await c.req.json<{ refresh_token?: string }>();
    } catch {
      throw new ValidationError('Malformed JSON body');
    }
  }
  const refreshTokenInput = body.refresh_token || getCookie(c, 'refresh_token');

  if (!refreshTokenInput) {
    throw new ValidationError('Refresh token is required');
  }

  try {
    const { userId, newRefreshToken } =
      await verifyAndRotateRefreshToken(refreshTokenInput);
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const roles = await getUserRoles(user.id);
    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      roles,
    });

    setCookie(c, 'access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: config.accessTokenTtl,
      path: '/',
    });

    setCookie(c, 'refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: config.refreshTokenTtl,
      path: '/',
    });

    return c.json({
      access_token: accessToken,
      refresh_token: newRefreshToken,
      token_type: 'Bearer',
      expires_in: config.accessTokenTtl,
    });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new UnauthorizedError(
      err instanceof Error ? err.message : 'Invalid refresh token',
    );
  }
});

authRouter.post('/logout', async (c) => {
  let body: { refresh_token?: string; pat?: string } = {};
  if ((c.req.header('content-type') || '').includes('application/json')) {
    try {
      body = await c.req.json<{ refresh_token?: string; pat?: string }>();
    } catch {
      throw new ValidationError('Malformed JSON body');
    }
  }
  const refreshTokenInput = body.refresh_token || getCookie(c, 'refresh_token');

  if (refreshTokenInput) {
    await revokeRefreshToken(refreshTokenInput);
  }
  const authHeader = c.req.header('Authorization');
  const bearerToken = stripBearer(authHeader);
  let patToken = body.pat;
  if (!patToken && bearerToken && bearerToken.startsWith('unsareport_pat_')) {
    patToken = bearerToken;
  }
  if (patToken) {
    const verified = await verifyPAT(patToken);
    if (verified) {
      await revokePAT(verified.user.id, verified.pat.id);
    }
  }

  deleteCookie(c, 'access_token', { path: '/' });
  deleteCookie(c, 'refresh_token', { path: '/' });

  return c.json({ success: true, message: 'Logged out successfully' });
});

authRouter.get('/me', authMiddleware, (c) => {
  const user = c.get('user');
  const authType = c.get('authType');
  const jwtClaims = c.get('jwtClaims');
  const pat = c.get('pat');
  const roles = c.get('roles');

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    auth_type: authType,
    roles,
    ...(authType === 'jwt' ? { jwt_claims: jwtClaims } : {}),
    ...(authType === 'pat' && pat
      ? { pat_info: { id: pat.id, name: pat.name, scopes: pat.scopes } }
      : {}),
  });
});

export { authRouter };
