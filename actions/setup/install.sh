#!/usr/bin/env bash
set -euo pipefail

readonly REPO="UNSAReport/UNSAReport2"
readonly DOWNLOAD_BASE="https://github.com/${REPO}/releases"

if [ -z "${RUNNER_OS:-}" ]; then
  echo "::error::RUNNER_OS environment variable is missing"
  exit 1
fi

if [ -z "${RUNNER_ARCH:-}" ]; then
  echo "::error::RUNNER_ARCH environment variable is missing"
  exit 1
fi

case "${RUNNER_OS}" in
  "Linux")
    OS_SLUG="linux"
    EXE_EXT=""
    ;;
  "macOS")
    OS_SLUG="darwin"
    EXE_EXT=""
    ;;
  "Windows")
    OS_SLUG="windows"
    EXE_EXT=".exe"
    ;;
  *)
    echo "::error::Unsupported operating system: ${RUNNER_OS}"
    exit 1
    ;;
esac

case "${RUNNER_ARCH}" in
  "X64")
    ARCH_SLUG="amd64"
    ;;
  "ARM64")
    ARCH_SLUG="arm64"
    ;;
  *)
    echo "::error::Unsupported architecture: ${RUNNER_ARCH}"
    exit 1
    ;;
esac

readonly BINARY_NAME="unsarep-${OS_SLUG}-${ARCH_SLUG}${EXE_EXT}"
readonly TARGET_BIN="unsarep${EXE_EXT}"

readonly VERSION_DEV="dev"
readonly VERSION_LATEST="latest"
readonly DEFAULT_INSTALL_DIR="/tmp/unsarep-bin"
readonly CHECKSUMS_FILE="checksums.txt"
readonly RETRY_COUNT="3"

VERSION="${1:-${VERSION_LATEST}}"
if [ -z "${VERSION}" ]; then
  VERSION="${VERSION_LATEST}"
fi

ACTION_REF="${ACTION_REF:-${GITHUB_ACTION_REF:-}}"
if [ "${VERSION}" = "${VERSION_LATEST}" ] && [ "${ACTION_REF}" = "${VERSION_DEV}" ]; then
  echo "Action ref '${ACTION_REF}' detected with version '${VERSION_LATEST}'. Automatically resolving version to '${VERSION_DEV}'."
  VERSION="${VERSION_DEV}"
fi

if [ "${VERSION}" = "${VERSION_DEV}" ]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
  TUI_DIR="${REPO_ROOT}/tui"

  if [ ! -d "${TUI_DIR}" ]; then
    echo "::error::Source directory '${TUI_DIR}' not found to build dev CLI."
    exit 1
  fi

  if ! command -v go >/dev/null 2>&1; then
    echo "::error::'go' command is required in PATH to build dev CLI from source."
    exit 1
  fi

  INSTALL_DIR="${RUNNER_TEMP:-${DEFAULT_INSTALL_DIR}}"
  mkdir -p "${INSTALL_DIR}"

  echo "Building unsarep (${VERSION_DEV}) from source at ${TUI_DIR}..."
  (
    cd "${TUI_DIR}"
    CGO_ENABLED=0 go build -ldflags "-s -w -X github.com/UNSAReport/tui/internal/config.Version=${VERSION_DEV}" -o "${INSTALL_DIR}/${TARGET_BIN}" ./cmd/unsarep
  )

  if [ ! -f "${INSTALL_DIR}/${TARGET_BIN}" ]; then
    echo "::error::Build completed but binary not found at ${INSTALL_DIR}/${TARGET_BIN}"
    exit 1
  fi

  chmod +x "${INSTALL_DIR}/${TARGET_BIN}"

  if [ -n "${GITHUB_PATH:-}" ]; then
    echo "${INSTALL_DIR}" >> "${GITHUB_PATH}"
  fi

  RESOLVED_VERSION=$("${INSTALL_DIR}/${TARGET_BIN}" version 2>/dev/null || echo "${VERSION_DEV}")

  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "cli-path=${INSTALL_DIR}/${TARGET_BIN}" >> "${GITHUB_OUTPUT}"
    echo "cli-version=${RESOLVED_VERSION}" >> "${GITHUB_OUTPUT}"
  fi

  echo "Successfully built and installed unsarep (${RESOLVED_VERSION}) at ${INSTALL_DIR}/${TARGET_BIN}"
  exit 0
