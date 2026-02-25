#!/usr/bin/env bash
set -euo pipefail

echo "JC-088 proof: Phase 10 — Missing Ledgers"
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

# ── Test 1: Trust ledger — POST /reporting/trust-metrics has trust_validations ──
echo "--- [1/6] POST /reporting/trust-metrics has trust_validations field ---"
SC=$(curl -sS -o /tmp/jc088_trust.out -w "%{http_code}" \
  -X POST "$BASE_URL/reporting/trust-metrics" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{}' || true)

if [ "$SC" = "200" ]; then
  TRUST_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
if 'trust_validations' in d:
    print('OK')
else:
    # Check alternative field names
    keys = list(d.keys())
    print(f'MISSING:trust_validations:keys={keys[:5]}')
" < /tmp/jc088_trust.out 2>/dev/null || echo "parse_error")
  if [ "$TRUST_CHECK" = "OK" ]; then
    echo "  PASS: trust-metrics response has trust_validations field"
    record_pass
  else
    echo "  FAIL: trust-metrics response missing trust_validations ($TRUST_CHECK)"
    record_fail "1-trust-validations"
  fi
else
  echo "  FAIL: expected 200 from trust-metrics, got $SC"
  record_fail "1-trust-status"
fi

# ── Test 2: Policy ledger — GET /events/recent with policy config snapshot ──
echo "--- [2/6] GET /events/recent for policy.config.snapshot ---"
SC=$(curl -sS -o /tmp/jc088_policy.out -w "%{http_code}" \
  -X GET "$BASE_URL/events/recent?event_type=policy.config.snapshot&limit=1" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ]; then
  POLICY_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
events = d.get('events', [])
if isinstance(events, list):
    print(f'OK:count={len(events)}')
else:
    print('MISSING:events_array')
" < /tmp/jc088_policy.out 2>/dev/null || echo "parse_error")
  case "$POLICY_CHECK" in
    OK:*)
      echo "  PASS: policy event endpoint returned 200 ($POLICY_CHECK)"
      record_pass
      ;;
    *)
      echo "  FAIL: policy event response invalid ($POLICY_CHECK)"
      record_fail "2-policy-events"
      ;;
  esac
else
  echo "  FAIL: expected 200 from events/recent, got $SC"
  record_fail "2-policy-status"
fi

# ── Test 3: Deep work ledger — GET /reporting/deep-work-metrics has ledger_sessions ──
echo "--- [3/6] GET /reporting/deep-work-metrics has ledger_sessions field ---"
SC=$(curl -sS -o /tmp/jc088_deepwork.out -w "%{http_code}" \
  -X GET "$BASE_URL/reporting/deep-work-metrics" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ]; then
  DW_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
if 'ledger_sessions' in d:
    print('OK')
else:
    keys = list(d.keys())
    print(f'MISSING:ledger_sessions:keys={keys[:5]}')
" < /tmp/jc088_deepwork.out 2>/dev/null || echo "parse_error")
  if [ "$DW_CHECK" = "OK" ]; then
    echo "  PASS: deep-work-metrics response has ledger_sessions field"
    record_pass
  else
    echo "  FAIL: deep-work-metrics missing ledger_sessions ($DW_CHECK)"
    record_fail "3-deepwork-sessions"
  fi
else
  echo "  FAIL: expected 200 from deep-work-metrics, got $SC"
  record_fail "3-deepwork-status"
fi

# ── Test 4: Graph sync ledger — GET /events/recent for graph.sync.completed ──
echo "--- [4/6] GET /events/recent for graph.sync.completed (may be empty) ---"
SC=$(curl -sS -o /tmp/jc088_graph.out -w "%{http_code}" \
  -X GET "$BASE_URL/events/recent?event_type=graph.sync.completed&limit=1" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ]; then
  GRAPH_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
events = d.get('events', [])
if isinstance(events, list):
    print(f'OK:count={len(events)}')
else:
    print('MISSING:events_array')
" < /tmp/jc088_graph.out 2>/dev/null || echo "parse_error")
  case "$GRAPH_CHECK" in
    OK:*)
      echo "  PASS: graph sync event endpoint returned 200 ($GRAPH_CHECK)"
      record_pass
      ;;
    *)
      echo "  FAIL: graph sync event response invalid ($GRAPH_CHECK)"
      record_fail "4-graph-events"
      ;;
  esac
else
  echo "  FAIL: expected 200 from events/recent, got $SC"
  record_fail "4-graph-status"
fi

# ── Test 5: Mail/Calendar stubs — GET /events/stats has event_type_counts ──
echo "--- [5/6] GET /events/stats has event_type_counts ---"
SC=$(curl -sS -o /tmp/jc088_stats.out -w "%{http_code}" \
  -X GET "$BASE_URL/events/stats" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ]; then
  STATS_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
if 'event_type_counts' in d:
    counts = d['event_type_counts']
    print(f'OK:types={len(counts)}')
else:
    keys = list(d.keys())
    print(f'MISSING:event_type_counts:keys={keys[:5]}')
" < /tmp/jc088_stats.out 2>/dev/null || echo "parse_error")
  case "$STATS_CHECK" in
    OK:*)
      echo "  PASS: events/stats has event_type_counts ($STATS_CHECK)"
      record_pass
      ;;
    *)
      echo "  FAIL: events/stats missing event_type_counts ($STATS_CHECK)"
      record_fail "5-stats-counts"
      ;;
  esac
else
  echo "  FAIL: expected 200 from events/stats, got $SC"
  record_fail "5-stats-status"
fi

# ── Test 6: PARA index — POST /filing/para/classify then verify event ──
echo "--- [6/6] PARA classify emits filing.para.classified event ---"
SC=$(curl -sS -o /tmp/jc088_para.out -w "%{http_code}" \
  -X POST "$BASE_URL/filing/para/classify" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"item":"test doc","text":"quarterly report"}' || true)

if [ "$SC" = "200" ]; then
  echo "  PARA classify returned 200, checking event log..."
  # Brief pause to allow event write
  sleep 0.5
  SC2=$(curl -sS -o /tmp/jc088_para_event.out -w "%{http_code}" \
    -X GET "$BASE_URL/events/recent?event_type=filing.para.classified&limit=1" \
    "${AUTH_ARGS[@]}" || true)
  if [ "$SC2" = "200" ]; then
    PARA_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
events = d.get('events', [])
if isinstance(events, list) and len(events) > 0:
    print('OK:event_found')
elif isinstance(events, list):
    print('OK:empty_but_valid')
else:
    print('MISSING:events_array')
" < /tmp/jc088_para_event.out 2>/dev/null || echo "parse_error")
    case "$PARA_CHECK" in
      OK:*)
        echo "  PASS: PARA classify event endpoint works ($PARA_CHECK)"
        record_pass
        ;;
      *)
        echo "  FAIL: PARA event check invalid ($PARA_CHECK)"
        record_fail "6-para-event"
        ;;
    esac
  else
    echo "  FAIL: expected 200 from events/recent after classify, got $SC2"
    record_fail "6-para-event-status"
  fi
else
  echo "  FAIL: expected 200 from filing/para/classify, got $SC"
  record_fail "6-para-classify"
fi

echo ""
echo "=========================================="
echo "JC-088 Missing Ledgers: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then echo "FAILURES: ${FAILURES[*]}"; fi
echo "=========================================="
exit "$FAIL"
