import { createServerFn } from '@tanstack/react-start';
import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server';
import { createLogger } from '@unsa/logger';
import {
  ACCESS_TOKEN_TTL_S,
  REFRESH_TOKEN_TTL_S,
} from '@unsa/schemas/constants';
import { serverEnv } from '@/lib/env';

const logger = createLogger('web');

export const COOKIE_ACCESS_TOKEN = 'access_token';
export const COOKIE_REFRESH_TOKEN = 'refresh_token';
export const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = ACCESS_TOKEN_TTL_S;
export const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = REFRESH_TOKEN_TTL_S;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  roles?: Record<string, string>;
}

export interface PatItem {
  id: string;
  name: string;
  scopes?: string[];
  createdAt?: string;
  expiresAt?: string | null;
}

async function fetchUserFromIDP(token: string): Promise<AuthUser | null> {
  const issuer = serverEnv.IDP_ISSUER;
  try {
    const res = await fetch(`${issuer.replace(/\/+$/, '')}/v1/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      user?: AuthUser;
      roles?: Record<string, string>;
    };
    if (!data.user) return null;
    return {
      ...data.user,
      roles: data.roles ?? data.user.roles,
    };
  } catch (err) {
    logger.warn('IDP user fetch failed', { err });
    throw err;
  }
}

export const fetchCurrentUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthUser | null> => {
    const token = getCookie(COOKIE_ACCESS_TOKEN);
    if (token) {
      const user = await fetchUserFromIDP(token);
      if (user) {
        return user;
      }
    }

    const refreshToken = getCookie(COOKIE_REFRESH_TOKEN);
    if (!refreshToken) {
      return null;
    }

    const issuer = serverEnv.IDP_ISSUER.replace(/\/+$/, '');
    try {
      const res = await fetch(`${issuer}/v1/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) {
        deleteCookie(COOKIE_ACCESS_TOKEN);
        deleteCookie(COOKIE_REFRESH_TOKEN);
        return null;
      }

      const data = (await res.json()) as {
        access_token: string;
        refresh_token: string;
        expires_in?: number;
      };

      setCookie(COOKIE_ACCESS_TOKEN, data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: data.expires_in ?? DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
        path: '/',
      });

      setCookie(COOKIE_REFRESH_TOKEN, data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: DEFAULT_REFRESH_TOKEN_TTL_SECONDS,
        path: '/',
      });

      return fetchUserFromIDP(data.access_token);
    } catch (err) {
      logger.warn('IDP token refresh failed', { err });
      throw err;
    }
  },
);

export const setSessionTokenServerFn = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string; expiresIn?: number }) => data)
  .handler(async ({ data }) => {
    setCookie(COOKIE_ACCESS_TOKEN, data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.expiresIn ?? DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
      path: '/',
    });
    return { success: true };
  });

export const requireAuthServerFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthUser> => {
    const token = getCookie(COOKIE_ACCESS_TOKEN);
    if (!token) throw new Error('Unauthorized');
    const user = await fetchUserFromIDP(token);
    if (!user) throw new Error('Unauthorized');
    return user;
  },
);

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const token = getCookie(COOKIE_ACCESS_TOKEN);
  const refreshToken = getCookie(COOKIE_REFRESH_TOKEN);
  const issuer = serverEnv.IDP_ISSUER;
  const res = await fetch(`${issuer.replace(/\/+$/, '')}/v1/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) {
    throw new Error('Logout failed');
  }
  deleteCookie(COOKIE_ACCESS_TOKEN);
  deleteCookie(COOKIE_REFRESH_TOKEN);
  return { success: true };
});

export const getGoogleLoginUrlServerFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const issuer = serverEnv.IDP_ISSUER;
  return `${issuer.replace(/\/+$/, '')}/v1/google`;
});

export const getGithubLoginUrlServerFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const issuer = serverEnv.IDP_ISSUER;
  return `${issuer.replace(/\/+$/, '')}/v1/github`;
});

export const getAuthUserServerFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthUser | null> => {
    const token = getCookie(COOKIE_ACCESS_TOKEN);
    if (!token) return null;
    return fetchUserFromIDP(token);
  },
);

export const listPatsServerFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PatItem[]> => {
    const token = getCookie(COOKIE_ACCESS_TOKEN);
    if (!token) throw new Error('Unauthorized');
    const issuer = serverEnv.IDP_ISSUER.replace(/\/+$/, '');
    const res = await fetch(`${issuer}/v1/pat`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { pats: PatItem[] };
    return data.pats ?? [];
  },
);

export const createPatServerFn = createServerFn({ method: 'POST' })
  .validator((data: { name: string; expires_at?: string }) => data)
  .handler(async ({ data }) => {
    const token = getCookie(COOKIE_ACCESS_TOKEN);
    if (!token) throw new Error('Unauthorized');
    const issuer = serverEnv.IDP_ISSUER.replace(/\/+$/, '');
    const res = await fetch(`${issuer}/v1/pat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: data.name, expires_at: data.expires_at }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    return (await res.json()) as { token: string; pat: PatItem };
  });

export const deletePatServerFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const token = getCookie(COOKIE_ACCESS_TOKEN);
    if (!token) throw new Error('Unauthorized');
    const issuer = serverEnv.IDP_ISSUER.replace(/\/+$/, '');
    const res = await fetch(`${issuer}/v1/pat/${data.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return { success: true };
  });

export const authorizeCliServerFn = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      tui_callback: string;
      state: string;
      name?: string;
      expires_in_days?: number | null;
    }) => data,
  )
  .handler(async ({ data }) => {
    const token = getCookie(COOKIE_ACCESS_TOKEN);
    if (!token) throw new Error('Unauthorized');

    let parsedCallback: URL;
    try {
      parsedCallback = new URL(data.tui_callback);
    } catch {
      throw new Error('Invalid callback URL format');
    }
    if (
      parsedCallback.protocol !== 'http:' ||
      (parsedCallback.hostname !== '127.0.0.1' &&
        parsedCallback.hostname !== 'localhost')
    ) {
      throw new Error(
        'Callback URL must be an HTTP loopback address (127.0.0.1 or localhost)',
      );
    }

    let expiresAtDate: string | undefined;
    if (data.expires_in_days && data.expires_in_days > 0) {
      const d = new Date(
        Date.now() + data.expires_in_days * 24 * 60 * 60 * 1000,
      );
      expiresAtDate = d.toISOString();
    }

    const issuer = serverEnv.IDP_ISSUER.replace(/\/+$/, '');
    const res = await fetch(`${issuer}/v1/pat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name:
          data.name || `unsarep CLI (${new Date().toISOString().slice(0, 10)})`,
        expires_at: expiresAtDate,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    return (await res.json()) as { token: string; pat: PatItem };
  });
