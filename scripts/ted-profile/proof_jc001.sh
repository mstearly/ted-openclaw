#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SIDECAR="$ROOT_DIR/sidecars/ted-engine/server.mjs"
LOG_DIR="$ROOT_DIR/sidecars/ted-engine/logs"

mkdir -p "$LOG_DIR"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required for proof_jc001.sh"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node is required for proof_jc001.sh"
  exit 1
fi

node "$SIDECAR" >/dev/null 2>&1 &
SIDECAR_PID=$!

cleanup() {
  if kill -0 "$SIDECAR_PID" >/dev/null 2>&1; then
    kill "$SIDECAR_PID" >/dev/null 2>&1 || true
    wait "$SIDECAR_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

ready=0
for _ in $(seq 1 30); do
  if ! kill -0 "$SIDECAR_PID" >/dev/null 2>&1; then
    echo "sidecar exited before becoming ready"
    exit 1
  fi
  if curl -fsS "http://127.0.0.1:48080/status" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 0.2
done

if [[ "$ready" != "1" ]]; then
  echo "sidecar did not become ready at 127.0.0.1:48080"
  exit 1
fi

DOCTOR_JSON="$(curl -fsS "http://127.0.0.1:48080/doctor")"
STATUS_JSON="$(curl -fsS "http://127.0.0.1:48080/status")"

python3 - "$DOCTOR_JSON" "$STATUS_JSON" <<'PY'
import json
import sys

for raw in sys.argv[1:]:
    obj = json.loads(raw)
    for key in ("version", "uptime", "profiles_count"):
        if key not in obj:
            raise SystemExit(f"missing key: {key}")
print("doctor/status payload keys verified")
PY

code="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:48080/not-allowlisted" || true)"
if [[ "$code" != "404" ]]; then
  echo "unexpected status for non-allowlisted endpoint: $code"
  exit 1
fi

echo "JC-001 proof passed"
echo "- /doctor and /status return expected payload keys"
echo "- non-allowlisted sidecar endpoint returns 404"
