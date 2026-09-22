import { createLogger } from '@unsa/logger';
import type { MiddlewareHandler } from 'hono';
import { stripBearer, verifyJWT } from '@/lib/auth';
import { ForbiddenError, UnauthorizedError } from '@/middleware/error-handler';
import type { HonoEnv } from '@/types';

const logger = createLogger('registry');

export const requireAuth: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const token = stripBearer(c.req.header('Authorization'));
  if (!token) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  try {
    const user = await verifyJWT(token);
    c.set('user', user);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new UnauthorizedError(errorMessage || 'Invalid authentication token');
  }

  await next();
};

export const optionalAuth: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const token = stripBearer(c.req.header('Authorization'));
  if (token) {
    try {
      const user = await verifyJWT(token);
      c.set('user', user);
    } catch (err) {
      logger.warn('Invalid token on optional auth route', {
        path: c.req.path,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
  await next();
};

export const requireRole = (
  subApp: string,
  role: string,
): MiddlewareHandler<HonoEnv> => {
  return async (c, next) => {
    const user = c.get('user');
    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (user.roles[subApp] !== role) {
      throw new ForbiddenError(`Role '${role}' required for this resource`);
    }

    await next();
  };
};
