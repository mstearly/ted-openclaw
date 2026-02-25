#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
PROFILE_ID="${TED_GRAPH_PROFILE:-olumie}"
START_SIDECAR="${TED_START_SIDECAR:-0}"
APPLY_P0_2="${TED_P0_2_APPLY:-0}"
SIDECAR_LOG="${TED_SIDECAR_LOG:-/tmp/p0-2-p0-4-sidecar.log}"
STATE_DIR="${OPENCLAW_STATE_DIR:-${HOME}/.openclaw}"
RUNTIME_ENV_FILE="${TED_RUNTIME_ENV_FILE:-${STATE_DIR}/ted/graph-runtime.env}"
SIDECAR_PID=""

cleanup() {
  if [ -n "$SIDECAR_PID" ] && kill -0 "$SIDECAR_PID" >/dev/null 2>&1; then
    kill "$SIDECAR_PID" >/dev/null 2>&1 || true
    wait "$SIDECAR_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

load_runtime_graph_env() {
  if [ ! -f "$RUNTIME_ENV_FILE" ]; then
    return 0
  fi

  local loaded=0
  while IFS= read -r line || [ -n "$line" ]; do
    if [ -z "$line" ] || [[ "$line" =~ ^[[:space:]]*# ]]; then
      continue
    fi
    local key="${line%%=*}"
    local value="${line#*=}"
    if [[ "$key" =~ ^TED_GRAPH_[A-Z0-9_]+_(TENANT_ID|CLIENT_ID)$ ]]; then
      export "${key}=${value}"
      export "TED_${key#TED_GRAPH_}=${value}"
      loaded=1
    fi
  done < "$RUNTIME_ENV_FILE"

  if [ "$loaded" -eq 1 ]; then
    echo "Loaded runtime Graph env: $RUNTIME_ENV_FILE"
  fi
}

local_bind_parts() {
  local url="$1"
  if [[ "$url" =~ ^http://(127\.0\.0\.1|localhost):([0-9]{2,5})$ ]]; then
    printf '%s %s\n' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
    return 0
  fi
  return 1
}

load_runtime_graph_env

ensure_sidecar() {
  if curl -fsS "$BASE_URL/status" >/dev/null 2>&1; then
    echo "Using existing sidecar at $BASE_URL"
    return 0
  fi

  if [ "$START_SIDECAR" != "1" ]; then
    echo "Sidecar not reachable at $BASE_URL (set TED_START_SIDECAR=1 to auto-start local sidecar)."
    return 1
  fi

  local bind
  bind="$(local_bind_parts "$BASE_URL" || true)"
  if [ -z "$bind" ]; then
    echo "Auto-start supports only loopback URLs like http://127.0.0.1:<port>."
    return 1
  fi
  local bind_host bind_port
  read -r bind_host bind_port <<<"$bind"

  echo "Starting local sidecar for run on $bind_host:$bind_port ..."
  TED_ENGINE_HOST="$bind_host" TED_ENGINE_PORT="$bind_port" node "$ROOT_DIR/sidecars/ted-engine/server.mjs" >"$SIDECAR_LOG" 2>&1 &
  SIDECAR_PID=$!

  for _ in $(seq 1 40); do
    if ! kill -0 "$SIDECAR_PID" >/dev/null 2>&1; then
      echo "Sidecar exited early. Log:"
      tail -n 120 "$SIDECAR_LOG" || true
      return 1
    fi
    if curl -fsS "$BASE_URL/status" >/dev/null 2>&1; then
      echo "Sidecar ready at $BASE_URL"
      return 0
    fi
    sleep 0.25
  done

  echo "Timed out waiting for sidecar at $BASE_URL"
  tail -n 120 "$SIDECAR_LOG" || true
  return 1
}

echo "=== P0-2 bootstrap check ==="
if [ "$APPLY_P0_2" = "1" ]; then
  node "$ROOT_DIR/scripts/ted-profile/p0-2-azure-bootstrap.mjs" --apply || true
else
  node "$ROOT_DIR/scripts/ted-profile/p0-2-azure-bootstrap.mjs" || true
fi

echo ""
echo "=== P0-4 smoke execution ==="
ensure_sidecar
TED_SIDECAR_URL="$BASE_URL" TED_GRAPH_PROFILE="$PROFILE_ID" bash "$ROOT_DIR/scripts/ted-profile/p0-4-smoke-runner.sh" || true

echo ""
echo "Run complete."
echo "If blocked: provide TED_* tenant/client IDs (runtime env or local config), complete device auth, then rerun this script."
