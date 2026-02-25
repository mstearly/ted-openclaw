#!/usr/bin/env bash
set -euo pipefail

echo "JC-113 proof: Reporting Endpoints — Morning Brief, EOD Digest, Deep Work, Trust Metrics"
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

# ── Test 1: Morning brief returns 200 with narrative field ──
echo "--- [1/8] GET /reporting/morning-brief returns 200 with narrative ---"
SC=$(curl -sS -o /tmp/jc113_morning_brief.out -w "%{http_code}" \
  "${AUTH_ARGS[@]}" "$BASE_URL/reporting/morning-brief" || true)
if [ "$SC" = "200" ]; then
  HAS_NARRATIVE=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
if 'narrative' in d and isinstance(d['narrative'], str):
    print('yes')
else:
    print('no')
" < /tmp/jc113_morning_brief.out 2>/dev/null || echo "parse_error")
  if [ "$HAS_NARRATIVE" = "yes" ]; then
    echo "  PASS: morning-brief returned 200 with narrative field"
    record_pass
  else
    echo "  FAIL: 200 but narrative field missing or not a string ($HAS_NARRATIVE)"
    record_fail "1-morning-brief-narrative"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "1-morning-brief-status"
fi

# ── Test 2: Morning brief has source field ──
echo "--- [2/8] Morning brief has source field (template or llm) ---"
HAS_SOURCE=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
src = d.get('source', '')
if src in ('template', 'llm'):
    print('yes')
else:
    print('no')
" < /tmp/jc113_morning_brief.out 2>/dev/null || echo "parse_error")

if [ "$HAS_SOURCE" = "yes" ]; then
  echo "  PASS: source field present (template or llm)"
  record_pass
else
  echo "  FAIL: source field missing or unexpected value ($HAS_SOURCE)"
  record_fail "2-morning-brief-source"
fi

# ── Test 3: EOD digest returns 200 with narrative field ──
echo "--- [3/8] GET /reporting/eod-digest returns 200 with narrative ---"
SC=$(curl -sS -o /tmp/jc113_eod_digest.out -w "%{http_code}" \
  "${AUTH_ARGS[@]}" "$BASE_URL/reporting/eod-digest" || true)
if [ "$SC" = "200" ]; then
  HAS_NARRATIVE=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
if 'narrative' in d and isinstance(d['narrative'], str):
    print('yes')
else:
    print('no')
" < /tmp/jc113_eod_digest.out 2>/dev/null || echo "parse_error")
  if [ "$HAS_NARRATIVE" = "yes" ]; then
    echo "  PASS: eod-digest returned 200 with narrative field"
    record_pass
  else
    echo "  FAIL: 200 but narrative field missing or not a string ($HAS_NARRATIVE)"
    record_fail "3-eod-digest-narrative"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "3-eod-digest-status"
fi

# ── Test 4: EOD digest has source field ──
echo "--- [4/8] EOD digest has source field (template or llm) ---"
HAS_SOURCE=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
src = d.get('source', '')
if src in ('template', 'llm'):
    print('yes')
else:
    print('no')
" < /tmp/jc113_eod_digest.out 2>/dev/null || echo "parse_error")

if [ "$HAS_SOURCE" = "yes" ]; then
  echo "  PASS: source field present (template or llm)"
  record_pass
else
  echo "  FAIL: source field missing or unexpected value ($HAS_SOURCE)"
  record_fail "4-eod-digest-source"
fi

# ── Test 5: Deep work metrics returns 200 with deep_work_hours ──
echo "--- [5/8] GET /reporting/deep-work-metrics?period=month returns 200 with deep_work_hours ---"
SC=$(curl -sS -o /tmp/jc113_deep_work.out -w "%{http_code}" \
  "${AUTH_ARGS[@]}" "$BASE_URL/reporting/deep-work-metrics?period=month" || true)
if [ "$SC" = "200" ]; then
  DW_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
hours = d.get('deep_work_hours')
if hours is not None and isinstance(hours, (int, float)):
    print('yes')
else:
    print('no')
" < /tmp/jc113_deep_work.out 2>/dev/null || echo "parse_error")
  if [ "$DW_CHECK" = "yes" ]; then
    echo "  PASS: deep-work-metrics returned 200 with numeric deep_work_hours"
    record_pass
  else
    echo "  FAIL: 200 but deep_work_hours missing or not numeric ($DW_CHECK)"
    record_fail "5-deep-work-hours"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "5-deep-work-status"
fi

# ── Test 6: Deep work metrics has adherence_pct (numeric) ──
echo "--- [6/8] Deep work metrics has adherence_pct (numeric) ---"
ADH_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
pct = d.get('adherence_pct')
if pct is not None and isinstance(pct, (int, float)):
    print('yes')
else:
    print('no')
" < /tmp/jc113_deep_work.out 2>/dev/null || echo "parse_error")

if [ "$ADH_CHECK" = "yes" ]; then
  echo "  PASS: adherence_pct is numeric"
  record_pass
else
  echo "  FAIL: adherence_pct missing or not numeric ($ADH_CHECK)"
  record_fail "6-deep-work-adherence"
fi

# ── Test 7: Trust metrics returns 200 with trust_validations object ──
echo "--- [7/8] GET /reporting/trust-metrics?period=month returns 200 with trust_validations ---"
SC=$(curl -sS -o /tmp/jc113_trust.out -w "%{http_code}" \
  "${AUTH_ARGS[@]}" "$BASE_URL/reporting/trust-metrics?period=month" || true)
if [ "$SC" = "200" ]; then
  TV_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
tv = d.get('trust_validations')
if tv is not None and isinstance(tv, dict):
    print('yes')
else:
    print('no')
" < /tmp/jc113_trust.out 2>/dev/null || echo "parse_error")
  if [ "$TV_CHECK" = "yes" ]; then
    echo "  PASS: trust-metrics returned 200 with trust_validations object"
    record_pass
  else
    echo "  FAIL: 200 but trust_validations missing or not an object ($TV_CHECK)"
    record_fail "7-trust-validations"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "7-trust-metrics-status"
fi

# ── Test 8: Trust metrics trust_validations has failure_reasons ──
echo "--- [8/8] Trust metrics trust_validations has failure_reasons ---"
FR_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
tv = d.get('trust_validations', {})
fr = tv.get('failure_reasons')
if fr is not None:
    print('yes')
else:
    print('no')
" < /tmp/jc113_trust.out 2>/dev/null || echo "parse_error")

if [ "$FR_CHECK" = "yes" ]; then
  echo "  PASS: trust_validations contains failure_reasons"
  record_pass
else
  echo "  FAIL: failure_reasons missing from trust_validations ($FR_CHECK)"
  record_fail "8-trust-failure-reasons"
fi

echo ""
echo "=========================================="
echo "JC-113 Reporting Endpoints: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then echo "FAILURES: ${FAILURES[*]}"; fi
echo "=========================================="
exit "$FAIL"
