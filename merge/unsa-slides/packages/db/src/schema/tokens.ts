import { users } from "@unsa-slides/db/schema/users";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const apiTokens = sqliteTable("api_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type ApiToken = typeof apiTokens.$inferSelect;
export type NewApiToken = typeof apiTokens.$inferInsert;

export const deviceCodes = sqliteTable("device_codes", {
  id: text("id").primaryKey(),
  deviceCode: text("device_code").notNull().unique(),
  userCode: text("user_code").notNull().unique(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["pending", "authorized", "expired"] })
    .notNull()
    .default("pending"),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type DeviceCode = typeof deviceCodes.$inferSelect;
export type NewDeviceCode = typeof deviceCodes.$inferInsert;
