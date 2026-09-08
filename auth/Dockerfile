# syntax=docker/dockerfile:1
# Context: monorepo root. Build with: docker build -f auth/Dockerfile .
FROM oven/bun:1-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
COPY auth/package.json ./auth/package.json
COPY registry/package.json ./registry/package.json
COPY website/apps/website/package.json ./website/apps/website/package.json
COPY website/packages/api/package.json ./website/packages/api/package.json
COPY website/packages/schemas/package.json ./website/packages/schemas/package.json
COPY website/packages/config/package.json ./website/packages/config/package.json
RUN bun install --frozen-lockfile --filter @unsa/auth

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/auth ./auth
COPY package.json bun.lock ./
COPY auth ./auth
COPY website/packages ./website/packages
WORKDIR /app/auth
RUN bun build --target=bun --minify --outdir=./dist ./src/index.ts ./src/db/migrate.ts

FROM base AS production-deps
COPY package.json bun.lock ./
COPY auth/package.json ./auth/package.json
COPY registry/package.json ./registry/package.json
COPY website/apps/website/package.json ./website/apps/website/package.json
COPY website/packages/api/package.json ./website/packages/api/package.json
COPY website/packages/schemas/package.json ./website/packages/schemas/package.json
COPY website/packages/config/package.json ./website/packages/config/package.json
RUN bun install --frozen-lockfile --production --filter @unsa/auth && bun pm cache rm

FROM base AS release
ENV NODE_ENV=production
ENV IDP_PORT=3000
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=production-deps /app/auth ./auth
COPY --from=build /app/auth/dist ./dist
COPY package.json ./
COPY auth/src/db/migrations ./src/db/migrations
COPY auth/drizzle.config.ts ./
COPY auth/docker/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
RUN chown -R bun:bun /app
USER bun

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.IDP_PORT||3000)+'/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["bun", "./dist/index.js"]
