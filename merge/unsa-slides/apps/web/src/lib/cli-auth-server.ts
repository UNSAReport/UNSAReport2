import { createServerFn } from "@tanstack/react-start";
import { db } from "@unsa-slides/db/client";
import { apiTokens, deviceCodes } from "@unsa-slides/db/schema/tokens";
import { users } from "@unsa-slides/db/schema/users";
import type {
  CliLoginExchangeResponse,
  CliLoginInitResponse,
} from "@unsa-slides/schemas/cli-api";
import { and, eq, gt } from "drizzle-orm";
import { fetchCurrentUser } from "@/lib/auth-server";
import { serverEnv } from "@/lib/env";

function generateUserCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += "-";
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createDeviceCode(): Promise<CliLoginInitResponse> {
  const deviceCode = crypto.randomUUID();
  const userCode = generateUserCode();
  const expiresIn = 600; // 10 minutes
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  await db.insert(deviceCodes).values({
    id: crypto.randomUUID(),
    deviceCode,
    userCode,
    status: "pending",
    expiresAt,
    createdAt: new Date(),
  });

  return {
    deviceCode,
    userCode,
    verificationUri: `${serverEnv.BASE_URL}/device`,
    expiresIn,
    interval: 3,
  };
}

export async function authorizeDeviceCode(
  userCode: string,
  userId: string,
): Promise<{ success: boolean; message: string }> {
  const cleanCode = userCode.trim().toUpperCase();

  const [device] = await db
    .select()
    .from(deviceCodes)
    .where(
      and(
        eq(deviceCodes.userCode, cleanCode),
        gt(deviceCodes.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!device) {
    return {
      success: false,
      message: "Invalid or expired authorization code.",
    };
  }

  if (device.status === "authorized") {
    return { success: true, message: "Code already authorized." };
  }

  await db
    .update(deviceCodes)
    .set({
      userId,
      status: "authorized",
    })
    .where(eq(deviceCodes.id, device.id));

  return { success: true, message: "CLI successfully authorized!" };
}

export async function exchangeDeviceCode(
  deviceCode: string,
): Promise<CliLoginExchangeResponse | null> {
  const [device] = await db
    .select()
    .from(deviceCodes)
    .where(
      and(
        eq(deviceCodes.deviceCode, deviceCode),
        eq(deviceCodes.status, "authorized"),
        gt(deviceCodes.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!device?.userId) {
    return null;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, device.userId))
    .limit(1);

  if (!user) {
    return null;
  }

  const token = `unsa_${crypto.randomUUID().replace(/-/g, "")}`;
  const tokenId = crypto.randomUUID();

  await db.insert(apiTokens).values({
    id: tokenId,
    userId: user.id,
    name: `CLI (${new Date().toLocaleDateString()})`,
    tokenHash: token,
    createdAt: new Date(),
  });

  // Mark device code as expired/used
  await db
    .update(deviceCodes)
    .set({ status: "expired" })
    .where(eq(deviceCodes.id, device.id));

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

export async function verifyApiToken(
  token: string,
): Promise<{ id: string; email: string; name: string } | null> {
  const cleanToken = token.replace(/^Bearer\s+/i, "").trim();

  const result = await db
    .select({
      token: apiTokens,
      user: users,
    })
    .from(apiTokens)
    .innerJoin(users, eq(apiTokens.userId, users.id))
    .where(eq(apiTokens.tokenHash, cleanToken))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const { token: apiToken, user } = result[0];

  if (apiToken.expiresAt && apiToken.expiresAt.getTime() < Date.now()) {
    return null;
  }

  await db
    .update(apiTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiTokens.id, apiToken.id));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

// Server functions for frontend & device route
export const getDeviceCodeInfoServerFn = createServerFn({ method: "GET" })
  .validator((data: { userCode: string }) => data)
  .handler(async ({ data }) => {
    const cleanCode = data.userCode.trim().toUpperCase();
    const [device] = await db
      .select()
      .from(deviceCodes)
      .where(
        and(
          eq(deviceCodes.userCode, cleanCode),
          gt(deviceCodes.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!device) return null;
    return {
      id: device.id,
      userCode: device.userCode,
      status: device.status,
    };
  });

export const authorizeDeviceServerFn = createServerFn({ method: "POST" })
  .validator((data: { userCode: string }) => data)
  .handler(async ({ data }) => {
    const user = await fetchCurrentUser();
    if (!user) {
      return {
        success: false,
        message: "You must be signed in to authorize the CLI.",
      };
    }
    return authorizeDeviceCode(data.userCode, user.id);
  });

export const createDeviceCodeServerFn = createServerFn({
  method: "POST",
}).handler(async () => {
  return createDeviceCode();
});

export const exchangeDeviceCodeServerFn = createServerFn({ method: "POST" })
  .validator((data: { deviceCode: string }) => data)
  .handler(async ({ data }) => {
    return exchangeDeviceCode(data.deviceCode);
  });

export const verifyApiTokenServerFn = createServerFn({ method: "GET" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    return verifyApiToken(data.token);
  });
