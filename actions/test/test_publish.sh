#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly PUBLISH_SCRIPT="${PROJECT_ROOT}/actions/publish/publish.sh"
readonly INSTALL_SCRIPT="${PROJECT_ROOT}/actions/setup/install.sh"
readonly FIXTURES_DIR="${PROJECT_ROOT}/actions/test/fixtures"
readonly VALID_TOKEN="unsareport_pat_11112222333344445555666677778888"
readonly TEST_TEMP_BASE="${PROJECT_ROOT}/actions/test/.tmp"

cleanup() {
  rm -rf "${TEST_TEMP_BASE}"
}
trap cleanup EXIT
mkdir -p "${TEST_TEMP_BASE}"

echo "=== Running Action Publish Test Suite ==="

echo "--> Test 1.1: Missing token should fail"
if INPUT_TOKEN="" bash "${PUBLISH_SCRIPT}" >/dev/null 2>&1; then
  echo "FAIL: Expected failure on missing token"
  exit 1
fi
echo "PASS: Missing token fails as expected."

echo "--> Test 1.2: Invalid token prefix should fail"
if INPUT_TOKEN="invalid_prefix_123" bash "${PUBLISH_SCRIPT}" >/dev/null 2>&1; then
  echo "FAIL: Expected failure on invalid token prefix"
  exit 1
fi
echo "PASS: Invalid token prefix fails as expected."

echo "--> Test 1.3: Non-existent directory should fail"
if INPUT_TOKEN="${VALID_TOKEN}" INPUT_DIR="non/existent/path" bash "${PUBLISH_SCRIPT}" >/dev/null 2>&1; then
  echo "FAIL: Expected failure on non-existent directory"
  exit 1
fi
echo "PASS: Non-existent directory fails as expected."

echo "--> Test 1.4: Invalid mode should fail"
if INPUT_TOKEN="${VALID_TOKEN}" INPUT_DIR="${FIXTURES_DIR}/sample-pkg" INPUT_MODE="invalid_mode" bash "${PUBLISH_SCRIPT}" >/dev/null 2>&1; then
  echo "FAIL: Expected failure on invalid mode"
  exit 1
fi
echo "PASS: Invalid mode fails as expected."

echo "--> Test 2: Single package dry run and caching"
TEST_CACHE_DIR="${TEST_TEMP_BASE}/cache-single"
TEST_OUTPUT_1="${TEST_TEMP_BASE}/output-single-1.txt"
mkdir -p "${TEST_CACHE_DIR}"

INPUT_TOKEN="${VALID_TOKEN}" \
INPUT_DIR="${FIXTURES_DIR}/sample-pkg" \
INPUT_MODE="package" \
INPUT_DRY_RUN="true" \
INPUT_CACHE="true" \
CACHE_DIR="${TEST_CACHE_DIR}" \
GITHUB_OUTPUT="${TEST_OUTPUT_1}" \
bash "${PUBLISH_SCRIPT}"

if ! grep -q "published-count=1" "${TEST_OUTPUT_1}"; then
  echo "FAIL: Expected published-count=1 in ${TEST_OUTPUT_1}"
  exit 1
fi
if ! grep -q "skipped-count=0" "${TEST_OUTPUT_1}"; then
  echo "FAIL: Expected skipped-count=0 in ${TEST_OUTPUT_1}"
  exit 1
fi
echo "PASS: Single package initial dry run succeeded."

PKG_HASH=$(cd "${FIXTURES_DIR}/sample-pkg" && find . -type f ! -path '*/.git*' -print0 | sort -z | xargs -0 sha256sum | sha256sum | awk '{print $1}')
echo "{\"version\":1,\"scope\":{},\"packages\":{\"@testscope/sample-pkg\":{\"version\":\"0.1.0\",\"content_hash\":\"${PKG_HASH}\"}}}" > "${TEST_CACHE_DIR}/manifest-cache.json"

TEST_OUTPUT_2="${TEST_TEMP_BASE}/output-single-2.txt"
INPUT_TOKEN="${VALID_TOKEN}" \
INPUT_DIR="${FIXTURES_DIR}/sample-pkg" \
INPUT_MODE="package" \
INPUT_DRY_RUN="true" \
INPUT_CACHE="true" \
CACHE_DIR="${TEST_CACHE_DIR}" \
GITHUB_OUTPUT="${TEST_OUTPUT_2}" \
bash "${PUBLISH_SCRIPT}"

