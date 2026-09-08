import { CreateOrgSchema, OrgRoleSchema } from '@unsa/schemas/orgs';
import { and, eq, inArray } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '@/db/index';
import { organizations, orgMembers } from '@/db/schema';
import { requireAuth, requireSlidesRole } from '@/middleware/auth';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/middleware/error-handler';
import type { HonoEnv } from '@/types';

const orgsRouter = new Hono<HonoEnv>();

orgsRouter.use('*', requireAuth, requireSlidesRole);

const memberBodySchema = z.object({
  userId: z.string().uuid(),
  role: OrgRoleSchema.default('member'),
});

/**
 * Returns the caller's membership in the org, if any.
 */
async function getMembership(orgId: string, userId: string) {
  const [membership] = await db
    .select()
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)))
    .limit(1);
  return membership;
}

/**
 * Throws unless the user is an owner or admin of the org.
 */
async function assertOrgAdmin(orgId: string, userId: string): Promise<void> {
  const membership = await getMembership(orgId, userId);
  if (
    !membership ||
    (membership.role !== 'owner' && membership.role !== 'admin')
  ) {
    throw new ForbiddenError(
      'Only organization owners or admins can perform this action',
    );
  }
}

/**
 * Creates an organization; the creator becomes its owner member.
 */
orgsRouter.post('/', async (c) => {
  const user = c.get('user');
  const userId = user?.id || '';
  const body = await c.req.json().catch(() => ({}));
  const parsed = CreateOrgSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const [existing] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, parsed.data.slug))
    .limit(1);
  if (existing) {
    throw new ConflictError(
      `Organization with slug "${parsed.data.slug}" already exists`,
    );
  }

  const [org] = await db
    .insert(organizations)
    .values({
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description,
      ownerId: userId,
    })
    .returning();
  if (!org) {
    throw new ValidationError('Failed to create organization');
  }

  await db.insert(orgMembers).values({
    orgId: org.id,
    userId,
    role: 'owner',
  });

  return c.json({ organization: org }, 201);
});

/**
 * Lists organizations the caller belongs to.
 */
orgsRouter.get('/', async (c) => {
  const user = c.get('user');
  const userId = user?.id || '';

  const memberships = await db
    .select()
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId));

  if (memberships.length === 0) {
    return c.json({ organizations: [] });
  }

  const orgIds = memberships.map((m) => m.orgId);
  const orgs = await db
    .select()
    .from(organizations)
    .where(inArray(organizations.id, orgIds));

  const roleByOrg = Object.fromEntries(
    memberships.map((m) => [m.orgId, m.role]),
  );
  return c.json({
    organizations: orgs.map((o) => ({ ...o, role: roleByOrg[o.id] })),
  });
});

/**
 * Returns one organization with its members. Caller must be a member.
 */
orgsRouter.get('/:slug', async (c) => {
  const user = c.get('user');
  const userId = user?.id || '';
  const slug = c.req.param('slug');

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  if (!org) {
    throw new NotFoundError('Organization not found');
  }

  const membership = await getMembership(org.id, userId);
  if (!membership) {
    throw new NotFoundError('Organization not found');
  }

  const members = await db
    .select()
    .from(orgMembers)
    .where(eq(orgMembers.orgId, org.id));

  return c.json({ organization: org, members, role: membership.role });
});

/**
 * Updates organization details. Owner/admin only.
 */
orgsRouter.patch('/:slug', async (c) => {
  const user = c.get('user');
  const userId = user?.id || '';
  const slug = c.req.param('slug');

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  if (!org) {
    throw new NotFoundError('Organization not found');
  }

  await assertOrgAdmin(org.id, userId);

  const body = await c.req.json().catch(() => ({}));
  const parsed = z
    .object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).nullable().optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  await db
    .update(organizations)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(organizations.id, org.id));

  const [updated] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, org.id))
    .limit(1);

  return c.json({ organization: updated });
});

/**
 * Adds a member by IdP user id. Owner/admin only.
 */
orgsRouter.post('/:slug/members', async (c) => {
  const user = c.get('user');
  const userId = user?.id || '';
  const slug = c.req.param('slug');

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  if (!org) {
    throw new NotFoundError('Organization not found');
  }

  await assertOrgAdmin(org.id, userId);

  const body = await c.req.json().catch(() => ({}));
  const parsed = memberBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const [existing] = await db
    .select()
    .from(orgMembers)
    .where(
      and(
        eq(orgMembers.orgId, org.id),
        eq(orgMembers.userId, parsed.data.userId),
      ),
    )
    .limit(1);
  if (existing) {
    throw new ConflictError('User is already a member of this organization');
  }

  const [member] = await db
    .insert(orgMembers)
    .values({
      orgId: org.id,
      userId: parsed.data.userId,
      role: parsed.data.role,
    })
    .returning();

  return c.json({ member }, 201);
});

/**
 * Changes a member role. Owner/admin only.
 */
orgsRouter.patch('/:slug/members/:memberUserId', async (c) => {
  const user = c.get('user');
  const userId = user?.id || '';
  const slug = c.req.param('slug');
  const memberUserId = c.req.param('memberUserId');

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  if (!org) {
    throw new NotFoundError('Organization not found');
  }

  await assertOrgAdmin(org.id, userId);

  const body = await c.req.json().catch(() => ({}));
  const parsed = z.object({ role: OrgRoleSchema }).safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const [existing] = await db
    .select()
    .from(orgMembers)
    .where(
      and(eq(orgMembers.orgId, org.id), eq(orgMembers.userId, memberUserId)),
    )
    .limit(1);
  if (!existing) {
    throw new NotFoundError('Member not found');
  }

  const [member] = await db
    .update(orgMembers)
    .set({ role: parsed.data.role })
    .where(eq(orgMembers.id, existing.id))
    .returning();

  return c.json({ member });
});

/**
 * Removes a member. Owner/admin only, or the member themselves (leave).
 */
orgsRouter.delete('/:slug/members/:memberUserId', async (c) => {
  const user = c.get('user');
  const userId = user?.id || '';
  const slug = c.req.param('slug');
  const memberUserId = c.req.param('memberUserId');

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  if (!org) {
    throw new NotFoundError('Organization not found');
  }

  if (memberUserId !== userId) {
    await assertOrgAdmin(org.id, userId);
  } else {
    const membership = await getMembership(org.id, userId);
    if (!membership) {
      throw new NotFoundError('Member not found');
    }
    if (membership.role === 'owner') {
      throw new ForbiddenError(
        'Organization owners cannot leave; transfer ownership first',
      );
    }
  }

  await db
    .delete(orgMembers)
    .where(
      and(eq(orgMembers.orgId, org.id), eq(orgMembers.userId, memberUserId)),
    );

  return c.json({ success: true, message: 'Member removed' });
});

export default orgsRouter;
