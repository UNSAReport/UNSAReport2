# Themes + theme-layout matrix

8 official themes (`packages/slides-kit/src/themes/catalog.ts` is truth):

- `unsa-dark` (default), `unsa-classic`, `epis-tech`, `fips-light`, `epis-night`, `cloudlet-pitch` (Cloudlet Tech startup pitch), `azul-proposal` (corporate blue business proposal), `harper-minimal` (black/red minimalist pitch).

Theme tokens consumed via `var(--slide-*)` (`--slide-bg`, `--slide-text`,
`--slide-accent`, `--slide-border`, ...). Unknown theme ids throw a
descriptive error (no silent fallback).

Signature layouts declare `supportedThemes` (one line per layout); undeclared
layouts are universal. Filter: `unsarep slides layouts --theme <id>`,
`unsarep slides themes --layout <id>`.

Porting a `.pptx` template (forense → theme polish → matrix → visual loop)
lives in the `pptx-porting` skill, not here.
