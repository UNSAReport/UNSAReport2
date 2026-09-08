import { SlideManifestSchema } from "@unsa-slides/schemas/manifest";
import { PresentationVisibilitySchema } from "@unsa-slides/schemas/presentations";
import { z } from "zod";

export const CliLoginInitResponseSchema = z.object({
  deviceCode: z.string(),
  userCode: z.string(),
  verificationUri: z.string().url(),
  expiresIn: z.number(),
  interval: z.number().default(5),
});

export type CliLoginInitResponse = z.infer<typeof CliLoginInitResponseSchema>;

export const CliLoginExchangeRequestSchema = z.object({
  deviceCode: z.string(),
});

export type CliLoginExchangeRequest = z.infer<
  typeof CliLoginExchangeRequestSchema
>;

export const CliLoginExchangeResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
  }),
});

export type CliLoginExchangeResponse = z.infer<
  typeof CliLoginExchangeResponseSchema
>;

export const CliDeployRequestSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  orgSlug: z.string().optional(),
  visibility: PresentationVisibilitySchema.default("private"),
  manifest: SlideManifestSchema,
  bundle: z.string().describe("Base64 or bundle artifact string"),
});

export type CliDeployRequest = z.infer<typeof CliDeployRequestSchema>;

export const CliDeployResponseSchema = z.object({
  success: z.boolean(),
  presentationId: z.string().uuid(),
  slug: z.string(),
  version: z.number(),
  url: z.string().url(),
  message: z.string(),
});

export type CliDeployResponse = z.infer<typeof CliDeployResponseSchema>;

export const ApiErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
