# Layout picking via SlotSchema

110 layouts in 9 families. Kit source of truth:
`packages/slides-kit/src/layouts/catalog.ts` (CLI mirrors it in
`tui/internal/slides/catalog.go`).

| Family | Count | Use for |
|--------|-------|---------|
| `hero` | 10 | Covers, openers, KPIs |
| `split` | 15 | Comparisons, image+text, pros/cons |
| `bento` | 20 | Grids, dashboards, mosaics |
| `stats` | 15 | Metrics, gauges, sparklines |
| `process` | 15 | Flows, pipelines, timelines |
| `code` | 10 | Snippets, diffs, terminals |
| `list` | 10 | Bullets, checklists, agendas |
| `quote` | 8 | Citations, callouts, testimonials |
| `closing` | 7 | Q&A, summaries, contact, thanks |

## How to pick

1. Match intent to family (comparison → `split`, metrics → `stats`/`bento`).
2. Read the layout's `slots: SlotSchema[]` — each slot has `name`, `type`
   (`string` | `array` | `object` | `code` | ...), `required`, `description`.
3. Fill every `required: true` slot; optional slots get sensible defaults.
4. Explore: `unsarep slides layouts --category bento`, or web
   `/presentations/catalog` for visual previews.

Example (`bento-4-featured-left`): required `tag`, `title`; `featured`
object `{stat, label, description}`; `cards` array (cap at 3 — see qa-bounds).
