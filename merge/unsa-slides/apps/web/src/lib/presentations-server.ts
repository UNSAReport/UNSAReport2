import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader } from "@tanstack/react-start/server";
import { db } from "@unsa-slides/db/client";
import { organizations, orgMembers } from "@unsa-slides/db/schema/orgs";
import {
  presentations,
  presentationVersions,
} from "@unsa-slides/db/schema/presentations";
import {
  type CliDeployRequest,
  CliDeployRequestSchema,
  type CliDeployResponse,
} from "@unsa-slides/schemas/cli-api";
import { and, eq } from "drizzle-orm";
import { SESSION_COOKIE_NAME } from "@/lib/auth-shared";
import { verifyApiToken } from "@/lib/cli-auth-server";
import { serverEnv } from "@/lib/env";
import { validateSession } from "./auth-server";

export async function authenticateDeployer(
  authHeader?: string | null,
  cookieSessionId?: string | null,
): Promise<{ id: string; email: string; name: string } | null> {
  if (authHeader) {
    const verified = await verifyApiToken(authHeader);
    if (verified) return verified;
  }

  if (cookieSessionId) {
    const session = await validateSession(cookieSessionId);
    if (session) {
      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      };
    }
  }

  return null;
}

export async function deployPresentation(
  payload: CliDeployRequest,
  user: { id: string; email: string; name: string },
): Promise<CliDeployResponse> {
  let ownerType: "user" | "organization" = "user";
  let ownerId = user.id;

  if (payload.orgSlug) {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, payload.orgSlug))
      .limit(1);

    if (!org) {
      throw new Error(`Organization with slug "${payload.orgSlug}" not found.`);
    }

    const [membership] = await db
      .select()
      .from(orgMembers)
      .where(and(eq(orgMembers.orgId, org.id), eq(orgMembers.userId, user.id)))
      .limit(1);

    if (!membership || membership.role === "viewer") {
      throw new Error(
        `You do not have permission to deploy presentations to organization "${org.name}".`,
      );
    }

    ownerType = "organization";
    ownerId = org.id;
  }

  // Check if presentation exists
  const [existing] = await db
    .select()
    .from(presentations)
    .where(
      and(
        eq(presentations.ownerType, ownerType),
        eq(presentations.ownerId, ownerId),
        eq(presentations.slug, payload.slug),
      ),
    )
    .limit(1);

  let presentationId: string;
  let nextVersion: number;
  const presentationUrl = `${serverEnv.BASE_URL}/p/${payload.slug}`;

  if (existing) {
    presentationId = existing.id;
    nextVersion = existing.activeVersion + 1;

    await db
      .update(presentations)
      .set({
        title: payload.title,
        description: payload.description || existing.description,
        visibility: payload.visibility || existing.visibility,
        activeVersion: nextVersion,
        updatedAt: new Date(),
      })
      .where(eq(presentations.id, presentationId));
  } else {
    presentationId = crypto.randomUUID();
    nextVersion = 1;

    await db.insert(presentations).values({
      id: presentationId,
      slug: payload.slug,
      title: payload.title,
      description: payload.description,
      ownerType,
      ownerId,
      visibility: payload.visibility || "private",
      activeVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Save version snapshot
  const versionId = crypto.randomUUID();
  await db.insert(presentationVersions).values({
    id: versionId,
    presentationId,
    versionNumber: nextVersion,
    entrypointUrl: `/p/${payload.slug}`,
    manifestJson: JSON.stringify(payload.manifest),
    deployedBy: user.id,
    deployedAt: new Date(),
  });

  return {
    success: true,
    presentationId,
    slug: payload.slug,
    version: nextVersion,
    url: presentationUrl,
    message: `Successfully deployed version v${nextVersion} of "${payload.title}"`,
  };
}

export const deployPresentationServerFn = createServerFn({ method: "POST" })
  .validator((data: CliDeployRequest) => CliDeployRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const authHeader = getRequestHeader("authorization");
    const cookieSessionId = getCookie(SESSION_COOKIE_NAME);

    const user = await authenticateDeployer(authHeader, cookieSessionId);
    if (!user) {
      throw new Error(
        "Unauthorized. Please provide a valid API token or sign in.",
      );
    }

    return deployPresentation(data, user);
  });
