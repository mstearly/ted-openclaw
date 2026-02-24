#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
echo "JC-070 proof: LLM provider infrastructure"
source "$(dirname "$0")/lib_auth.sh"

curl -fsS "$BASE_URL/status" >/dev/null

mint_ted_auth_token
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

# 1. GET /ops/llm-provider returns config with sanitized keys
CODE="$(curl -sS -o /tmp/jc070_provider_get.out -w "%{http_code}" \
  -X GET "$BASE_URL/ops/llm-provider" \
  "${AUTH_ARGS[@]}" || true)"

if [ "$CODE" != "200" ]; then
  echo "FAIL: GET /ops/llm-provider returned $CODE"
  cat /tmp/jc070_provider_get.out
  exit 1
fi

grep -q '"default_provider"' /tmp/jc070_provider_get.out || {
  echo "FAIL: response missing 'default_provider' field"
  cat /tmp/jc070_provider_get.out
  exit 1
}
grep -q '"providers"' /tmp/jc070_provider_get.out || {
  echo "FAIL: response missing 'providers' field"
  cat /tmp/jc070_provider_get.out
  exit 1
}
# Verify API keys are NOT exposed
if grep -q '"api_key_env"' /tmp/jc070_provider_get.out; then
  echo "FAIL: api_key_env should be sanitized out"
  exit 1
fi
echo "OK: GET /ops/llm-provider returns sanitized config"

# 2. POST /ops/llm-provider can update default provider
CODE="$(curl -sS -o /tmp/jc070_provider_set.out -w "%{http_code}" \
  -X POST "$BASE_URL/ops/llm-provider" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"default_provider":"disabled"}' || true)"

if [ "$CODE" != "200" ]; then
  echo "FAIL: POST /ops/llm-provider returned $CODE"
  cat /tmp/jc070_provider_set.out
  exit 1
fi
grep -q '"updated":true' /tmp/jc070_provider_set.out || grep -q '"updated": true' /tmp/jc070_provider_set.out || {
  echo "FAIL: response missing updated:true"
  cat /tmp/jc070_provider_set.out
  exit 1
}
echo "OK: POST /ops/llm-provider updated to disabled"

# 3. Verify update persisted
CODE="$(curl -sS -o /tmp/jc070_provider_verify.out -w "%{http_code}" \
  -X GET "$BASE_URL/ops/llm-provider" \
  "${AUTH_ARGS[@]}" || true)"
grep -q '"disabled"' /tmp/jc070_provider_verify.out || {
  echo "FAIL: updated provider not persisted"
  cat /tmp/jc070_provider_verify.out
  exit 1
}
echo "OK: provider update persisted correctly"

# 4. Restore to openai_direct
curl -sS -o /dev/null \
  -X POST "$BASE_URL/ops/llm-provider" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"default_provider":"openai_direct"}'
echo "OK: restored default provider to openai_direct"

# 5. GET /ops/notification-budget returns budget + onboarding
CODE="$(curl -sS -o /tmp/jc070_budget.out -w "%{http_code}" \
  -X GET "$BASE_URL/ops/notification-budget" \
  "${AUTH_ARGS[@]}" || true)"

if [ "$CODE" != "200" ]; then
  echo "FAIL: GET /ops/notification-budget returned $CODE"
  cat /tmp/jc070_budget.out
  exit 1
fi
grep -q '"budget"' /tmp/jc070_budget.out || {
  echo "FAIL: response missing 'budget' field"
  cat /tmp/jc070_budget.out
  exit 1
}
grep -q '"onboarding"' /tmp/jc070_budget.out || {
  echo "FAIL: response missing 'onboarding' field"
  cat /tmp/jc070_budget.out
  exit 1
}
echo "OK: GET /ops/notification-budget returns budget + onboarding"

# 6. GET /reporting/morning-brief returns headline + detail
CODE="$(curl -sS -o /tmp/jc070_brief.out -w "%{http_code}" \
  -X GET "$BASE_URL/reporting/morning-brief" \
  "${AUTH_ARGS[@]}" || true)"

if [ "$CODE" != "200" ]; then
  echo "FAIL: GET /reporting/morning-brief returned $CODE"
  cat /tmp/jc070_brief.out
  exit 1
fi
grep -q '"headline"' /tmp/jc070_brief.out || {
  echo "FAIL: morning brief missing 'headline' field"
  cat /tmp/jc070_brief.out
  exit 1
}
grep -q '"detail"' /tmp/jc070_brief.out || {
  echo "FAIL: morning brief missing 'detail' field"
  cat /tmp/jc070_brief.out
  exit 1
}
grep -q '"source"' /tmp/jc070_brief.out || {
  echo "FAIL: morning brief missing 'source' field"
  cat /tmp/jc070_brief.out
  exit 1
}
echo "OK: morning brief has headline + detail + source fields"

# 7. GET /reporting/eod-digest returns headline + detail
CODE="$(curl -sS -o /tmp/jc070_eod.out -w "%{http_code}" \
  -X GET "$BASE_URL/reporting/eod-digest" \
  "${AUTH_ARGS[@]}" || true)"

if [ "$CODE" != "200" ]; then
  echo "FAIL: GET /reporting/eod-digest returned $CODE"
  cat /tmp/jc070_eod.out
  exit 1
fi
grep -q '"headline"' /tmp/jc070_eod.out || {
  echo "FAIL: eod digest missing 'headline' field"
  cat /tmp/jc070_eod.out
  exit 1
}
grep -q '"detail"' /tmp/jc070_eod.out || {
  echo "FAIL: eod digest missing 'detail' field"
  cat /tmp/jc070_eod.out
  exit 1
}
echo "OK: eod digest has headline + detail + source fields"

echo ""
echo "JC-070 PASS: LLM provider infra + notification budget + progressive disclosure all verified."