fi

if [ "${VERSION}" = "${VERSION_LATEST}" ]; then
  DOWNLOAD_URL="${DOWNLOAD_BASE}/latest/download/${BINARY_NAME}"
  CHECKSUMS_URL="${DOWNLOAD_BASE}/latest/download/${CHECKSUMS_FILE}"
else
  DOWNLOAD_URL="${DOWNLOAD_BASE}/download/${VERSION}/${BINARY_NAME}"
  CHECKSUMS_URL="${DOWNLOAD_BASE}/download/${VERSION}/${CHECKSUMS_FILE}"
fi

INSTALL_DIR="${RUNNER_TEMP:-${DEFAULT_INSTALL_DIR}}"
mkdir -p "${INSTALL_DIR}"

echo "Downloading ${BINARY_NAME} (${VERSION}) from ${DOWNLOAD_URL}..."
curl -fsSL --retry "${RETRY_COUNT}" "${DOWNLOAD_URL}" -o "${INSTALL_DIR}/${BINARY_NAME}"
curl -fsSL --retry "${RETRY_COUNT}" "${CHECKSUMS_URL}" -o "${INSTALL_DIR}/${CHECKSUMS_FILE}"

EXPECTED_CHECKSUM=$(grep -E "[[:space:]]${BINARY_NAME}$" "${INSTALL_DIR}/${CHECKSUMS_FILE}" | awk '{print $1}')
if [ -z "${EXPECTED_CHECKSUM}" ]; then
  echo "::error::Checksum for ${BINARY_NAME} not found in ${CHECKSUMS_FILE}"
  exit 1
fi

if command -v sha256sum >/dev/null 2>&1; then
  CALCULATED_CHECKSUM=$(sha256sum "${INSTALL_DIR}/${BINARY_NAME}" | awk '{print $1}')
elif command -v shasum >/dev/null 2>&1; then
  CALCULATED_CHECKSUM=$(shasum -a 256 "${INSTALL_DIR}/${BINARY_NAME}" | awk '{print $1}')
else
  echo "::error::Neither sha256sum nor shasum is available on runner"
  exit 1
fi

if [ "${EXPECTED_CHECKSUM}" != "${CALCULATED_CHECKSUM}" ]; then
  echo "::error::Checksum verification failed for ${BINARY_NAME}!"
  echo "::error::Expected: ${EXPECTED_CHECKSUM}"
  echo "::error::Calculated: ${CALCULATED_CHECKSUM}"
  exit 1
fi

mv "${INSTALL_DIR}/${BINARY_NAME}" "${INSTALL_DIR}/${TARGET_BIN}"
chmod +x "${INSTALL_DIR}/${TARGET_BIN}"
rm -f "${INSTALL_DIR}/${CHECKSUMS_FILE}"

if [ -n "${GITHUB_PATH:-}" ]; then
  echo "${INSTALL_DIR}" >> "${GITHUB_PATH}"
fi

RESOLVED_VERSION=$("${INSTALL_DIR}/${TARGET_BIN}" version 2>/dev/null || echo "${VERSION}")

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "cli-path=${INSTALL_DIR}/${TARGET_BIN}" >> "${GITHUB_OUTPUT}"
  echo "cli-version=${RESOLVED_VERSION}" >> "${GITHUB_OUTPUT}"
fi

echo "Successfully installed unsarep (${RESOLVED_VERSION}) at ${INSTALL_DIR}/${TARGET_BIN}"
