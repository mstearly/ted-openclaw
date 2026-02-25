#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
echo "JC-013 proof: sidecar auth boundary hardening"
source "$(dirname "$0")/lib_auth.sh"

curl -fsS "$BASE_URL/status" >/dev/null

CODE_NOAUTH="$(curl -sS -o /tmp/jc013_noauth.out -w "%{http_code}" -X POST "$BASE_URL/governance/role-cards/validate" -H "Content-Type: application/json" -d '{}' || true)"
if [ "$CODE_NOAUTH" != "401" ]; then
  echo "FAIL: expected 401 on non-health route without auth, got $CODE_NOAUTH"
  cat /tmp/jc013_noauth.out
  exit 1
fi

HEALTH_CODE="$(curl -sS -o /tmp/jc013_health.out -w "%{http_code}" "$BASE_URL/doctor" || true)"
[ "$HEALTH_CODE" = "200" ] || {
  echo "FAIL: expected 200 on health route without auth, got $HEALTH_CODE"
  cat /tmp/jc013_health.out
  exit 1
}

mint_ted_auth_token
CODE_AUTH="$(curl -sS -o /tmp/jc013_auth.out -w "%{http_code}" \
  -X POST "$BASE_URL/governance/role-cards/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TED_AUTH_TOKEN}" \
  -H "x-ted-execution-mode: DETERMINISTIC" \
  -d '{"role_card":{"role_id":"writer"}}' || true)"
[ "$CODE_AUTH" = "400" ] || {
  echo "FAIL: expected governed 400 (invalid payload) after auth, got $CODE_AUTH"
  cat /tmp/jc013_auth.out
  exit 1
}
grep -q '"reason_code"' /tmp/jc013_auth.out || {
  echo "FAIL: expected explainability payload on authenticated request"
  cat /tmp/jc013_auth.out
  exit 1
}

echo "OK: auth boundary hardening verified"
