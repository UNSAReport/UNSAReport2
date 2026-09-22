import { createLogger } from '@unsa/logger';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config } from '@/config';
import {
  globalErrorHandler,
  notFoundHandler,
  setErrorReporter,
} from '@/lib/errors';
import { getOrGenerateActiveKey } from '@/lib/keys';
import { authRouter } from '@/routes/auth';
import { jwksRouter } from '@/routes/jwks';
import { keysRouter } from '@/routes/keys';
import { patRouter } from '@/routes/pat';
import { rolesRouter } from '@/routes/roles';

const logger = createLogger('auth');

setErrorReporter((err, info) => {
  const message = err instanceof Error ? err.message : 'Request error';
  if (info.statusCode >= 500) {
    logger.error(message, {
      err,
      path: info.path,
      statusCode: info.statusCode,
    });
  } else {
    logger.warn(message, { path: info.path, statusCode: info.statusCode });
  }
});

const app = new Hono();

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) {
        return '*';
      }
      if (
        config.idpAllowedOrigins.includes(origin) ||
        config.idpAllowedOrigins.includes('*')
      ) {
        return origin;
      }
      return undefined;
    },
    allowHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
);

getOrGenerateActiveKey().catch((err) => {
  logger.error('Failed to initialize active signing key', { err });
});

const v1 = new Hono();
v1.route('/', authRouter);
v1.route('/pat', patRouter);
v1.route('/roles', rolesRouter);
v1.route('/keys', keysRouter);

app.route('/v1', v1);
app.route('/', jwksRouter);

app.get('/', (c) =>
  c.json({
    name: 'UNSAReport Identity Provider (IDP)',
    status: 'online',
    issuer: config.idpIssuer,
    endpoints: app.routes
      .filter((r) => r.path !== '/' && r.method !== 'ALL')
      .map((r) => `${r.method} ${r.path}`),
  }),
);

app.notFound(notFoundHandler);

app.onError(globalErrorHandler);

export default {
  port: config.idpPort,
  fetch: app.fetch,
};
