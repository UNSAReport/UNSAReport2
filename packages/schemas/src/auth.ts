import { z } from "zod";

export const RoleSchema = z.enum(["user", "admin"]);
export type Role = z.infer<typeof RoleSchema>;

export const UserPayloadSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  picture: z.string().nullable().optional(),
  roles: z.record(z.string(), RoleSchema).optional(),
});
export type UserPayload = z.infer<typeof UserPayloadSchema>;

export const AccessTokenClaimsSchema = UserPayloadSchema.extend({
  roles: z.record(z.string(), RoleSchema),
  iss: z.string(),
  iat: z.number(),
  exp: z.number(),
  jti: z.string(),
  type: z.literal("access"),
});
export type AccessTokenClaims = z.infer<typeof AccessTokenClaimsSchema>;

export const AuthUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  picture: z.string().nullable(),
  createdAt: z.coerce.date().nullable().optional(),
  updatedAt: z.coerce.date().nullable().optional(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const PatSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  scopes: z.array(z.string()).default([]),
  createdAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  lastUsedAt: z.coerce.date().nullable().optional(),
});
export type Pat = z.infer<typeof PatSchema>;

export const CreatePatResponseSchema = z.object({
  token: z.string().startsWith("unsareport_pat_"),
  pat: PatSchema,
});
export type CreatePatResponse = z.infer<typeof CreatePatResponseSchema>;
