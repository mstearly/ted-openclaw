#!/usr/bin/env bash
set -euo pipefail

echo "JC-046 proof: integration health and readiness plane"
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
SC=$(curl -sS -o /tmp/jc046_status.out -w "%{http_code}" \
  "${AUTH_ARGS[@]}" "$BASE_URL/status" || true)
if [ "$SC" = "200" ]; then
  echo "  PASS: status returned 200"
  record_pass
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "1-status-http"
fi

# ── Test 2: Response has dependencies.graph_tokens object ──
echo "--- [2/3] Response has dependencies.graph_tokens object ---"
HAS_GRAPH_TOKENS=$(python3 -c "
import json, sys
payload = json.load(sys.stdin)
graph_tokens = payload.get('dependencies', {}).get('graph_tokens')
print('yes' if isinstance(graph_tokens, dict) else 'no')
" < /tmp/jc046_status.out 2>/dev/null || echo "parse_error")

if [ "$HAS_GRAPH_TOKENS" = "yes" ]; then
  echo "  PASS: dependencies.graph_tokens object present"
  record_pass
else
  echo "  FAIL: dependencies.graph_tokens missing or invalid ($HAS_GRAPH_TOKENS)"
  record_fail "2-graph-tokens"
fi

# ── Test 3: Graph token map includes expected profile keys/statuses ──
echo "--- [3/3] Graph token map includes profile statuses ---"
PROFILE_CHECK=$(python3 -c "
import json, sys
payload = json.load(sys.stdin)
graph_tokens = payload.get('dependencies', {}).get('graph_tokens', {})
if not isinstance(graph_tokens, dict):
    print('MISSING_MAP')
    sys.exit(0)
required = ['olumie', 'everest']
missing = [key for key in required if key not in graph_tokens]
if missing:
    print(f'MISSING_KEYS:{missing[0]}')
    sys.exit(0)
allowed = {'configured', 'not_configured', 'error'}
for key in required:
    val = graph_tokens.get(key)
    if val not in allowed:
        print(f'INVALID_STATUS:{key}:{val}')
        sys.exit(0)
print('OK')
" < /tmp/jc046_status.out 2>/dev/null || echo "parse_error")

case "$PROFILE_CHECK" in
  OK)
    echo "  PASS: graph token map has expected profile statuses"
    record_pass
    ;;
  MISSING_MAP)
    echo "  FAIL: graph token map missing"
    record_fail "3-map-missing"
    ;;
  MISSING_KEYS:*)
    echo "  FAIL: missing profile key ${PROFILE_CHECK#MISSING_KEYS:}"
    record_fail "3-profile-key"
    ;;
  INVALID_STATUS:*)
    echo "  FAIL: invalid profile status ($PROFILE_CHECK)"
    record_fail "3-profile-status"
    ;;
  *)
    echo "  FAIL: could not parse graph token map ($PROFILE_CHECK)"
    record_fail "3-profile-parse"
    ;;
esac

echo ""
echo "=========================================="
echo "JC-046 Integration Health: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then echo "FAILURES: ${FAILURES[*]}"; fi
echo "=========================================="
exit "$FAIL"
