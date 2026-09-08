import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { handleOAuthCallbackServerFn } from "@/lib/auth-server";

const callbackSearchSchema = z.object({
  code: z.string().optional(),
});

export const Route = createFileRoute("/api/v1/auth/callback")({
  validateSearch: (search) => callbackSearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const code = deps.code;
    if (!code) {
      throw redirect({
        to: "/login",
        search: { error: "missing_code" },
      });
    }

    try {
      await handleOAuthCallbackServerFn({ data: { code } });
      throw redirect({ to: "/" });
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        ("to" in err || "href" in err)
      ) {
        throw err;
      }
      console.error("OAuth callback error:", err);
      throw redirect({
        to: "/login",
        search: { error: "oauth_failed" },
      });
    }
  },
});
