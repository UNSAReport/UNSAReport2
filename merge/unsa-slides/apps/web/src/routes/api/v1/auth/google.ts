import { createFileRoute, redirect } from "@tanstack/react-router";
import { getGoogleLoginUrlServerFn } from "@/lib/auth-server";

export const Route = createFileRoute("/api/v1/auth/google")({
  loader: async () => {
    const url = await getGoogleLoginUrlServerFn();
    throw redirect({ href: url });
  },
});
