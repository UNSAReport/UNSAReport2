import { GoogleProfileSchema } from "@unsa-slides/schemas/auth";
import {
  CliDeployRequestSchema,
  CliDeployResponseSchema,
  CliLoginInitResponseSchema,
} from "@unsa-slides/schemas/cli-api";
import { SlideManifestSchema } from "@unsa-slides/schemas/manifest";
import { describe, expect, it } from "vitest";

describe("SlideManifestSchema", () => {
  it("should validate a complete valid manifest", () => {
    const validManifest = {
      name: "agentic-ai",
      title: "Introduction to Agentic AI",
      description: "A comprehensive overview of AI workflows",
      slides: [
        {
          id: "intro",
          index: 0,
          title: "Introduction",
          notes: "Introduce yourself and explain the agenda.",
        },
        {
          id: "architecture",
          index: 1,
          title: "Architecture",
        },
      ],
    };

    const parsed = SlideManifestSchema.safeParse(validManifest);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe("Introduction to Agentic AI");
      expect(parsed.data.slides).toHaveLength(2);
      expect(parsed.data.slides[0].id).toBe("intro");
    }
  });

  it("should reject manifest missing title or name", () => {
    const invalidManifest = {
      description: "Missing name and title",
    };

    const parsed = SlideManifestSchema.safeParse(invalidManifest);
    expect(parsed.success).toBe(false);
  });
});

describe("CliApi Schemas", () => {
  it("should validate CliLoginInitResponse", () => {
    const initData = {
      deviceCode: "dev-123",
      userCode: "ABCD-1234",
      verificationUri: "http://localhost:3000/device",
      expiresIn: 600,
      interval: 3,
    };

    const parsed = CliLoginInitResponseSchema.safeParse(initData);
    expect(parsed.success).toBe(true);
  });

  it("should validate CliDeployRequest and reject invalid slugs", () => {
    const validPayload = {
      slug: "my-valid-talk",
      title: "My Valid Talk",
      visibility: "public" as const,
      manifest: {
        name: "my-valid-talk",
        title: "My Valid Talk",
        slides: [{ id: "1", index: 0, title: "Slide 1" }],
      },
      bundle: "base64bundle",
    };

    expect(CliDeployRequestSchema.safeParse(validPayload).success).toBe(true);

    const invalidSlugPayload = {
      ...validPayload,
      slug: "Invalid Slug with spaces and CAPS!",
    };

    expect(CliDeployRequestSchema.safeParse(invalidSlugPayload).success).toBe(
      false,
    );
  });

  it("should validate CliDeployResponse", () => {
    const res = {
      success: true,
      presentationId: "3b7b2520-22c6-4b8c-851f-506fa3eb56b2",
      slug: "my-talk",
      version: 1,
      url: "http://localhost:3000/p/my-talk",
      message: "Deployed v1",
    };

    const parsed = CliDeployResponseSchema.safeParse(res);
    expect(parsed.success).toBe(true);
  });
});

describe("GoogleProfileSchema", () => {
  it("should validate Google profile response", () => {
    const profile = {
      id: "google-123456789",
      email: "user@unsa.edu.pe",
      verified_email: true,
      name: "Gusta Dev",
      picture: "https://example.com/avatar.png",
    };

    const parsed = GoogleProfileSchema.safeParse(profile);
    expect(parsed.success).toBe(true);
  });
});
