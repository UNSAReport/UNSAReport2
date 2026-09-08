import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie } from "@tanstack/react-start/server";
import { serverEnv } from "@/lib/env";

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
    const res = await fetch(`${issuer.replace(/\/$/, "")}/v1/me`, {
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
  } catch {
    return null;
  }
}

export const fetchCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthUser | null> => {
    const token = getCookie("access_token");
    if (!token) return null;
    return fetchUserFromIDP(token);
  },
);

export const requireAuthServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthUser> => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Unauthorized");
    const user = await fetchUserFromIDP(token);
    if (!user) throw new Error("Unauthorized");
    return user;
  },
);

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const token = getCookie("access_token");
  const refreshToken = getCookie("refresh_token");
  const issuer = serverEnv.IDP_ISSUER;
  try {
    await fetch(`${issuer.replace(/\/$/, "")}/v1/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // ignore network errors on logout
  }
  deleteCookie("access_token");
  deleteCookie("refresh_token");
  return { success: true };
});

export const getGoogleLoginUrlServerFn = createServerFn({
  method: "GET",
}).handler(async () => {
  const issuer = serverEnv.IDP_ISSUER;
  return `${issuer.replace(/\/$/, "")}/v1/google`;
});

export const getGithubLoginUrlServerFn = createServerFn({
  method: "GET",
}).handler(async () => {
  const issuer = serverEnv.IDP_ISSUER;
  return `${issuer.replace(/\/$/, "")}/v1/github`;
});

export const getAuthUserServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthUser | null> => {
    const token = getCookie("access_token");
    if (!token) return null;
    return fetchUserFromIDP(token);
  },
);

export const listPatsServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<PatItem[]> => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Unauthorized");
    const issuer = serverEnv.IDP_ISSUER.replace(/\/$/, "");
    const res = await fetch(`${issuer}/v1/pat`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { pats: PatItem[] };
    return data.pats ?? [];
  },
);

export const createPatServerFn = createServerFn({ method: "POST" })
  .validator((data: { name: string }) => data)
  .handler(async ({ data }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Unauthorized");
    const issuer = serverEnv.IDP_ISSUER.replace(/\/$/, "");
    const res = await fetch(`${issuer}/v1/pat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: data.name }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    return (await res.json()) as { token: string; pat: { id: string } };
  });

export const deletePatServerFn = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const token = getCookie("access_token");
    if (!token) throw new Error("Unauthorized");
    const issuer = serverEnv.IDP_ISSUER.replace(/\/$/, "");
    const res = await fetch(`${issuer}/v1/pat/${data.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return { success: true };
  });
