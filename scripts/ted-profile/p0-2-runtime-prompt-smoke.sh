#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PROFILES_CSV="${TED_GRAPH_PROFILES:-${TED_GRAPH_PROFILE:-olumie}}"
BASE_URL="${TED_RUNTIME_SIDECAR_URL:-http://127.0.0.1:48180}"

is_guid() {
  [[ "$1" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$ ]]
}

to_env_key() {
  local raw="$1"
  echo "$raw" | tr '[:lower:]-' '[:upper:]_'
}

prompt_guid() {
  local label="$1"
  local value=""
  while true; do
    read -r -p "$label" value
    value="${value//[$'\r\n\t ']/}"
    if is_guid "$value"; then
      printf '%s\n' "$value"
      return 0
    fi
    echo "Invalid GUID format. Expected: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  done
}

IFS=',' read -r -a profile_list <<<"$PROFILES_CSV"
for i in "${!profile_list[@]}"; do
  profile_list[$i]="$(echo "${profile_list[$i]}" | xargs)"
done

if [ "${#profile_list[@]}" -eq 0 ] || [ -z "${profile_list[0]}" ]; then
  echo "No profiles provided. Set TED_GRAPH_PROFILES or TED_GRAPH_PROFILE."
  exit 2
fi

echo "Runtime GUID prompt mode"
echo "  profiles: ${profile_list[*]}"
echo "  sidecar:  $BASE_URL"
echo ""
echo "GUIDs are used only for this process and are not written to repo config files."
echo ""

for profile in "${profile_list[@]}"; do
  key="$(to_env_key "$profile")"
  tenant_var="TED_${key}_TENANT_ID"
  client_var="TED_${key}_CLIENT_ID"

  tenant_val="${!tenant_var:-}"
  client_val="${!client_var:-}"

  if [ -z "$tenant_val" ]; then
    tenant_val="$(prompt_guid "Enter tenant GUID for $profile: ")"
  fi
  if [ -z "$client_val" ]; then
    client_val="$(prompt_guid "Enter client GUID for $profile: ")"
  fi

  export "$tenant_var=$tenant_val"
  export "$client_var=$client_val"
  export "TED_GRAPH_${key}_TENANT_ID=$tenant_val"
  export "TED_GRAPH_${key}_CLIENT_ID=$client_val"
done

echo ""
echo "=== Runtime bootstrap validation ==="
node "$ROOT_DIR/scripts/ted-profile/p0-2-azure-bootstrap.mjs" --profiles "$PROFILES_CSV"

echo ""
for profile in "${profile_list[@]}"; do
  echo "=== Runtime smoke for profile: $profile ==="
  TED_SIDECAR_URL="$BASE_URL" \
  TED_GRAPH_PROFILE="$profile" \
  TED_START_SIDECAR=1 \
  TED_P0_2_APPLY=0 \
  bash "$ROOT_DIR/scripts/ted-profile/run_p0_2_p0_4.sh"
  echo ""
done

echo "Runtime smoke complete."
echo "Next: run device auth (start/poll) with the same runtime env values for a full live-auth pass."
