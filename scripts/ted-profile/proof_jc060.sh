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
payload = json.load(sys.stdin)
narrative = payload.get('narrative')
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

# ── Test 3: Response has current brief snapshot sections ──
echo "--- [3/3] Response has detail/commitments/meetings/actions sections ---"
SECTION_CHECK=$(python3 -c "
import json, sys
payload = json.load(sys.stdin)
missing = []
detail = payload.get('detail')
commitments = payload.get('commitments_snapshot')
meetings = payload.get('meetings_today')
actions = payload.get('actions_snapshot')
if not isinstance(detail, dict):
    missing.append('detail')
if not isinstance(commitments, dict):
    missing.append('commitments_snapshot')
if not isinstance(meetings, list):
    missing.append('meetings_today')
if not isinstance(actions, dict):
    missing.append('actions_snapshot')
for field in ['triage_open', 'deals_active', 'filing_pending_count']:
    if not isinstance(detail, dict) or field not in detail:
        missing.append(f'detail.{field}')
if missing:
    print('MISSING:' + missing[0])
else:
    print('OK')
" < /tmp/jc060_brief.out 2>/dev/null || echo "parse_error")

case "$SECTION_CHECK" in
  OK)
    echo "  PASS: morning brief includes required sections"
    record_pass
    ;;
  MISSING:*)
    FIELD="${SECTION_CHECK#MISSING:}"
    echo "  FAIL: missing field $FIELD"
    record_fail "3-$FIELD"
    ;;
  *)
    echo "  FAIL: could not parse section fields ($SECTION_CHECK)"
    record_fail "3-sections-parse"
    ;;
esac

echo ""
echo "=========================================="
echo "JC-060 Morning Brief: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then echo "FAILURES: ${FAILURES[*]}"; fi
echo "=========================================="
exit "$FAIL"
