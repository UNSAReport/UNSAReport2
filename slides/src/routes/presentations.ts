import {
  CliDeployRequestSchema,
  type CliDeployResponse,
} from '@unsa/schemas/cli-api';
import { PresentationVisibilitySchema } from '@unsa/schemas/presentations';
import { and, eq, inArray } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { config } from '@/config';
import { db } from '@/db/index';
import {
  organizations,
  orgMembers,
  presentations,
  presentationVersions,
} from '@/db/schema';
import { requireAuth, requireSlidesRole } from '@/middleware/auth';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/middleware/error-handler';
import type { HonoEnv } from '@/types';

const presentationsRouter = new Hono<HonoEnv>();

presentationsRouter.use('*', requireAuth, requireSlidesRole);

/**
 * Resolves the deploy target owner from the request payload: the deploying
 * user, or an organization (by slug) the user belongs to with a non-viewer role.
 */
async function resolveOwner(
  userId: string,
  orgSlug: string | undefined,
): Promise<{ ownerType: 'user' | 'organization'; ownerId: string }> {
  if (!orgSlug) {
    return { ownerType: 'user', ownerId: userId };
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, orgSlug))
    .limit(1);

  if (!org) {
    throw new NotFoundError(`Organization with slug "${orgSlug}" not found`);
  }

  const [membership] = await db
    .select()
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, org.id), eq(orgMembers.userId, userId)))
    .limit(1);

  if (!membership || membership.role === 'viewer') {
    throw new ForbiddenError(
      `You do not have permission to deploy presentations to organization "${org.name}"`,
    );
  }

  return { ownerType: 'organization', ownerId: org.id };
}

/**
 * Deploys a slide bundle: validates the manifest, upserts the presentation
 * slot, and records a new immutable version snapshot.
 */
presentationsRouter.post('/deploy', async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const parsed = CliDeployRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }
  const payload = parsed.data;

  const { ownerType, ownerId } = await resolveOwner(
    user?.id || '',
    payload.orgSlug,
  );

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
  const presentationUrl = `${config.baseUrl}/p/${payload.slug}`;

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
    const [created] = await db
      .insert(presentations)
      .values({
        slug: payload.slug,
        title: payload.title,
        description: payload.description,
        ownerType,
        ownerId,
        visibility: payload.visibility || 'private',
        activeVersion: 1,
      })
      .returning({ id: presentations.id });
    if (!created) {
      throw new ValidationError('Failed to create presentation');
    }
    presentationId = created.id;
    nextVersion = 1;
  }

  await db.insert(presentationVersions).values({
    presentationId,
    versionNumber: nextVersion,
    entrypointUrl: `/p/${payload.slug}`,
    manifest: payload.manifest as Record<string, unknown>,
    deployedBy: user?.id || '',
  });

  const response: CliDeployResponse = {
    success: true,
    presentationId,
    slug: payload.slug,
    version: nextVersion,
    url: presentationUrl,
    message: `Successfully deployed version v${nextVersion} of "${payload.title}"`,
  };
  return c.json(response);
});

/**
 * Lists presentations visible to the caller: own slots plus slots of
 * organizations the caller belongs to.
 */
presentationsRouter.get('/', async (c) => {
  const user = c.get('user');
  const userId = user?.id || '';

  const own = await db
    .select()
    .from(presentations)
    .where(
      and(
        eq(presentations.ownerType, 'user'),
        eq(presentations.ownerId, userId),
      ),
    );

  const memberships = await db
    .select({ orgId: orgMembers.orgId })
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId));

  let orgSlots: typeof own = [];
  if (memberships.length > 0) {
    const orgIds = memberships.map((m) => m.orgId);
    orgSlots = await db
      .select()
      .from(presentations)
      .where(
        and(
          eq(presentations.ownerType, 'organization'),
          inArray(presentations.ownerId, orgIds),
        ),
      );
  }

  return c.json({ presentations: [...own, ...orgSlots] });
});

