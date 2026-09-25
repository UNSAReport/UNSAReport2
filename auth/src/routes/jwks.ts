import { JWKS_CACHE_SECONDS } from '@unsa/schemas/constants';
import { Hono } from 'hono';
import { getAllActivePublicKeys } from '@/lib/keys';

const jwksRouter = new Hono();
jwksRouter.get('/.well-known/jwks.json', async (c) => {
  const keys = await getAllActivePublicKeys();
  return c.json({ keys }, 200, {
    'Cache-Control': `public, max-age=${JWKS_CACHE_SECONDS}`,
  });
});

export { jwksRouter };