if ! grep -q "published-count=0" "${TEST_OUTPUT_2}"; then
  echo "FAIL: Expected published-count=0 after cache match"
  exit 1
fi
if ! grep -q "skipped-count=1" "${TEST_OUTPUT_2}"; then
  echo "FAIL: Expected skipped-count=1 after cache match"
  exit 1
fi
echo "PASS: Single package cache hit successfully skipped publication."

echo "--> Test 3: Scope mode batch processing"
SCOPE_CACHE_DIR="${TEST_TEMP_BASE}/cache-scope"
TEST_OUTPUT_SCOPE_1="${TEST_TEMP_BASE}/output-scope-1.txt"
mkdir -p "${SCOPE_CACHE_DIR}"

INPUT_TOKEN="${VALID_TOKEN}" \
INPUT_DIR="${FIXTURES_DIR}/sample-scope" \
INPUT_MODE="auto" \
INPUT_DRY_RUN="true" \
INPUT_CACHE="true" \
CACHE_DIR="${SCOPE_CACHE_DIR}" \
GITHUB_OUTPUT="${TEST_OUTPUT_SCOPE_1}" \
bash "${PUBLISH_SCRIPT}"

if ! grep -q "scope-name=@testscope" "${TEST_OUTPUT_SCOPE_1}"; then
  echo "FAIL: Expected scope-name=@testscope in ${TEST_OUTPUT_SCOPE_1}"
  exit 1
fi
if ! grep -q "published-count=2" "${TEST_OUTPUT_SCOPE_1}"; then
  echo "FAIL: Expected published-count=2 in ${TEST_OUTPUT_SCOPE_1}"
  exit 1
fi
if ! grep -q "skipped-count=0" "${TEST_OUTPUT_SCOPE_1}"; then
  echo "FAIL: Expected skipped-count=0 in ${TEST_OUTPUT_SCOPE_1}"
  exit 1
fi
echo "PASS: Scope mode batch processing discovered and validated both packages."

echo "--> Test 4: Scope caching & partial package modifications"
WORK_SCOPE="${TEST_TEMP_BASE}/work-scope"
cp -r "${FIXTURES_DIR}/sample-scope" "${WORK_SCOPE}"

PKG_A_HASH=$(cd "${WORK_SCOPE}/packages/pkg-a" && find . -type f ! -path '*/.git*' -print0 | sort -z | xargs -0 sha256sum | sha256sum | awk '{print $1}')
PKG_B_HASH=$(cd "${WORK_SCOPE}/packages/pkg-b" && find . -type f ! -path '*/.git*' -print0 | sort -z | xargs -0 sha256sum | sha256sum | awk '{print $1}')
SCOPE_HASH=$(cd "${WORK_SCOPE}" && find . -type f ! -path '*/.git*' ! -path './packages/*' -print0 | sort -z | xargs -0 sha256sum | sha256sum | awk '{print $1}')

cat << CACHE_EOF > "${SCOPE_CACHE_DIR}/manifest-cache.json"
{
  "version": 1,
  "scope": {
    "@testscope": {
      "content_hash": "${SCOPE_HASH}"
    }
  },
  "packages": {
    "@testscope/pkg-a": {
      "version": "0.1.0",
      "content_hash": "${PKG_A_HASH}"
    },
    "@testscope/pkg-b": {
      "version": "0.2.0",
      "content_hash": "${PKG_B_HASH}"
    }
  }
}
CACHE_EOF

TEST_OUTPUT_SCOPE_2="${TEST_TEMP_BASE}/output-scope-2.txt"
INPUT_TOKEN="${VALID_TOKEN}" \
INPUT_DIR="${WORK_SCOPE}" \
INPUT_MODE="scope" \
INPUT_DRY_RUN="true" \
INPUT_CACHE="true" \
CACHE_DIR="${SCOPE_CACHE_DIR}" \
GITHUB_OUTPUT="${TEST_OUTPUT_SCOPE_2}" \
bash "${PUBLISH_SCRIPT}"

