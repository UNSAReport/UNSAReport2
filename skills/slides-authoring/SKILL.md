# Slides Authoring

Author UNSA slide decks with `@unsa/slides-kit` layouts, chroma-neutral
components, and the `unsarep slides` CLI. This skill covers picking layouts,
staying within the 1280×720 QA bounds, theme/config precedence, and deploy
validation.

Related ecosystem skills (reference by name; install on demand, never vendored):

- `anthropics/skills@pptx` — `.pptx` = ZIP of XML mental model behind
  `unsarep slides import` (`npx skills add https://github.com/anthropics/skills --skill pptx`).
- `wshobson/agents@pptx-slide-specification` — stable slide ids, message-led
  titles, a11y reading order, `layout_tree` concept model for slot planning.
- `anthropics/skills@frontend-design` — color/type discipline for new themes
  (layouts stay chroma-neutral; color lives in themes).

## Workflow

1. Scaffold: `unsarep slides init mi-charla` (theme via `theme:` key in
   `deck.config.ts`, not a `--theme` flag).
2. Pick layouts from `references/layouts.md` using each layout's SlotSchema.
3. Preview: `unsarep slides dev` (default port 4000).
4. Link + deploy: `unsarep slides link --title ... --visibility ...` then
   `unsarep slides deploy --yes`.
5. Present at `/presentations/<slug>?present=1`; export PDF via the viewer
   PDF button (`?print-pdf`).

## Rules (must-follow)

- Layout picking: every layout declares `slots: SlotSchema[]`
  (`name`, `type`, `required`, `description`). Fill required slots first;
  see `references/layouts.md` for the family map (110 layouts, 9 families).
- Chroma-neutrality: layouts are structural only. Colors ONLY via
  `var(--slide-*)` theme tokens — never hardcode palettes in slide components.
- 1280×720 QA bounds: slides must survive a 1280×720 viewport without
  overflow. Wrap growing regions in `flex-1 min-h-0 overflow-hidden`, clamp
  text with `line-clamp-*` / `truncate`, and cap arrays (see
  `references/qa-bounds.md`).
- Config-overlay precedence: `deck.config.ts` values win; `.slidesrc.json`
  (written by `slides link`) fills gaps — see `references/config.md`.
- Deploy validation: slug `[a-z0-9-]{2,100}`, non-empty title, bundle
  ≤ 50 MiB, visibility `private|org|unlisted|public`, org slug empty-or-valid —
  see `references/deploy.md`.

## References

- `references/layouts.md` — family map + SlotSchema picking guide.
- `references/qa-bounds.md` — 1280×720 overflow contract + patterns.
- `references/config.md` — `deck.config.ts` vs `.slidesrc.json` precedence.
- `references/deploy.md` — deploy validation checklist + env switch.
- `references/themes.md` — theme tokens + `slides import` fidelity ceiling.
