# PPTX Porting

Port any `.pptx` template into UNSAReport2: forensic inventory, theme +
signature layouts, theme-layout matrix declaration, visual loop to ≥ 0.90,
demo deck + report. Use this skill whenever someone needs a PowerPoint,
Canva-exported, or Google-Slides-exported deck reproduced as UNSA slides —
even if they ask for "matching slides", "same design as the pptx", "port
the template", or pixel-parity work. Start here for template ports; do not
hand-roll conversions without it.

Related: `../slides-authoring/SKILL.md` (authoring rules, QA bounds, deploy).

## Prerequisites

- `.pptx` source (unzip-readable), `bun`, Go toolchain, python3 (+PIL for
  forensics).
- Fonts FIRST: extract embedded EOT fonts before any capture, or the loop
  compares against wrong substitutions (`scripts/eot-extract.py`, see
  `references/forense.md` §5).
- For pixel capture: `soffice` (LibreOffice) + `pdftoppm`, screenshots at
  exactly 1280×720. Without them, do forensic + code and record pixel
  capture as debt.

## Workflow

Two paths; pick per slide deck (they compose: compiler first, signatures
for reusable pieces):

1. **Forense** — inventory every slide, then decide theme vs layout.
   Exit: per-slide table (text runs, fonts, fills, media) + existing-vs-missing
   matrix. See `references/forense.md`.
2. **Vía compilador (paridad 1:1)** — for exact reproductions, compile the
   `.pptx` straight to `custom/slides.tsx` instead of rebuilding by hand:
   `scripts/pptx-to-slides.py --pptx P --theme T --slug S --out DECK`.
   It maps EMU geometry, run styles, fills/blips, Bézier paths and the
   first-line leading model; iterate by re-running it (never hand-edit
   generated `slides.tsx` — fix the compiler so every deck benefits).
   Exit: `validate-deck.mjs` green + visual loop scores.
3. **Vía firmas (piezas reutilizables)** — polish (never fork) the closest
   theme: exact `srgbClr` colors from runs (not `theme.xml` factory Calibri),
   real run fonts, signature tokens with fallbacks
   (`var(--slide-x, var(--slide-accent))`); reuse catalog layouts and create
   only the missing 2–4 signature ones, chroma-neutral
   (`var(--slide-*)` only).
   Exit: theme tests green, zero unexpected token warnings; each signature
   degrades without breaking outside its theme.
4. **Matriz** — declare `supportedThemes: ['<theme-id>']` (one line) per
   signature layout; curate `showcaseLayouts` on the theme.
   Exit: `bun test` + `go test ./internal/slides/` green.
5. **Loop visual** — capture, compare, fix, repeat until 100% pass
   (Tier A strict, Tier B fotográfico documentado).
   Exit: JSON report + diff PNGs per pair. See `references/visual-loop.md`.

## Rules

- Colors/fonts come from `ppt/slides/*.xml` runs; `ppt/theme/theme1.xml`
  keeps factory values — never trust it blindly.
- No theme forks: one theme evolves; layouts stay chroma-neutral.
- Threshold flag `--threshold` (default `0.90`); never gate CI on pixels.
- Gate de dos niveles documentado: Tier A estricto; Tier B fotográfico
  (cobertura raster ≥ 30%, auditado en `tiers-<deck>.json`, SSIM ≥ umbral y
  pixdiff ≤ 25%) por el piso de ruido del pipeline JPEG+resample de
  LibreOffice. Ver `references/visual-loop.md`.
- Debt rule: a failing check records REQ, numeric delta, owner — the plan
  is not done until all checks pass.

## References

- `references/forense.md` — `.pptx` inventory with copyable commands.
- `references/theme-layout-matrix.md` — one-line declaration + fallback.
- `references/visual-loop.md` — capture/compare commands + iteration.

## Scripts

- `scripts/pptx-shot.mjs` — `.pptx` → PNGs 1280×720 (needs soffice+pdftoppm).
- `scripts/unsa-shot.mjs` — deck → PNGs 1280×720 (SSR + Chromium headless).
- `scripts/compare.mjs` — SSIM + pixel-diff por par, `--threshold` 0.90,
  `--tiers` para el gate fotográfico documentado.
- `scripts/validate-deck.mjs` — deck contra kit (temas, layouts o `custom`
  con component, slots); verde antes del loop visual.
- `scripts/eot-extract.py` — fuentes EOT embebidas del `.pptx` → TTF
  instalables (repara `name`); obligatorio antes de capturar.
- `scripts/pptx-to-slides.py` — compilador `.pptx` → `custom/slides.tsx`
  1:1 (geometría EMU, runs, fills, blips, Bézier). Itera en el compilador,
  nunca a mano en el generado.
