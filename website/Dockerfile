# syntax=docker/dockerfile:1
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
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/website/apps/website/node_modules ./website/apps/website/node_modules
COPY package.json bun.lock website/tsconfig.json website/biome.json ./
COPY website/apps ./website/apps
COPY website/packages ./website/packages
RUN bun --filter @unsa/website build

FROM base AS production-deps
COPY package.json bun.lock ./
COPY auth/package.json ./auth/package.json
COPY registry/package.json ./registry/package.json
COPY website/apps/website/package.json ./website/apps/website/package.json
COPY website/packages/api/package.json ./website/packages/api/package.json
COPY website/packages/schemas/package.json ./website/packages/schemas/package.json
COPY website/packages/config/package.json ./website/packages/config/package.json
RUN bun install --frozen-lockfile --production && bun pm cache rm

FROM base AS release
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=production-deps /app/website/apps/website/node_modules ./website/apps/website/node_modules
COPY --from=build /app/website/apps/website/dist ./dist
COPY --from=build /app/website/apps/website/package.json ./package.json
RUN cp -RL ./website/apps/website/node_modules/* ./node_modules/ 2>/dev/null || true; \
    mkdir -p ./node_modules/.bin && cp -RL ./website/apps/website/node_modules/.bin/* ./node_modules/.bin/ 2>/dev/null || true; \
    cp -RL ./node_modules/.bun/*/node_modules/* ./node_modules/ 2>/dev/null || true; \
    chown -R bun:bun /app
USER bun
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["bun", "./dist/server/server.js"]
