import path from 'node:path';
// biome-ignore lint/style/noRestrictedImports: dist/server/server.js is built dynamically
import server from './dist/server/server.js';

const DEFAULT_PORT = 3000;
const CLIENT_DIR = path.resolve(import.meta.dir, 'dist/client');
const ASSETS_PATH_PREFIX = '/assets/';
const ASSET_CACHE_CONTROL = 'public, max-age=31536000, immutable';

const configuredPort = process.env.PORT;
const parsedPort = configuredPort ? Number(configuredPort) : DEFAULT_PORT;
const PORT =
  Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_PORT;

Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = decodeURIComponent(url.pathname);

    // Proxy /api/slides/* to the slides service (gateway path in prod,
    // direct service URL locally). Strips the prefix like traefik does.
    if (pathname === '/api/slides' || pathname.startsWith('/api/slides/')) {
      const targetBase = (
        process.env.SLIDES_URL || 'http://localhost:3002'
      ).replace(/\/$/, '');
      const stripped = pathname.replace(/^\/api\/slides/, '') || '/';
      const target = new URL(stripped + url.search, targetBase);
      const headers = new Headers(req.headers);
      headers.delete('host');
      const init: RequestInit = {
        method: req.method,
        headers,
        redirect: 'manual',
      };
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        init.body = req.body;
        // @ts-expect-error Bun supports duplex streaming
        init.duplex = 'half';
      }
      return fetch(target, init);
    }

    const safeRelativePath = path
      .normalize(pathname)
      .replace(/^(\.\.[/\\])+/, '');
    const absoluteFilePath = path.join(CLIENT_DIR, safeRelativePath);

    const isWithinClientDir = absoluteFilePath.startsWith(CLIENT_DIR);
    if (isWithinClientDir) {
      const file = Bun.file(absoluteFilePath);
      const exists = await file.exists();

      if (exists) {
        const headers = new Headers();
        if (pathname.startsWith(ASSETS_PATH_PREFIX)) {
          headers.set('Cache-Control', ASSET_CACHE_CONTROL);
        }
        return new Response(file, { headers });
      }
    }

    return server.fetch(req);
  },
});
