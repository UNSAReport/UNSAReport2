import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifyApiTokenServerFn } from "@/lib/cli-auth-server";

const verifyTokenSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/api/v1/auth/verify-token")({
  validateSearch: (search) => verifyTokenSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    if (!deps.token) return null;
    return verifyApiTokenServerFn({
      data: { token: deps.token },
    });
  },
});
