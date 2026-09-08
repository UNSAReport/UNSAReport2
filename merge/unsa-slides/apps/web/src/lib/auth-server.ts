import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
import { db } from "@unsa-slides/db/client";
import {
  type Session,
  sessions,
  type User,
  users,
} from "@unsa-slides/db/schema/users";
import type { GoogleProfile } from "@unsa-slides/schemas/auth";
import { eq } from "drizzle-orm";
import { SESSION_COOKIE_NAME } from "@/lib/auth-shared";
import { serverEnv } from "@/lib/env";

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function getGoogleOAuthURLServer(state: string = "default"): string {
  if (serverEnv.GOOGLE_CLIENT_ID === "mock-google-client-id") {
    return `${serverEnv.BASE_URL}/api/v1/auth/callback?code=mock_dev_code&state=${state}`;
  }

  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: `${serverEnv.BASE_URL}/api/v1/auth/callback`,
    client_id: serverEnv.GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ].join(" "),
    state,
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleProfile> {
  if (
    serverEnv.GOOGLE_CLIENT_ID === "mock-google-client-id" ||
    code === "mock_dev_code"
  ) {
    return {
      id: "google-mock-12345",
      email: "gustadev@unsa.edu.pe",
      verified_email: true,
      name: "Gusta Dev",
      given_name: "Gusta",
      family_name: "Dev",
      picture: "https://api.dicebear.com/7.x/bottts/svg?seed=gustadev",
    };
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: serverEnv.GOOGLE_CLIENT_ID,
      client_secret: serverEnv.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${serverEnv.BASE_URL}/api/v1/auth/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed: ${tokenRes.statusText}`);
  }

  const tokens = await tokenRes.json();

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error(`Failed to fetch Google profile: ${userRes.statusText}`);
  }

  return userRes.json();
}

export async function upsertGoogleUser(profile: GoogleProfile): Promise<User> {
  const existingByGoogle = await db
    .select()
    .from(users)
    .where(eq(users.googleId, profile.id))
    .limit(1);

  if (existingByGoogle.length > 0) {
    const user = existingByGoogle[0];
    const [updated] = await db
      .update(users)
      .set({
        name: profile.name,
        avatarUrl: profile.picture || user.avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();
    return updated;
  }

  const existingByEmail = await db
    .select()
    .from(users)
    .where(eq(users.email, profile.email))
    .limit(1);

  if (existingByEmail.length > 0) {
    const user = existingByEmail[0];
    const [updated] = await db
      .update(users)
      .set({
        googleId: profile.id,
        avatarUrl: profile.picture || user.avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();
    return updated;
  }

  const newUserId = crypto.randomUUID();
  const [created] = await db
    .insert(users)
    .values({
      id: newUserId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
      googleId: profile.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

export async function createSession(userId: string): Promise<{
  session: Session;
  sessionId: string;
}> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  const [session] = await db
    .insert(sessions)
    .values({
      id: sessionId,
      userId,
      expiresAt,
      createdAt: new Date(),
    })
    .returning();

  return { session, sessionId };
}

export async function validateSession(sessionId: string): Promise<{
  session: Session;
  user: User;
} | null> {
  const result = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const { session, user } = result[0];

  if (session.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return null;
  }

  return { session, user };
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export const fetchCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<User | null> => {
    const sessionId = getCookie(SESSION_COOKIE_NAME);
    if (!sessionId) return null;

    const auth = await validateSession(sessionId);
    if (!auth) return null;

    return auth.user;
  },
);

export const getGoogleLoginUrlServerFn = createServerFn({
  method: "GET",
}).handler(async () => {
  return getGoogleOAuthURLServer();
});

export const handleOAuthCallbackServerFn = createServerFn({ method: "GET" })
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const profile = await exchangeGoogleCode(data.code);
    const user = await upsertGoogleUser(profile);
    const { sessionId } = await createSession(user.id);

    setCookie(SESSION_COOKIE_NAME, sessionId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return { success: true };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const sessionId = getCookie(SESSION_COOKIE_NAME);
  if (sessionId) {
    await deleteSession(sessionId);
  }

  setCookie(SESSION_COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
    expires: new Date(0),
  });
  deleteCookie(SESSION_COOKIE_NAME, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  return { success: true };
});

export const requireAuthServerFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await fetchCurrentUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    return user;
  },
);
