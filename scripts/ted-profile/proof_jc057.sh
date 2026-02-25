#!/usr/bin/env bash
set -euo pipefail

echo "JC-057 proof: inbox reading (mail list)"
echo ""

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
source "$(dirname "$0")/lib_auth.sh"

PASS=0; FAIL=0; TESTED=0; FAILURES=()
record_pass() { PASS=$((PASS + 1)); TESTED=$((TESTED + 1)); }
record_fail() { FAIL=$((FAIL + 1)); TESTED=$((TESTED + 1)); FAILURES+=("$1"); }

# ── sidecar must be reachable ──
curl -fsS "$BASE_URL/status" >/dev/null

# ── mint auth token ──
mint_ted_auth_token
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

# ── Test 1: GET /graph/olumie/mail/list returns 200 or 409 ──
echo "--- [1/2] GET /graph/olumie/mail/list returns valid status ---"
SC=$(curl -sS -o /tmp/jc057_mail.out -w "%{http_code}" \
  -X GET "$BASE_URL/graph/olumie/mail/list" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ] || [ "$SC" = "409" ]; then
  echo "  PASS: mail list returned $SC (valid)"
  record_pass
else
  echo "  FAIL: expected 200 or 409, got $SC"
  record_fail "1-mail-status"
fi

# ── Test 2: Response body has expected structure ──
echo "--- [2/2] Response body has expected structure ---"
if [ "$SC" = "200" ]; then
  BODY_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
has_messages = 'messages' in d
has_folder = 'folder' in d
if has_messages and has_folder:
    print('OK')
elif not has_messages:
    print('MISSING:messages')
else:
    print('MISSING:folder')
" < /tmp/jc057_mail.out 2>/dev/null || echo "parse_error")
  if [ "$BODY_CHECK" = "OK" ]; then
    echo "  PASS: 200 response has messages and folder fields"
    record_pass
  else
    echo "  FAIL: 200 response structure invalid ($BODY_CHECK)"
    record_fail "2-body-200"
  fi
elif [ "$SC" = "409" ]; then
  BODY_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
has_reason = d.get('reason_code') == 'NOT_AUTHENTICATED'
has_next = 'next_action' in d
if has_reason and has_next:
    print('OK')
elif not has_reason:
    print('MISSING:NOT_AUTHENTICATED')
else:
    print('MISSING:next_action')
" < /tmp/jc057_mail.out 2>/dev/null || echo "parse_error")
  if [ "$BODY_CHECK" = "OK" ]; then
    echo "  PASS: 409 response has NOT_AUTHENTICATED and next_action (Graph creds absent)"
    record_pass
  else
    echo "  FAIL: 409 response structure invalid ($BODY_CHECK)"
    record_fail "2-body-409"
  fi
else
  echo "  SKIP: cannot validate body for status $SC"
  record_fail "2-body-skip"
fi

echo ""
echo "=========================================="
echo "JC-057 Inbox Reading: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then echo "FAILURES: ${FAILURES[*]}"; fi
echo "=========================================="
exit "$FAIL"
