#!/usr/bin/env bash
set -euo pipefail

TED_BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
TED_OPERATOR_KEY="${TED_OPERATOR_KEY:-ted-local-operator}"

mint_ted_auth_token() {
  local code
  code="$(curl -sS -o /tmp/ted_auth_mint.out -w "%{http_code}" \
    -X POST "$TED_BASE_URL/auth/mint" \
    -H "Content-Type: application/json" \
    -H "x-ted-execution-mode: DETERMINISTIC" \
    -d "{\"operator_key\":\"${TED_OPERATOR_KEY}\"}" || true)"
  if [ "$code" != "200" ]; then
    echo "FAIL: unable to mint sidecar auth token (HTTP $code)"
    cat /tmp/ted_auth_mint.out
    exit 1
  fi
  TED_AUTH_TOKEN="$(node -e "const fs=require('fs');try{const j=JSON.parse(fs.readFileSync('/tmp/ted_auth_mint.out','utf8'));process.stdout.write(j.token||'')}catch{}" 2>/dev/null || true)"
  if [ -z "$TED_AUTH_TOKEN" ]; then
    echo "FAIL: auth mint response missing token"
    cat /tmp/ted_auth_mint.out
    exit 1
  fi
  export TED_AUTH_TOKEN
}

ted_auth_headers() {
  printf '%s\n' \
    "-H" "Authorization: Bearer ${TED_AUTH_TOKEN}" \
    "-H" "x-ted-execution-mode: DETERMINISTIC"
}
