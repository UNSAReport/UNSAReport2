import { db } from "@unsa-slides/db/client";
import { users } from "@unsa-slides/db/schema/users";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  createUserToken,
  listUserTokens,
  revokeUserToken,
} from "@/lib/tokens-server";

describe("API Tokens Management", () => {
  it("should create, list, and revoke an API token", async () => {
    // Setup test user
    const testUserId = `test-user-tokens-${Date.now()}`;
    const [testUser] = await db
      .insert(users)
      .values({
        id: testUserId,
        email: `tokens-${Date.now()}@unsa.edu.pe`,
        name: "Tokens Tester",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // 1. Create Token
    const created = await createUserToken(testUser.id, {
      name: "CI Pipeline Deployer",
      expiresInDays: 30,
    });

    expect(created.name).toBe("CI Pipeline Deployer");
    expect(created.token).toMatch(/^unsa_/);

    // 2. List Tokens
    const list = await listUserTokens(testUser.id);
    expect(list.length).toBeGreaterThanOrEqual(1);
    const found = list.find((t) => t.id === created.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("CI Pipeline Deployer");
    expect(found?.tokenMasked).toContain("••••••••••••");

    // 3. Revoke Token
    const revokeRes = await revokeUserToken(testUser.id, created.id);
    expect(revokeRes.success).toBe(true);

    const listAfter = await listUserTokens(testUser.id);
    expect(listAfter.find((t) => t.id === created.id)).toBeUndefined();

    // Clean up
    await db.delete(users).where(eq(users.id, testUser.id));
  });
});
