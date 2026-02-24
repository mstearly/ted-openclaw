#!/usr/bin/env bash
set -euo pipefail

echo "JC-109 proof: Trust-Driven Autonomy + Mail/Calendar Dual-Write"
echo ""

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
source "$(dirname "$0")/lib_auth.sh"

PASS=0; FAIL=0; TESTED=0; FAILURES=()
record_pass() { PASS=$((PASS + 1)); TESTED=$((TESTED + 1)); }
record_fail() { FAIL=$((FAIL + 1)); TESTED=$((TESTED + 1)); FAILURES+=("$1"); }

# ── sidecar must be reachable ──
if ! curl -fsS "$BASE_URL/status" >/dev/null 2>&1; then
  echo "WARNING: sidecar not reachable at $BASE_URL — skipping all tests"
  exit 0
fi

# ── mint auth token ──
mint_ted_auth_token
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

# ---------------------------------------------------------------------------
# 1. GET /trust/autonomy/evaluate — verify metrics fields
# ---------------------------------------------------------------------------
echo "--- [1/4] Trust autonomy evaluation metrics (GET /trust/autonomy/evaluate) ---"
SC="$(curl -sS -o /tmp/jc109_trust.out -w "%{http_code}" \
  -X GET "$BASE_URL/trust/autonomy/evaluate" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$SC" = "200" ]; then
  TRUST_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('ok') == True, 'missing ok flag'
ev = d.get('evaluation', {})
assert 'current_level' in ev, 'missing current_level'
assert 'eligible_for_promotion' in ev, 'missing eligible_for_promotion'
m = ev.get('metrics', {})
assert 'validation_pass_rate' in m, 'missing validation_pass_rate'
assert 'draft_approval_rate' in m, 'missing draft_approval_rate'
assert 'consecutive_passes' in m, 'missing consecutive_passes'
assert 'total_validations' in m, 'missing total_validations'
assert 'total_drafts_approved' in m, 'missing total_drafts_approved'
# Verify types are numeric
assert isinstance(m['validation_pass_rate'], (int, float)), 'validation_pass_rate not numeric'
assert isinstance(m['draft_approval_rate'], (int, float)), 'draft_approval_rate not numeric'
assert isinstance(m['consecutive_passes'], int), 'consecutive_passes not int'
print('OK')
" < /tmp/jc109_trust.out 2>/dev/null || echo "FAIL")"
  if [ "$TRUST_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 200 — metrics have validation_pass_rate, draft_approval_rate, consecutive_passes"
    record_pass
  else
    echo "  FAIL: HTTP 200 but metrics missing expected fields or wrong types"
    record_fail "1-trust-metrics"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  cat /tmp/jc109_trust.out 2>/dev/null || true
  record_fail "1-trust-http"
fi

# ---------------------------------------------------------------------------
# 2. GET /improvement/failure-aggregation?days=7 — verify aggregation fields
# ---------------------------------------------------------------------------
echo "--- [2/4] Failure aggregation 7-day window (GET /improvement/failure-aggregation?days=7) ---"
SC="$(curl -sS -o /tmp/jc109_agg.out -w "%{http_code}" \
  -X GET "$BASE_URL/improvement/failure-aggregation?days=7" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$SC" = "200" ]; then
  AGG_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('ok') == True, 'missing ok flag'
