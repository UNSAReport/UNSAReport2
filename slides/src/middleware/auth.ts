import type { MiddlewareHandler } from 'hono';
import { stripBearer, verifyCredential } from '@/lib/auth';
import { ForbiddenError, UnauthorizedError } from '@/middleware/error-handler';
import type { HonoEnv } from '@/types';

export const requireAuth: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const token = stripBearer(c.req.header('Authorization'));
  if (!token) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
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
