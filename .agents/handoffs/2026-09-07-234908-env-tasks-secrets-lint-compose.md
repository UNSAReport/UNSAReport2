# Handoff: env/task/secrets/lint/compose fixes complete, uncommitted, user validates gateway

## Session Metadata
- Created: 2026-09-07 23:49 UTC
- Project: /home/cricro/store/projects/UNSAReport/UNSAReport2
- Branch: main (HEAD still at edfaab0; all work below is UNCOMMITTED in working tree)
- Session duration: ~1h10m
- Plan record: session-local `local://unsa-report-fixes-plan.md` (authoritative spec; 5 approach steps + verification)

### Recent Commits (for context, none made this session)
  - edfaab0 docs: session handoff for monorepo merge
  - d5cf821 chore: lock root flake, restore system deps
  - bef2b80 monorepo merge: tui, website, auth, registry under Moon

## Handoff Chain

- **Continues from**: [2026-09-08-025046-monorepo-merge-complete.md](./2026-09-08-025046-monorepo-merge-complete.md)
  - Previous title: Moon monorepo merge complete (UNSAReport2)
- **Supersedes**: None (prior handoff still valid for merge context; this one covers the 5-issue fix session)

## Current State Summary

All 5 requested fixes are implemented, verified as far as this sandbox allows, and left UNCOMMITTED for user review (~47 modified/deleted + 5 new files; full list in git status). Moon gates green: `:typecheck`, `:lint`, `:check` (lint+typecheck, no test), `registry:test` + `tui:test`. `auth:test` fails on E2E DB setup — pre-existing (documented in prior handoff, fails identically in pristine source). The one thing nobody can prove here: end-to-end gateway traffic through bridge-mode Traefik, because this sandbox filters container→host TCP and blackholes port 9876 specifically; the user explicitly took on firewall validation on their host (README.md has the port table + ufw/firewalld recipes). Infra containers stopped; no dev servers running; tree otherwise clean.

## Codebase Understanding

### Architecture Overview

- Env layering (last-wins via append, moon wrappers `source` files): (1) plaintext `.env.example` defaults, (2) per-env globals from `secrets/global.<ENV>.enc.env` (new, 17 keys), (3) per-app overrides from `secrets/<app>.<ENV>.enc.env`. `just <recipe> <env>` sets `ENV` for moon/compose; unset defaults to `dev`, file names unchanged for dev.
- Root moon aggregators now: `:lint` (auth/registry/tui:lint + tui:vet + new website:lint), `:typecheck` (unchanged set), `:test` (registry + tui; auth:test intentionally local-only), `:check` = lint+typecheck union. Note: `moon run :test` fans out to ALL tasks named test including auth:test — the root `test` aggregator does not exclude it.
- Lint authority: root `biome.json` (ex-auth content); service stubs use `"extends": "//"` string microsyntax (implies `root: false`); website adds only CSS override + routeTree exclusion. Root `.golangci.yml` pins default linter set, discovered upward from `tui/`.
- Gateway: bridge-mode Traefik (`host.docker.internal:host-gateway`, published 9876) → native bun (auth 3000, registry 3001, all-interfaces) + vite (3100, `host: true`).

### Critical Files

| File | Purpose | Relevance |
|------|---------|-----------|
| `justfile` (new) | ENV-proxy recipes | Added this session; uses `env_var_or_default`, not `env()` |
| `.moon/tasks/infra.yml` | strict sops decrypt + parametrized infra | Rewritten; NO shell vars/loops/double-quotes (moon eats `$vars`, mangles `"`) |
| `moon.yml` | lint/typecheck/test/check aggregators | Split this session |
| `secrets/global.dev.enc.env` (new) | per-env globals vault | 17 agreed keys; populated from old per-app vaults by hash-agreement |
| `secrets/auth|registry.dev.enc.env` | pruned app-only vaults | auth 8 keys, registry 3 keys |
| `biome.json` (new) + `*/biome.json` stubs | centralized lint | stubs MUST use `"extends": "//"` string form |
| `compose.dev.yml`, `traefik-dynamic.yml` | bridge gateway | backends → host.docker.internal |
| `README.md` (new) | firewall docs | user needs this for gateway validation |
| `local://unsa-report-fixes-plan.md` | execution spec | session-local; full rationale + verification log |

