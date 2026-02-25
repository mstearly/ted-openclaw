#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
echo "JC-087 proof: Event Foundation (Phase 9)"
source "$(dirname "$0")/lib_auth.sh"

PASS=0
FAIL=0
TESTED=0
FAILURES=()

record_pass() { PASS=$((PASS + 1)); TESTED=$((TESTED + 1)); }
record_fail() { FAIL=$((FAIL + 1)); TESTED=$((TESTED + 1)); FAILURES+=("$1"); }

# ---------------------------------------------------------------------------
# 1. GET /events/stats returns valid response
# ---------------------------------------------------------------------------
echo ""
echo "--- [1/6] Event log stats endpoint (GET /events/stats) ---"
SC="$(curl -sS -o /tmp/jc087_stats.out -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" "$BASE_URL/events/stats" || true)"
if [ "$SC" = "200" ]; then
  echo "  HTTP 200 OK"
  if python3 -c "import json,sys; d=json.load(sys.stdin); assert 'total_events' in d; assert 'event_type_counts' in d" < /tmp/jc087_stats.out 2>/dev/null; then
    echo "  PASS: response has total_events + event_type_counts"
    record_pass
  else
    echo "  FAIL: response missing required fields"
    record_fail "1-stats-fields"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "1-stats-http"
fi

# ---------------------------------------------------------------------------
# 2. POST /commitments/create emits event to event_log
# ---------------------------------------------------------------------------
echo ""
echo "--- [2/6] Commitment create emits event_log entry ---"
# Record initial event count
BEFORE="$(curl -sS -H "Authorization: Bearer $TOKEN" "$BASE_URL/events/stats" | python3 -c "import json,sys; print(json.load(sys.stdin).get('total_events',0))" 2>/dev/null || echo 0)"

SC="$(curl -sS -o /tmp/jc087_commit.out -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"who_owes":"Isaac","who_to":"Clint","what":"Send PSA draft","entity":"olumie"}' \
  "$BASE_URL/commitments/create" || true)"

if [ "$SC" = "200" ]; then
  AFTER="$(curl -sS -H "Authorization: Bearer $TOKEN" "$BASE_URL/events/stats" | python3 -c "import json,sys; print(json.load(sys.stdin).get('total_events',0))" 2>/dev/null || echo 0)"
  if [ "$AFTER" -gt "$BEFORE" ]; then
    echo "  PASS: event count increased ($BEFORE -> $AFTER)"
    record_pass
  else
    echo "  FAIL: event count did not increase"
    record_fail "2-event-count"
  fi
else
  echo "  FAIL: commitment create returned $SC"
  record_fail "2-create-http"
fi

# ---------------------------------------------------------------------------
# 3. GET /events/recent returns event with correct type
# ---------------------------------------------------------------------------
echo ""
echo "--- [3/6] Recent events include commitment.created ---"
SC="$(curl -sS -o /tmp/jc087_recent.out -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" "$BASE_URL/events/recent?event_type=commitment.created&limit=5" || true)"
if [ "$SC" = "200" ]; then
  HAS_EVENT="$(python3 -c "
import json,sys
d=json.load(sys.stdin)
events=d.get('events',[])
found=any(e.get('event_type')=='commitment.created' for e in events)
print('yes' if found else 'no')
" < /tmp/jc087_recent.out 2>/dev/null || echo no)"
  if [ "$HAS_EVENT" = "yes" ]; then
    echo "  PASS: commitment.created event found in recent log"
    record_pass
  else
    echo "  FAIL: no commitment.created event in response"
    record_fail "3-event-type"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "3-recent-http"
fi

# ---------------------------------------------------------------------------
# 4. Audit ledger is separate from triage (JC-087b)
# ---------------------------------------------------------------------------
echo ""
echo "--- [4/6] Audit ledger separation ---"
SC="$(curl -sS -o /tmp/jc087_events2.out -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" "$BASE_URL/events/recent?event_type=audit.action&limit=5" || true)"
if [ "$SC" = "200" ]; then
  HAS_AUDIT="$(python3 -c "
import json,sys
d=json.load(sys.stdin)
found=any(e.get('event_type')=='audit.action' for e in d.get('events',[]))
print('yes' if found else 'no')
" < /tmp/jc087_events2.out 2>/dev/null || echo no)"
  if [ "$HAS_AUDIT" = "yes" ]; then
    echo "  PASS: audit.action events emitted to event_log"
    record_pass
  else
    echo "  FAIL: no audit.action events found"
    record_fail "4-audit-events"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "4-audit-http"
fi

# ---------------------------------------------------------------------------
# 5. Ops pause persists (JC-087d)
# ---------------------------------------------------------------------------
echo ""
echo "--- [5/6] Ops pause state persistence ---"
# Pause automation
SC="$(curl -sS -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"reason":"proof_test_pause"}' \
  "$BASE_URL/ops/pause" || true)"
if [ "$SC" = "200" ]; then
  # Check ops.paused event emitted
  HAS_OPS="$(curl -sS -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/events/recent?event_type=ops.paused&limit=3" | \
    python3 -c "import json,sys; d=json.load(sys.stdin); print('yes' if any(e.get('event_type')=='ops.paused' for e in d.get('events',[])) else 'no')" 2>/dev/null || echo no)"
  if [ "$HAS_OPS" = "yes" ]; then
    echo "  PASS: ops.paused event emitted"
    record_pass
  else
    echo "  FAIL: ops.paused event not found"
    record_fail "5-ops-event"
  fi
  # Resume to clean up
  curl -sS -o /dev/null -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/ops/resume" || true
else
  echo "  FAIL: pause returned $SC"
  record_fail "5-pause-http"
fi

# ---------------------------------------------------------------------------
# 6. Event envelope has required fields
# ---------------------------------------------------------------------------
echo ""
echo "--- [6/6] Event envelope schema validation ---"
SC="$(curl -sS -o /tmp/jc087_envelope.out -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" "$BASE_URL/events/recent?limit=1" || true)"
if [ "$SC" = "200" ]; then
  VALID="$(python3 -c "
import json,sys
d=json.load(sys.stdin)
events=d.get('events',[])
if not events:
  print('no_events')
else:
  e=events[-1]
  required=['event_id','event_type','timestamp','source','payload']
  missing=[f for f in required if f not in e]
  print('valid' if not missing else 'missing:'+','.join(missing))
" < /tmp/jc087_envelope.out 2>/dev/null || echo error)"
  if [ "$VALID" = "valid" ]; then
    echo "  PASS: event envelope has all required fields"
    record_pass
  else
    echo "  FAIL: envelope check returned: $VALID"
    record_fail "6-envelope"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "6-envelope-http"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=========================================="
echo "JC-087 Event Foundation Proof: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "FAILURES: ${FAILURES[*]}"
fi
echo "=========================================="
exit "$FAIL"
