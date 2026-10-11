# PPTX Porting

Port any `.pptx` template into UNSAReport2: forensic inventory, CSS-first styles,
remote asset hosting (CDN/SeaweedFS S3), clean TSX (no inline SVGs), and atomic
Template Pack architecture (`TemplatePack` + `TemplateSlide`), visual loop to ≥ 0.90,
demo deck + report. Use this skill whenever someone needs a PowerPoint,
Canva-exported, or Google-Slides-exported deck reproduced as UNSA slide packs —
even if they ask for "matching slides", "same design as the pptx", "port
the template", or pixel-parity work. Start here for template ports; do not
hand-roll conversions without it.

Related: `../slides-authoring/SKILL.md` (authoring rules, QA bounds, deploy).

## Prerequisites

- `.pptx` source (unzip-readable), `bun`, Go toolchain, python3 (+PIL for
  forensics).
- Fonts FIRST: extract embedded EOT fonts before any capture, or the loop
  compares against wrong substitutions (`scripts/eot-extract.py`, see
  `references/forense.md` §6).
- Remote storage: SeaweedFS S3 / UNSAReport CDN access
  (`/api/slides/assets/templates/:packId/:filename`) for hosting extracted
  binary assets.
- For pixel capture: `soffice` (LibreOffice) + `pdftoppm`, screenshots at
  exactly 1280×720. Without them, do forensic + code and record pixel
  capture as debt.

## Workflow

1. **Forense y Categorización** — inventory every slide, classify visual styles
   into CSS-replicable (washes, gradients, glows, blurs, borders, cards) vs
   remote assets (photos, icons). Extract runs, fonts, and fill colors.
   See `references/forense.md`.
2. **Assets Remotos (Zero Local Binaries)** — extract raster photos and clean
   icons from `ppt/media/`, optimize them, and upload to SeaweedFS S3 / CDN
   under `templates/assets/<pack-id>/<filename>`.
   Component templates must ONLY reference remote URLs via
   `getTemplateAssetUrl(packId, filename)` from `@unsa/slides-kit/packs/assets`
   (or relative `../../assets`). NEVER commit heavy binary images to git or
   bundle them into `@unsa/slides-kit`.
3. **Construcción de Template Pack (TSX Limpio & CSS-First)** — build an atomic
   `TemplatePack` in `packages/slides-kit/src/packs/<pack-id>/`:
   - `theme.ts`: theme tokens, palette, and typography from real slide runs.
   - `slides/<slide-id>.tsx`: slide components implementing pure CSS/Tailwind
     styling, parameterizing dynamic slots (`SlotSchema[]`), and referencing
     remote images via `getTemplateAssetUrl`.
   - **CSS-First:** Gradients, washes, glows, blurs, cards, shadows, borders,
     lines must be implemented in pure CSS / Tailwind
     (`style={{ background: 'radial-gradient(...)', filter: 'blur(...)' }}`).
     PROHIBIT exporting decorative raster images (washes, blurs, shapes) from PPTX.
   - **Higiene TSX:** Explicitly forbid injecting huge inline
     `<svg><path .../></svg>` blocks into slide TSX components to prevent code
     clutter and contamination. Use remote image tags
     (`<img src={getTemplateAssetUrl(packId, filename)} />`) or semantic CSS/HTML
     shapes (`rounded-full`, divs with borders, etc.).
   - `index.ts`: canonical `TemplatePack` declaration bundling `id`, `name`,
     `description`, `tags`, `theme`, and `slides` (`TemplateSlide[]`).
4. **Registro y Validación** — register the pack in
   `packages/slides-kit/src/packs/catalog.ts` via `registerPack(pack)`.
   Run `bun test` in `packages/slides-kit` and validate deck schema.
5. **Loop visual** — capture, compare, fix, repeat until 100% pass
   (Tier A strict, Tier B fotográfico documentado).
   Exit: JSON report + diff PNGs per pair. See `references/visual-loop.md`.

## Rules

- **CSS-First Rule:** In forensic analysis and implementation, strictly
  classify visual styles: gradients, washes, glows, blurs, cards, shadows,
  borders, lines must be implemented in pure CSS / Tailwind
  (`style={{ background: 'radial-gradient(...)', filter: 'blur(...)' }}` etc.).
  PROHIBIT exporting decorative raster images (washes, blurs, shapes) from PPTX.
- **Remote Assets (Zero Local Binaries):** Photos, complex illustrations, and
  icon images must be uploaded to the UNSAReport CDN / SeaweedFS S3 storage
  (`/api/slides/assets/templates/:packId/:filename`) or external CDN.
  Component templates must ONLY reference remote URLs via
  `getTemplateAssetUrl(packId, filename)` from `@unsa/slides-kit/packs/assets`
  (or relative `../../assets` inside slides-kit). NEVER commit heavy binary
  images to git or bundle them into `@unsa/slides-kit`.
- **Code Cleanliness (No Inline SVGs):** Explicitly forbid injecting huge inline
  `<svg><path .../></svg>` blocks into slide TSX components to prevent code
  clutter and contamination. Use remote image tags
  (`<img src={getTemplateAssetUrl(packId, filename)} />`) or semantic CSS/HTML
  shapes (`rounded-full`, border divs, etc.).
- **Template Pack Architecture:** Replace legacy references to the `theme-layout`
  matrix (`supportedThemes`, `showcaseLayouts`) with the canonical
  `TemplatePack` architecture (`TemplatePack` and `TemplateSlide` in
  `src/packs/<pack-id>/`).
- **Colors/Fonts from Runs:** Colors and fonts come from `ppt/slides/*.xml` runs;
  `ppt/theme/theme1.xml` keeps factory values — never trust it blindly.
- **Threshold & Visual Gates:** Threshold flag `--threshold` (default `0.90`);
  never gate CI on pixels. Two-tier gate: Tier A strict (vector/text), Tier B
  photographic (raster coverage ≥ 30%, audited in `tiers-<deck>.json`,
  SSIM ≥ threshold, pixdiff ≤ 25%) due to JPEG+resampling noise floor of
  LibreOffice. See `references/visual-loop.md`.
- **Debt rule:** a failing check records REQ, numeric delta, owner — the plan
  is not done until all checks pass.

## References

- `references/forense.md` — `.pptx` inventory, visual categorization (CSS vs remote assets), fonts.
- `references/template-packs.md` — canonical `TemplatePack` and `TemplateSlide` architecture, `getTemplateAssetUrl`, TSX hygiene, and migration from legacy matrix.
- `references/theme-layout-matrix.md` — deprecation notice and transition guide to Template Packs.
- `references/visual-loop.md` — capture/compare commands, SSIM threshold, Tier A/B gates, and iteration.

## Scripts

- `scripts/pptx-shot.mjs` — `.pptx` → PNGs 1280×720 (needs soffice+pdftoppm).
- `scripts/unsa-shot.mjs` — deck → PNGs 1280×720 (SSR + Chromium headless).
- `scripts/compare.mjs` — SSIM + pixel-diff por par, `--threshold` 0.90,
  `--tiers` para el gate fotográfico documentado.
- `scripts/validate-deck.mjs` — deck contra kit (temas, packs o `custom`
  con component, slots); verde antes del loop visual.
- `scripts/eot-extract.py` — fuentes EOT embebidas del `.pptx` → TTF
  instalables (repara `name`); obligatorio antes de capturar.
- `scripts/pptx-to-slides.py` — compilador `.pptx` → `custom/slides.tsx`
  1:1 (geometría EMU, runs, fills, blips, Bézier). Itera en el compilador,
  nunca a mano en el generado.