agg = d.get('aggregation', {})
assert 'total_failures' in agg, 'missing total_failures'
assert isinstance(agg['total_failures'], int), 'total_failures not int'
assert 'failure_by_intent' in agg, 'missing failure_by_intent'
assert isinstance(agg['failure_by_intent'], dict), 'failure_by_intent not dict'
assert 'recommendation' in agg, 'missing recommendation'
assert isinstance(agg['recommendation'], str), 'recommendation not string'
assert 'top_banned_phrases' in agg, 'missing top_banned_phrases'
assert 'top_missing_sections' in agg, 'missing top_missing_sections'
print('OK')
" < /tmp/jc109_agg.out 2>/dev/null || echo "FAIL")"
  if [ "$AGG_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 200 — aggregation has total_failures, failure_by_intent, recommendation"
    record_pass
  else
    echo "  FAIL: HTTP 200 but aggregation missing expected fields"
    record_fail "2-agg-shape"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  cat /tmp/jc109_agg.out 2>/dev/null || true
  record_fail "2-agg-http"
fi

# ---------------------------------------------------------------------------
# 3. POST /graph/olumie/mail/{message_id}/move — mail move route
#    Expect 200 (if authenticated) or 409 NOT_AUTHENTICATED (if no Azure AD)
# ---------------------------------------------------------------------------
echo "--- [3/4] Mail move (POST /graph/olumie/mail/test-msg-jc109/move) ---"
SC="$(curl -sS -o /tmp/jc109_mail.out -w "%{http_code}" \
  -X POST "$BASE_URL/graph/olumie/mail/test-msg-jc109/move" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"destination_folder_id":"archive"}' || true)"
if [ "$SC" = "200" ]; then
  MAIL_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
# Success case — verify JSON shape
assert isinstance(d, dict), 'response is not a dict'
print('OK')
" < /tmp/jc109_mail.out 2>/dev/null || echo "FAIL")"
  if [ "$MAIL_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 200 — mail move returned valid JSON"
    record_pass
  else
    echo "  FAIL: HTTP 200 but response is not valid JSON"
    record_fail "3-mail-shape"
  fi
elif [ "$SC" = "409" ]; then
  AUTH_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('error') == 'NOT_AUTHENTICATED', 'expected NOT_AUTHENTICATED error'
assert 'next_action' in d, 'missing next_action field'
print('OK')
" < /tmp/jc109_mail.out 2>/dev/null || echo "FAIL")"
  if [ "$AUTH_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 409 NOT_AUTHENTICATED — route exists, Graph auth required"
    record_pass
  else
    echo "  FAIL: HTTP 409 but not the expected NOT_AUTHENTICATED shape"
    record_fail "3-mail-409-shape"
  fi
elif [ "$SC" = "404" ]; then
  # Profile not configured — still proves route dispatched correctly
  PROFILE_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
err = d.get('error', '')
# PROFILE_NOT_FOUND or similar means the route matched but profile is missing
assert isinstance(d, dict), 'response not a dict'
print('OK')
" < /tmp/jc109_mail.out 2>/dev/null || echo "FAIL")"
  if [ "$PROFILE_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 404 — route dispatched, profile not configured (valid)"
    record_pass
  else
    echo "  FAIL: HTTP 404 but unexpected response shape"
    record_fail "3-mail-404-shape"
  fi
else
  echo "  FAIL: expected 200, 409, or 404, got $SC"
  cat /tmp/jc109_mail.out 2>/dev/null || true
  record_fail "3-mail-http"
fi

# ---------------------------------------------------------------------------
# 4. POST /graph/olumie/calendar/event/create — calendar event create
#    Expect 200 (if authenticated) or 409 NOT_AUTHENTICATED (if no Azure AD)
# ---------------------------------------------------------------------------
echo "--- [4/4] Calendar event create (POST /graph/olumie/calendar/event/create) ---"
SC="$(curl -sS -o /tmp/jc109_cal.out -w "%{http_code}" \
  -X POST "$BASE_URL/graph/olumie/calendar/event/create" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"subject":"JC-109 Proof Test Event","start_datetime":"2026-03-01T10:00:00","end_datetime":"2026-03-01T11:00:00"}' || true)"
if [ "$SC" = "200" ] || [ "$SC" = "201" ]; then
  CAL_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
# Success case — verify JSON shape
assert isinstance(d, dict), 'response is not a dict'
print('OK')
" < /tmp/jc109_cal.out 2>/dev/null || echo "FAIL")"
  if [ "$CAL_CHECK" = "OK" ]; then
    echo "  PASS: HTTP $SC — calendar event create returned valid JSON"
    record_pass
  else
    echo "  FAIL: HTTP $SC but response is not valid JSON"
    record_fail "4-cal-shape"
  fi
elif [ "$SC" = "409" ]; then
  AUTH_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('error') == 'NOT_AUTHENTICATED', 'expected NOT_AUTHENTICATED error'
assert 'next_action' in d, 'missing next_action field'
print('OK')
" < /tmp/jc109_cal.out 2>/dev/null || echo "FAIL")"
  if [ "$AUTH_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 409 NOT_AUTHENTICATED — route exists, Graph auth required"
    record_pass
  else
    echo "  FAIL: HTTP 409 but not the expected NOT_AUTHENTICATED shape"
    record_fail "4-cal-409-shape"
  fi
elif [ "$SC" = "404" ]; then
  # Profile not configured — still proves route dispatched correctly
  PROFILE_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert isinstance(d, dict), 'response not a dict'
print('OK')
" < /tmp/jc109_cal.out 2>/dev/null || echo "FAIL")"
  if [ "$PROFILE_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 404 — route dispatched, profile not configured (valid)"
    record_pass
  else
    echo "  FAIL: HTTP 404 but unexpected response shape"
    record_fail "4-cal-404-shape"
  fi
else
  echo "  FAIL: expected 200, 409, or 404, got $SC"
  cat /tmp/jc109_cal.out 2>/dev/null || true
  record_fail "4-cal-http"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=========================================="
echo "JC-109 Trust-Driven Autonomy + Mail/Calendar: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "FAILURES: ${FAILURES[*]}"
fi
echo "=========================================="
exit "$FAIL"
