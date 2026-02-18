#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
echo "JC-004 proof (proof-first): Deal ledger + triage queue"

# Expect these endpoints to exist after implementation:
REQ_ENDPOINTS=(
  "/deals/list"
  "/triage/list"
)

for ep in "${REQ_ENDPOINTS[@]}"; do
  code="$(curl -sS -o /tmp/jc004.out -w "%{http_code}" "$BASE_URL$ep" || true)"
  if [ "$code" = "404" ]; then
    echo "EXPECTED_FAIL_UNTIL_JC004_IMPLEMENTED: missing $ep"
    cat /tmp/jc004.out || true
    exit 1
  fi
done

echo "OK: endpoints exist (next: functional tests will be added after implementation)"