### Key Patterns Discovered

- Moon task args: `${MOON_WORKSPACE_ROOT:-.}` and `${ENV:-dev}` pass through for bash; any other `$var` (loop vars, `$(...)`) is eaten by moon substitution, and `"` chars in multi-line blocks arrive literally-escaped. Write moon bash inline with unrolled lines, no quotes, no shell variables.
- `MOON_WORKSPACE_ROOT` must be referenced inline, never assigned (prior-handoff quirk, still true).
- Bun `Bun.serve({port})` binds all interfaces (`*:3001`, `*:3002` observed); vite needs explicit `host: true`.
- sops dotenv vaults: `sops decrypt` prints clean KEY=value (no metadata); re-encrypt via plaintext + `sops encrypt --in-place` (creation rules from `.sops.yaml` re-apply). Value agreement across vaults compared by sha256 of values, never printing them.
- `moon run` in this harness needs `env -u CI` (harness exports CI=true, which filters `runInCI:false` tasks). Missing tools obtained via `nix run nixpkgs#<pkg>` (moon 2.5.2, just 1.58, biome, bun 1.3.13 exact, go 1.26.7).

## Work Completed

### Tasks Finished

- [x] justfile ENV proxy + moon `${ENV:-dev}` parametrization + flake `just` + `.gitignore` `/.env.*`
- [x] Root `:lint`/`:typecheck`/`:test` split; `:check` = lint+typecheck; fixed `lint`-runs-typecheck conflation in auth/registry scripts; new `website:lint`
- [x] Strict fail-fast decrypt with per-env global layer; vault pruning + deduplication; stale registry `:5432`→`:5433` fix; `AUTO_MIGRATE` preserved via examples
- [x] Root `biome.json` + `//` stubs + `.golangci.yml`; website source fixes (alias import, dead barrel removal, routeTree exclusion); root package.json format
- [x] Bridge compose + backend repoint + vite `host:true` + stale copy deletion + README firewall docs
- [x] Full verification: moon gates, biome 2.5.10 clean (95 files), golangci/vet/go-test, decrypt layering + negative proofs, live backend probes, infra-up/down cycle

### Files Modified

| File | Changes | Rationale |
|------|---------|-----------|
| `justfile` (new) | 5 recipes proxying ENV | Issue 1: `just <recipe> <env>` UX |
| `flake.nix` | +`just` in devShell | justfile requires the binary |
| `.gitignore` | `/.env.dev`→`/.env.*`, comment fix | future env files ignored |
| `.moon/tasks/infra.yml` | strict sops decrypt, parametrized up/down | Issues 1+3: fail-fast layered decrypt |
| `moon.yml` | 4 aggregators replace `check` | Issue 2: lint/typecheck/test split |
| `auth|registry|tui|website apps` `moon.yml` | dev wrappers source `.env.${ENV:-dev}` | Issue 1 |
| `auth|registry/package.json` | `lint` → pure `biome lint .` | Issue 2: de-conflate typecheck |
| `website/.../moon.yml` + `package.json` | new `lint` task + `check:biome` script | Issue 2: website was lint-invisible |
| `.env.example`, `registry/.env.example`, `auth/.env.example` | truthful headers; +AUTO_MIGRATE; registry DB port fix | Issues 1+3 |
| `secrets/global.dev.enc.env` (new) | 17 global keys vault | Issue 3 + per-env globals layer |
| `secrets/auth|registry.dev.enc.env` | pruned to 8 / 3 app-only keys | Issue 3 |
| 6 vault files deleted | website/tui roots + 4 per-app dups | Issue 3: byte-duplicates / superseded |
| `biome.json` (new), `auth|registry|website/biome.json` | base + `//` stubs (+CSS override, +routeTree exclusion) | Issue 4 |
| `.golangci.yml` (new) | pin default linter set | Issue 4 |
| `website/**` ~19 files | single-quote reformat | Issue 4: unified quote style |
| `router.tsx` | `./routeTree.gen`→`@/routeTree.gen` | Issue 4: relative-import ban |
| `schemas/src/index.ts` deleted + exports `"."` dropped | dead barrel, zero importers (grep-verified) | Issue 4: unfixable-by-alias barrel |
| `package.json` | array rewrap (format-only) | Issue 4: newly covered by root biome |
| `tui/go.mod` | go-keyring indirect→direct | toolchain-corrected (directly imported); keep |
| `compose.dev.yml` | bridge + extra_hosts + published 9876 | Issue 5 |
| `traefik-dynamic.yml` | 3 backends → host.docker.internal | Issue 5 |
| `vite.config.ts` | `host: true` | Issue 5: loopback was the bridge blocker |
| `auth|registry/traefik-dynamic.yml` deleted | stale single-service copies | Issue 5 |
| `README.md` (new) | ports + firewall section | Issue 5 |

