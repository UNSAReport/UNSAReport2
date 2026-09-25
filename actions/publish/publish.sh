#!/usr/bin/env bash
set -euo pipefail

readonly PAT_PREFIX="unsareport_pat_"
readonly CONFIG_FILENAME="unsareport.toml"
readonly CACHE_FILE_NAME="manifest-cache.json"
readonly DEFAULT_REGISTRY_URL="https://unsareport.ynoacamino.tech"
readonly DEFAULT_PACKAGES_DIR="packages"
readonly DEFAULT_DIR="."
readonly MODE_PACKAGE="package"
readonly MODE_SCOPE="scope"
readonly MODE_AUTO="auto"
readonly TRUE_VAL="true"
readonly FALSE_VAL="false"

INPUT_TOKEN="${INPUT_TOKEN:-}"
INPUT_DIR="${INPUT_DIR:-${DEFAULT_DIR}}"
INPUT_MODE="${INPUT_MODE:-${MODE_AUTO}}"
INPUT_PACKAGES_DIR="${INPUT_PACKAGES_DIR:-${DEFAULT_PACKAGES_DIR}}"
INPUT_REGISTRY_URL="${INPUT_REGISTRY_URL:-${DEFAULT_REGISTRY_URL}}"
INPUT_CHECK="${INPUT_CHECK:-${TRUE_VAL}}"
INPUT_DRY_RUN="${INPUT_DRY_RUN:-${FALSE_VAL}}"
INPUT_CACHE="${INPUT_CACHE:-${TRUE_VAL}}"
INPUT_PUSH_SCOPE="${INPUT_PUSH_SCOPE:-${TRUE_VAL}}"
CACHE_DIR="${CACHE_DIR:-${RUNNER_TEMP:-/tmp}/unsarep-cache}"
OUTPUT_FILE="${GITHUB_OUTPUT:-/dev/null}"

if [ -z "${INPUT_TOKEN}" ]; then
  echo "::error::Missing required input: token. Please provide a valid UNSAReport Personal Access Token (PAT)."
  exit 1
fi

echo "::add-mask::${INPUT_TOKEN}"

if [[ ! "${INPUT_TOKEN}" =~ ^${PAT_PREFIX} ]]; then
  echo "::error::Invalid token format. Personal Access Tokens must begin with '${PAT_PREFIX}'."
  exit 1
fi

if [ ! -d "${INPUT_DIR}" ]; then
  echo "::error::Specified directory '${INPUT_DIR}' does not exist."
  exit 1
fi

if [ "${INPUT_MODE}" != "${MODE_AUTO}" ] && [ "${INPUT_MODE}" != "${MODE_PACKAGE}" ] && [ "${INPUT_MODE}" != "${MODE_SCOPE}" ]; then
  echo "::error::Invalid mode '${INPUT_MODE}'. Supported modes are '${MODE_AUTO}', '${MODE_PACKAGE}', and '${MODE_SCOPE}'."
  exit 1
fi

compute_content_hash() {
  local target_dir="$1"
  shift
  local exclude_args=()
  while [ "$#" -gt 0 ]; do
    exclude_args+=(! -path "$1")
    shift
  done

  if [ ! -d "${target_dir}" ]; then
    echo "::error::Directory '${target_dir}' does not exist for hash computation."
    exit 1
  fi

  (
    cd "${target_dir}"
    if command -v sha256sum >/dev/null 2>&1; then
      find . -type f ! -path '*/.git*' "${exclude_args[@]}" -print0 | sort -z | xargs -0 sha256sum 2>/dev/null | sha256sum | awk '{print $1}'
    elif command -v shasum >/dev/null 2>&1; then
      find . -type f ! -path '*/.git*' "${exclude_args[@]}" -print0 | sort -z | xargs -0 shasum -a 256 2>/dev/null | shasum -a 256 | awk '{print $1}'
    else
      echo "::error::Neither sha256sum nor shasum is available on runner for content hashing."
      exit 1
    fi
  )
}

