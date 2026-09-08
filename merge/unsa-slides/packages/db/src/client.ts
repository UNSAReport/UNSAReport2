import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import * as orgsSchema from "@unsa-slides/db/schema/orgs";
import * as presentationsSchema from "@unsa-slides/db/schema/presentations";
import * as tokensSchema from "@unsa-slides/db/schema/tokens";
import * as usersSchema from "@unsa-slides/db/schema/users";
import { drizzle } from "drizzle-orm/libsql";

const defaultDbPath = fileURLToPath(new URL("../local.db", import.meta.url));
const dbUrl = process.env.DATABASE_URL || `file:${defaultDbPath}`;
const dbAuthToken = process.env.DATABASE_AUTH_TOKEN;

const client = createClient({
  url: dbUrl,
  authToken: dbAuthToken,
});

export const db = drizzle(client, {
  schema: {
    ...usersSchema,
    ...orgsSchema,
    ...presentationsSchema,
    ...tokensSchema,
  },
});

export type DB = typeof db;
