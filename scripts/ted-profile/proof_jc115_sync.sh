#!/usr/bin/env bash
set -euo pipefail

echo "JC-115 proof: Planner + To Do + Sync Endpoints"
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

# ── Test 1: Planner plans list endpoint exists ──
echo "--- [1/8] GET /graph/olumie/planner/plans endpoint exists ---"
SC=$(curl -sS -o /dev/null -w "%{http_code}" \
  "${AUTH_ARGS[@]}" "$BASE_URL/graph/olumie/planner/plans" || true)
if [ "$SC" = "200" ] || [ "$SC" = "409" ] || [ "$SC" = "502" ]; then
  echo "  PASS: planner/plans returned $SC (endpoint wired)"
  record_pass
elif [ "$SC" = "404" ]; then
  echo "  FAIL: endpoint missing (404)"
  record_fail "1-planner-plans-missing"
else
  echo "  FAIL: unexpected status $SC"
  record_fail "1-planner-plans-unexpected-$SC"
fi

# ── Test 2: To Do lists endpoint exists ──
echo "--- [2/8] GET /graph/olumie/todo/lists endpoint exists ---"
SC=$(curl -sS -o /dev/null -w "%{http_code}" \
  "${AUTH_ARGS[@]}" "$BASE_URL/graph/olumie/todo/lists" || true)
if [ "$SC" = "200" ] || [ "$SC" = "409" ] || [ "$SC" = "502" ]; then
  echo "  PASS: todo/lists returned $SC (endpoint wired)"
  record_pass
elif [ "$SC" = "404" ]; then
  echo "  FAIL: endpoint missing (404)"
  record_fail "2-todo-lists-missing"
else
  echo "  FAIL: unexpected status $SC"
  record_fail "2-todo-lists-unexpected-$SC"
fi

# ── Test 3: Sync reconcile endpoint exists ──
echo "--- [3/8] GET /graph/olumie/sync/reconcile endpoint exists ---"
SC=$(curl -sS -o /dev/null -w "%{http_code}" \
  "${AUTH_ARGS[@]}" "$BASE_URL/graph/olumie/sync/reconcile" || true)
if [ "$SC" = "200" ] || [ "$SC" = "409" ] || [ "$SC" = "502" ]; then
  echo "  PASS: sync/reconcile returned $SC (endpoint wired)"
  record_pass
elif [ "$SC" = "404" ]; then
  echo "  FAIL: endpoint missing (404)"
  record_fail "3-sync-reconcile-missing"
else
  echo "  FAIL: unexpected status $SC"
  record_fail "3-sync-reconcile-unexpected-$SC"
fi

# ── Test 4: Sync proposals list endpoint exists (reads local JSONL) ──
echo "--- [4/8] GET /graph/olumie/sync/proposals returns 200 ---"
SC=$(curl -sS -o /dev/null -w "%{http_code}" \
  "${AUTH_ARGS[@]}" "$BASE_URL/graph/olumie/sync/proposals" || true)
if [ "$SC" = "200" ]; then
  echo "  PASS: sync/proposals returned 200"
  record_pass
elif [ "$SC" = "404" ]; then
  echo "  FAIL: endpoint missing (404)"
  record_fail "4-sync-proposals-missing"
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "4-sync-proposals-unexpected-$SC"
fi

# ── Test 5: Sync proposals approve on non-existent returns 404 ──
echo "--- [5/8] POST /graph/olumie/sync/proposals/FAKE-PROPOSAL-999/approve returns 404 ---"
SC=$(curl -sS -o /dev/null -w "%{http_code}" -X POST \
  "${AUTH_ARGS[@]}" -H "Content-Type: application/json" -d '{}' \
  "$BASE_URL/graph/olumie/sync/proposals/FAKE-PROPOSAL-999/approve" || true)
if [ "$SC" = "404" ]; then
  echo "  PASS: approve on non-existent proposal returned 404"
  record_pass
else
  echo "  FAIL: expected 404, got $SC"
  record_fail "5-approve-nonexistent-$SC"
fi

# ── Test 6: Sync proposals reject on non-existent returns 404 ──
echo "--- [6/8] POST /graph/olumie/sync/proposals/FAKE-PROPOSAL-999/reject returns 404 ---"
SC=$(curl -sS -o /dev/null -w "%{http_code}" -X POST \
  "${AUTH_ARGS[@]}" -H "Content-Type: application/json" -d '{}' \
  "$BASE_URL/graph/olumie/sync/proposals/FAKE-PROPOSAL-999/reject" || true)
if [ "$SC" = "404" ]; then
  echo "  PASS: reject on non-existent proposal returned 404"
  record_pass
else
  echo "  FAIL: expected 404, got $SC"
  record_fail "6-reject-nonexistent-$SC"
fi

# ── Test 7: Graph sync status endpoint exists and returns profile_id ──
echo "--- [7/8] GET /graph/olumie/sync/status returns 200 with profile_id ---"
SC=$(curl -sS -o /tmp/jc115_sync_status.out -w "%{http_code}" \
  "${AUTH_ARGS[@]}" "$BASE_URL/graph/olumie/sync/status?limit=5" || true)
if [ "$SC" = "200" ]; then
  PROFILE_ID=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d.get('profile_id', ''))
" < /tmp/jc115_sync_status.out 2>/dev/null || echo "parse_error")
  if [ "$PROFILE_ID" = "olumie" ]; then
    echo "  PASS: sync/status returned 200 with profile_id=olumie"
    record_pass
  else
    echo "  FAIL: profile_id expected 'olumie', got '$PROFILE_ID'"
    record_fail "7-sync-status-profile-id"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "7-sync-status-$SC"
fi

# ── Test 8: Commitment extraction endpoint exists ──
echo "--- [8/8] POST /graph/olumie/mail/test-msg-999/extract-commitments endpoint exists ---"
SC=$(curl -sS -o /dev/null -w "%{http_code}" -X POST \
  "${AUTH_ARGS[@]}" -H "Content-Type: application/json" -d '{}' \
  "$BASE_URL/graph/olumie/mail/test-msg-999/extract-commitments" || true)
if [ "$SC" = "200" ] || [ "$SC" = "409" ] || [ "$SC" = "502" ]; then
  echo "  PASS: extract-commitments returned $SC (endpoint wired)"
  record_pass
elif [ "$SC" = "404" ]; then
  echo "  FAIL: endpoint missing (404)"
  record_fail "8-extract-commitments-missing"
else
  echo "  FAIL: unexpected status $SC"
  record_fail "8-extract-commitments-unexpected-$SC"
fi

echo ""
echo "=========================================="
echo "JC-115 Planner + To Do + Sync: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then echo "FAILURES: ${FAILURES[*]}"; fi
echo "=========================================="
exit "$FAIL"
