import { SlideManifestSchema } from '@unsa/schemas/manifest';
import { PresentationVisibilitySchema } from '@unsa/schemas/presentations';
import { z } from 'zod';

export const CliDeployRequestSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  orgSlug: z.string().optional(),
  visibility: PresentationVisibilitySchema.default('private'),
  manifest: SlideManifestSchema,
  bundle: z.string().describe('Base64 or bundle artifact string'),
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

export {
  type ApiErrorResponse,
  ApiErrorResponseSchema,
} from '@unsa/schemas/registry';
