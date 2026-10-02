# Themes + `slides import` fidelity ceiling

5 official themes (`packages/slides-kit/src/themes/catalog.ts` is truth):

- `unsa-dark` (default), `unsa-classic`, `epis-tech`, `fips-light`, `epis-night`.

Theme tokens consumed via `var(--slide-*)` (`--slide-bg`, `--slide-text`,
`--slide-accent`, `--slide-border`, ...). Unknown theme ids throw a
descriptive error (no silent fallback).

## `unsarep slides import deck.pptx`

Extracts **colors + fonts only** (Go stdlib `archive/zip` + `encoding/xml`):

- `ppt/theme/theme1.xml` 12-slot `clrScheme`
  (`dk1/lt1/dk2/lt2/accent1-6/hlink/folHlink`) + major/minor latin fonts.
- `tint`/`shade`/`lumMod`/`lumOff`/`satMod` resolved to `#rrggbb`.
- `ppt/slideMasters/*.xml` background fills as patch comments.

Emits `themes/<slug>.ts` (`ThemeDefinition`) + a `--theme` wiring hint:
copy into `packages/slides-kit/src/themes/<slug>.ts`, register in
`themes/catalog.ts`, set `theme: '<slug>'` in `deck.config.ts`.

NOT imported: layouts, text runs, shapes, images, charts, animations —
rebuild slides with slides-kit layouts after wiring the theme.
