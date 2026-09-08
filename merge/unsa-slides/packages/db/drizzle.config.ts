import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

const defaultDbPath = fileURLToPath(new URL("./local.db", import.meta.url));

export default defineConfig({
  schema: "./src/schema/*.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || `file:${defaultDbPath}`,
  },
});