if ! grep -q "published-count=0" "${TEST_OUTPUT_SCOPE_2}"; then
  echo "FAIL: Expected published-count=0 when all packages are cached"
  exit 1
fi
if ! grep -q "skipped-count=2" "${TEST_OUTPUT_SCOPE_2}"; then
  echo "FAIL: Expected skipped-count=2 when all packages are cached"
  exit 1
fi
echo "PASS: Scope cache hit correctly skipped all unchanged packages."

echo "// modified" >> "${WORK_SCOPE}/packages/pkg-a/lib.typ"
TEST_OUTPUT_SCOPE_3="${TEST_TEMP_BASE}/output-scope-3.txt"
INPUT_TOKEN="${VALID_TOKEN}" \
INPUT_DIR="${WORK_SCOPE}" \
INPUT_MODE="scope" \
INPUT_DRY_RUN="true" \
INPUT_CACHE="true" \
CACHE_DIR="${SCOPE_CACHE_DIR}" \
GITHUB_OUTPUT="${TEST_OUTPUT_SCOPE_3}" \
bash "${PUBLISH_SCRIPT}"

if ! grep -q "published-count=1" "${TEST_OUTPUT_SCOPE_3}"; then
  echo "FAIL: Expected published-count=1 after modifying pkg-a"
  exit 1
fi
if ! grep -q "skipped-count=1" "${TEST_OUTPUT_SCOPE_3}"; then
  echo "FAIL: Expected skipped-count=1 for unchanged pkg-b"
  exit 1
fi
echo "PASS: Partial change detection verified: pkg-a processed, pkg-b skipped."

echo "--> Test 5: install.sh build dev CLI from source"
INSTALL_TEST_DIR="${TEST_TEMP_BASE}/install-dev-bin"
mkdir -p "${INSTALL_TEST_DIR}"
INSTALL_OUTPUT="${TEST_TEMP_BASE}/install-output.txt"

RUNNER_OS="Linux" RUNNER_ARCH="X64" RUNNER_TEMP="${INSTALL_TEST_DIR}" GITHUB_OUTPUT="${INSTALL_OUTPUT}" \
bash "${INSTALL_SCRIPT}" dev

if [ ! -f "${INSTALL_TEST_DIR}/unsarep" ]; then
  echo "FAIL: Expected unsarep executable in ${INSTALL_TEST_DIR}"
  exit 1
fi
if ! grep -q "cli-version=unsarep dev" "${INSTALL_OUTPUT}"; then
  echo "FAIL: Expected cli-version=unsarep dev in ${INSTALL_OUTPUT}"
  exit 1
fi
echo "PASS: install.sh dev successfully compiled CLI from source."

echo "--> Test 6: Scope manifest with [workspace] table"
WS_SCOPE="${TEST_TEMP_BASE}/ws-scope"
cp -r "${FIXTURES_DIR}/sample-scope" "${WS_SCOPE}"
cat << 'WS_EOF' > "${WS_SCOPE}/unsareport.toml"
[project]
config_version = 1

[workspace]
packages = ["packages/*"]

[scope]
name = "@testscope"
description = "Scope fixture with workspace declaration"
files = ["README.md"]
WS_EOF

WS_OUTPUT="${TEST_TEMP_BASE}/output-ws-scope.txt"
WS_CACHE="${TEST_TEMP_BASE}/cache-ws-scope"
mkdir -p "${WS_CACHE}"

INPUT_TOKEN="${VALID_TOKEN}" \
INPUT_DIR="${WS_SCOPE}" \
INPUT_MODE="scope" \
INPUT_DRY_RUN="true" \
INPUT_CACHE="false" \
CACHE_DIR="${WS_CACHE}" \
GITHUB_OUTPUT="${WS_OUTPUT}" \
bash "${PUBLISH_SCRIPT}"

if ! grep -q "scope-name=@testscope" "${WS_OUTPUT}"; then
  echo "FAIL: Expected scope-name=@testscope in ${WS_OUTPUT}"
  exit 1
fi
if ! grep -q "published-count=2" "${WS_OUTPUT}"; then
  echo "FAIL: Expected published-count=2 for scope with [workspace]"
  exit 1
fi
echo "PASS: Scope manifest with [workspace] processed and packages evaluated successfully."

