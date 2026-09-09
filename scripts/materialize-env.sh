#!/usr/bin/env bash
set -euo pipefail

readonly DEFAULT_ENV="dev"
readonly GLOBAL_SECRETS_PREFIX="global"

ENV="${ENV:-$DEFAULT_ENV}"

if [ -n "${MOON_WORKSPACE_ROOT:-}" ]; then
  ROOT="$MOON_WORKSPACE_ROOT"
else
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

CAN_DECRYPT=false
if command -v sops >/dev/null 2>&1 && [ -f "$ROOT/secrets/${GLOBAL_SECRETS_PREFIX}.${ENV}.enc.env" ]; then
  if sops decrypt "$ROOT/secrets/${GLOBAL_SECRETS_PREFIX}.${ENV}.enc.env" >/dev/null 2>&1; then
    CAN_DECRYPT=true
    echo "[decrypt] SOPS keys detected. Decrypting secrets vaults."
  else
    CAN_DECRYPT=false
    echo "[decrypt] SOPS keys not found or vault decryption unavailable. Skipping SOPS vaults (using examples + overrides)."
  fi
else
  CAN_DECRYPT=false
  echo "[decrypt] SOPS CLI or secrets/${GLOBAL_SECRETS_PREFIX}.${ENV}.enc.env not found. Skipping SOPS vaults (using examples + overrides)."
fi

materialize_target() {
  local target_rel_dir="$1"
  local app_vault_name="$2"

  local target_dir
  if [ -n "$target_rel_dir" ]; then
    target_dir="$ROOT/$target_rel_dir"
  else
    target_dir="$ROOT"
  fi

  local example_file="$target_dir/.env.example"
  local output_file="$target_dir/.env.${ENV}"
  local global_override="$ROOT/.env.${ENV}.override"
  local service_override="$target_dir/.env.${ENV}.override"

  if [ ! -f "$example_file" ]; then
    echo "[decrypt] Error: Example template '$example_file' not found." >&2
    exit 1
  fi

  cp "$example_file" "$output_file"

  if [ "$CAN_DECRYPT" = "true" ]; then
    local global_vault="$ROOT/secrets/${GLOBAL_SECRETS_PREFIX}.${ENV}.enc.env"
    if [ -f "$global_vault" ]; then
      sops decrypt "$global_vault" >> "$output_file"
    else
      echo "[decrypt] Error: Expected global vault '$global_vault' does not exist." >&2
      exit 1
    fi

    if [ -n "$app_vault_name" ]; then
      local app_vault="$ROOT/secrets/${app_vault_name}.${ENV}.enc.env"
      if [ -f "$app_vault" ]; then
        sops decrypt "$app_vault" >> "$output_file"
      fi
    fi
  fi

  if [ -f "$global_override" ]; then
    cat "$global_override" >> "$output_file"
  fi

  if [ -n "$target_rel_dir" ] && [ -f "$service_override" ]; then
    cat "$service_override" >> "$output_file"
  fi
}

materialize_target "" ""
materialize_target "auth" "auth"
materialize_target "registry" "registry"
materialize_target "slides" "slides"
materialize_target "web" ""
materialize_target "tui" ""
