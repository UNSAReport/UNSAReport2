import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config } from '@/config';
import { globalErrorHandler } from '@/middleware/error-handler';
import orgsRouter from '@/routes/orgs';
import presentationsRouter from '@/routes/presentations';
import type { HonoEnv } from '@/types';

const app = new Hono<HonoEnv>();

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return '*';
      if (
        config.allowedOrigins.includes('*') ||
        config.allowedOrigins.includes(origin)
      ) {
        return origin;
      }
      return undefined;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.onError(globalErrorHandler);

app.route('/presentations', presentationsRouter);
app.route('/orgs', orgsRouter);

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'unsareport-slides',
    timestamp: new Date().toISOString(),
    endpoints: app.routes
      .filter((r) => r.path !== '/health' && r.method !== 'ALL')
      .map((r) => `${r.method} ${r.path}`),
  });
});

export default {
  port: config.port,
  fetch: app.fetch,
};
