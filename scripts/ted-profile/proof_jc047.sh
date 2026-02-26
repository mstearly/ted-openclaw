#!/usr/bin/env bash
set -euo pipefail

echo "JC-047 proof: operator flow and approval path clarity"
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

# ── Test 1: GET /status returns 200 ──
echo "--- [1/3] GET /status returns 200 ---"
SC=$(curl -sS -o /tmp/jc047_status.out -w "%{http_code}" \
  "${AUTH_ARGS[@]}" "$BASE_URL/status" || true)
if [ "$SC" = "200" ]; then
  echo "  PASS: status returned 200"
  record_pass
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "1-status-http"
fi

# ── Test 2: Response has governance guard list ──
echo "--- [2/3] Response has catalog.governance_guards array ---"
HAS_GUARDS=$(python3 -c "
import json, sys
payload = json.load(sys.stdin)
guards = payload.get('catalog', {}).get('governance_guards')
print('yes' if isinstance(guards, list) and len(guards) > 0 else 'no')
" < /tmp/jc047_status.out 2>/dev/null || echo "parse_error")

if [ "$HAS_GUARDS" = "yes" ]; then
  echo "  PASS: governance guard array present"
  record_pass
else
  echo "  FAIL: governance guard array missing or empty ($HAS_GUARDS)"
  record_fail "2-guards-missing"
fi

# ── Test 3: Required approval/authority guards are present ──
echo "--- [3/3] Governance guards include approval and authority controls ---"
GUARD_CHECK=$(python3 -c "
import json, sys
payload = json.load(sys.stdin)
guards = payload.get('catalog', {}).get('governance_guards', [])
if not isinstance(guards, list):
    print('MISSING_GUARDS')
    sys.exit(0)
required = ['approval_first', 'draft_only_boundary', 'single_operator', 'fail_closed']
missing = [g for g in required if g not in guards]
if missing:
    print(f'MISSING:{missing[0]}')
else:
    print('OK')
" < /tmp/jc047_status.out 2>/dev/null || echo "parse_error")

case "$GUARD_CHECK" in
  OK)
    echo "  PASS: required governance guards are present"
    record_pass
    ;;
  MISSING_GUARDS)
    echo "  FAIL: governance guards are missing"
    record_fail "3-guards-null"
    ;;
  MISSING:*)
    FIELD="${GUARD_CHECK#MISSING:}"
    echo "  FAIL: missing governance guard $FIELD"
    record_fail "3-guards-$FIELD"
    ;;
  *)
    echo "  FAIL: could not parse governance guards ($GUARD_CHECK)"
    record_fail "3-guards-parse"
    ;;
esac

echo ""
echo "=========================================="
echo "JC-047 Operator Flow: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then echo "FAILURES: ${FAILURES[*]}"; fi
echo "=========================================="
exit "$FAIL"
