# syntax=docker/dockerfile:1
FROM oven/bun:1-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
COPY apps/website/package.json ./apps/website/package.json
COPY packages/api/package.json ./packages/api/package.json
COPY packages/schemas/package.json ./packages/schemas/package.json
COPY packages/config/package.json ./packages/config/package.json
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/website/node_modules ./apps/website/node_modules
COPY package.json bun.lock tsconfig.json biome.json ./
COPY apps ./apps
COPY packages ./packages
RUN bun --filter @unsa/website build

FROM base AS production-deps
COPY package.json bun.lock ./
COPY apps/website/package.json ./apps/website/package.json
COPY packages/api/package.json ./packages/api/package.json
COPY packages/schemas/package.json ./packages/schemas/package.json
COPY packages/config/package.json ./packages/config/package.json
RUN bun install --frozen-lockfile --production && bun pm cache rm

FROM base AS release
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=production-deps /app/apps/website/node_modules ./apps/website/node_modules
COPY --from=build /app/apps/website/dist ./dist
COPY --from=build /app/apps/website/package.json ./package.json
RUN cp -RL ./apps/website/node_modules/* ./node_modules/ 2>/dev/null || true; \
    mkdir -p ./node_modules/.bin && cp -RL ./apps/website/node_modules/.bin/* ./node_modules/.bin/ 2>/dev/null || true; \
    cp -RL ./node_modules/.bun/*/node_modules/* ./node_modules/ 2>/dev/null || true; \
    chown -R bun:bun /app
USER bun
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["bun", "./dist/server/server.js"]
