import { clientEnv } from "@/lib/env";

export const SESSION_COOKIE_NAME = "unsa_session";

export function getGoogleOAuthURL(state: string = "default"): string {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: `${clientEnv.BASE_URL}/api/v1/auth/callback`,
    client_id: "mock-google-client-id",
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

export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const c of cookies) {
    if (c.startsWith(`${SESSION_COOKIE_NAME}=`)) {
      return c.substring(SESSION_COOKIE_NAME.length + 1);
    }
  }
  return null;
}
