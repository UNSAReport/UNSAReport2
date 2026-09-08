import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { exchangeDeviceCodeServerFn } from "@/lib/cli-auth-server";

const exchangeSchema = z.object({
  deviceCode: z.string().optional(),
});

export const Route = createFileRoute("/api/v1/auth/device-exchange")({
  validateSearch: (search) => exchangeSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    if (!deps.deviceCode) return null;
    return exchangeDeviceCodeServerFn({
      data: { deviceCode: deps.deviceCode },
    });
  },
});
