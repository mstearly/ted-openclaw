#!/usr/bin/env bash
set -euo pipefail

echo "JC-103 proof: Sync Reconciliation + Proposals"
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

# ---------------------------------------------------------------------------
# 1. GET /graph/olumie/sync/reconcile returns 200 with required fields
# ---------------------------------------------------------------------------
echo "--- [1/6] Sync reconcile endpoint (GET /graph/olumie/sync/reconcile) ---"
SC="$(curl -sS -o /tmp/jc103_reconcile.out -w "%{http_code}" \
  -X GET "$BASE_URL/graph/olumie/sync/reconcile" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$SC" = "200" ]; then
  RECONCILE_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
required = ['drift_items', 'proposed_writes', 'local_counts', 'remote_counts']
missing = [f for f in required if f not in d]
if missing:
    print('MISSING:' + ','.join(missing))
else:
    assert isinstance(d['drift_items'], list), 'drift_items is not a list'
    assert isinstance(d['proposed_writes'], list), 'proposed_writes is not a list'
    assert isinstance(d['local_counts'], dict), 'local_counts is not a dict'
    assert isinstance(d['remote_counts'], dict), 'remote_counts is not a dict'
    print('OK')
" < /tmp/jc103_reconcile.out 2>/dev/null || echo "FAIL")"
  if [ "$RECONCILE_CHECK" = "OK" ]; then
    echo "  PASS: reconcile returned 200 with drift_items, proposed_writes, local_counts, remote_counts"
    record_pass
  else
    echo "  FAIL: reconcile response shape invalid: $RECONCILE_CHECK"
    record_fail "1-reconcile-shape"
  fi
else
  echo "  FAIL: expected 200 from sync/reconcile, got $SC"
  record_fail "1-reconcile-http"
fi

# ---------------------------------------------------------------------------
# 2. GET /graph/olumie/sync/proposals returns 200 with proposals array
# ---------------------------------------------------------------------------
echo "--- [2/6] Sync proposals endpoint (GET /graph/olumie/sync/proposals) ---"
SC="$(curl -sS -o /tmp/jc103_proposals.out -w "%{http_code}" \
  -X GET "$BASE_URL/graph/olumie/sync/proposals" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$SC" = "200" ]; then
  PROPOSALS_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert 'proposals' in d, 'missing proposals array'
assert isinstance(d['proposals'], list), 'proposals is not a list'
assert 'total_count' in d, 'missing total_count'
assert isinstance(d['total_count'], int), 'total_count is not an int'
print('OK')
" < /tmp/jc103_proposals.out 2>/dev/null || echo "FAIL")"
  if [ "$PROPOSALS_CHECK" = "OK" ]; then
    echo "  PASS: proposals returned 200 with proposals array and total_count"
    record_pass
  else
    echo "  FAIL: proposals response shape invalid"
    record_fail "2-proposals-shape"
  fi
else
  echo "  FAIL: expected 200 from sync/proposals, got $SC"
  record_fail "2-proposals-http"
fi

# ---------------------------------------------------------------------------
# 3. POST approve on nonexistent proposal returns 404
# ---------------------------------------------------------------------------
echo "--- [3/6] Approve nonexistent proposal returns 404 ---"
SC="$(curl -sS -o /tmp/jc103_approve_404.out -w "%{http_code}" \
  -X POST "$BASE_URL/graph/olumie/sync/proposals/nonexistent-proposal-id/approve" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{}' || true)"
if [ "$SC" = "404" ]; then
  ERROR_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
print('OK' if d.get('error') == 'proposal_not_found' else 'WRONG_ERROR:' + str(d.get('error')))
" < /tmp/jc103_approve_404.out 2>/dev/null || echo "FAIL")"
  if [ "$ERROR_CHECK" = "OK" ]; then
    echo "  PASS: approve nonexistent -> 404 proposal_not_found"
    record_pass
  else
    echo "  FAIL: 404 but wrong error: $ERROR_CHECK"
    record_fail "3-approve-error"
  fi
else
  echo "  FAIL: expected 404, got $SC"
  record_fail "3-approve-http"
fi

