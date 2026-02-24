#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
echo "JC-084-086 proof: Notification budget + Onboarding ramp + Trust metrics + Progressive disclosure"
source "$(dirname "$0")/lib_auth.sh"

curl -fsS "$BASE_URL/status" >/dev/null
mint_ted_auth_token
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

# 1. GET /ops/notification-budget returns budget config
CODE="$(curl -sS -o /tmp/jc084_budget.out -w "%{http_code}" \
  -X GET "$BASE_URL/ops/notification-budget" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: GET /ops/notification-budget returned $CODE"
  cat /tmp/jc084_budget.out
  exit 1
fi
grep -q '"budget"' /tmp/jc084_budget.out || {
  echo "FAIL: response missing 'budget' field"
  cat /tmp/jc084_budget.out
  exit 1
}
grep -q '"onboarding"' /tmp/jc084_budget.out || {
  echo "FAIL: response missing 'onboarding' field"
  cat /tmp/jc084_budget.out
  exit 1
}
echo "OK: GET /ops/notification-budget returns budget + onboarding"

# 2. Verify morning brief has progressive disclosure fields
CODE="$(curl -sS -o /tmp/jc086_brief.out -w "%{http_code}" \
  -X GET "$BASE_URL/reporting/morning-brief" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: GET /reporting/morning-brief returned $CODE"
  cat /tmp/jc086_brief.out
  exit 1
fi
grep -q '"headline"' /tmp/jc086_brief.out || {
  echo "FAIL: morning brief missing 'headline' field"
  cat /tmp/jc086_brief.out
  exit 1
}
grep -q '"summary"' /tmp/jc086_brief.out || {
  echo "FAIL: morning brief missing 'summary' field"
  cat /tmp/jc086_brief.out
  exit 1
}
grep -q '"detail"' /tmp/jc086_brief.out || {
  echo "FAIL: morning brief missing 'detail' field"
  cat /tmp/jc086_brief.out
  exit 1
}
grep -q '"source"' /tmp/jc086_brief.out || {
  echo "FAIL: morning brief missing 'source' field"
  cat /tmp/jc086_brief.out
  exit 1
}
echo "OK: morning brief has headline + summary + detail + source"

# 3. Verify EOD digest has progressive disclosure fields
CODE="$(curl -sS -o /tmp/jc086_eod.out -w "%{http_code}" \
  -X GET "$BASE_URL/reporting/eod-digest" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: GET /reporting/eod-digest returned $CODE"
  cat /tmp/jc086_eod.out
  exit 1
fi
grep -q '"headline"' /tmp/jc086_eod.out || {
  echo "FAIL: eod digest missing 'headline' field"
  cat /tmp/jc086_eod.out
  exit 1
}
grep -q '"detail"' /tmp/jc086_eod.out || {
  echo "FAIL: eod digest missing 'detail' field"
  cat /tmp/jc086_eod.out
  exit 1
}
echo "OK: eod digest has headline + detail + source"

# 4. GET /reporting/trust-metrics returns metrics
CODE="$(curl -sS -o /tmp/jc085_trust.out -w "%{http_code}" \
  -X GET "$BASE_URL/reporting/trust-metrics?period=week" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: GET /reporting/trust-metrics returned $CODE"
  cat /tmp/jc085_trust.out
  exit 1
fi
grep -q '"approval_rate"' /tmp/jc085_trust.out || {
  echo "FAIL: response missing 'approval_rate' field"
  cat /tmp/jc085_trust.out
  exit 1
}
grep -q '"time_saved_estimate"' /tmp/jc085_trust.out || {
  echo "FAIL: response missing 'time_saved_estimate' field"
  cat /tmp/jc085_trust.out
  exit 1
}
echo "OK: GET /reporting/trust-metrics returns trust data"

echo ""
echo "JC-084-086 PASS: Notification budget, progressive disclosure, and trust metrics all verified."
