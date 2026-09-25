# GitHub Actions for UNSAReport

Automate the verification and publishing of Typst packages to the [UNSAReport Registry](https://unsareport.ynoacamino.tech) using Personal Access Tokens (PAT).

## Available Actions

- **[`actions/publish`](#actionspublish)**: Validates, bundles, and publishes your package to the registry. Sets up the CLI automatically if not already installed.
- **[`actions/setup`](#actionssetup)**: Downloads and installs the `unsarep` CLI binary into `PATH` on Linux, macOS, or Windows runners with sha256 checksum verification.

---

## Quickstart: Automated Package Publishing

Create a workflow file in your package repository at `.github/workflows/publish.yml`:

```yaml
name: Publish Package to UNSAReport Registry

on:
  release:
    types: [published]
  # Alternatively, trigger on tag push:
  # push:
  #   tags:
  #     - 'v*'
  workflow_dispatch:

jobs:
  publish:
    name: Publish Package
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Publish to UNSAReport Registry
        uses: UNSAReport/UNSAReport2/actions/publish@v0.1.0
        with:
          token: ${{ secrets.UNSAREP_TOKEN }}
          dir: '.'
```

---

## Authentication: Personal Access Tokens (PAT)

To publish packages automatically in CI/CD:

1. Log in to the UNSAReport platform at [unsareport.ynoacamino.tech](https://unsareport.ynoacamino.tech).
2. Navigate to your user settings / tokens page and create a new **Personal Access Token (PAT)**.
   - Tokens follow the format: `unsareport_pat_<hex>`.
3. In your GitHub repository:
   - Go to **Settings > Secrets and variables > Actions**.
   - Create a new repository secret named `UNSAREP_TOKEN` and paste your PAT value.

The action automatically marks `token` with `::add-mask::` to prevent secret leakage in workflow run logs.

---

## `actions/publish`

Validates package manifest (`unsareport.toml`), bundles components, and uploads them to the registry. Supports both single-package repositories and repositories that host an entire scope (scope monorepos) with batch uploads and automated caching to prevent pushing unchanged packages.

### Inputs

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `token` | **Yes** | — | Personal Access Token (`unsareport_pat_...`). |
| `dir` | No | `.` | Relative path to package directory or scope root containing `unsareport.toml`. |
| `mode` | No | `auto` | Execution mode: `auto`, `package` (single package), or `scope` (scope monorepo). |
| `packages-dir` | No | `packages` | Subdirectory containing packages when running in `scope` mode. |
| `registry-url` | No | `https://unsareport.ynoacamino.tech` | Base URL of the target UNSAReport package registry. |
| `version` | No | `latest` | Version of `unsarep` CLI to install from GitHub Releases if not already available in runner `PATH`. |
| `check` | No | `true` | Whether to execute `unsarep registry check` before publishing. |
| `dry-run` | No | `false` | If `true`, validates package integrity without uploading to registry. Useful for Pull Request CI workflows. |
| `cache` | No | `true` | Whether to automatically cache and skip unchanged packages across workflow runs. |
| `cache-key-prefix` | No | `unsarep-cache` | Cache key prefix for GitHub Actions cache storage. |
| `push-scope` | No | `true` | Whether to push root scope configuration (`unsarep registry scope push`) in scope mode. |

### Outputs

| Name | Description |
|------|-------------|
| `package-name` | Package name (or last processed package name in scope mode). |
| `package-version` | Package version (or last processed package version in scope mode). |
| `scope-name` | Name of the scope if scope configuration was processed. |
| `published-packages` | JSON array of packages published or validated in this run (e.g. `["@scope/a@1.0.0"]`). |
| `skipped-packages` | JSON array of packages skipped due to cache matches. |
| `published-count` | Number of packages published or validated. |
| `skipped-count` | Number of packages skipped from cache. |
| `total-packages` | Total number of packages evaluated. |
| `cache-updated` | `true` if local cache entries were updated. |

---

## `actions/setup`

Downloads the precompiled `unsarep` CLI binary, verifies its sha256 checksum against official release checksums, and adds it to the runner's `PATH`.

### Inputs

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `version` | No | `latest` | Tag or version to install (`latest`, `v0.1.0`, etc.). |

### Outputs

| Name | Description |
|------|-------------|
| `cli-path` | Path to the installed `unsarep` executable. |
| `cli-version` | Version reported by `unsarep version`. |

### Example Usage

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: UNSAReport/UNSAReport2/actions/setup@v0.1.0
    with:
      version: 'v0.1.0'

  - name: Validate package manifest
    run: unsarep registry check ./mi-paquete
```

---

## Whole Scope / Monorepo Publishing (Batch Mode with Automatic Caching)

If your repository hosts an entire scope under a single repository (e.g. scope assets and multiple packages under `packages/`):

```
my-scope-repo/
├── unsareport.toml          # [scope] name = "@myscope", files = ["README.md"]
├── README.md
└── packages/
    ├── report-theme/
    │   ├── unsareport.toml  # [package] name = "@myscope/report-theme", version = "1.0.0"
    │   └── lib.typ
    └── letter-template/
        ├── unsareport.toml  # [package] name = "@myscope/letter-template", version = "0.2.0"
        └── lib.typ
```

Configure your workflow at `.github/workflows/publish.yml`:

```yaml
name: Publish Scope Packages

on:
  push:
    branches:
      - main

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Publish Scope Packages
        uses: UNSAReport/UNSAReport2/actions/publish@v0.1.0
        with:
          token: ${{ secrets.UNSAREP_TOKEN }}
          dir: '.'
          mode: 'scope'               # or 'auto' (detects [scope] or packages/ automatically)
          packages-dir: 'packages'     # scans packages/ for child packages
          cache: 'true'               # automatically skips unchanged packages and scope
```

### How Automatic Caching Works
- Each package's contents are deterministically hashed (SHA-256) matching `unsarep`'s bundling mechanism.
- The action automatically restores previous publish state via GitHub Actions Cache.
- Packages are only built and pushed if their version in `unsareport.toml` or their content hash has changed.
- Unchanged packages are automatically skipped, preventing registry conflicts (e.g. `Version already exists`) on commits that only touch a subset of packages or repository documentation.
- When `dry-run: 'true'` is used in PR checks, the cache is consulted but never overwritten with unreleased changes.

