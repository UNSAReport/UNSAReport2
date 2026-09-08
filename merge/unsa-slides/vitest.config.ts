import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const schemasDir = fileURLToPath(
  new URL("./packages/schemas/src", import.meta.url),
);
const dbDir = fileURLToPath(new URL("./packages/db/src", import.meta.url));
const webSrcDir = fileURLToPath(new URL("./apps/web/src", import.meta.url));
const cliSrcDir = fileURLToPath(new URL("./apps/cli/src", import.meta.url));

export default defineConfig({
  test: {
    fileParallelism: false,
    projects: [
      {
        test: {
          name: "schemas",
          root: "./packages/schemas",
          include: ["src/**/*.test.ts"],
          environment: "node",
        },
        resolve: {
          alias: {
            "@unsa-slides/schemas": schemasDir,
            "@unsa-slides/db": dbDir,
          },
        },
      },
      {
        test: {
          name: "web",
          root: "./apps/web",
          include: ["src/**/*.test.ts"],
          environment: "node",
        },
        resolve: {
          alias: {
            "@": webSrcDir,
            "@unsa-slides/schemas": schemasDir,
            "@unsa-slides/db": dbDir,
          },
        },
      },
      {
        test: {
          name: "cli",
          root: "./apps/cli",
          include: ["src/**/*.test.ts"],
          environment: "node",
        },
        resolve: {
          alias: {
            "@": cliSrcDir,
            "@unsa-slides/schemas": schemasDir,
            "@unsa-slides/db": dbDir,
          },
        },
      },
    ],
  },
});
