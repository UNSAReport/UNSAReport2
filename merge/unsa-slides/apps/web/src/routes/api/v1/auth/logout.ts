import { createFileRoute, redirect } from "@tanstack/react-router";
import { logoutFn } from "@/lib/auth-server";

export const Route = createFileRoute("/api/v1/auth/logout")({
  loader: async () => {
    await logoutFn();
    throw redirect({ to: "/" });
  },
});