### Decisions Made

| Decision | Options Considered | Rationale |
|----------|-------------------|-----------|
| `secrets/global.<env>.enc.env` as globals layer | root plaintext only / per-app duplication | User-requested layering example < env < app; sops keeps per-env secrets out of git |
| Globalize only hash-agreed keys; DATABASE_URL/S3_ENDPOINT/PORT stay per-app | force-globalize all | Divergent values across vaults; globalizing would pick a wrong winner |
| Remove registry vault DATABASE_URL + fix example to :5433 | keep diverged per-app value | Vault value stale vs compose `5433:5432`; keeping it regressed runtime onto the auth DB |
| Biome stubs `"extends": "//"` | plan's `../../` array / my `../` array | Both arrays hard-error as nested roots; `//` microsyntax (docs-verified) implies `root:false` |
| Decrypt without shell vars/quotes/loops | plan's loop+`$(...)` form | Moon eats `$vars` and escapes `"` (first decrypt run failed exactly so); unrolled lines, same semantics |
| Delete schemas barrel vs `@/`-alias it | add tsconfig paths to schemas pkg | `@/` inside source-consumed package resolves per-consumer (bun/vite) — wrong-file risk; barrel had zero importers |
| `tui:vet` kept + added to `:lint` | merge into lint / delete | Resolves orphan without deleting history; zero breakage |
| Bridge-only, no host fallback | dual-mode files | User chose bridge-only; stale copies deleted for clean cutover |

## Pending Work

### Immediate Next Steps

1. Review + commit the working tree (all changes uncommitted; HEAD still edfaab0). Suggested message: `env/tasks/secrets/lint/compose: parametrize env, split gates, strict decrypt, centralize lint, bridge gateway`.
2. Open host firewall TCP 3000/3001/3100 from the Docker bridge subnet (README.md has table + ufw/firewalld recipes; subnet via `docker network inspect unsareport-dev --format ...`), then `just infra-up dev` + `just dev dev` and probe `localhost:9876` (`/`, `/api/registry/health`, `/.well-known/jwks.json`, `/api/auth/`).
3. Revoke the real-looking `GOOGLE_CLIENT_SECRET` in source `auth/.env.dev` if ever used outside dev (carried over from prior handoff; needs Google console; cannot be done from here).
4. Add a remote for UNSAReport2 and push (carried over from prior handoff).

### Blockers/Open Questions

- [ ] Gateway end-to-end unprovable in this sandbox (environmental port/TCP filtering, not a repo defect) — user-owned validation is step 2 above.
- [ ] `auth:test` E2E failures pre-existing (need live OAuth); no action unless the user wants those suites fixed.

### Deferred Items

- Additional environments (staging/prod files: `compose.<env>.yml`, `.env.<env>.example`, `secrets/*.<env>.enc.env`) — pattern is wired, files intentionally not created (user chose dev-only + pattern).
- `registry:test` missing `db-migrate` dep (asymmetric with auth) — left as-is to protect the green gate.
- Biome warnings (9, pre-existing style nits) — errors are zero; warnings untouched.

## Context for Resuming Agent

### Important Context