echo "--> Test 7: Dry-run without token should succeed"
NO_TOKEN_OUTPUT="${TEST_TEMP_BASE}/output-no-token.txt"
NO_TOKEN_CACHE="${TEST_TEMP_BASE}/cache-no-token"
mkdir -p "${NO_TOKEN_CACHE}"

INPUT_TOKEN="" \
INPUT_DIR="${FIXTURES_DIR}/sample-pkg" \
INPUT_MODE="package" \
INPUT_DRY_RUN="true" \
INPUT_CACHE="false" \
CACHE_DIR="${NO_TOKEN_CACHE}" \
GITHUB_OUTPUT="${NO_TOKEN_OUTPUT}" \
bash "${PUBLISH_SCRIPT}"

if ! grep -q "published-count=1" "${NO_TOKEN_OUTPUT}"; then
  echo "FAIL: Expected published-count=1 when dry-running without token"
  exit 1
fi
echo "PASS: Dry-run without token succeeded."

echo "--> Test 8: Placeholder token with dry-run=false auto-converts to dry-run"
DUMMY_OUTPUT="${TEST_TEMP_BASE}/output-dummy-token.txt"
DUMMY_CACHE="${TEST_TEMP_BASE}/cache-dummy-token"
mkdir -p "${DUMMY_CACHE}"

INPUT_TOKEN="unsareport_pat_00000000000000000000000000000000" \
INPUT_DIR="${FIXTURES_DIR}/sample-pkg" \
INPUT_MODE="package" \
INPUT_DRY_RUN="false" \
INPUT_CACHE="false" \
CACHE_DIR="${DUMMY_CACHE}" \
GITHUB_OUTPUT="${DUMMY_OUTPUT}" \
bash "${PUBLISH_SCRIPT}"

if ! grep -q "published-count=1" "${DUMMY_OUTPUT}"; then
  echo "FAIL: Expected published-count=1 when running with placeholder token"
  exit 1
fi
echo "PASS: Placeholder token auto-converted to dry-run and succeeded."

echo "--> Test 9: Registry URL normalization from bare origin"
NORM_OUTPUT="${TEST_TEMP_BASE}/output-norm-url.txt"
NORM_CACHE="${TEST_TEMP_BASE}/cache-norm-url"
mkdir -p "${NORM_CACHE}"

INPUT_TOKEN="${VALID_TOKEN}" \
INPUT_DIR="${FIXTURES_DIR}/sample-pkg" \
INPUT_MODE="package" \
INPUT_REGISTRY_URL="https://unsareport.ynoacamino.tech" \
INPUT_DRY_RUN="true" \
INPUT_CACHE="false" \
CACHE_DIR="${NORM_CACHE}" \
GITHUB_OUTPUT="${NORM_OUTPUT}" \
bash "${PUBLISH_SCRIPT}"

if ! grep -q "published-count=1" "${NORM_OUTPUT}"; then
  echo "FAIL: Expected published-count=1 with bare origin registry URL"
  exit 1
fi
echo "PASS: Registry URL normalization succeeded."

echo "--> Test 10: Remote version exists with matching content skips publish"
REMOTE_EXISTS_OUTPUT="${TEST_TEMP_BASE}/output-remote-exists.txt"
REMOTE_EXISTS_CACHE="${TEST_TEMP_BASE}/cache-remote-exists"
mkdir -p "${REMOTE_EXISTS_CACHE}"

