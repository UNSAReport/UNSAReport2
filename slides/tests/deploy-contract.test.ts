import { describe, expect, it } from 'bun:test';
import {
  CliDeployRequestSchema,
  CliDeployResponseSchema,
} from '@unsa/schemas/cli-api';
import { SlideManifestSchema } from '@unsa/schemas/manifest';

const validManifest = {
  name: 'demo',
  title: 'Demo',
  slides: [{ id: 'intro', index: 0, title: 'Intro' }],
};

describe('Slides deploy contract', () => {
  it('accepts a complete deploy payload', () => {
    const parsed = CliDeployRequestSchema.safeParse({
      slug: 'demo-deck',
      title: 'Demo Deck',
      visibility: 'private',
      manifest: validManifest,
      bundle: 'ZQ==',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects slugs outside [a-z0-9-]{2,100}', () => {
    for (const slug of ['X', 'UPPER', 'has space', 'a']) {
      const parsed = CliDeployRequestSchema.safeParse({
        slug,
        title: 'T',
        manifest: validManifest,
        bundle: 'eA==',
      });
      expect(parsed.success).toBe(false);
    }
  });

  it('rejects manifests missing name or title, and defaults slides', () => {
    expect(
      SlideManifestSchema.safeParse({ title: 'T', slides: [] }).success,
    ).toBe(false);
    expect(
      SlideManifestSchema.safeParse({ name: 'n', slides: [] }).success,
    ).toBe(false);
    const parsed = SlideManifestSchema.safeParse({ name: 'n', title: 'T' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.slides).toEqual([]);
    }
  });

  it('rejects slide entries missing id', () => {
    expect(
      SlideManifestSchema.safeParse({
        name: 'n',
        title: 'T',
        slides: [{ index: 0 }],
      }).success,
    ).toBe(false);
  });

  it('deploy response carries version and viewer url', () => {
    const parsed = CliDeployResponseSchema.safeParse({
      success: true,
      presentationId: 'a41d9440-eca6-4812-8521-dea0ded5c033',
      slug: 'demo-deck',
      version: 2,
      url: 'http://localhost:9876/p/demo-deck',
      message: 'ok',
    });
    expect(parsed.success).toBe(true);
  });
});
