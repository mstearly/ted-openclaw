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

# ── Test 1: GET /ted/workbench returns 200 ──
echo "--- [1/3] GET /ted/workbench returns 200 ---"
SC=$(curl -sS -o /tmp/jc047_workbench.out -w "%{http_code}" \
  "${AUTH_ARGS[@]}" "$BASE_URL/ted/workbench" || true)
if [ "$SC" = "200" ]; then
  echo "  PASS: workbench returned 200"
  record_pass
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "1-workbench-status"
fi

# ── Test 2: Response has operator_flow field ──
echo "--- [2/3] Response has operator_flow field ---"
HAS_FLOW=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
flow = d.get('operator_flow')
if flow is not None and isinstance(flow, dict):
    print('yes')
else:
    print('no')
" < /tmp/jc047_workbench.out 2>/dev/null || echo "parse_error")

if [ "$HAS_FLOW" = "yes" ]; then
  echo "  PASS: operator_flow field present"
  record_pass
else
  echo "  FAIL: operator_flow missing or not an object ($HAS_FLOW)"
  record_fail "2-operator-flow"
fi

# ── Test 3: operator_flow has required sub-fields ──
echo "--- [3/3] operator_flow has approval surfaces ---"
FLOW_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
flow = d.get('operator_flow', {})
if not flow:
    print('MISSING_FLOW')
    sys.exit(0)
required = ['primary_approval_surface', 'secondary_approval_surface', 'draft_review_surface']
for f in required:
    if f not in flow:
        print(f'MISSING:{f}')
        sys.exit(0)
print('OK')
" < /tmp/jc047_workbench.out 2>/dev/null || echo "parse_error")

case "$FLOW_CHECK" in
  OK)
    echo "  PASS: operator_flow has all required approval surfaces"
    record_pass
    ;;
  MISSING_FLOW)
    echo "  FAIL: operator_flow is null or missing"
    record_fail "3-flow-null"
    ;;
  MISSING:*)
    FIELD="${FLOW_CHECK#MISSING:}"
    echo "  FAIL: operator_flow missing field \"$FIELD\""
    record_fail "3-flow-$FIELD"
    ;;
  *)
    echo "  FAIL: could not parse operator_flow ($FLOW_CHECK)"
    record_fail "3-flow-parse"
    ;;
esac

echo ""
echo "=========================================="
echo "JC-047 Operator Flow: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then echo "FAILURES: ${FAILURES[*]}"; fi
echo "=========================================="
exit "$FAIL"
