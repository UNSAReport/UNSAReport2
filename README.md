# UNSAReport Monorepo

Unified monorepo for the **UNSAReport** ecosystem — providing automated lab report scaffolding, Typst package management, interactive presentation decks, identity services, and web tools for students and faculty at UNSA (Universidad Nacional de San Agustín).

> [!WARNING]
> **Early Release Notice**: UNSAReport has just been officially released into public preview. You should expect active development, evolving command syntax, and potential edge cases or bugs. If you encounter any unexpected behavior, please file a report at our [GitHub Issues Tracker](https://github.com/UNSAReport/UNSAReport2/issues).

---

## 🌐 Live Web Platform

The central web application and API services are deployed and accessible at:

👉 **[https://unsareport.ynoacamino.tech/](https://unsareport.ynoacamino.tech/)**

- **Package Registry**: Browse and search official and community Typst packages.
- **Scope Management**: Request and manage namespace scopes (such as `@unsareport`).
- **Presentations**: Hosted slide deck player for decks deployed via `unsarep slides`.
- **Identity & Tokens**: Sign in via OAuth providers and generate Personal Access Tokens (PATs) for automated or headless CLI workflows.

---

## 📦 Installation

The CLI tool binary is named **`unsarep`**.

### Option 1: Nix Flake (Recommended)

The Nix package includes all runtime dependencies, automatically wrapping the [Typst](https://typst.app/) compiler in your path with zero manual toolchain setup:

```bash
# Ad-hoc execution without installing:
nix run github:UNSAReport/UNSAReport2 -- --help

# Install into your Nix profile:
nix profile install github:UNSAReport/UNSAReport2
```

### Option 2: Build from Source (Go 1.24+)

#### Prerequisites
- [Go](https://go.dev/dl/) (1.24 or higher)
- [Typst](https://typst.app/) compiler installed on your system (e.g., via `nix`, `cargo install typst-cli`, or your OS package manager).

#### Build & Install

```bash
# Clone the repository
git clone https://github.com/UNSAReport/UNSAReport2.git
cd UNSAReport2/tui

# Build the binary
go build -o unsarep ./cmd/unsarep

# Move to a directory in your PATH (e.g., ~/.local/bin or /usr/local/bin)
install -m 755 unsarep ~/.local/bin/unsarep
```

Verify your installation:

```bash
unsarep version
```

---

## 🚀 Usage Guide

`unsarep` provides interactive terminal forms when arguments are omitted in a TTY. Use `--no-input` or supply flags to script workflows.

### 1. Document & Lab Reports (`unsarep docs`)

Manage lab reports, configuration (`unsareport.toml`), and Typst compilation.

```bash
# Initialize a new report project using an official package (e.g. @unsareport/lab)
# Pass --yes to accept default files without interactive confirmation
unsarep docs init @unsareport/lab --report lab-01 --yes

# Live compilation with automatic Typst recompile on file changes
unsarep docs watch lab-01

# Compile production PDF (runs configured pre-build hooks + typst compile)
unsarep docs build lab-01

# Add an additional package dependency to the project
unsarep docs add @unsareport/epis-lab@^0.1.0 --yes

# Update vendored packages to their latest versions matching semver range
unsarep docs update

# Validate project configuration, lockfile integrity, and dependencies
unsarep docs check

# Execute defined project script aliases
unsarep docs run lab:submit
```

### 2. Slide Presentations (`unsarep slides`)

Create, preview, and deploy interactive presentation slide decks.

```bash
# Scaffold a new slide deck directory
unsarep slides init my-deck

# Start a local hot-reloading development preview server
unsarep slides dev my-deck

# Link your local presentation directory to the remote platform
unsarep slides link

# Deploy the presentation to the hosted slides service
unsarep slides deploy
```

### 3. Package Registry (`unsarep registry`)

Author and publish packages under scopes to the registry.

```bash
# List available packages in the registry
unsarep registry list

# Scaffold a new package directory with unsareport.toml
unsarep registry init --name "@unsareport/my-package" --version 0.1.0

# Verify package metadata and asset structure
unsarep registry check ./my-package

# Publish package version to the registry
unsarep registry publish ./my-package

# Push scope configuration and assets
unsarep registry scope push ./scope-dir
```

### 4. Authentication (`unsarep auth`)

Manage sessions and access tokens for publishing packages or deploying slides.

```bash
# Interactive browser OAuth login (opens browser with loopback callback on 127.0.0.1)
unsarep auth login

# Headless login using a Personal Access Token (PAT) generated on the website
unsarep auth login --token unsareport_pat_...

# Inspect authenticated identity and roles
unsarep auth whoami

# Clear stored credentials from OS keychain
unsarep auth logout
```

---

## 🏛️ Monorepo Architecture & Consolidation

This monorepo consolidates previously separate repositories into a single cohesive codebase:
- **Replaces**: The in-work repositories `tui`, `registry`, `auth`, `unsaslides`, and `website`.
- **Packages over Templates**: Standalone template repositories (such as the legacy `templates` repo) have been deprecated and dropped. All reusable report formats, themes, and hooks are distributed as versioned **Packages** through the UNSAReport Registry.
- **Official `@unsareport` Scope**: Official packages are published and maintained under the `@unsareport` scope (hosted in the `packages/` repository, e.g. `@unsareport/epis-lab`).

### Monorepo Structure

| Directory | Service / Component | Technology | Description |
|-----------|---------------------|------------|-------------|
| [`tui/`](file:///home/cricro/projects/UNSAReport/UNSAReport2/tui) | `unsarep` CLI | Go 1.26 + Cobra + Huh | Primary command-line tool for document scaffolding, slides, auth, and package management |
| [`web/`](file:///home/cricro/projects/UNSAReport/UNSAReport2/web) | Website Frontend | TanStack Start + Vite + Bun | Full-stack web application hosted at `unsareport.ynoacamino.tech` |
| [`registry/`](file:///home/cricro/projects/UNSAReport/UNSAReport2/registry) | Package Registry | Bun + Hono + Postgres + SeaweedFS | Registry API for publishing, resolving, and downloading scoped Typst packages |
| [`auth/`](file:///home/cricro/projects/UNSAReport/UNSAReport2/auth) | Identity Provider (IdP) | Bun + Hono + Postgres | OAuth2 / OIDC authentication service and PAT token management |
| [`slides/`](file:///home/cricro/projects/UNSAReport/UNSAReport2/slides) | Slides Service | Bun + Hono + Postgres | Presentation authoring backend and hosted deck deployment service |
| [`packages/`](file:///home/cricro/projects/UNSAReport/UNSAReport2/packages) | Shared Libraries | TypeScript / Bun | Shared monorepo packages (e.g. `@unsa/logger`) |

---

## 💻 Local Development & Infrastructure

For contributors working on the monorepo services natively.

### Toolchain

The monorepo uses [Moon](https://moonrepo.dev/), [Bun](https://bun.sh/), [Go](https://go.dev/), and Docker Compose. If you use Nix, enter the development shell:

```bash
nix develop
```

### 1. Environment & Secrets Decryption

Running `just decrypt <env>` materializes `.env.<ENV>` at the root and in all sub-services (`auth/`, `registry/`, `slides/`, `web/`, `tui/`):

```bash
just decrypt dev
```

- **Base Defaults**: Materialized from `.env.example` and `<service>/.env.example`.
- **SOPS Vaults (Automatic)**: If SOPS age keys are configured, encrypted secrets are decrypted. External contributors without age keys can safely run development with local mock fallbacks.
- **Overrides**: Create `.env.dev.override` (root) or `<service>/.env.dev.override` for personal configuration (gitignored).

### 2. Start Infrastructure

Start local PostgreSQL databases, SeaweedFS S3 storage, and Traefik gateway:

```bash
just infra-up dev
```

Run database migrations:

```bash
just db-migrate dev
```

### 3. Start Development Servers

Start all application services natively:

```bash
just dev dev
```

Gateway entrypoint: `http://localhost:9876`.

### 4. Ports & Host Firewall (Linux Dev)

Traefik runs in Docker bridge mode and routes to native dev servers via `host.docker.internal`. Ensure host firewall rules allow container-to-host traffic:

| Host Port | Process | Access |
|-----------|---------|--------|
| `3000` | Auth IdP (`auth/`) | Allow TCP from Docker bridge subnet |
| `3001` | Package Registry (`registry/`) | Allow TCP from Docker bridge subnet |
| `3100` | Web App (`web/app`) | Allow TCP from Docker bridge subnet |
| `9876` | Traefik Gateway | Public entrypoint |

#### Configure UFW / Firewalld

```bash
# Retrieve Docker network bridge subnet
SUBNET=$(docker network inspect unsareport-dev --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}')

# UFW:
sudo ufw allow from "$SUBNET" to any port 3000,3001,3100 proto tcp

# Firewalld:
sudo firewall-cmd --permanent --add-rich-rule="rule family=ipv4 source address=$SUBNET port port=3000 protocol=tcp accept"
sudo firewall-cmd --permanent --add-rich-rule="rule family=ipv4 source address=$SUBNET port port=3001 protocol=tcp accept"
sudo firewall-cmd --permanent --add-rich-rule="rule family=ipv4 source address=$SUBNET port port=3100 protocol=tcp accept"
sudo firewall-cmd --reload
```

---

## 🐞 Bugs, Feedback & Contributions

- **Issue Tracker**: File bug reports, ask questions, or request new features at [github.com/UNSAReport/UNSAReport2/issues](https://github.com/UNSAReport/UNSAReport2/issues).
- **Guidelines**: Before submitting a PR, ensure formatting, tests, and typechecks pass:
  ```bash
  bun run check
  moon run :test
  ```

---

## 📄 License

AGPL-3.0 (GNU Affero General Public License v3.0) — see [LICENSE](file:///home/cricro/projects/UNSAReport/UNSAReport2/LICENSE) for details.
