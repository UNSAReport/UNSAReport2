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
