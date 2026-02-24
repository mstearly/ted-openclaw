#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
echo "JC-081-083 proof: Time-block planning + PARA filing + Deep work metrics"
source "$(dirname "$0")/lib_auth.sh"

curl -fsS "$BASE_URL/status" >/dev/null
mint_ted_auth_token
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

# 1. POST /planning/timeblock/generate creates a plan
CODE="$(curl -sS -o /tmp/jc081_plan.out -w "%{http_code}" \
  -X POST "$BASE_URL/planning/timeblock/generate" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-02-23"}' || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: POST /planning/timeblock/generate returned $CODE"
  cat /tmp/jc081_plan.out
  exit 1
fi
grep -q '"plan_id"' /tmp/jc081_plan.out || {
  echo "FAIL: response missing 'plan_id' field"
  cat /tmp/jc081_plan.out
  exit 1
}
grep -q '"blocks"' /tmp/jc081_plan.out || {
  echo "FAIL: response missing 'blocks' field"
  cat /tmp/jc081_plan.out
  exit 1
}
grep -q '"deep_work_hours"' /tmp/jc081_plan.out || {
  echo "FAIL: response missing 'deep_work_hours' field"
  cat /tmp/jc081_plan.out
  exit 1
}
echo "OK: POST /planning/timeblock/generate returns structured plan"

# 2. POST /filing/para/classify classifies an item
CODE="$(curl -sS -o /tmp/jc082_classify.out -w "%{http_code}" \
  -X POST "$BASE_URL/filing/para/classify" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"item":"PSA draft for Acme SNF acquisition","entity":"olumie","deal_id":"acme-001"}' || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: POST /filing/para/classify returned $CODE"
  cat /tmp/jc082_classify.out
  exit 1
fi
grep -q '"para_category"' /tmp/jc082_classify.out || {
  echo "FAIL: response missing 'para_category' field"
  cat /tmp/jc082_classify.out
  exit 1
}
grep -q '"confidence"' /tmp/jc082_classify.out || {
  echo "FAIL: response missing 'confidence' field"
  cat /tmp/jc082_classify.out
  exit 1
}
echo "OK: POST /filing/para/classify returns PARA classification"

# 3. GET /filing/para/structure returns folder structure
CODE="$(curl -sS -o /tmp/jc082_struct.out -w "%{http_code}" \
  -X GET "$BASE_URL/filing/para/structure" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: GET /filing/para/structure returned $CODE"
  cat /tmp/jc082_struct.out
  exit 1
fi
grep -q '"structure"' /tmp/jc082_struct.out || {
  echo "FAIL: response missing 'structure' field"
  cat /tmp/jc082_struct.out
  exit 1
}
echo "OK: GET /filing/para/structure returns PARA structure"

# 4. GET /reporting/deep-work-metrics returns metrics
CODE="$(curl -sS -o /tmp/jc083_metrics.out -w "%{http_code}" \
  -X GET "$BASE_URL/reporting/deep-work-metrics?period=week" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: GET /reporting/deep-work-metrics returned $CODE"
  cat /tmp/jc083_metrics.out
  exit 1
fi
grep -q '"deep_work_hours"' /tmp/jc083_metrics.out || {
  echo "FAIL: response missing 'deep_work_hours' field"
  cat /tmp/jc083_metrics.out
  exit 1
}
grep -q '"target_hours"' /tmp/jc083_metrics.out || {
  echo "FAIL: response missing 'target_hours' field"
  cat /tmp/jc083_metrics.out
  exit 1
}
echo "OK: GET /reporting/deep-work-metrics returns weekly metrics"

echo ""
echo "JC-081-083 PASS: Time-block planning, PARA classification, and deep work metrics all verified."
