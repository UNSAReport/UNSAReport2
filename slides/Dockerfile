# syntax=docker/dockerfile:1
# Context: monorepo root. Build with: docker build -f slides/Dockerfile .
FROM oven/bun:1-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
COPY slides/package.json ./slides/package.json
COPY web/packages/api/package.json ./web/packages/api/package.json
COPY web/packages/schemas/package.json ./web/packages/schemas/package.json
COPY web/packages/config/package.json ./web/packages/config/package.json
RUN bun install --frozen-lockfile --filter @unsa/slides

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/slides ./slides
COPY --from=deps /app/web/packages ./web/packages
COPY package.json bun.lock ./
COPY slides ./slides
COPY web/packages ./web/packages
WORKDIR /app/slides
RUN bun build --target=bun --minify --outdir=./dist ./src/index.ts ./src/db/migrate.ts

FROM base AS production-deps
COPY package.json bun.lock ./
COPY slides/package.json ./slides/package.json
COPY web/packages/api/package.json ./web/packages/api/package.json
COPY web/packages/schemas/package.json ./web/packages/schemas/package.json
COPY web/packages/config/package.json ./web/packages/config/package.json
RUN bun install --frozen-lockfile --production --filter @unsa/slides && bun pm cache rm

FROM base AS release
ENV NODE_ENV=production
ENV PORT=3002
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=production-deps /app/slides ./slides
COPY --from=build /app/slides/dist ./dist
COPY package.json ./
COPY slides/src/db/migrations ./src/db/migrations
COPY slides/drizzle.config.ts ./
COPY slides/docker/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
RUN chown -R bun:bun /app
USER bun
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||3002)+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["bun", "./dist/index.js"]
