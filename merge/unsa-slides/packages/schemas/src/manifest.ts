import { z } from "zod";

export const SlideTransitionSchema = z.enum([
  "none",
  "fade",
  "slide",
  "convex",
  "concave",
  "zoom",
]);
export type SlideTransition = z.infer<typeof SlideTransitionSchema>;

export const SlideDeckConfigSchema = z.object({
  width: z.number().default(1280),
  height: z.number().default(720),
  margin: z.number().default(0.04),
  theme: z.string().default("black"),
  transition: SlideTransitionSchema.default("slide"),
  controls: z.boolean().default(true),
  progress: z.boolean().default(true),
  center: z.boolean().default(false),
  hash: z.boolean().default(true),
  autoSlide: z.number().default(0),
  loop: z.boolean().default(false),
});

export type SlideDeckConfig = z.infer<typeof SlideDeckConfigSchema>;

export const SlideMetaSchema = z.object({
  id: z.string(),
  index: z.number().int().nonnegative(),
  title: z.string().optional(),
  notes: z.string().optional(),
});

export type SlideMeta = z.infer<typeof SlideMetaSchema>;

export const SlideManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().default("1.0.0"),
  title: z.string().min(1),
  description: z.string().optional(),
  config: SlideDeckConfigSchema.default({
    width: 1280,
    height: 720,
    margin: 0.04,
    theme: "black",
    transition: "slide",
    controls: true,
    progress: true,
    center: false,
    hash: true,
    autoSlide: 0,
    loop: false,
  }),
  slides: z.array(SlideMetaSchema).default([]),
  entrypoint: z.string().default("index.js"),
  assets: z.array(z.string()).default([]),
  createdAt: z.string().datetime().optional(),
});

export type SlideManifest = z.infer<typeof SlideManifestSchema>;