# Start tiny mock registry responding 200 with matching file checksum
bun -e '
  const s = Bun.serve({
    port: 9877,
    fetch(req) {
      if (req.url.includes("/v1/packages/")) {
        return new Response(JSON.stringify({
          version: "0.1.0",
          files: [{ path: "lib.typ", checksum: "57c86b9cdb3da24d792ae5cf27c00f1a08ab35ea05e13aa093cbf34e59437c72" }]
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response("Not found", { status: 404 });
    }
  });
  setInterval(() => {}, 1000);
' >/dev/null 2>&1 &
MOCK_SERVER_PID=$!

sleep 0.2

INPUT_TOKEN="${VALID_TOKEN}" \
INPUT_DIR="${FIXTURES_DIR}/sample-pkg" \
INPUT_MODE="package" \
INPUT_REGISTRY_URL="http://127.0.0.1:9877" \
INPUT_DRY_RUN="false" \
INPUT_CACHE="false" \
CACHE_DIR="${REMOTE_EXISTS_CACHE}" \
GITHUB_OUTPUT="${REMOTE_EXISTS_OUTPUT}" \
bash "${PUBLISH_SCRIPT}"

kill "${MOCK_SERVER_PID}" 2>/dev/null || true

if ! grep -q "skipped-count=1" "${REMOTE_EXISTS_OUTPUT}"; then
  echo "FAIL: Expected skipped-count=1 when package version already exists remotely with matching content"
  exit 1
fi
if ! grep -q "published-count=0" "${REMOTE_EXISTS_OUTPUT}"; then
  echo "FAIL: Expected published-count=0 when package version already exists remotely with matching content"
  exit 1
fi
echo "PASS: Package already existing in remote registry with matching content was skipped successfully."

echo "--> Test 11: Remote version exists with DIFFERENT content fails fast"
REMOTE_DIFF_OUTPUT="${TEST_TEMP_BASE}/output-remote-diff.txt"
REMOTE_DIFF_CACHE="${TEST_TEMP_BASE}/cache-remote-diff"
mkdir -p "${REMOTE_DIFF_CACHE}"

# Start mock registry responding 200 with non-matching checksum
bun -e '
  const s = Bun.serve({
    port: 9878,
    fetch(req) {
      if (req.url.includes("/v1/packages/")) {
        return new Response(JSON.stringify({
          version: "0.1.0",
          files: [{ path: "lib.typ", checksum: "0000000000000000000000000000000000000000000000000000000000000000" }]
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response("Not found", { status: 404 });
    }
  });
  setInterval(() => {}, 1000);
' >/dev/null 2>&1 &
MOCK_SERVER_PID_2=$!

sleep 0.2

test_11_failed=0
INPUT_TOKEN="${VALID_TOKEN}" \
INPUT_DIR="${FIXTURES_DIR}/sample-pkg" \
INPUT_MODE="package" \
INPUT_REGISTRY_URL="http://127.0.0.1:9878" \
INPUT_DRY_RUN="false" \
INPUT_CACHE="false" \
CACHE_DIR="${REMOTE_DIFF_CACHE}" \
GITHUB_OUTPUT="${REMOTE_DIFF_OUTPUT}" \
bash "${PUBLISH_SCRIPT}" >/dev/null 2>&1 || test_11_failed=1

kill "${MOCK_SERVER_PID_2}" 2>/dev/null || true

if [ ${test_11_failed} -ne 1 ]; then
  echo "FAIL: Expected publish.sh to exit with error when remote version exists with different checksum"
  exit 1
fi
echo "PASS: Remote version with checksum mismatch failed fast as expected."

echo "--> Test 12: Dry-run with remote checksum mismatch also fails fast"
test_12_failed=0
bun -e '
  const s = Bun.serve({
    port: 9879,
    fetch(req) {
      if (req.url.includes("/v1/packages/")) {
        return new Response(JSON.stringify({
          version: "0.1.0",
          files: [{ path: "lib.typ", checksum: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }]
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response("Not found", { status: 404 });
    }
  });
  setInterval(() => {}, 1000);
' >/dev/null 2>&1 &
MOCK_SERVER_PID_3=$!

sleep 0.2

INPUT_TOKEN="${VALID_TOKEN}" \
INPUT_DIR="${FIXTURES_DIR}/sample-pkg" \
INPUT_MODE="package" \
INPUT_REGISTRY_URL="http://127.0.0.1:9879" \
INPUT_DRY_RUN="true" \
INPUT_CACHE="false" \
CACHE_DIR="${TEST_TEMP_BASE}/cache-dry-mismatch" \
GITHUB_OUTPUT="${TEST_TEMP_BASE}/output-dry-mismatch.txt" \
bash "${PUBLISH_SCRIPT}" >/dev/null 2>&1 || test_12_failed=1

kill "${MOCK_SERVER_PID_3}" 2>/dev/null || true

if [ ${test_12_failed} -ne 1 ]; then
  echo "FAIL: Expected dry-run to exit with error when remote version exists with different checksum"
  exit 1
fi
echo "PASS: Dry run with unbumped checksum mismatch failed fast as expected."

echo "=== All publish tests passed successfully! ==="
