import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

function aliasResolverPlugin(): Plugin {
  const slidesKitSrc = fileURLToPath(
    new URL('../../packages/slides-kit/src', import.meta.url),
  );
  const appSrc = fileURLToPath(new URL('./src', import.meta.url));

  return {
    name: 'alias-resolver',
    enforce: 'pre',
    resolveId(id, importer) {
      if (id.startsWith('@/')) {
        const subpath = id.slice(2);
        if (importer?.includes('packages/slides-kit')) {
          const resolved = path.join(slidesKitSrc, subpath);
          return this.resolve(resolved, importer, { skipSelf: true });
        }
        const resolved = path.join(appSrc, subpath);
        return this.resolve(resolved, importer, { skipSelf: true });
      }
      return null;
    },
  };
}

const slidesTarget = (
  process.env.SLIDES_URL || 'http://localhost:3002'
).replace(/\/api\/slides\/?$/, '');

export default defineConfig({
  base: '/',
  server: {
    host: true,
    port: 3100,
    proxy: {
      '/api/slides': {
        target: slidesTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/slides/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const cookie = (req.headers?.cookie as string | undefined) ?? '';
            const match = cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
            const token = match ? decodeURIComponent(match[1]) : '';
            if (token && !proxyReq.hasHeader('authorization')) {
              proxyReq.setHeader('authorization', `Bearer ${token}`);
            }
          });
        },
      },
    },
  },
  plugins: [aliasResolverPlugin(), tailwindcss(), tanstackStart(), react()],
});
