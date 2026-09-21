import {
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const packages = pgTable(
  'packages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    displayName: text('display_name'),
    description: text('description'),
    authorId: uuid('author_id').notNull(),
    latestVersion: text('latest_version'),
    status: text('status').notNull().default('pending'),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_packages_name').on(table.name),
    index('idx_packages_status').on(table.status),
    index('idx_packages_author').on(table.authorId),
  ],
);

export const packageVersions = pgTable(
  'package_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    packageId: uuid('package_id')
      .notNull()
      .references(() => packages.id, { onDelete: 'cascade' }),
    version: text('version').notNull(),
    status: text('status').notNull().default('pending'),
    rejectionReason: text('rejection_reason'),
    s3Key: text('s3_key').notNull(),
    archiveS3Key: text('archive_s3_key').notNull(),
    componentsS3Key: text('components_s3_key'),
    templatesS3Key: text('templates_s3_key'),
    fileCount: integer('file_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    unique('unique_package_version').on(table.packageId, table.version),
    index('idx_package_versions_package').on(table.packageId),
    index('idx_package_versions_status').on(table.status),
  ],
);

export const packageFiles = pgTable(
  'package_files',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    versionId: uuid('version_id')
      .notNull()
      .references(() => packageVersions.id, { onDelete: 'cascade' }),
    path: text('path').notNull(),
    section: text('section').notNull().default('components'),
    size: integer('size').notNull(),
    checksum: text('checksum').notNull(),
    s3Key: text('s3_key').notNull(),
  },
  (table) => [
    unique('unique_version_path').on(table.versionId, table.path),
    index('idx_package_files_version').on(table.versionId),
  ],
);

export const packageDependencies = pgTable(
  'package_dependencies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    versionId: uuid('version_id')
      .notNull()
      .references(() => packageVersions.id, { onDelete: 'cascade' }),
    dependencyName: text('dependency_name').notNull(),
    versionRange: text('version_range').notNull(),
  },
  (table) => [
    unique('unique_version_dep_name').on(table.versionId, table.dependencyName),
    index('idx_package_dependencies_version').on(table.versionId),
  ],
);

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    displayName: text('display_name').notNull(),
    parentId: uuid('parent_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: 'tags_parent_id_fkey',
    }).onDelete('set null'),
    index('idx_tags_parent').on(table.parentId),
  ],
);

export const packageTags = pgTable(
  'package_tags',
  {
    packageId: uuid('package_id')
      .notNull()
      .references(() => packages.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.packageId, table.tagId] }),
    index('idx_package_tags_tag').on(table.tagId),
  ],
);

export const trustedUsers = pgTable('trusted_users', {
  userId: uuid('user_id').primaryKey(),
  grantedBy: uuid('granted_by'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export const scopes = pgTable(
  'scopes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    description: text('description'),
    ownerId: uuid('owner_id').notNull(),
    scopeType: text('scope_type').notNull(), // 'email' | 'custom'
    archiveS3Key: text('archive_s3_key'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_scopes_name').on(table.name),
    index('idx_scopes_owner').on(table.ownerId),
  ],
);

export const scopeMembers = pgTable(
  'scope_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scopeId: uuid('scope_id')
      .notNull()
      .references(() => scopes.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    role: text('role').notNull(), // 'admin' | 'contributor'
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('unique_scope_member').on(table.scopeId, table.userId),
    index('idx_scope_members_user').on(table.userId),
  ],
);

export const scopeInvitations = pgTable(
  'scope_invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scopeId: uuid('scope_id')
      .notNull()
      .references(() => scopes.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role').notNull(), // 'admin' | 'contributor'
    invitedBy: uuid('invited_by').notNull(),
    status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'declined' | 'revoked'
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_scope_invitations_scope').on(table.scopeId),
    index('idx_scope_invitations_email').on(table.email),
  ],
);

export const scopeFiles = pgTable(
  'scope_files',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scopeId: uuid('scope_id')
      .notNull()
      .references(() => scopes.id, { onDelete: 'cascade' }),
    path: text('path').notNull(),
    size: integer('size').notNull(),
    checksum: text('checksum').notNull(),
    s3Key: text('s3_key').notNull(),
  },
  (table) => [
    unique('unique_scope_file_path').on(table.scopeId, table.path),
    index('idx_scope_files_scope').on(table.scopeId),
  ],
);

export const scopeRequests = pgTable(
  'scope_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scopeName: text('scope_name').notNull(),
    requestedBy: uuid('requested_by').notNull(),
    reason: text('reason').notNull(),
    status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
    reviewedBy: uuid('reviewed_by'),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    index('idx_scope_requests_status').on(table.status),
    index('idx_scope_requests_user').on(table.requestedBy),
    index('idx_scope_requests_name').on(table.scopeName),
  ],
);

