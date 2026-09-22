import { z } from 'zod';

export const PkgTomlCommandCommandsSchema = z
  .object({
    any: z.array(z.string().min(1)).default([]),
    linux: z.array(z.string().min(1)).default([]),
    windows: z.array(z.string().min(1)).default([]),
    macos: z.array(z.string().min(1)).default([]),
  })
  .strict()
  .refine(
    (commands) =>
      commands.any.length +
        commands.linux.length +
        commands.windows.length +
        commands.macos.length >=
      1,
    { message: 'Command "commands" must define at least one shell line' },
  );
export type PkgTomlCommandCommands = z.infer<
  typeof PkgTomlCommandCommandsSchema
>;
export const PkgTomlCommandSchema = z.object({
  description: z.string().min(1),
  commands: PkgTomlCommandCommandsSchema,
});

export const PkgTomlConfigSchemaEntrySchema = z.object({
  type: z.enum(['string', 'bool', 'int', 'path', 'path-list']),
  required: z.boolean().default(false),
  default: z.unknown().optional(),
  doc: z.string().optional(),
});
export type PkgTomlConfigSchemaEntry = z.infer<
  typeof PkgTomlConfigSchemaEntrySchema
>;

export const ProjectSchema = z.object({
  config_version: z.literal(1),
  typst_entry: z.string().optional(),
});
export type ProjectDef = z.infer<typeof ProjectSchema>;

export const ScopeSchema = z.object({
  name: z
    .string()
    .regex(
      /^@[a-z0-9][a-z0-9._~-]*$/,
      'Invalid scope name (must match @scope)',
    ),
  description: z.string().optional(),
  files: z.array(z.string().min(1)),
});
export type ScopeDef = z.infer<typeof ScopeSchema>;

export const UnsareportTomlSchema = z.object({
  project: ProjectSchema,
  scope: ScopeSchema.optional(),
  package: z
    .object({
      name: z
        .string()
        .min(3)
        .max(64)
        .regex(
          /^@[a-z0-9][a-z0-9._~-]*\/[a-z0-9][a-z0-9._~-]*$/,
          'Package name must be scoped (@scope/name)',
        ),
      version: z.string().regex(/^\d+\.\d+\.\d+/, 'Invalid semver'),
      description: z.string().max(2048).optional(),
      displayName: z.string().min(1).max(128).optional(),
      tags: z.array(z.string()).optional(),
      command_prefix: z
        .string()
        .regex(/^[a-z0-9][a-z0-9._~-]*$/, 'Invalid command prefix')
        .optional(),
    })
    .optional(),
  dependencies: z.record(z.string(), z.string()).default({}),
  components: z
    .object({
      files: z.array(z.string().min(1)).min(1),
    })
    .optional(),
  templates: z
    .object({
      files: z.array(z.string().min(1)).default([]),
    })
    .default({ files: [] }),
  commands: z.record(z.string(), PkgTomlCommandSchema).default({}),
  'hooks-suggest': z.record(z.string(), z.array(z.string())).default({}),
  'config-schema': z
    .record(z.string(), PkgTomlConfigSchemaEntrySchema)
    .default({}),
});
export type UnsareportToml = z.infer<typeof UnsareportTomlSchema>;

export const PkgTomlSchema = UnsareportTomlSchema;
export type PkgToml = UnsareportToml;

export const JWTPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  roles: z.record(z.string(), z.string()).optional(),
  iss: z.string().optional(),
  aud: z.union([z.string(), z.array(z.string())]).optional(),
  exp: z.number().optional(),
  iat: z.number().optional(),
});
export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

export const UserContextSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  roles: z.record(z.string(), z.string()),
});
export type UserContext = z.infer<typeof UserContextSchema>;

export const ResolvedPackageSchema = z.object({
  name: z.string(),
  version: z.string(),
  archive_url: z.string().url(),
  files: z.array(z.string()),
});
export type ResolvedPackage = z.infer<typeof ResolvedPackageSchema>;

export const PackageVersionSchema = z.object({
  version: z.string(),
  pkgToml: PkgTomlSchema,
  archive_url: z.string().url().nullable().optional(),
  files: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
});
export type PackageVersion = z.infer<typeof PackageVersionSchema>;

export const PackageSchema = z.object({
  name: z.string(),
  displayName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  latestVersion: z.string().nullable().optional(),
  versions: z.array(PackageVersionSchema).optional(),
  version: z.string().optional(),
  pkgToml: PkgTomlSchema.optional(),
});
export type Package = z.infer<typeof PackageSchema>;

export const PackageListResponseSchema = z.object({
  packages: z.array(PackageSchema),
  total: z.number().optional(),
});
export type PackageListResponse = z.infer<typeof PackageListResponseSchema>;

export const ApiErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  statusCode: z.number(),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export const ScopeMemberRoleSchema = z.enum(['admin', 'contributor']);
export type ScopeMemberRole = z.infer<typeof ScopeMemberRoleSchema>;

export const ScopeTypeSchema = z.enum(['email', 'custom']);
export type ScopeType = z.infer<typeof ScopeTypeSchema>;

export const ScopeRequestStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export type ScopeRequestStatus = z.infer<typeof ScopeRequestStatusSchema>;

export const ScopeInvitationStatusSchema = z.enum(['pending', 'accepted', 'declined']);
export type ScopeInvitationStatus = z.infer<typeof ScopeInvitationStatusSchema>;

export const ScopeMemberSchema = z.object({
  userId: z.string(),
  role: ScopeMemberRoleSchema,
  createdAt: z.string().or(z.date()),
});
export type ScopeMember = z.infer<typeof ScopeMemberSchema>;

export const ScopeFileSchema = z.object({
  path: z.string(),
  size: z.number(),
  checksum: z.string(),
});
export type ScopeFile = z.infer<typeof ScopeFileSchema>;

export const ScopeItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  ownerId: z.string(),
  scopeType: ScopeTypeSchema,
  role: ScopeMemberRoleSchema.optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type ScopeItem = z.infer<typeof ScopeItemSchema>;

export const ScopeDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  ownerId: z.string(),
  scopeType: ScopeTypeSchema,
  hasArchive: z.boolean(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  members: z.array(ScopeMemberSchema),
  files: z.array(ScopeFileSchema),
});
export type ScopeDetail = z.infer<typeof ScopeDetailSchema>;

export const ScopeRequestItemSchema = z.object({
  id: z.string(),
  scopeName: z.string(),
  requestedBy: z.string(),
  reason: z.string(),
  status: ScopeRequestStatusSchema,
  rejectionReason: z.string().nullable().optional(),
  reviewedBy: z.string().nullable().optional(),
  reviewedAt: z.string().or(z.date()).nullable().optional(),
  createdAt: z.string().or(z.date()),
});
export type ScopeRequestItem = z.infer<typeof ScopeRequestItemSchema>;

export const ScopeInvitationItemSchema = z.object({
  id: z.string(),
  scopeId: z.string(),
  scopeName: z.string().optional(),
  email: z.string(),
  role: ScopeMemberRoleSchema,
  invitedBy: z.string().optional(),
  status: ScopeInvitationStatusSchema,
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()).optional(),
});
export type ScopeInvitationItem = z.infer<typeof ScopeInvitationItemSchema>;

