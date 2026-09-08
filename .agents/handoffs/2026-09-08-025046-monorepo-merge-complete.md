# Handoff: Moon monorepo merge complete (UNSAReport2)

- Date (UTC): 2026-09-08 ~02:50
- Project dir: `/home/cricro/store/projects/UNSAReport2` (new monorepo, sibling of `/home/cricro/store/projects/UNSAReport`)
- Branch: `main`, HEAD: `d5cf821` (clean tree). Merge commit `bef2b80` below it.
- Source checkouts (untouched, still canonical upstreams): `/home/cricro/store/projects/UNSAReport/{tui,website,auth,registry}` (all on `dev`)
- Plan record: session-local `local://monorepo-merge-plan.md` (+ "Execution notes" appendix). Originals + skill scripts for handoff scaffolding were 0-byte placeholders, so this file is hand-written.
- Status: DONE. All 8 plan steps executed and verified. No remote configured for UNSAReport2 yet (nothing pushed).

## Current State Summary

`UNSAReport2/` holds `tui/ website/ auth/ registry/` (git-subtree imports with full history from each repo's `dev` branch) orchestrated by Moon 2.5.4 + proto (bun 1.3.13, go 1.26.6). Single bun workspace/lockfile, one `compose.dev.yml` (traefik 9876, postgres 5432/5433, minio 9000/9001), unified `ci.yml`. Last actions this session: committed merge (`bef2b80`), proved affected-detection with a probe commit (then reset), committed root `flake.lock` + restored system deps (`d5cf821`). Infra containers stopped; dev servers stopped; tree clean.

## How to work here (daily commands)

- `moon run infra-up` then `moon run auth:dev registry:dev website:dev` (or `bun run dev`). Root `moon.yml` also has a `dev` aggregator.
- `moon run :check` (full gate); CI runs `moon ci :build :test :typecheck :lint`.
- `moon run auth:db-migrate` / `registry:db-migrate` for native DB migrations.
- If the shell exports `CI=true` (this harness does; normal shells don't), moon filters `runInCI:false` tasks from `moon run` too — prefix dev/infra/db commands with `env -u CI`.

## Important Context (MUST know)

1. Traefik runs `network_mode: host` (entrypoint `:9876`), backends are `127.0.0.1:3000/3001/3100` in `traefik-dynamic.yml`. Bridge + `host.docker.internal` does NOT work here (container→host traffic filtered by host firewall; proven by timeout probes). Linux-only (noted in compose file).
2. Workspace root has explicit Moon id `root` (`root: '.'`, `defaultProject: root`). Service dev tasks dep on `root:infra-up` (single execution; parallel `compose up` races otherwise). `:task` scope in deps is invalid; `moon run :dev`-style fan-out runs in ALL projects — root `package.json` scripts use explicit targets.
3. `MOON_WORKSPACE_ROOT` must be referenced directly in task commands, never captured into an intermediate shell var (moon substitution quirk yields empty on assignment).
4. `typescript.syncProjectReferences: false` — moon's sync reformats tsconfigs into biome-dirty style and injects `references` that break plain `tsc --noEmit` (TS6305). Do not re-enable without handling that.
5. `auth:test` is `runInCI: false` (its E2E/roles suites fail identically in pristine source — need live OAuth). `auth:test` deps on `auth:db-migrate` (CI-enabled); CI moon job has a `postgres:16` service + `DATABASE_URL`. Registry/tui tests are green and gated.
6. `auth/.env.dev` overrides `DATABASE_URL` to the idp DB (root default is the registry DB). Dev wrappers source root env first, service env second. Root `.env.dev` is generated (`moon run decrypt`); service `.env.dev` files are committed mock defaults.
7. Dockerfiles build from repo root (`docker build -f <svc>/Dockerfile .`), filtered installs (`--filter @unsa/<svc>`), nested (non-flattened) build layout so bun resolution + `@/` alias keep working. All 3 images verified building.
8. `tui` Go code contains 12 lint fixes (unchecked closes, empty branch/case, unused field) — upstream failed identically; keep gate green, don't revert.
9. `auth/package.json` was named `registry` upstream (fixed to `@unsa/auth`); TS stays split (website 7.x, services 5.x); biome unified on 2.5.x; `auth`/`registry` import shared types from `@unsa/schemas` (type-only, runtime validation untouched).
10. Mystery note: root `flake.nix` lost 3 package lines and a `flake.lock` appeared at ~21:46 without a known actor (no `nix flake` command was run). Restored + committed. If it recurs, suspect an automated nix/direnv hook, not moon.

## Verification already done (don't redo blindly)

- `moon ci :build :test :typecheck :lint` 14/14 pass; `bun install --frozen-lockfile` byte-identical lockfile.
- Gateway probes: `/`→200, `/api/registry/health`→ok JSON, `/.well-known/jwks.json`→RSA JWKS, `/api/auth/`→200 (native servers + host-mode gateway).
- `moon run tui:build` + `unsarep version` + `whoami --json` → `not logged in` (auth shape, no conn-refused).
- Affected proof: auth-only change ran exactly `auth:build/lint/typecheck`, rest skipped.

## Immediate Next Steps (for the user, not yet done)

1. Revoke the real-looking `GOOGLE_CLIENT_SECRET` in source `tui/.env.dev` (gitignored, never imported — requires Google console; cannot be done from here).
2. Add a remote for UNSAReport2 and push (`main` has 5 commits: init + 4 subtree adds + merge + flake-lock).
3. Decide fate of source checkouts (`UNSAReport/{tui,website,auth,registry}`) — left untouched deliberately; also out of scope: `UNSAReport/ UNSASlides/ templates/ skills/`.
4. CI workflow (`ci.yml`) is written but has never run on GitHub (uses `moonrepo/setup-toolchain@v0`, `dorny/paths-filter@v3`); watch the first `dev` push.

## Critical Files

- `.moon/workspace.yml` (project map + `root` id + `vcs.defaultBranch: main`), `.moon/toolchains.yml` (bun/go/node/typescript, golangci via go `bins`), `.moon/tasks/infra.yml` (decrypt/infra-up/infra-down, workspace-root anchored), `.prototools`
- `compose.dev.yml`, `traefik-dynamic.yml`, `.env.example`, `auth/.env.dev`, `registry/.env.dev`, `.sops.yaml`, `secrets/*.dev.enc.env` (carried verbatim)
- `moon.yml` (root aggregators), `auth|registry|tui|website/apps/website|website/packages/{api,schemas}/moon.yml`
- `auth|registry|website/Dockerfile` (root-context), `.dockerignore`, `.github/workflows/ci.yml`
- `package.json` (root workspace), `auth|registry` manifests (renamed + `@unsa/schemas` dep)

## Gotchas

- `moon check` (bare) requires TTY/id — use `moon query tasks` to validate configs non-interactively.
- `moon ci :check` silently drops the no-command aggregator — always list concrete scopes (`:build :test :typecheck :lint`).
- `bun run <script>` inside `website/`, `auth/`, `registry/` source checkouts resolves against THEIR lockfiles — use UNSAReport2 shells for merged-tree work.
- `docker compose` dev servers print "Started development server" before bun `--hot` finishes compiling; vite binds `127.0.0.1:3100` (correct for host-mode gateway, do not change to bridge assumptions).
- Wiping dev DBs: drop `public` AND `drizzle` schemas or migrations no-op; registry_db must never contain auth tables (happened once via wrong-DATABASE_URL migrate; fixed by env override in step 7 above).
