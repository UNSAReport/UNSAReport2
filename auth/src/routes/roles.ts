import { and, desc, eq, ilike, inArray, or } from 'drizzle-orm';
import type { Context, MiddlewareHandler } from 'hono';
import { Hono } from 'hono';
import { config } from '@/config';
import { db } from '@/db/index';
import { userRoles, users } from '@/db/schema';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { authMiddleware } from '@/middleware/auth';
import type { Role } from '@/types';

const MAX_USERS_SEARCH_LIMIT = 50;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const rolesRouter = new Hono();

const rolesAuthMiddleware: MiddlewareHandler = async (c, next) => {
  const adminHeader = c.req.header('X-Admin-Key');
  if (adminHeader) {
    if (adminHeader !== config.adminApiKey) {
      throw new ForbiddenError('Invalid admin API key');
    }
    c.set('isSuperAdmin', true);
    c.set('roles', {});
    await next();
    return;
  }
  return authMiddleware(c, next);
};

function authorizeAdminForSubApp(c: Context, subApp: string): boolean {
  if (c.get('isSuperAdmin')) {
    return true;
  }
  const roles = c.get('roles') || {};
  return roles[subApp] === 'admin';
}

function hasAnyAdminRole(c: Context): boolean {
  if (c.get('isSuperAdmin')) {
    return true;
  }
  const roles = c.get('roles') || {};
  return Object.values(roles).includes('admin');
}

rolesRouter.get('/me', rolesAuthMiddleware, (c) => {
  const roles = c.get('roles') || {};
  return c.json({ roles });
});

rolesRouter.get('/user/:userId', rolesAuthMiddleware, async (c) => {
  const targetUserId = c.req.param('userId');
  const currentUser = c.get('user');

  const isSelf = currentUser && currentUser.id === targetUserId;
  const isAuthorized = isSelf || hasAnyAdminRole(c);

  if (!isAuthorized) {
    throw new ForbiddenError('Requires admin role');
  }

  const rows = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, targetUserId));

  return c.json({ userId: targetUserId, roles: rows });
});

rolesRouter.get('/users', rolesAuthMiddleware, async (c) => {
  if (!hasAnyAdminRole(c)) {
    throw new ForbiddenError('Requires admin role');
  }

  const query = (c.req.query('q') ?? c.req.query('search'))?.trim();

  let userRows: (typeof users.$inferSelect)[];

  if (query && query.length > 0) {
    if (UUID_REGEX.test(query)) {
      userRows = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.id, query),
            ilike(users.email, `%${query}%`),
            ilike(users.name, `%${query}%`),
          ),
        )
        .orderBy(desc(users.createdAt))
        .limit(MAX_USERS_SEARCH_LIMIT);
    } else {
      userRows = await db
        .select()
        .from(users)
        .where(
          or(ilike(users.email, `%${query}%`), ilike(users.name, `%${query}%`)),
        )
        .orderBy(desc(users.createdAt))
        .limit(MAX_USERS_SEARCH_LIMIT);
    }
  } else {
    userRows = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(MAX_USERS_SEARCH_LIMIT);
  }

  const userIds = userRows.map((u) => u.id);
  const roleRows =
    userIds.length > 0
      ? await db
          .select()
          .from(userRoles)
          .where(inArray(userRoles.userId, userIds))
      : [];

  const rolesByUserId = new Map<string, typeof roleRows>();
  for (const r of roleRows) {
    const existing = rolesByUserId.get(r.userId) || [];
    existing.push(r);
    rolesByUserId.set(r.userId, existing);
  }

  return c.json({
    users: userRows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      picture: u.picture,
      createdAt: u.createdAt,
      roles: rolesByUserId.get(u.id) || [],
    })),
  });
});

rolesRouter.get('/:subApp', rolesAuthMiddleware, async (c) => {
  const subApp = c.req.param('subApp');

  if (!authorizeAdminForSubApp(c, subApp)) {
    throw new ForbiddenError('Requires admin role');
  }

  const rows = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.subApp, subApp));

  return c.json({ subApp, roles: rows });
});

rolesRouter.post('/', rolesAuthMiddleware, async (c) => {
  let body: { userId?: unknown; subApp?: unknown; role?: unknown };
  try {
    body = await c.req.json();
  } catch {
    throw new ValidationError('Invalid JSON body');
  }

  const { userId, subApp, role } = body;

  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('userId is required');
  }

  if (!subApp || typeof subApp !== 'string' || subApp.trim() === '') {
    throw new ValidationError('subApp must be a non-empty string');
  }

  if (role !== 'user' && role !== 'admin') {
    throw new ValidationError('role must be "user" or "admin"');
  }

  if (!authorizeAdminForSubApp(c, subApp)) {
    throw new ForbiddenError('Requires admin role');
  }

  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!targetUser) {
    throw new NotFoundError('User non-existent');
  }

  const [userRole] = await db
    .insert(userRoles)
    .values({ userId, subApp, role: role as Role })
    .onConflictDoUpdate({
      target: [userRoles.userId, userRoles.subApp],
      set: { role: role as Role, updatedAt: new Date() },
    })
    .returning();

  return c.json({ success: true, role: userRole });
});

rolesRouter.delete('/', rolesAuthMiddleware, async (c) => {
  let body: { userId?: unknown; subApp?: unknown };
  try {
    body = await c.req.json();
  } catch {
    throw new ValidationError('Invalid JSON body');
  }

  const { userId, subApp } = body;

  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('userId is required');
  }

  if (!subApp || typeof subApp !== 'string' || subApp.trim() === '') {
    throw new ValidationError('subApp must be a non-empty string');
  }

  if (!authorizeAdminForSubApp(c, subApp)) {
    throw new ForbiddenError('Requires admin role');
  }

  const deleted = await db
    .delete(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.subApp, subApp)))
    .returning();

  if (deleted.length === 0) {
    throw new NotFoundError('Role assignment not found');
  }

  return c.json({ success: true, message: 'Role revoked successfully' });
});

export { rolesRouter };
