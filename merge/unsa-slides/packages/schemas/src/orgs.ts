import { z } from "zod";

export const OrgRoleSchema = z.enum(["owner", "admin", "member", "viewer"]);
export type OrgRole = z.infer<typeof OrgRoleSchema>;

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must only contain lowercase alphanumeric characters and hyphens",
    ),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  ownerId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

export const OrgMemberSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  userId: z.string().uuid(),
  role: OrgRoleSchema,
  createdAt: z.date(),
});

export type OrgMember = z.infer<typeof OrgMemberSchema>;

export const CreateOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
});

export type CreateOrgInput = z.infer<typeof CreateOrgSchema>;

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: OrgRoleSchema.default("member"),
});

export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
