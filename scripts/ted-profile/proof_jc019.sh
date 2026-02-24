#!/usr/bin/env bash
set -euo pipefail

echo "JC-019 proof: Ted workbench dashboard surface"

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
source "$(dirname "$0")/lib_auth.sh"

# ── sidecar must be reachable ──
curl -fsS "$BASE_URL/status" >/dev/null

# ── mint auth token ──
mint_ted_auth_token
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

# ── GET /ted/workbench — the dashboard data endpoint ──
HTTP_CODE="$(curl -sS -o /tmp/jc019_workbench.out -w "%{http_code}" \
  "${AUTH_ARGS[@]}" "$BASE_URL/ted/workbench" || true)"

if [ "$HTTP_CODE" != "200" ]; then
  echo "FAIL: GET /ted/workbench returned HTTP $HTTP_CODE, expected 200"
  cat /tmp/jc019_workbench.out
  exit 1
fi

# ── verify response contains required top-level fields ──
for field in generated_at job_cards sidecar; do
  if ! grep -q "\"${field}\"" /tmp/jc019_workbench.out; then
    echo "FAIL: workbench response missing required field \"${field}\""
    cat /tmp/jc019_workbench.out
    exit 1
  fi
done

echo "OK: Ted workbench dashboard surface verified — endpoint returns 200 with generated_at, job_cards, sidecar fields"
