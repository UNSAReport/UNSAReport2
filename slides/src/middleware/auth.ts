import type { MiddlewareHandler } from 'hono';
import { verifyCredential } from '@/lib/auth';
import { ForbiddenError, UnauthorizedError } from '@/middleware/error-handler';
import type { HonoEnv } from '@/types';

/**
 * Middleware handler that enforces authentication via Bearer IdP JWT or IdP PAT
 * in the Authorization header. Sets the authenticated user context on Hono
 * environment variables.
 *
 * @param c - Hono context object.
 * @param next - Next middleware continuation callback.
 */
export const requireAuth: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    throw new UnauthorizedError('Token not provided');
  }

  try {
    const user = await verifyCredential(token);
    c.set('user', user);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new UnauthorizedError(errorMessage || 'Invalid authentication token');
  }

  await next();
};

/**
 * Middleware handler that enforces that the authenticated user holds any role
 * for the `slides` sub-app (provisioned via the IdP roles flow). Org-level
 * permissions (owner/admin/member/viewer) are checked per-route against the
 * slides database.
 *
 * @param c - Hono context object.
 * @param next - Next middleware continuation callback.
 */
export const requireSlidesRole: MiddlewareHandler<HonoEnv> = async (
  c,
  next,
) => {
  const user = c.get('user');
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (!user.roles.slides) {
    throw new ForbiddenError(
      "No 'slides' role assigned for this user (provisioned via the IdP)",
    );
  }

  await next();
};
