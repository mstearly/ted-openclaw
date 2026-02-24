#!/usr/bin/env bash
set -euo pipefail

echo "JC-060 proof: morning brief"
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

# ── Test 1: GET /reporting/morning-brief returns 200 ──
echo "--- [1/3] GET /reporting/morning-brief returns 200 ---"
SC=$(curl -sS -o /tmp/jc060_brief.out -w "%{http_code}" \
  -X GET "$BASE_URL/reporting/morning-brief" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ]; then
  echo "  PASS: morning brief returned 200"
  record_pass
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "1-brief-status"
fi

# ── Test 2: Response has narrative field (not null) ──
echo "--- [2/3] Response has narrative field ---"
NARRATIVE_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
narrative = d.get('narrative')
if narrative is not None and len(str(narrative)) > 0:
    print('OK')
elif narrative is None:
    print('NULL')
else:
    print('EMPTY')
" < /tmp/jc060_brief.out 2>/dev/null || echo "parse_error")

if [ "$NARRATIVE_CHECK" = "OK" ]; then
  echo "  PASS: narrative field present and non-empty"
  record_pass
else
  echo "  FAIL: narrative is $NARRATIVE_CHECK"
  record_fail "2-narrative"
fi

# ── Test 3: Response has snapshot with required sub-fields ──
echo "--- [3/3] Response has snapshot with inbox/commitments/meetings/actions ---"
SNAPSHOT_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
snapshot = d.get('snapshot', {})
if not snapshot:
    print('MISSING_SNAPSHOT')
    sys.exit(0)
required = ['inbox_count', 'commitments_snapshot', 'meetings_snapshot', 'actions_snapshot']
missing = [f for f in required if f not in snapshot]
if missing:
    print(f'MISSING:{missing[0]}')
else:
    print('OK')
" < /tmp/jc060_brief.out 2>/dev/null || echo "parse_error")

case "$SNAPSHOT_CHECK" in
  OK)
    echo "  PASS: snapshot has all required sub-fields"
    record_pass
    ;;
  MISSING_SNAPSHOT)
    echo "  FAIL: snapshot field is missing"
    record_fail "3-snapshot"
    ;;
  MISSING:*)
    FIELD="${SNAPSHOT_CHECK#MISSING:}"
    echo "  FAIL: snapshot missing field $FIELD"
    record_fail "3-snapshot-$FIELD"
    ;;
  *)
    echo "  FAIL: could not parse snapshot ($SNAPSHOT_CHECK)"
    record_fail "3-snapshot-parse"
    ;;
esac

echo ""
echo "=========================================="
echo "JC-060 Morning Brief: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then echo "FAILURES: ${FAILURES[*]}"; fi
echo "=========================================="
exit "$FAIL"
