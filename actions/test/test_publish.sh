#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly PUBLISH_SCRIPT="${PROJECT_ROOT}/actions/publish/publish.sh"
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

echo "=== All publish tests passed successfully! ==="
