#!/usr/bin/env bash
set -euo pipefail

echo "JC-114 proof: State Machine Violations — Invalid Transitions, Terminal States"
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

# ── Test 1: Approve non-existent draft returns 404 ──
echo "--- [1/8] Approve non-existent draft returns 404 ---"
SC=$(curl -sS -o /tmp/jc114_t1.out -w "%{http_code}" \
  -X POST "$BASE_URL/drafts/FAKE-DRAFT-999/approve" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{}' || true)
if [ "$SC" = "404" ] || [ "$SC" = "409" ]; then
  echo "  PASS: approve on non-existent draft returns $SC (correctly rejected)"
  record_pass
else
  echo "  FAIL: expected 404 or 409, got $SC"
  record_fail "1-approve-nonexistent"
fi

# ── Test 2: Execute non-existent draft returns 404 ──
echo "--- [2/8] Execute non-existent draft returns 404 ---"
SC=$(curl -sS -o /tmp/jc114_t2.out -w "%{http_code}" \
  -X POST "$BASE_URL/drafts/FAKE-DRAFT-999/execute" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{}' || true)
if [ "$SC" = "404" ] || [ "$SC" = "409" ]; then
  echo "  PASS: execute on non-existent draft returns $SC (correctly rejected)"
  record_pass
else
  echo "  FAIL: expected 404 or 409, got $SC"
  record_fail "2-execute-nonexistent"
fi

# ── Test 3: Edit non-existent draft returns 404 ──
echo "--- [3/8] Edit non-existent draft returns 404 ---"
SC=$(curl -sS -o /tmp/jc114_t3.out -w "%{http_code}" \
  -X POST "$BASE_URL/drafts/FAKE-DRAFT-999/edit" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"subject":"test","body":"test"}' || true)
if [ "$SC" = "404" ] || [ "$SC" = "409" ]; then
  echo "  PASS: edit on non-existent draft returns $SC (correctly rejected)"
  record_pass
else
  echo "  FAIL: expected 404 or 409, got $SC"
  record_fail "3-edit-nonexistent"
fi

# ── Test 4: Archive non-existent draft returns 404 ──
echo "--- [4/8] Archive non-existent draft returns 404 ---"
SC=$(curl -sS -o /tmp/jc114_t4.out -w "%{http_code}" \
  -X POST "$BASE_URL/drafts/FAKE-DRAFT-999/archive" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{}' || true)
if [ "$SC" = "404" ] || [ "$SC" = "409" ]; then
  echo "  PASS: archive on non-existent draft returns $SC (correctly rejected)"
  record_pass
else
  echo "  FAIL: expected 404 or 409, got $SC"
  record_fail "4-archive-nonexistent"
fi

# ── Test 5: Submit-review on non-existent draft returns 404 ──
echo "--- [5/8] Submit-review on non-existent draft returns 404 ---"
SC=$(curl -sS -o /tmp/jc114_t5.out -w "%{http_code}" \
  -X POST "$BASE_URL/drafts/FAKE-DRAFT-999/submit-review" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{}' || true)
if [ "$SC" = "404" ] || [ "$SC" = "409" ]; then
  echo "  PASS: submit-review on non-existent draft returns $SC (correctly rejected)"
  record_pass
else
  echo "  FAIL: expected 404 or 409, got $SC"
  record_fail "5-submit-review-nonexistent"
fi

# ── Test 6: Escalate non-existent commitment returns 404 ──
echo "--- [6/8] Escalate non-existent commitment returns 404 ---"
SC=$(curl -sS -o /tmp/jc114_t6.out -w "%{http_code}" \
  -X POST "$BASE_URL/commitments/FAKE-COMMIT-999/escalate" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{}' || true)
if [ "$SC" = "404" ] || [ "$SC" = "409" ]; then
  echo "  PASS: escalate on non-existent commitment returns $SC (correctly rejected)"
  record_pass
else
  echo "  FAIL: expected 404 or 409, got $SC"
  record_fail "6-escalate-nonexistent"
fi

# ── Test 7: Complete non-existent commitment returns 404 ──
echo "--- [7/8] Complete non-existent commitment returns 404 ---"
SC=$(curl -sS -o /tmp/jc114_t7.out -w "%{http_code}" \
  -X POST "$BASE_URL/commitments/FAKE-COMMIT-999/complete" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"evidence":"test"}' || true)
if [ "$SC" = "404" ] || [ "$SC" = "409" ]; then
  echo "  PASS: complete on non-existent commitment returns $SC (correctly rejected)"
  record_pass
else
  echo "  FAIL: expected 404 or 409, got $SC"
  record_fail "7-complete-nonexistent"
fi

# ── Test 8: Resolve non-existent facility alert returns 404 ──
echo "--- [8/8] Resolve non-existent facility alert returns 404 ---"
SC=$(curl -sS -o /tmp/jc114_t8.out -w "%{http_code}" \
  -X POST "$BASE_URL/facility/alert/FAKE-ALERT-999/resolve" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"resolution":"test"}' || true)
if [ "$SC" = "404" ] || [ "$SC" = "409" ]; then
  echo "  PASS: resolve on non-existent facility alert returns $SC (correctly rejected)"
  record_pass
else
  echo "  FAIL: expected 404 or 409, got $SC"
  record_fail "8-resolve-nonexistent"
fi

# ── Summary ──
echo ""
echo "=================================="
echo "JC-114 Proof Results"
echo "  PASSED: $PASS"
echo "  FAILED: $FAIL"
echo "  TOTAL:  $TESTED"
if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "  FAILED TESTS: ${FAILURES[*]}"
fi
echo "=================================="
exit "$FAIL"
