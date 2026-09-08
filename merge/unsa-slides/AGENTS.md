# AGENTS.md

## Project overview

UNSA Slides is a cloud slides management platform and CLI ecosystem built as a Bun monorepo.
- **apps/web**: Cloud slide manager with dashboard, presenter/audience mode, organization sharing, Google OAuth, and slide ingestion API. Built with TanStack Start, React 19, Vite, Tailwind CSS v4, and Biome.
- **apps/cli**: Developer CLI for slide authoring, project scaffolding (`slides init`), local dev preview (`slides dev`), authentication (`slides login`), and cloud publishing (`slides deploy`). Powered by Bun and `@clack/prompts`.
- **packages/schemas**: Zod validation schemas and types for manifests, domain entities, and CLI-cloud API contracts.
- **packages/db**: Drizzle ORM database layer (libSQL/SQLite), migrations, and schema definitions.
- **packages/config**: Shared TypeScript configuration presets.

## Commands

- `bun run dev` / `bun run dev:web` - start web dev server on port 3000
- `bun run dev:cli` - run CLI in development
- `bun run build` - build all workspaces
- `bun run typecheck` - typecheck all workspaces with TypeScript
- `bun run lint:format` - auto-format with Biome
- `bun run lint:check` - lint + format check with Biome (write mode)

## Monorepo Architecture

```
.
├── apps/
│   ├── web/                        # TanStack Start web platform
│   │   ├── src/
│   │   │   ├── routes/             # File-based routes
│   │   │   ├── shared/             # Slide and UI components
│   │   │   └── lib/                # Config and runtime utilities
│   │   ├── vite.config.ts
│   │   └── package.json            # @unsa-slides/web
│   │
│   └── cli/                        # Bun-native developer CLI
│       ├── src/
│       │   ├── commands/           # init, dev, login, link, deploy
│       │   ├── templates/          # Slide starter templates
│       │   └── cli.ts              # Commander entrypoint
│       └── package.json            # @unsa-slides/cli
│
├── packages/
│   ├── schemas/                    # Shared Zod schemas (auth, orgs, presentations, manifest, cli-api)
│   │   └── package.json            # @unsa-slides/schemas
│   ├── db/                         # Drizzle ORM schema & client
│   │   └── package.json            # @unsa-slides/db
│   └── config/                     # Shared tsconfigs
│       └── package.json            # @unsa-slides/config
│
├── biome.json                      # Workspace linter & formatter configuration
├── package.json                    # Workspace root
└── tsconfig.json                   # Solution tsconfig
```

## Key Guidelines & Rules

- **No Barrel Files**: Do not use `index.ts` files that just `export *`. Submodules are exported directly via `package.json` exports (e.g. `@unsa-slides/schemas/manifest`, `@unsa-slides/db/schema/users`).
- **Aliases over Relative Imports**:
  - Intra-package imports use `@/*` alias (e.g. `@/lib/config`).
  - Cross-package imports use package name alias (e.g. `@unsa-slides/schemas/manifest`, `@unsa-slides/db/client`).
  - Do not use relative imports (`../` or `../../`).
- **Direct Bun APIs**: Utilize `Bun.file()`, `Bun.write()`, `Bun.serve()`, `Bun.env` directly in CLI and scripts.
- **TanStack Start**: Route tree is auto-generated at `apps/web/src/routeTree.gen.ts` — do not manually edit or format it.
- **Biome**: Linter and formatter for the entire monorepo.
