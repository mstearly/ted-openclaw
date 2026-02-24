#!/usr/bin/env bash
set -euo pipefail

echo "JC-112 proof: Auth Failure Paths — Invalid/Missing Bearer Token"
echo ""

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
source "$(dirname "$0")/lib_auth.sh"

PASS=0; FAIL=0; TESTED=0; FAILURES=()
record_pass() { PASS=$((PASS + 1)); TESTED=$((TESTED + 1)); }
record_fail() { FAIL=$((FAIL + 1)); TESTED=$((TESTED + 1)); FAILURES+=("$1"); }

# sidecar must be reachable
curl -fsS "$BASE_URL/status" >/dev/null

# ── Test 1: No Authorization header on protected route (expect 401) ──
echo "--- [1/8] No Authorization header on protected route ---"
SC=$(curl -sS -o /tmp/jc112_test1.out -w "%{http_code}" \
  "$BASE_URL/reporting/morning-brief" || true)
if [ "$SC" = "401" ]; then
  echo "  PASS: protected route returned 401 with no auth header"
  record_pass
else
  echo "  FAIL: expected 401 for missing auth header, got $SC"
  record_fail "1-no-auth-header"
fi

# ── Test 2: Invalid Bearer token (expect 401) ──
echo "--- [2/8] Invalid Bearer token on protected route ---"
SC=$(curl -sS -o /tmp/jc112_test2.out -w "%{http_code}" \
  "$BASE_URL/reporting/trust-metrics" \
  -H "Authorization: Bearer INVALID-TOKEN-12345" || true)
if [ "$SC" = "401" ]; then
  echo "  PASS: invalid bearer token correctly rejected with 401"
  record_pass
else
  echo "  FAIL: expected 401 for invalid bearer token, got $SC"
  record_fail "2-invalid-bearer"
fi

# ── Test 3: Empty Bearer token (expect 401) ──
echo "--- [3/8] Empty Bearer token on protected route ---"
SC=$(curl -sS -o /tmp/jc112_test3.out -w "%{http_code}" \
  "$BASE_URL/deals/list" \
  -H "Authorization: Bearer " || true)
if [ "$SC" = "401" ]; then
  echo "  PASS: empty bearer token correctly rejected with 401"
  record_pass
else
  echo "  FAIL: expected 401 for empty bearer token, got $SC"
  record_fail "3-empty-bearer"
fi

# ── Test 4: Missing x-ted-execution-mode header on boundary-protected route ──
echo "--- [4/8] Missing x-ted-execution-mode on boundary-protected route ---"
mint_ted_auth_token
SC=$(curl -sS -o /tmp/jc112_test4.out -w "%{http_code}" \
  -X POST "$BASE_URL/governance/output/validate" \
  -H "Authorization: Bearer ${TED_AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"intent":"draft_email","output":"test"}' || true)
if [ "$SC" = "400" ] || [ "$SC" = "403" ]; then
  echo "  PASS: missing execution-mode header rejected with $SC"
  record_pass
else
  echo "  FAIL: expected 400 or 403 for missing execution-mode header, got $SC"
  record_fail "4-missing-exec-mode"
fi

# ── Test 5: Health route exempt from auth (expect 200) ──
echo "--- [5/8] Health route /status exempt from auth ---"
SC=$(curl -sS -o /tmp/jc112_test5.out -w "%{http_code}" \
  "$BASE_URL/status" || true)
if [ "$SC" = "200" ]; then
  echo "  PASS: /status is auth-exempt (200 with no auth header)"
  record_pass
else
  echo "  FAIL: expected 200 for auth-exempt /status, got $SC"
  record_fail "5-status-exempt"
fi

# ── Test 6: Doctor route exempt from auth (expect 200) ──
echo "--- [6/8] Doctor route /doctor exempt from auth ---"
SC=$(curl -sS -o /tmp/jc112_test6.out -w "%{http_code}" \
  "$BASE_URL/doctor" || true)
if [ "$SC" = "200" ]; then
  echo "  PASS: /doctor is auth-exempt (200 with no auth header)"
  record_pass
else
  echo "  FAIL: expected 200 for auth-exempt /doctor, got $SC"
  record_fail "6-doctor-exempt"
fi

# ── Test 7: Auth mint with missing operator_key (expect 400 or 401) ──
echo "--- [7/8] Auth mint with missing operator_key ---"
SC=$(curl -sS -o /tmp/jc112_test7.out -w "%{http_code}" \
  -X POST "$BASE_URL/auth/mint" \
  -H "Content-Type: application/json" \
  -H "x-ted-execution-mode: DETERMINISTIC" \
  -d '{}' || true)
if [ "$SC" = "400" ] || [ "$SC" = "401" ]; then
  echo "  PASS: mint with missing operator_key rejected with $SC"
  record_pass
else
  echo "  FAIL: expected 400 or 401 for missing operator_key, got $SC"
  record_fail "7-mint-missing-key"
fi

# ── Test 8: Auth mint with correct key returns token (expect 200) ──
echo "--- [8/8] Auth mint with correct operator_key returns token ---"
SC=$(curl -sS -o /tmp/jc112_test8.out -w "%{http_code}" \
  -X POST "$BASE_URL/auth/mint" \
  -H "Content-Type: application/json" \
  -H "x-ted-execution-mode: DETERMINISTIC" \
  -d '{"operator_key":"ted-local-operator"}' || true)
if [ "$SC" = "200" ]; then
  HAS_TOKEN=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
print('yes' if d.get('token') else 'no')
" < /tmp/jc112_test8.out 2>/dev/null || echo "no")
  if [ "$HAS_TOKEN" = "yes" ]; then
    echo "  PASS: mint returned 200 with token field"
    record_pass
  else
    echo "  FAIL: mint returned 200 but response missing token field"
    record_fail "8-mint-no-token"
  fi
else
  echo "  FAIL: expected 200 for valid mint, got $SC"
  record_fail "8-mint-valid"
fi

# ── Summary ──
echo ""
echo "=================================="
echo "JC-112 Proof Results"
echo "  PASSED: $PASS"
echo "  FAILED: $FAIL"
echo "  TOTAL:  $TESTED"
if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "  FAILED TESTS: ${FAILURES[*]}"
fi
echo "=================================="
exit "$FAIL"
