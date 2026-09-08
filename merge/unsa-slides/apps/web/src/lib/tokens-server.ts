import { createServerFn } from "@tanstack/react-start";
import { db } from "@unsa-slides/db/client";
import { apiTokens } from "@unsa-slides/db/schema/tokens";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { fetchCurrentUser } from "@/lib/auth-server";

export async function listUserTokens(userId: string) {
  const tokens = await db
    .select({
      id: apiTokens.id,
      name: apiTokens.name,
      lastUsedAt: apiTokens.lastUsedAt,
      createdAt: apiTokens.createdAt,
      expiresAt: apiTokens.expiresAt,
      tokenMasked: apiTokens.tokenHash,
    })
    .from(apiTokens)
    .where(eq(apiTokens.userId, userId))
    .orderBy(desc(apiTokens.createdAt));

  return tokens.map((t) => ({
    ...t,
    tokenMasked: `${t.tokenMasked.slice(0, 8)}••••••••••••${t.tokenMasked.slice(-4)}`,
  }));
}

export async function createUserToken(
  userId: string,
  data: { name: string; expiresInDays?: number },
) {
  const token = `unsa_${crypto.randomUUID().replace(/-/g, "")}`;
  const tokenId = crypto.randomUUID();

  const expiresAt = data.expiresInDays
    ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  await db.insert(apiTokens).values({
    id: tokenId,
    userId,
    name: data.name,
    tokenHash: token,
    expiresAt,
    createdAt: new Date(),
  });

  return {
    id: tokenId,
    name: data.name,
    token,
    expiresAt,
  };
}

export async function revokeUserToken(userId: string, tokenId: string) {
  await db
    .delete(apiTokens)
    .where(and(eq(apiTokens.id, tokenId), eq(apiTokens.userId, userId)));

  return { success: true };
}

export const listUserTokensServerFn = createServerFn({
  method: "GET",
}).handler(async () => {
  const user = await fetchCurrentUser();
  if (!user) {
    throw new Error("Unauthorized. Please sign in.");
  }
  return listUserTokens(user.id);
});

export const createUserTokenServerFn = createServerFn({ method: "POST" })
  .validator((data: { name: string; expiresInDays?: number }) =>
    z
      .object({
        name: z.string().min(1).max(50),
        expiresInDays: z.number().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await fetchCurrentUser();
    if (!user) {
      throw new Error("Unauthorized. Please sign in.");
    }
    return createUserToken(user.id, data);
  });

export const revokeUserTokenServerFn = createServerFn({ method: "POST" })
  .validator((data: { tokenId: string }) =>
    z
      .object({
        tokenId: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await fetchCurrentUser();
    if (!user) {
      throw new Error("Unauthorized. Please sign in.");
    }
    return revokeUserToken(user.id, data.tokenId);
  });
