#!/usr/bin/env bash
set -euo pipefail

echo "JC-090 proof: Phase 12 — Contract Validation"
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

# ── Test 1: Morning brief template — narrative is NOT null ──
echo "--- [1/4] GET /reporting/morning-brief has non-null narrative ---"
SC=$(curl -sS -o /tmp/jc090_brief.out -w "%{http_code}" \
  -X GET "$BASE_URL/reporting/morning-brief" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ]; then
  BRIEF_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
narrative = d.get('narrative')
if narrative is not None and len(str(narrative)) > 0:
    print('OK')
elif narrative is None:
    print('NULL')
else:
    print('EMPTY')
" < /tmp/jc090_brief.out 2>/dev/null || echo "parse_error")
  if [ "$BRIEF_CHECK" = "OK" ]; then
    echo "  PASS: morning brief narrative is non-null and non-empty"
    record_pass
  else
    echo "  FAIL: morning brief narrative is $BRIEF_CHECK (template fallback not working)"
    record_fail "1-brief-narrative"
  fi
else
  echo "  FAIL: expected 200 from morning-brief, got $SC"
  record_fail "1-brief-status"
fi

# ── Test 2: EOD digest template — narrative is NOT null ──
echo "--- [2/4] GET /reporting/eod-digest has non-null narrative ---"
SC=$(curl -sS -o /tmp/jc090_eod.out -w "%{http_code}" \
  -X GET "$BASE_URL/reporting/eod-digest" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ]; then
  EOD_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
# EOD digest may use 'narrative' or 'summary' depending on implementation
narrative = d.get('narrative', d.get('summary', None))
if narrative is not None and len(str(narrative)) > 0:
    print('OK')
elif narrative is None:
    print('NULL')
else:
    print('EMPTY')
" < /tmp/jc090_eod.out 2>/dev/null || echo "parse_error")
  if [ "$EOD_CHECK" = "OK" ]; then
    echo "  PASS: EOD digest narrative/summary is non-null and non-empty"
    record_pass
  else
    echo "  FAIL: EOD digest narrative is $EOD_CHECK (template fallback not working)"
    record_fail "2-eod-narrative"
  fi
else
  echo "  FAIL: expected 200 from eod-digest, got $SC"
  record_fail "2-eod-status"
fi

# ── Test 3: Output contracts config — GET /events/stats returns 200 ──
echo "--- [3/4] GET /events/stats returns 200 (config loading intact) ---"
SC=$(curl -sS -o /tmp/jc090_stats.out -w "%{http_code}" \
  -X GET "$BASE_URL/events/stats" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ]; then
  STATS_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
# Validate it's a well-formed JSON object with expected fields
has_total = 'total_events' in d or 'event_type_counts' in d
if has_total:
    print('OK')
else:
    keys = list(d.keys())
    print(f'UNEXPECTED:keys={keys[:5]}')
" < /tmp/jc090_stats.out 2>/dev/null || echo "parse_error")
  case "$STATS_CHECK" in
    OK)
      echo "  PASS: events/stats returned 200 with valid structure"
      record_pass
      ;;
    *)
      echo "  FAIL: events/stats has unexpected structure ($STATS_CHECK)"
      record_fail "3-stats-structure"
      ;;
  esac
else
  echo "  FAIL: expected 200 from events/stats, got $SC (config may be broken)"
  record_fail "3-stats-status"
fi

# ── Test 4: Trust validation events — verify endpoint handles filter ──
echo "--- [4/4] GET /events/recent for trust validation events ---"
# Try passed first, then failed — either is valid
SC=$(curl -sS -o /tmp/jc090_trust_pass.out -w "%{http_code}" \
  -X GET "$BASE_URL/events/recent?event_type=trust.validation.passed&limit=5" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ]; then
  PASSED_COUNT=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
events = d.get('events', [])
print(len(events))
" < /tmp/jc090_trust_pass.out 2>/dev/null || echo "0")

  SC2=$(curl -sS -o /tmp/jc090_trust_fail.out -w "%{http_code}" \
    -X GET "$BASE_URL/events/recent?event_type=trust.validation.failed&limit=5" \
    "${AUTH_ARGS[@]}" || true)

  if [ "$SC2" = "200" ]; then
    FAILED_COUNT=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
events = d.get('events', [])
print(len(events))
" < /tmp/jc090_trust_fail.out 2>/dev/null || echo "0")
    echo "  PASS: trust validation event queries returned 200 (passed=$PASSED_COUNT, failed=$FAILED_COUNT)"
    record_pass
  else
    echo "  FAIL: trust.validation.failed query returned $SC2"
    record_fail "4-trust-failed-query"
  fi
else
  echo "  FAIL: expected 200 from trust.validation.passed query, got $SC"
  record_fail "4-trust-passed-query"
fi

echo ""
echo "=========================================="
echo "JC-090 Contract Validation: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then echo "FAILURES: ${FAILURES[*]}"; fi
echo "=========================================="
exit "$FAIL"
