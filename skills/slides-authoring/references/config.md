# Config-overlay precedence

Two sources configure a deck; they merge with a fixed winner.

1. `deck.config.ts` (typed, `defineConfig`) — **wins** on every key it sets:
   `title`, `slug`, `theme`, `visibility`, `orgSlug`, `description`, `slides`.
2. `.slidesrc.json` (written by `unsarep slides link --title/--slug/--org/--visibility`)
   — **fills gaps** for keys `deck.config.ts` leaves empty.

Resolution (`tui/internal/slides/project.go:LoadProjectConfig`): parse
`deck.config.ts` regexes first, overlay `.slidesrc.json` only where empty,
fall back to `.slidesrc.json` alone when no `deck.config.ts` exists.

Practical rule: keep identity (`slug`, `title`, `visibility`) in
`deck.config.ts` for reviewability; use `slides link` for one-off overrides.
`theme` lives ONLY in `deck.config.ts` (there is no `--theme` flag).
