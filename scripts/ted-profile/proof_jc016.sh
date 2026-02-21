#!/usr/bin/env bash
set -euo pipefail

echo "JC-016 proof: fast repair and explainability"
BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
source "$(dirname "$0")/lib_auth.sh"

curl -fsS "$BASE_URL/status" >/dev/null
mint_ted_auth_token
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

REPAIR_CODE="$(curl -sS -o /tmp/jc016_repair.out -w "%{http_code}" \
  -X POST "$BASE_URL/governance/repair/simulate" \
  -H "Content-Type: application/json" \
  "${AUTH_ARGS[@]}" \
  -d '{"proposal_id":"p-1","correction":"update close date to 2026-03-20"}' || true)"
[ "$REPAIR_CODE" = "200" ] || {
  echo "FAIL: expected 200 from repair simulation, got $REPAIR_CODE"
  cat /tmp/jc016_repair.out
  exit 1
}

MEDIAN_MS="$(node -e "const fs=require('fs');try{const j=JSON.parse(fs.readFileSync('/tmp/jc016_repair.out','utf8'));process.stdout.write(String(j.elapsed_ms ?? ''))}catch{}" 2>/dev/null || true)"
[ -n "$MEDIAN_MS" ] || {
  echo "FAIL: missing elapsed_ms in repair output"
  cat /tmp/jc016_repair.out
  exit 1
}

if [ "$MEDIAN_MS" -gt 10000 ]; then
  echo "FAIL: fast repair median exceeded 10s (${MEDIAN_MS}ms)"
  exit 1
fi

echo "OK: fast repair median within gate"

DENY_CODE="$(curl -sS -o /tmp/jc016_deny.out -w "%{http_code}" \
  -X POST "$BASE_URL/ops/rate/evaluate" \
  -H "Content-Type: application/json" \
  "${AUTH_ARGS[@]}" \
  -d '{"quota_percent":101,"priority":"LOW"}' || true)"
[ "$DENY_CODE" = "400" ] || {
  echo "FAIL: expected 400 deny response for invalid quota"
  cat /tmp/jc016_deny.out
  exit 1
}
for field in blocked_action reason_code next_safe_step; do
  grep -q "\"$field\"" /tmp/jc016_deny.out || {
    echo "FAIL: deny payload missing $field"
    cat /tmp/jc016_deny.out
    exit 1
  }
done
echo "OK: explainability contract fields verified"
