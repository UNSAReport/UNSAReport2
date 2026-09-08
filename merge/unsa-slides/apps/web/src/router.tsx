import { createRouter } from "@tanstack/react-router";
import { clientEnv } from "@/lib/env";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    basepath: clientEnv.BASE_URL,
  });

  return router;
}