/**
 * Returns one presentation with its versions, enforcing visibility:
 * owners and org members always; public/unlisted slots for any caller.
 */
presentationsRouter.get('/:id', async (c) => {
  const user = c.get('user');
  const userId = user?.id || '';
  const id = c.req.param('id');

  const [presentation] = await db
    .select()
    .from(presentations)
    .where(eq(presentations.id, id))
    .limit(1);

  if (!presentation) {
    throw new NotFoundError('Presentation not found');
  }

  let allowed = false;
  if (presentation.ownerType === 'user' && presentation.ownerId === userId) {
    allowed = true;
  } else if (presentation.ownerType === 'organization') {
    const [membership] = await db
      .select()
      .from(orgMembers)
      .where(
        and(
          eq(orgMembers.orgId, presentation.ownerId),
          eq(orgMembers.userId, userId),
        ),
      )
      .limit(1);
    if (membership) {
      allowed = true;
    }
  }
  if (
    !allowed &&
    (presentation.visibility === 'public' ||
      presentation.visibility === 'unlisted')
  ) {
    allowed = true;
  }
  if (!allowed) {
    throw new NotFoundError('Presentation not found');
  }

  const versions = await db
    .select()
    .from(presentationVersions)
    .where(eq(presentationVersions.presentationId, id));

  return c.json({ presentation, versions });
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  visibility: PresentationVisibilitySchema.optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
});

/**
 * Updates presentation metadata. Allowed for the owning user or org
 * owner/admin members.
 */
presentationsRouter.patch('/:id', async (c) => {
  const user = c.get('user');
  const userId = user?.id || '';
  const id = c.req.param('id');

  const [presentation] = await db
    .select()
    .from(presentations)
    .where(eq(presentations.id, id))
    .limit(1);

  if (!presentation) {
    throw new NotFoundError('Presentation not found');
  }

  await assertCanManage(userId, presentation.ownerType, presentation.ownerId);

  const body = await c.req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }
  const data = parsed.data;

  await db
    .update(presentations)
    .set({
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.visibility !== undefined ? { visibility: data.visibility } : {}),
      ...(data.thumbnailUrl ? { thumbnailUrl: data.thumbnailUrl } : {}),
      updatedAt: new Date(),
    })
    .where(eq(presentations.id, id));

  const [updated] = await db
    .select()
    .from(presentations)
    .where(eq(presentations.id, id))
    .limit(1);

  return c.json({ presentation: updated });
});

/**
 * Deletes a presentation and all its versions (cascade). Same permission as update.
 */
presentationsRouter.delete('/:id', async (c) => {
  const user = c.get('user');
  const userId = user?.id || '';
  const id = c.req.param('id');

  const [presentation] = await db
    .select()
    .from(presentations)
    .where(eq(presentations.id, id))
    .limit(1);

  if (!presentation) {
    throw new NotFoundError('Presentation not found');
  }

  await assertCanManage(userId, presentation.ownerType, presentation.ownerId);

  await db.delete(presentations).where(eq(presentations.id, id));

  return c.json({ success: true, message: 'Presentation deleted' });
});

/**
 * Throws unless the user owns the slot (user-owned) or holds an
 * owner/admin membership (org-owned).
 */
async function assertCanManage(
  userId: string,
  ownerType: string,
  ownerId: string,
): Promise<void> {
  if (ownerType === 'user') {
    if (ownerId !== userId) {
      throw new ForbiddenError(
        'Only the owning user can manage this presentation',
      );
    }
    return;
  }

  const [membership] = await db
    .select()
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, ownerId), eq(orgMembers.userId, userId)))
    .limit(1);

  if (
    !membership ||
    (membership.role !== 'owner' && membership.role !== 'admin')
  ) {
    throw new ForbiddenError(
      'Only organization owners or admins can manage this presentation',
    );
  }
}

export default presentationsRouter;
