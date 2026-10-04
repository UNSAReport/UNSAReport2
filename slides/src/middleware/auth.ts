import type { MiddlewareHandler } from 'hono';
import { stripBearer, verifyCredential } from '@/lib/auth';
import {
  AppError,
  ForbiddenError,
  UnauthorizedError,
} from '@/middleware/error-handler';
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
    if (err instanceof Error && err.name === 'AuthUpstreamError') {
      throw new AppError(
        err.message || 'Authentication service unavailable',
        503,
      );
    }
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new UnauthorizedError(errorMessage || 'Invalid authentication token');
  }

  await next();
};
// Note: /embed routes intentionally skip the slides-role gates below.
// checkAccess in routes/embed.ts authorizes by presentation visibility
// (public/unlisted open; private/org via ownership or org membership),
// never by slides role, so viewer tokens can still read permitted embeds.

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

// Write gate: only 'editor' or 'admin' slides roles may deploy or mutate
// presentations. Viewers keep read access (GET routes, embeds), so this
// middleware is attached per-route on POST /deploy, PATCH /:id, and
// DELETE /:id rather than globally.
export const requireSlidesEditor: MiddlewareHandler<HonoEnv> = async (
  c,
  next,
) => {
  const user = c.get('user');
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }

  const role = user.roles.slides;
  if (role !== 'editor' && role !== 'admin') {
    throw new ForbiddenError(
      "Requires an 'editor' or 'admin' slides role to modify presentations",
    );
  }

  await next();
};
