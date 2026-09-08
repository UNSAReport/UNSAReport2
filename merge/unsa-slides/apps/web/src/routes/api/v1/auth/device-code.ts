import { createFileRoute } from "@tanstack/react-router";
import { createDeviceCodeServerFn } from "@/lib/cli-auth-server";

export const Route = createFileRoute("/api/v1/auth/device-code")({
  loader: async () => {
    return createDeviceCodeServerFn();
  },
});
