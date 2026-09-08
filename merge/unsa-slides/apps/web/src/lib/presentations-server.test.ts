import { db } from "@unsa-slides/db/client";
import {
  presentations,
  presentationVersions,
} from "@unsa-slides/db/schema/presentations";
import { users } from "@unsa-slides/db/schema/users";
import { SlideManifestSchema } from "@unsa-slides/schemas/manifest";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { deployPresentation } from "@/lib/presentations-server";

describe("Presentations Ingestion & Versioning", () => {
  it("should create a new presentation with version 1 and increment to version 2 on redeploy", async () => {
    // Setup test user
    const testUserId = `test-user-${Date.now()}`;
    const [testUser] = await db
      .insert(users)
      .values({
        id: testUserId,
        email: `test-${Date.now()}@unsa.edu.pe`,
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const testSlug = `talk-${Date.now()}`;

    // 1. Initial Deploy (Version 1)
    const deploy1 = await deployPresentation(
      {
        slug: testSlug,
        title: "Test Presentation v1",
        description: "Initial description",
        visibility: "public",
        manifest: SlideManifestSchema.parse({
          name: testSlug,
          title: "Test Presentation v1",
          slides: [{ id: "1", index: 0, title: "Intro" }],
        }),
        bundle: "mock-bundle-v1",
      },
      testUser,
    );

    expect(deploy1.success).toBe(true);
    expect(deploy1.version).toBe(1);
    expect(deploy1.slug).toBe(testSlug);

    // Verify DB state for v1
    const [saved1] = await db
      .select()
      .from(presentations)
      .where(eq(presentations.id, deploy1.presentationId))
      .limit(1);

    expect(saved1).toBeDefined();
    expect(saved1.activeVersion).toBe(1);
    expect(saved1.title).toBe("Test Presentation v1");

    // 2. Redeploy (Version 2)
    const deploy2 = await deployPresentation(
      {
        slug: testSlug,
        title: "Test Presentation v2 (Updated)",
        description: "Updated description",
        visibility: "public",
        manifest: SlideManifestSchema.parse({
          name: testSlug,
          title: "Test Presentation v2 (Updated)",
          slides: [
            { id: "1", index: 0, title: "Intro" },
            { id: "2", index: 1, title: "Slide 2" },
          ],
        }),
        bundle: "mock-bundle-v2",
      },
      testUser,
    );

    expect(deploy2.success).toBe(true);
    expect(deploy2.presentationId).toBe(deploy1.presentationId);
    expect(deploy2.version).toBe(2);

    // Verify DB state for v2
    const [saved2] = await db
      .select()
      .from(presentations)
      .where(eq(presentations.id, deploy1.presentationId))
      .limit(1);

    expect(saved2.activeVersion).toBe(2);
    expect(saved2.title).toBe("Test Presentation v2 (Updated)");

    // Verify both versions exist in presentation_versions table
    const versions = await db
      .select()
      .from(presentationVersions)
      .where(eq(presentationVersions.presentationId, deploy1.presentationId));

    expect(versions).toHaveLength(2);
    const versionNumbers = versions.map((v) => v.versionNumber).sort();
    expect(versionNumbers).toEqual([1, 2]);

    // Clean up
    await db
      .delete(presentations)
      .where(eq(presentations.id, deploy1.presentationId));
    await db.delete(users).where(eq(users.id, testUser.id));
  });
});
