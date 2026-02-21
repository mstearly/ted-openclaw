#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
echo "JC-014 proof: idempotency/retry/resume integrity"
source "$(dirname "$0")/lib_auth.sh"

curl -fsS "$BASE_URL/status" >/dev/null
mint_ted_auth_token
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

RUN_ID="$(date +%s%N)"
IDEMP_KEY="proof-jc014-${RUN_ID}"
REQ="{\"item_id\":\"jc014-item-${RUN_ID}\",\"source_type\":\"email\",\"source_ref\":\"proof@openclaw.ai\",\"summary\":\"proof ingest\"}"

CODE_1="$(curl -sS -o /tmp/jc014_1.out -w "%{http_code}" -X POST "$BASE_URL/triage/ingest" -H "Content-Type: application/json" "${AUTH_ARGS[@]}" -H "x-idempotency-key: ${IDEMP_KEY}" -d "$REQ" || true)"
CODE_2="$(curl -sS -o /tmp/jc014_2.out -w "%{http_code}" -X POST "$BASE_URL/triage/ingest" -H "Content-Type: application/json" "${AUTH_ARGS[@]}" -H "x-idempotency-key: ${IDEMP_KEY}" -d "$REQ" || true)"

[ "$CODE_1" = "200" ] && [ "$CODE_2" = "200" ] || {
  echo "FAIL: idempotent ingest did not return 200/200"
  cat /tmp/jc014_1.out
  cat /tmp/jc014_2.out
  exit 1
}

grep -q '"deduped":true' /tmp/jc014_2.out || {
  echo "FAIL: second request did not report deduped=true"
  cat /tmp/jc014_2.out
  exit 1
}

echo "OK: idempotent dedupe verified"

echo "2) Retry policy should be bounded and deterministic..."
RETRY_CODE="$(curl -sS -o /tmp/jc014_retry.out -w "%{http_code}" \
  -X POST "$BASE_URL/ops/retry/evaluate" \
  -H "Content-Type: application/json" \
  "${AUTH_ARGS[@]}" \
  -d '{"priority":"LOW","attempt":3}' || true)"
[ "$RETRY_CODE" = "200" ] || {
  echo "FAIL: expected 200 from retry evaluator, got $RETRY_CODE"
  cat /tmp/jc014_retry.out
  exit 1
}
grep -q '"action":"STOP"' /tmp/jc014_retry.out || {
  echo "FAIL: expected STOP action at LOW attempt=3"
  cat /tmp/jc014_retry.out
  exit 1
}
echo "OK: retry bounds enforced"

echo "3) Resume summary should remain queryable..."
curl -sS -o /tmp/jc014_resume.out -w "%{http_code}" \
  -X POST "$BASE_URL/ops/resume" \
  -H "Content-Type: application/json" \
  "${AUTH_ARGS[@]}" \
  -d '{}' >/dev/null || true

LAST_CODE="$(curl -sS -o /tmp/jc014_last.out -w "%{http_code}" \
  -X GET "$BASE_URL/ops/resume/last" \
  "${AUTH_ARGS[@]}" || true)"
[ "$LAST_CODE" = "200" ] || {
  echo "FAIL: expected 200 from /ops/resume/last, got $LAST_CODE"
  cat /tmp/jc014_last.out
  exit 1
}
grep -q '"catch_up_summary"' /tmp/jc014_last.out || {
  echo "FAIL: missing catch_up_summary in /ops/resume/last response"
  cat /tmp/jc014_last.out
  exit 1
}
echo "OK: resume summary consistency verified"

echo "JC-014 proof completed successfully."
