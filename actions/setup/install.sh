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

VERSION="${1:-latest}"
if [ -z "${VERSION}" ]; then
  VERSION="latest"
fi

if [ "${VERSION}" = "latest" ]; then
  DOWNLOAD_URL="${DOWNLOAD_BASE}/latest/download/${BINARY_NAME}"
  CHECKSUMS_URL="${DOWNLOAD_BASE}/latest/download/checksums.txt"
else
  DOWNLOAD_URL="${DOWNLOAD_BASE}/download/${VERSION}/${BINARY_NAME}"
  CHECKSUMS_URL="${DOWNLOAD_BASE}/download/${VERSION}/checksums.txt"
fi

INSTALL_DIR="${RUNNER_TEMP:-/tmp}/unsarep-bin"
mkdir -p "${INSTALL_DIR}"

echo "Downloading ${BINARY_NAME} (${VERSION}) from ${DOWNLOAD_URL}..."
curl -fsSL --retry 3 "${DOWNLOAD_URL}" -o "${INSTALL_DIR}/${BINARY_NAME}"
curl -fsSL --retry 3 "${CHECKSUMS_URL}" -o "${INSTALL_DIR}/checksums.txt"

EXPECTED_CHECKSUM=$(grep -E "[[:space:]]${BINARY_NAME}$" "${INSTALL_DIR}/checksums.txt" | awk '{print $1}')
if [ -z "${EXPECTED_CHECKSUM}" ]; then
  echo "::error::Checksum for ${BINARY_NAME} not found in checksums.txt"
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
rm -f "${INSTALL_DIR}/checksums.txt"

if [ -n "${GITHUB_PATH:-}" ]; then
  echo "${INSTALL_DIR}" >> "${GITHUB_PATH}"
fi

RESOLVED_VERSION=$("${INSTALL_DIR}/${TARGET_BIN}" version 2>/dev/null || echo "${VERSION}")

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "cli-path=${INSTALL_DIR}/${TARGET_BIN}" >> "${GITHUB_OUTPUT}"
  echo "cli-version=${RESOLVED_VERSION}" >> "${GITHUB_OUTPUT}"
fi

echo "Successfully installed unsarep (${RESOLVED_VERSION}) at ${INSTALL_DIR}/${TARGET_BIN}"
