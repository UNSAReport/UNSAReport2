import { Hono } from 'hono';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { createPAT, listUserPATs, revokePAT } from '@/lib/tokens';
import { authMiddleware } from '@/middleware/auth';

const patRouter = new Hono();

patRouter.use('*', authMiddleware);

patRouter.post('/', async (c) => {
  const user = c.get('user');
  let body: { name?: unknown; scopes?: unknown; expires_at?: unknown };
  try {
    body = await c.req.json();
  } catch {
    throw new ValidationError('Invalid JSON body');
  }
  const { name, scopes, expires_at } = body;

  if (!name || typeof name !== 'string') {
    throw new ValidationError('Field "name" is required');
  }

  if (
    scopes !== undefined &&
    (!Array.isArray(scopes) || scopes.some((s) => typeof s !== 'string'))
  ) {
    throw new ValidationError('Field "scopes" must be an array of strings');
  }

  let expiresAtDate: Date | undefined;
  if (expires_at) {
    expiresAtDate = new Date(expires_at as string);
    if (Number.isNaN(expiresAtDate.getTime())) {
      throw new ValidationError('Invalid "expires_at" date format');
    }
  }

  const { token, pat } = await createPAT(
    user.id,
    name,
    Array.isArray(scopes) ? (scopes as string[]) : [],
    expiresAtDate,
  );

  return c.json(
    {
      token,
      pat: {
        id: pat.id,
        name: pat.name,
        scopes: pat.scopes,
        createdAt: pat.createdAt,
        expiresAt: pat.expiresAt,
      },
    },
    201,
  );
});

patRouter.get('/', async (c) => {
  const user = c.get('user');
  const pats = await listUserPATs(user.id);
  return c.json({ pats });
});

patRouter.delete('/:id', async (c) => {
  const user = c.get('user');
  const patId = c.req.param('id');

  const success = await revokePAT(user.id, patId);
  if (!success) {
    throw new NotFoundError('PAT not found or already revoked');
  }

  return c.json({ success: true, message: 'PAT revoked successfully' });
});

export { patRouter };