extract_manifest_val() {
  local file="$1"
  local section="$2"
  local key="$3"

  if [ ! -f "${file}" ]; then
    echo ""
    return
  fi

  awk -v sec="${section}" -v k="${key}" '
    BEGIN { in_sec = 0 }
    /^[[:space:]]*\[.*\]/ {
      gsub(/[[:space:]\[\]]/, "", $0)
      if ($0 == sec) { in_sec = 1 } else { in_sec = 0 }
      next
    }
    in_sec && $0 ~ "^[[:space:]]*" k "[[:space:]]*=" {
      split($0, parts, "=")
      val = parts[2]
      gsub(/["'\''[:space:]]/, "", val)
      print val
      exit
    }
  ' "${file}"
}

RESOLVED_MODE="${INPUT_MODE}"
ROOT_MANIFEST="${INPUT_DIR}/${CONFIG_FILENAME}"
PACKAGES_SEARCH_DIR="${INPUT_DIR}/${INPUT_PACKAGES_DIR}"

if [ "${RESOLVED_MODE}" = "${MODE_AUTO}" ]; then
  if [ -f "${ROOT_MANIFEST}" ] && grep -q '^[[:space:]]*\[scope\]' "${ROOT_MANIFEST}"; then
    RESOLVED_MODE="${MODE_SCOPE}"
  elif [ -f "${ROOT_MANIFEST}" ] && grep -q '^[[:space:]]*\[package\]' "${ROOT_MANIFEST}"; then
    RESOLVED_MODE="${MODE_PACKAGE}"
  elif [ -d "${PACKAGES_SEARCH_DIR}" ]; then
    RESOLVED_MODE="${MODE_SCOPE}"
  else
    echo "::error::Auto-detection failed: '${ROOT_MANIFEST}' not found or lacks [package]/[scope], and '${PACKAGES_SEARCH_DIR}' does not exist."
    exit 1
  fi
fi

echo "Operating in '${RESOLVED_MODE}' mode."

mkdir -p "${CACHE_DIR}"
CACHE_FILE_PATH="${CACHE_DIR}/${CACHE_FILE_NAME}"

if [ -f "${CACHE_FILE_PATH}" ]; then
  CACHE_DATA=$(cat "${CACHE_FILE_PATH}")
  if ! echo "${CACHE_DATA}" | jq . >/dev/null 2>&1; then
    echo "::warning::Corrupted cache file found at ${CACHE_FILE_PATH}. Reinitializing empty cache."
    CACHE_DATA='{"version":1,"scope":{},"packages":{}}'
  fi
else
  CACHE_DATA='{"version":1,"scope":{},"packages":{}}'
fi

CACHE_UPDATED="${FALSE_VAL}"
SCOPE_NAME=""
PUBLISHED_PKGS=()
SKIPPED_PKGS=()
TOTAL_PKGS=0
LAST_PKG_NAME=""
LAST_PKG_VERSION=""

if [ "${RESOLVED_MODE}" = "${MODE_SCOPE}" ]; then
  if [ -f "${ROOT_MANIFEST}" ] && grep -q '^[[:space:]]*\[scope\]' "${ROOT_MANIFEST}"; then
    SCOPE_NAME=$(extract_manifest_val "${ROOT_MANIFEST}" "scope" "name")
    if [ -z "${SCOPE_NAME}" ]; then
      echo "::error::[scope] table found in ${ROOT_MANIFEST} but 'name' is missing."
      exit 1
    fi
    echo "Scope manifest detected for '${SCOPE_NAME}'."

    REL_PACKAGES_PATH="./${INPUT_PACKAGES_DIR}/*"
    SCOPE_HASH=$(compute_content_hash "${INPUT_DIR}" "${REL_PACKAGES_PATH}")
    CACHED_SCOPE_HASH=$(echo "${CACHE_DATA}" | jq -r --arg s "${SCOPE_NAME}" '.scope[$s].content_hash // empty')

    if [ "${INPUT_CACHE}" = "${TRUE_VAL}" ] && [ "${CACHED_SCOPE_HASH}" = "${SCOPE_HASH}" ]; then
      echo "Scope '${SCOPE_NAME}' has not changed (cached hash: ${SCOPE_HASH:0:12}). Skipping scope push."
    else
      echo "Scope '${SCOPE_NAME}' changed or not cached (hash: ${SCOPE_HASH:0:12})."
      if [ "${INPUT_PUSH_SCOPE}" = "${TRUE_VAL}" ]; then
        if [ "${INPUT_DRY_RUN}" = "${TRUE_VAL}" ]; then
          echo "[dry-run] Validated scope '${SCOPE_NAME}'. Skipping scope push."
        else
          echo "Pushing scope '${SCOPE_NAME}' configuration from '${INPUT_DIR}'..."
          UNSAREP_TOKEN="${INPUT_TOKEN}" UNSAREP_REGISTRY_URL="${INPUT_REGISTRY_URL}" unsarep registry scope push "${INPUT_DIR}"
          CACHE_DATA=$(echo "${CACHE_DATA}" | jq --arg s "${SCOPE_NAME}" --arg h "${SCOPE_HASH}" '.scope[$s] = {"content_hash": $h}')
          CACHE_UPDATED="${TRUE_VAL}"
        fi
      else
        echo "Scope push disabled via input push-scope=false."
      fi
    fi
  fi
fi

TARGET_PKG_DIRS=()

if [ "${RESOLVED_MODE}" = "${MODE_PACKAGE}" ]; then
  if [ ! -f "${ROOT_MANIFEST}" ]; then
    echo "::error::Package manifest '${CONFIG_FILENAME}' not found in '${INPUT_DIR}'."
    exit 1
  fi
  if ! grep -q '^[[:space:]]*\[package\]' "${ROOT_MANIFEST}"; then
    echo "::error::Manifest '${ROOT_MANIFEST}' does not declare a [package] table."
    exit 1
  fi
  TARGET_PKG_DIRS+=("${INPUT_DIR}")
elif [ "${RESOLVED_MODE}" = "${MODE_SCOPE}" ]; then
  if [ ! -d "${PACKAGES_SEARCH_DIR}" ]; then
    echo "::error::Packages directory '${PACKAGES_SEARCH_DIR}' does not exist for scope '${SCOPE_NAME:-unknown}'."
    exit 1
  fi

  while IFS= read -r manifest_file; do
    if [ -n "${manifest_file}" ]; then
      pkg_dir=$(dirname "${manifest_file}")
      if grep -q '^[[:space:]]*\[package\]' "${manifest_file}"; then
        TARGET_PKG_DIRS+=("${pkg_dir}")
      fi
    fi
  done < <(find "${PACKAGES_SEARCH_DIR}" -type f -name "${CONFIG_FILENAME}" | sort)

  if [ ${#TARGET_PKG_DIRS[@]} -eq 0 ]; then
    echo "::error::No package manifests containing [package] were found under '${PACKAGES_SEARCH_DIR}'."
    exit 1
  fi
fi

TOTAL_PKGS=${#TARGET_PKG_DIRS[@]}
echo "Found ${TOTAL_PKGS} package(s) to evaluate."

for pkg_dir in "${TARGET_PKG_DIRS[@]}"; do
  manifest="${pkg_dir}/${CONFIG_FILENAME}"
  PKG_NAME=$(extract_manifest_val "${manifest}" "package" "name")
  PKG_VERSION=$(extract_manifest_val "${manifest}" "package" "version")

  if [ -z "${PKG_NAME}" ]; then
    echo "::error::Missing 'name' under [package] in '${manifest}'."
    exit 1
  fi
  if [ -z "${PKG_VERSION}" ]; then
    echo "::error::Missing 'version' under [package] in '${manifest}'."
    exit 1
  fi

  LAST_PKG_NAME="${PKG_NAME}"
  LAST_PKG_VERSION="${PKG_VERSION}"

  PKG_HASH=$(compute_content_hash "${pkg_dir}")
  CACHED_VERSION=$(echo "${CACHE_DATA}" | jq -r --arg pkg "${PKG_NAME}" '.packages[$pkg].version // empty')
  CACHED_HASH=$(echo "${CACHE_DATA}" | jq -r --arg pkg "${PKG_NAME}" '.packages[$pkg].content_hash // empty')

  if [ "${INPUT_CACHE}" = "${TRUE_VAL}" ] && [ "${CACHED_VERSION}" = "${PKG_VERSION}" ] && [ "${CACHED_HASH}" = "${PKG_HASH}" ]; then
    echo "Package '${PKG_NAME}@${PKG_VERSION}' is unchanged (cached hash: ${PKG_HASH:0:12}). Skipping publish."
    SKIPPED_PKGS+=("${PKG_NAME}@${PKG_VERSION}")
  else
    echo "Package '${PKG_NAME}@${PKG_VERSION}' changed or not cached (hash: ${PKG_HASH:0:12})."

    if [ "${INPUT_CHECK}" = "${TRUE_VAL}" ]; then
      echo "Checking package validity for '${pkg_dir}'..."
      unsarep registry check "${pkg_dir}"
    fi

    if [ "${INPUT_DRY_RUN}" = "${TRUE_VAL}" ]; then
      echo "[dry-run] Package '${PKG_NAME}@${PKG_VERSION}' passed check. Skipping publish step."
      PUBLISHED_PKGS+=("${PKG_NAME}@${PKG_VERSION}")
    else
      echo "Publishing '${PKG_NAME}@${PKG_VERSION}' from '${pkg_dir}' to registry '${INPUT_REGISTRY_URL}'..."
      UNSAREP_TOKEN="${INPUT_TOKEN}" UNSAREP_REGISTRY_URL="${INPUT_REGISTRY_URL}" unsarep registry publish "${pkg_dir}"
      CACHE_DATA=$(echo "${CACHE_DATA}" | jq --arg pkg "${PKG_NAME}" --arg ver "${PKG_VERSION}" --arg hash "${PKG_HASH}" \
        '.packages[$pkg] = {"version": $ver, "content_hash": $hash}')
      CACHE_UPDATED="${TRUE_VAL}"
      PUBLISHED_PKGS+=("${PKG_NAME}@${PKG_VERSION}")
    fi
  fi
done

if [ "${CACHE_UPDATED}" = "${TRUE_VAL}" ] && [ "${INPUT_DRY_RUN}" != "${TRUE_VAL}" ] && [ "${INPUT_CACHE}" = "${TRUE_VAL}" ]; then
  echo "${CACHE_DATA}" > "${CACHE_FILE_PATH}"
  echo "Cache updated successfully at ${CACHE_FILE_PATH}."
fi

PUBLISHED_COUNT=${#PUBLISHED_PKGS[@]}
SKIPPED_COUNT=${#SKIPPED_PKGS[@]}

if [ ${PUBLISHED_COUNT} -eq 0 ]; then
  PUBLISHED_JSON="[]"
else
  PUBLISHED_JSON=$(printf '%s\n' "${PUBLISHED_PKGS[@]}" | jq -R . | jq -s -c .)
fi

if [ ${SKIPPED_COUNT} -eq 0 ]; then
  SKIPPED_JSON="[]"
else
  SKIPPED_JSON=$(printf '%s\n' "${SKIPPED_PKGS[@]}" | jq -R . | jq -s -c .)
fi

{
  echo "package-name=${LAST_PKG_NAME}"
  echo "package-version=${LAST_PKG_VERSION}"
  echo "scope-name=${SCOPE_NAME}"
  echo "published-packages=${PUBLISHED_JSON}"
  echo "skipped-packages=${SKIPPED_JSON}"
  echo "published-count=${PUBLISHED_COUNT}"
  echo "skipped-count=${SKIPPED_COUNT}"
  echo "total-packages=${TOTAL_PKGS}"
  echo "cache-updated=${CACHE_UPDATED}"
} >> "${OUTPUT_FILE}"

echo "Publish run finished: ${PUBLISHED_COUNT} published/validated, ${SKIPPED_COUNT} skipped from cache (Total: ${TOTAL_PKGS})."
