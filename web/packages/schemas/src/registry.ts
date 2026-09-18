import { z } from 'zod';

export const PkgTomlCommandSchema = z.object({
  description: z.string().min(1),
  commands: z.array(z.string().min(1)).min(1),
  default_select: z.boolean().default(false),
});
export type PkgTomlCommand = z.infer<typeof PkgTomlCommandSchema>;

export const PkgTomlConfigSchemaEntrySchema = z.object({
  type: z.enum(['string', 'bool', 'int', 'path', 'path-list']),
  required: z.boolean().default(false),
  default: z.unknown().optional(),
  doc: z.string().optional(),
});
export type PkgTomlConfigSchemaEntry = z.infer<
  typeof PkgTomlConfigSchemaEntrySchema
>;

export const PkgTomlSchema = z.object({
  package: z.object({
    name: z
      .string()
      .min(3)
      .max(64)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Invalid package name'),
    version: z.string().regex(/^\d+\.\d+\.\d+/, 'Invalid semver'),
    entrypoint: z.string().min(1),
    description: z.string().max(2048).optional(),
    displayName: z.string().min(1).max(128).optional(),
    tags: z.array(z.string()).optional(),
    command_prefix: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'Invalid command prefix')
      .optional(),
  }),
  components: z.object({
    files: z.array(z.string().min(1)).min(1),
    depends_on: z.array(z.string().min(1)).default([]),
  }),
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
export type PkgToml = z.infer<typeof PkgTomlSchema>;

export const JWTPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  roles: z.array(z.string()).optional(),
  iss: z.string().optional(),
  aud: z.union([z.string(), z.array(z.string())]).optional(),
  exp: z.number().optional(),
  iat: z.number().optional(),
});
export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

export const UserContextSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  roles: z.array(z.string()),
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
  archiveUrl: z.string().url().nullable().optional(),
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
  // registry API may return flat list shape
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
  details: z.record(z.string(), z.unknown()).optional(),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
