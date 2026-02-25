#!/usr/bin/env bash
set -euo pipefail

echo "JC-012 proof: workflow vs agent boundary contract"
BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
source "$(dirname "$0")/lib_auth.sh"

CONTRACT_FILE="docs/ted-profile/sdd-pack/18_WORKFLOW_AGENT_BOUNDARY_CONTRACT.md"
if [ ! -f "$CONTRACT_FILE" ]; then
  echo "FAIL: missing boundary contract artifact: $CONTRACT_FILE"
  exit 1
fi

rg -n "deterministic|adaptive|fail-closed" "$CONTRACT_FILE" >/dev/null || {
  echo "FAIL: boundary contract missing deterministic/adaptive/fail-closed declarations"
  exit 1
}

curl -fsS "$BASE_URL/status" >/dev/null
mint_ted_auth_token

BLOCK_CODE="$(curl -sS -o /tmp/jc012_block.out -w "%{http_code}" \
  -X POST "$BASE_URL/governance/role-cards/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TED_AUTH_TOKEN}" \
  -H "x-ted-execution-mode: ADAPTIVE" \
  -d '{"role_card":{"role_id":"x"}}' || true)"

[ "$BLOCK_CODE" = "409" ] || {
  echo "FAIL: expected 409 for out-of-contract adaptive execution, got $BLOCK_CODE"
  cat /tmp/jc012_block.out
  exit 1
}
grep -q '"reason_code":"OUT_OF_CONTRACT_EXECUTION_MODE"' /tmp/jc012_block.out || {
  echo "FAIL: missing OUT_OF_CONTRACT_EXECUTION_MODE reason code"
  cat /tmp/jc012_block.out
  exit 1
}

echo "OK: boundary contract artifact + runtime enforcement verified"
