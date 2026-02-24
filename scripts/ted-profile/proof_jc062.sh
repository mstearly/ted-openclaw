#!/usr/bin/env bash
set -euo pipefail

echo "JC-062 proof: deadline extraction"
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
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC" -H "Content-Type: application/json")

# ── Test 1: POST /extraction/deadlines returns 200 ──
echo "--- [1/3] POST /extraction/deadlines returns 200 ---"
SC=$(curl -sS -o /tmp/jc062_deadlines.out -w "%{http_code}" \
  -X POST "$BASE_URL/extraction/deadlines" \
  "${AUTH_ARGS[@]}" \
  -d '{"text":"The deadline for the Smith deal is 2026-03-15. Please submit by March 20, 2026. Due next Friday."}' || true)

if [ "$SC" = "200" ]; then
  echo "  PASS: deadline extraction returned 200"
  record_pass
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "1-deadline-status"
fi

# ── Test 2: Response has candidates array ──
echo "--- [2/3] Response has candidates array ---"
CANDIDATES_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
candidates = d.get('candidates')
if candidates is not None and isinstance(candidates, list):
    print(f'OK:{len(candidates)}')
else:
    print('MISSING')
" < /tmp/jc062_deadlines.out 2>/dev/null || echo "parse_error")

case "$CANDIDATES_CHECK" in
  OK:*)
    COUNT="${CANDIDATES_CHECK#OK:}"
    echo "  PASS: candidates array has $COUNT entries"
    record_pass
    ;;
  *)
    echo "  FAIL: candidates array missing or invalid ($CANDIDATES_CHECK)"
    record_fail "2-candidates"
    ;;
esac

# ── Test 3: At least 2 deadline candidates extracted ──
echo "--- [3/3] At least 2 candidates extracted ---"
CANDIDATE_COUNT=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
print(len(d.get('candidates', [])))
" < /tmp/jc062_deadlines.out 2>/dev/null || echo "0")

if [ "$CANDIDATE_COUNT" -ge 2 ] 2>/dev/null; then
  echo "  PASS: $CANDIDATE_COUNT candidates extracted (>= 2)"
  record_pass
else
  echo "  FAIL: expected >= 2 candidates, got $CANDIDATE_COUNT"
  record_fail "3-candidate-count"
fi

echo ""
echo "=========================================="
echo "JC-062 Deadline Extraction: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then echo "FAILURES: ${FAILURES[*]}"; fi
echo "=========================================="
exit "$FAIL"
