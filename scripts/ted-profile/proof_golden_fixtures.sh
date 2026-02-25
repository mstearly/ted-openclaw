#!/usr/bin/env bash
set -euo pipefail

echo "JC-093b proof: golden fixture validation"
echo ""

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
source "$(dirname "$0")/lib_auth.sh"

PASS=0; FAIL=0; TESTED=0; FAILURES=()
record_pass() { PASS=$((PASS + 1)); TESTED=$((TESTED + 1)); }
record_fail() { FAIL=$((FAIL + 1)); TESTED=$((TESTED + 1)); FAILURES+=("$1"); }

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FIXTURE_DIR="$REPO_ROOT/sidecars/ted-engine/fixtures"

# ── sidecar must be reachable ──
curl -fsS "$BASE_URL/status" >/dev/null

# ── mint auth token ──
mint_ted_auth_token
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

# ══════════════════════════════════════════════
# Morning Brief — golden_morning_brief.json
# ══════════════════════════════════════════════

echo "--- Morning Brief Golden Fixture Validation ---"
echo ""

# Verify fixture file exists
if [ ! -f "$FIXTURE_DIR/golden_morning_brief.json" ]; then
  echo "  FAIL: golden_morning_brief.json fixture not found"
  record_fail "brief-fixture-missing"
else
  record_pass
fi

# Test 1: GET /reporting/morning-brief returns 200
echo "--- [1/4] Morning brief returns 200 ---"
SC=$(curl -sS -o /tmp/golden_brief.out -w "%{http_code}" \
  -X GET "$BASE_URL/reporting/morning-brief" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ]; then
  echo "  PASS: morning brief returned 200"
  record_pass
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "brief-status"
fi

