import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: uuid('owner_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const orgMembers = pgTable(
  'org_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    role: text('role').notNull().default('member'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique('org_user_uniq').on(table.orgId, table.userId),
    index('org_members_org_id_idx').on(table.orgId),
  ],
);

export const presentations = pgTable(
  'presentations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    ownerType: text('owner_type').notNull().default('user'),
    ownerId: uuid('owner_id').notNull(),
    visibility: text('visibility').notNull().default('private'),
    activeVersion: integer('active_version').notNull().default(1),
    thumbnailUrl: text('thumbnail_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique('owner_slug_uniq').on(table.ownerType, table.ownerId, table.slug),
    index('presentations_owner_idx').on(table.ownerType, table.ownerId),
  ],
);

export const presentationVersions = pgTable(
  'presentation_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    presentationId: uuid('presentation_id')
      .notNull()
      .references(() => presentations.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    entrypointUrl: text('entrypoint_url').notNull(),
    manifest: jsonb('manifest').notNull(),
    deployedBy: uuid('deployed_by').notNull(),
    deployedAt: timestamp('deployed_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique('presentation_version_uniq').on(
      table.presentationId,
      table.versionNumber,
    ),
  ],
);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrgMember = typeof orgMembers.$inferSelect;
export type NewOrgMember = typeof orgMembers.$inferInsert;
export type Presentation = typeof presentations.$inferSelect;
export type NewPresentation = typeof presentations.$inferInsert;
export type PresentationVersion = typeof presentationVersions.$inferSelect;
export type NewPresentationVersion = typeof presentationVersions.$inferInsert;
