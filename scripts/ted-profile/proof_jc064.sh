#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
echo "JC-064 proof: EOD digest"
source "$(dirname "$0")/lib_auth.sh"

curl -fsS "$BASE_URL/status" >/dev/null

mint_ted_auth_token
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

CODE="$(curl -sS -o /tmp/jc064_eod.out -w "%{http_code}" \
  -X GET "$BASE_URL/reporting/eod-digest" \
  "${AUTH_ARGS[@]}" || true)"

if [ "$CODE" != "200" ]; then
  echo "FAIL: expected 200 from eod-digest, got $CODE"
  cat /tmp/jc064_eod.out
  exit 1
fi

grep -q '"generated_at"' /tmp/jc064_eod.out || {
  echo "FAIL: response missing 'generated_at' field"
  cat /tmp/jc064_eod.out
  exit 1
}
grep -q '"date"' /tmp/jc064_eod.out || {
  echo "FAIL: response missing 'date' field"
  cat /tmp/jc064_eod.out
  exit 1
}
grep -q '"summary"' /tmp/jc064_eod.out || {
  echo "FAIL: response missing 'summary' field"
  cat /tmp/jc064_eod.out
  exit 1
}
grep -q '"activity_log"' /tmp/jc064_eod.out || {
  echo "FAIL: response missing 'activity_log' field"
  cat /tmp/jc064_eod.out
  exit 1
}

echo "OK: EOD digest returned 200 with generated_at, date, summary, activity_log"