# ---------------------------------------------------------------------------
# 4. POST reject on nonexistent proposal returns 404
# ---------------------------------------------------------------------------
echo "--- [4/6] Reject nonexistent proposal returns 404 ---"
SC="$(curl -sS -o /tmp/jc103_reject_404.out -w "%{http_code}" \
  -X POST "$BASE_URL/graph/olumie/sync/proposals/nonexistent-proposal-id/reject" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{}' || true)"
if [ "$SC" = "404" ]; then
  ERROR_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
print('OK' if d.get('error') == 'proposal_not_found' else 'WRONG_ERROR:' + str(d.get('error')))
" < /tmp/jc103_reject_404.out 2>/dev/null || echo "FAIL")"
  if [ "$ERROR_CHECK" = "OK" ]; then
    echo "  PASS: reject nonexistent -> 404 proposal_not_found"
    record_pass
  else
    echo "  FAIL: 404 but wrong error: $ERROR_CHECK"
    record_fail "4-reject-error"
  fi
else
  echo "  FAIL: expected 404, got $SC"
  record_fail "4-reject-http"
fi

# ---------------------------------------------------------------------------
# 5. Reconciliation returns valid counts structure
# ---------------------------------------------------------------------------
echo "--- [5/6] Reconciliation counts structure (local + remote) ---"
# Re-use the reconcile output from test 1 if it was 200; otherwise re-fetch
if [ ! -f /tmp/jc103_reconcile.out ]; then
  curl -sS -o /tmp/jc103_reconcile.out \
    -X GET "$BASE_URL/graph/olumie/sync/reconcile" \
    "${AUTH_ARGS[@]}" || true
fi
COUNTS_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
lc = d.get('local_counts', {})
rc = d.get('remote_counts', {})
# Verify local_counts has expected keys
assert 'commitments' in lc, 'local_counts missing commitments'
assert 'gtd_actions' in lc, 'local_counts missing gtd_actions'
assert isinstance(lc['commitments'], int), 'commitments is not int'
assert isinstance(lc['gtd_actions'], int), 'gtd_actions is not int'
# Verify remote_counts has expected keys
assert 'planner_tasks' in rc, 'remote_counts missing planner_tasks'
assert 'todo_tasks' in rc, 'remote_counts missing todo_tasks'
assert isinstance(rc['planner_tasks'], int), 'planner_tasks is not int'
assert isinstance(rc['todo_tasks'], int), 'todo_tasks is not int'
print('OK')
" < /tmp/jc103_reconcile.out 2>/dev/null || echo "FAIL")"
if [ "$COUNTS_CHECK" = "OK" ]; then
  echo "  PASS: local_counts has commitments+gtd_actions, remote_counts has planner_tasks+todo_tasks"
  record_pass
else
  echo "  FAIL: counts structure invalid"
  record_fail "5-counts-shape"
fi

# ---------------------------------------------------------------------------
# 6. Event log shows sync.reconciliation.completed after reconciliation
# ---------------------------------------------------------------------------
echo "--- [6/6] Event log contains sync.reconciliation.completed ---"
SC="$(curl -sS -o /tmp/jc103_events.out -w "%{http_code}" \
  -X GET "$BASE_URL/events/recent?event_type=sync.reconciliation.completed&limit=3" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$SC" = "200" ]; then
  EVENT_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
events = d.get('events', [])
found = any(e.get('event_type') == 'sync.reconciliation.completed' for e in events)
print('OK' if found else 'NOT_FOUND')
" < /tmp/jc103_events.out 2>/dev/null || echo "FAIL")"
  if [ "$EVENT_CHECK" = "OK" ]; then
    echo "  PASS: sync.reconciliation.completed event found in event log"
    record_pass
  else
    echo "  FAIL: no sync.reconciliation.completed event found (may need to run test 1 first)"
    record_fail "6-event-missing"
  fi
else
  echo "  FAIL: expected 200 from events/recent, got $SC"
  record_fail "6-events-http"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=========================================="
echo "JC-103 Sync Reconciliation + Proposals: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "FAILURES: ${FAILURES[*]}"
fi
echo "=========================================="
exit "$FAIL"
