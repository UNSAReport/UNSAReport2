# 1280×720 QA bounds contract

Every slide must render without overflow at 1280×720 (the deck canvas and
the `?present=1` viewport).

## Patterns (required)

- Growing regions: `flex-1 min-h-0 overflow-hidden` — lets flex children
  shrink instead of pushing content off-canvas.
- Long titles: `truncate` (single line) or `line-clamp-2` / `line-clamp-3`.
- Body copy: `line-clamp-*` with a fixed budget (e.g. 3 lines for cards).
- Arrays: cap items per slide — cards ≤ 6, list items ≤ 7, bento `cards` ≤ 3,
  stats KPIs ≤ 4. Split into multiple slides instead.
- Images: `object-cover` inside a bounded container, never raw `<img>` with
  intrinsic size.

## Anti-patterns

- Unbounded `map()` over user data with no slice cap.
- `whitespace-nowrap` on free text.
- Fixed pixel heights that exceed 720 minus shell chrome.
