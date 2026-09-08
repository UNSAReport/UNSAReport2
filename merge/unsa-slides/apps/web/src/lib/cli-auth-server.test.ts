import { db } from "@unsa-slides/db/client";
import { apiTokens, deviceCodes } from "@unsa-slides/db/schema/tokens";
import { users } from "@unsa-slides/db/schema/users";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  authorizeDeviceCode,
  createDeviceCode,
  exchangeDeviceCode,
  verifyApiToken,
} from "@/lib/cli-auth-server";

describe("CLI Device Authorization Flow", () => {
  it("should complete the device code request, authorize, exchange, and verify token flow", async () => {
    // Setup test user
    const testUserId = `test-user-device-${Date.now()}`;
    const [testUser] = await db
      .insert(users)
      .values({
        id: testUserId,
        email: `device-${Date.now()}@unsa.edu.pe`,
        name: "Device Tester",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // 1. Create Device Code
    const init = await createDeviceCode();
    expect(init.deviceCode).toBeDefined();
    expect(init.userCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(init.verificationUri).toContain("/device");

    // 2. Poll before authorization should return null
    const earlyExchange = await exchangeDeviceCode(init.deviceCode);
    expect(earlyExchange).toBeNull();

    // 3. User authorizes device code in browser
    const authRes = await authorizeDeviceCode(init.userCode, testUser.id);
    expect(authRes.success).toBe(true);

    // 4. Poll after authorization should return token & user profile
    const exchangeRes = await exchangeDeviceCode(init.deviceCode);
    expect(exchangeRes).not.toBeNull();
    expect(exchangeRes?.token).toMatch(/^unsa_/);
    expect(exchangeRes?.user.id).toBe(testUser.id);
    expect(exchangeRes?.user.email).toBe(testUser.email);

    // 5. Verify the issued API Token
    if (exchangeRes?.token) {
      const verified = await verifyApiToken(exchangeRes.token);
      expect(verified).not.toBeNull();
      expect(verified?.id).toBe(testUser.id);
      expect(verified?.name).toBe(testUser.name);

      await db
        .delete(apiTokens)
        .where(eq(apiTokens.tokenHash, exchangeRes.token));
    }

    // Clean up
    await db
      .delete(deviceCodes)
      .where(eq(deviceCodes.deviceCode, init.deviceCode));
    await db.delete(users).where(eq(users.id, testUser.id));
  });
});