1. NOTHING this session is committed. `git status` is the source of truth; do not assume HEAD contains any of it. Generated `.env.dev` files are gitignored but REQUIRED at runtime (`just decrypt dev` recreates them; needs age key in `~/.config/sops/age/keys.txt`, recipient matches first `.sops.yaml` entry).
2. This box is shared: an unrelated process (`tiny-projects/.../galleyr`) squats port 3000 — do not kill it; auth was verified on alt port instead. Check `ss -tlnp` ownership before trusting any `:3000` probe.
3. `moon run` here ALWAYS needs `env -u CI` prefix (harness sets CI=true). Never bare `moon check` (needs TTY) — use `moon query tasks`.
4. Moon task-arg quoting rules (hard-won): no `$shell_vars`, no `$(...)`, no `"` inside bash `-c` args; unroll loops explicitly. `${MOON_WORKSPACE_ROOT:-.}` and `${ENV:-dev}` are the only safe tokens.
5. `moon run :test` fans out to auth:test (fails, pre-existing) — gate signal is `registry:test tui:test` + `:check`.
6. Website was never lint-gated before; centralization surfaced real violations (now fixed). `routeTree.gen.ts` MUST stay biome-excluded (generated).
7. Bun binds `0.0.0.0` by default (observed `*:3001`, `*:3002`); the one `127.0.0.1:3000` sighting was the foreign process, not bun's default.

### Assumptions Made

- Age secret key present locally (was: `~/.config/sops/age/keys.txt`, matched recipient). Without it, decrypt/vault work is impossible — fail fast, do not invent workarounds.
- Dev-only + pattern scope per user answers (no staging/prod files); justfile proxy per user choice; `:check` = lint+typecheck per user wording; bridge-only per user choice; CSS-override-only website delta per user choice.
- `172.16.0.0/12` fallback if firewall can't scope to bridge subnet (pre-decided in plan).

### Potential Gotchas

- `vite.config.ts` was reformatted by biome mid-session (quote style) — stale edit tags after any `--write`; re-read before editing formatted files.
- `nix run` commands print store paths; never leave the `result` symlink in-tree (removed once already).
- `go test/vet` with `-mod=mod` can rewrite `go.mod` (happened: legitimate here); prefer `-mod=readonly` for pure verification.
- Traefik `--api.insecure=true` dashboard is host-exposed in dev (`:8080` in bridge mode, reachable via bridge IP) — dev-only, never prod.
- `docker compose` dev servers print ready before bun `--hot` finishes compiling; wait for ports, not log lines.

## Environment State

### Tools/Services Used

- moon 2.5.2 via `nix run nixpkgs#moon` (repo pins 2.5.4 via proto; 2.5.2 sufficed for verification) + just 1.58 + biome 2.5.9 (nix; schema-mismatch infos) + `@biomejs/biome@2.5.10` via bunx (definitive green) + bun 1.3.13 (nix store path, exact pin) + go 1.26.7 (nix) + system golangci-lint 2.12.2 + sops 3.13.3/age 1.3.2 (flake) + docker 29.7.2 w/ daemon + ctx7 via `nix run nixpkgs#bun -- x ctx7@latest` (biome `//` semantics)
- No node/npm/python/cargo on PATH; no `~/.proto` (moon auto-provisioned toolchains on first gated run)

### Active Processes

- None. All probe servers (unsa-auth/registry/website/probe) stopped; infra (`just infra-down` equivalent via moon) down; `docker ps` shows no `unsareport-*`. Network `unsareport-dev` may still exist (harmless; `infra-up` recreates idempotently).

### Environment Variables

- NAMES only: `ENV` (env selector, default dev), `SOPS_AGE_KEY` (alternative age-key source; normally file-based), `CI` (must be unset for dev tasks), `DATABASE_URL`/`AUTH_DATABASE_URL` (layered precedence root<app), `IDP_PORT`/`PORT`/`WEBSITE_PORT`, `SOPS_*` never handled directly.

## Related Resources

- Plan: session-local `local://unsa-report-fixes-plan.md` (full spec incl. verification log)
- Prior handoff: `.agents/handoffs/2026-09-08-025046-monorepo-merge-complete.md`
- Biome monorepo docs: `extends: "//"` microsyntax (`/biomejs/website` ctx7: big-projects guide)
- Firewalls: root `README.md` Ports & host firewall section
