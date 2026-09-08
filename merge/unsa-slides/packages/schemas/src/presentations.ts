import { z } from "zod";

export const PresentationVisibilitySchema = z.enum([
  "private",
  "org",
  "public",
  "unlisted",
]);
export type PresentationVisibility = z.infer<
  typeof PresentationVisibilitySchema
>;

export const PresentationOwnerTypeSchema = z.enum(["user", "organization"]);
export type PresentationOwnerType = z.infer<typeof PresentationOwnerTypeSchema>;

export const PresentationSchema = z.object({
  id: z.string().uuid(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  ownerType: PresentationOwnerTypeSchema,
  ownerId: z.string().uuid(),
  visibility: PresentationVisibilitySchema.default("private"),
  activeVersion: z.number().int().nonnegative().default(1),
  thumbnailUrl: z.string().url().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Presentation = z.infer<typeof PresentationSchema>;

export const PresentationVersionSchema = z.object({
  id: z.string().uuid(),
  presentationId: z.string().uuid(),
  versionNumber: z.number().int().positive(),
  entrypointUrl: z.string(),
  manifest: z.record(z.string(), z.unknown()),
  deployedBy: z.string().uuid(),
  deployedAt: z.date(),
});

export type PresentationVersion = z.infer<typeof PresentationVersionSchema>;

export const CreatePresentationSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional(),
  orgId: z.string().uuid().optional(),
  visibility: PresentationVisibilitySchema.default("private"),
});

export type CreatePresentationInput = z.infer<typeof CreatePresentationSchema>;
