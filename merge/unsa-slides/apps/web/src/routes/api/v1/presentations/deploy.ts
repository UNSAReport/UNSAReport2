import { createFileRoute } from "@tanstack/react-router";
import { deployPresentationServerFn } from "@/lib/presentations-server";

export const Route = createFileRoute("/api/v1/presentations/deploy")({
  loader: async () => {
    return { error: "POST request required with deployment payload." };
  },
});

export { deployPresentationServerFn };
