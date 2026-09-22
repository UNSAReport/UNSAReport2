import { Hono } from 'hono';
import { config } from '@/config';
import { stripBearer } from '@/lib/bearer';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';
import { rotateKeys } from '@/lib/keys';

const keysRouter = new Hono();

keysRouter.post('/rotate', async (c) => {
  const authHeader = c.req.header('Authorization');
  const adminHeader = c.req.header('X-Admin-Key');

  let keyInput = adminHeader;
  if (!keyInput) {
    keyInput = stripBearer(authHeader) ?? undefined;
  }

  if (!keyInput) {
    throw new UnauthorizedError('Missing admin API key');
  }

  if (keyInput !== config.adminApiKey) {
    throw new ForbiddenError('Invalid admin API key');
  }

  const newKey = await rotateKeys();
  return c.json({
    success: true,
    message: 'Key rotated successfully',
    key: {
      kid: newKey.kid,
      algorithm: newKey.algorithm,
      createdAt: newKey.createdAt,
    },
  });
});

export { keysRouter };
