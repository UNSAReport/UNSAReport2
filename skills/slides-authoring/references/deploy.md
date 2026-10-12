# Deploy validation checklist

Checked client-side by `unsarep slides link`/`deploy`, enforced server-side
(max 50 MiB archive).

- `slug`: `[a-z0-9-]{2,100}` (`unsarep slides link --slug ...` or derived
  from title; `ValidateSlug`).
- `title`: non-empty (`--title` required).
- `bundle`: zipped `dist/` ≤ 50 MiB (`MAX_ARCHIVE_BYTES = 50 * 1024 * 1024`).
- `visibility`: `private` (default) | `org` | `unlisted` | `public`.
- `org`: empty (personal) or a valid org slug the user belongs to.
- Auth: stored credential (`unsarep slides login`) or `--token` /
  `UNSAREP_TOKEN`, plus the `slides` role — 401/403 means login or role fix.

## Env switch (local vs prod)

| Variable             | Local dev                          | Prod (default)                                  |
| -------------------- | ---------------------------------- | ----------------------------------------------- |
| `UNSAREP_SLIDES_URL` | `http://localhost:9876/api/slides` | `https://unsareport.ynoacamino.tech/api/slides` |
| `UNSAREP_TOKEN`      | local PAT                          | prod PAT                                        |

Each `deploy` creates version `vN`; the viewer serves
`/api/slides/embed/:id/vN/...`; speaker notes travel as
`manifest.notes` (surfaced as `version.notes`).
