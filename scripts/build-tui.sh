#!/usr/bin/env bash
set -euo pipefail

OUT="${1:-dist/unsarep}"
COMMIT="${COMMIT:-$(git rev-parse --short HEAD 2>/dev/null || echo unknown)}"
BRANCH="${BRANCH:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo dev)}"
DATE="${DATE:-$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo unknown)}"
VERSION="${VERSION:-dev}"
CHANNEL="${CHANNEL:-stable}"

LDFLAGS="-s -w \
  -X github.com/UNSAReport/tui/internal/config.Version=${VERSION} \
  -X github.com/UNSAReport/tui/internal/config.GitCommit=${COMMIT} \
  -X github.com/UNSAReport/tui/internal/config.GitBranch=${BRANCH} \
  -X github.com/UNSAReport/tui/internal/config.BuildDate=${DATE} \
  -X github.com/UNSAReport/tui/internal/config.Channel=${CHANNEL}"

mkdir -p "$(dirname "${OUT}")"
exec go build -ldflags "${LDFLAGS}" -o "${OUT}" ./cmd/unsarep