# Test 2: Response has required_fields from fixture (narrative, source, snapshot data)
echo "--- [2/4] Morning brief has required fields ---"
FIELD_CHECK=$(python3 -c "
import json, sys
fixture = json.load(open('$FIXTURE_DIR/golden_morning_brief.json'))
d = json.load(sys.stdin)
missing = []
for f in fixture['required_fields']:
    if f == 'snapshot':
        # snapshot is virtual: check for detail, commitments_snapshot, actions_snapshot
        if 'detail' not in d and 'commitments_snapshot' not in d:
            missing.append('snapshot(detail|commitments_snapshot)')
    elif f not in d:
        missing.append(f)
if missing:
    print('MISSING:' + ','.join(missing))
else:
    print('OK')
" < /tmp/golden_brief.out 2>/dev/null || echo "parse_error")

if [ "$FIELD_CHECK" = "OK" ]; then
  echo "  PASS: all required fields present"
  record_pass
else
  echo "  FAIL: $FIELD_CHECK"
  record_fail "brief-fields"
fi

# Test 3: narrative is not null
echo "--- [3/4] Morning brief narrative is not null ---"
NARRATIVE_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
narrative = d.get('narrative')
if narrative is not None and len(str(narrative)) > 0:
    print('OK')
else:
    print('NULL')
" < /tmp/golden_brief.out 2>/dev/null || echo "parse_error")

if [ "$NARRATIVE_CHECK" = "OK" ]; then
  echo "  PASS: narrative is non-null"
  record_pass
else
  echo "  FAIL: narrative is null or empty"
  record_fail "brief-narrative-null"
fi

# Test 4: snapshot sub-fields present
echo "--- [4/4] Morning brief has snapshot sub-fields ---"
SNAPSHOT_CHECK=$(python3 -c "
import json, sys
fixture = json.load(open('$FIXTURE_DIR/golden_morning_brief.json'))
d = json.load(sys.stdin)
missing = []
for f in fixture.get('snapshot_required_fields', []):
    if f == 'inbox_count':
        # maps to detail.triage_open
        detail = d.get('detail', {})
        if 'triage_open' not in detail:
            missing.append('inbox_count(detail.triage_open)')
    elif f == 'meetings_snapshot':
        if 'meetings_today' not in d:
            missing.append('meetings_snapshot(meetings_today)')
    elif f not in d:
        missing.append(f)
if missing:
    print('MISSING:' + ','.join(missing))
else:
    print('OK')
" < /tmp/golden_brief.out 2>/dev/null || echo "parse_error")

if [ "$SNAPSHOT_CHECK" = "OK" ]; then
  echo "  PASS: all snapshot sub-fields present"
  record_pass
else
  echo "  FAIL: $SNAPSHOT_CHECK"
  record_fail "brief-snapshot"
fi

# ══════════════════════════════════════════════
# EOD Digest — golden_eod_digest.json
# ══════════════════════════════════════════════

echo ""
echo "--- EOD Digest Golden Fixture Validation ---"
echo ""

# Verify fixture file exists
if [ ! -f "$FIXTURE_DIR/golden_eod_digest.json" ]; then
  echo "  FAIL: golden_eod_digest.json fixture not found"
  record_fail "digest-fixture-missing"
else
  record_pass
fi

# Test 5: GET /reporting/eod-digest returns 200
echo "--- [5/8] EOD digest returns 200 ---"
SC=$(curl -sS -o /tmp/golden_digest.out -w "%{http_code}" \
  -X GET "$BASE_URL/reporting/eod-digest" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ]; then
  echo "  PASS: eod digest returned 200"
  record_pass
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "digest-status"
fi

# Test 6: Response has required_fields from fixture (narrative, source, snapshot data)
echo "--- [6/8] EOD digest has required fields ---"
FIELD_CHECK=$(python3 -c "
import json, sys
fixture = json.load(open('$FIXTURE_DIR/golden_eod_digest.json'))
d = json.load(sys.stdin)
missing = []
for f in fixture['required_fields']:
    if f == 'snapshot':
        # snapshot is virtual: check for detail object
        if 'detail' not in d:
            missing.append('snapshot(detail)')
    elif f not in d:
        missing.append(f)
if missing:
    print('MISSING:' + ','.join(missing))
else:
    print('OK')
" < /tmp/golden_digest.out 2>/dev/null || echo "parse_error")

if [ "$FIELD_CHECK" = "OK" ]; then
  echo "  PASS: all required fields present"
  record_pass
else
  echo "  FAIL: $FIELD_CHECK"
  record_fail "digest-fields"
fi

# Test 7: narrative is not null
echo "--- [7/8] EOD digest narrative is not null ---"
NARRATIVE_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
narrative = d.get('narrative')
if narrative is not None and len(str(narrative)) > 0:
    print('OK')
else:
    print('NULL')
" < /tmp/golden_digest.out 2>/dev/null || echo "parse_error")

if [ "$NARRATIVE_CHECK" = "OK" ]; then
  echo "  PASS: narrative is non-null"
  record_pass
else
  echo "  FAIL: narrative is null or empty"
  record_fail "digest-narrative-null"
fi

# Test 8: source is a valid value
echo "--- [8/8] EOD digest source is valid ---"
SOURCE_CHECK=$(python3 -c "
import json, sys
fixture = json.load(open('$FIXTURE_DIR/golden_eod_digest.json'))
d = json.load(sys.stdin)
source = d.get('source', '')
valid = fixture.get('source_values', [])
# Also accept 'hybrid' as valid
if source in valid or source == 'hybrid':
    print('OK:' + source)
else:
    print('INVALID:' + str(source))
" < /tmp/golden_digest.out 2>/dev/null || echo "parse_error")

case "$SOURCE_CHECK" in
  OK:*)
    SRC="${SOURCE_CHECK#OK:}"
    echo "  PASS: source is \"$SRC\""
    record_pass
    ;;
  *)
    echo "  FAIL: source value invalid ($SOURCE_CHECK)"
    record_fail "digest-source"
    ;;
esac

echo ""
echo "=========================================="
echo "Golden Fixture Validation: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then echo "FAILURES: ${FAILURES[*]}"; fi
echo "=========================================="
exit "$FAIL"
