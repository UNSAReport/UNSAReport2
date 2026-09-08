import { users } from "@unsa-slides/db/schema/users";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const presentations = sqliteTable(
  "presentations",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    ownerType: text("owner_type", { enum: ["user", "organization"] })
      .notNull()
      .default("user"),
    ownerId: text("owner_id").notNull(),
    visibility: text("visibility", {
      enum: ["private", "org", "public", "unlisted"],
    })
      .notNull()
      .default("private"),
    activeVersion: integer("active_version").notNull().default(1),
    thumbnailUrl: text("thumbnail_url"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    unique("owner_slug_uniq").on(table.ownerType, table.ownerId, table.slug),
  ],
);

export type Presentation = typeof presentations.$inferSelect;
export type NewPresentation = typeof presentations.$inferInsert;

export const presentationVersions = sqliteTable(
  "presentation_versions",
  {
    id: text("id").primaryKey(),
    presentationId: text("presentation_id")
      .notNull()
      .references(() => presentations.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    entrypointUrl: text("entrypoint_url").notNull(),
    manifestJson: text("manifest_json").notNull(),
    deployedBy: text("deployed_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    deployedAt: integer("deployed_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    unique("presentation_version_uniq").on(
      table.presentationId,
      table.versionNumber,
    ),
  ],
);

export type PresentationVersion = typeof presentationVersions.$inferSelect;
export type NewPresentationVersion = typeof presentationVersions.$inferInsert;
