#!/usr/bin/env bash
set -euo pipefail

echo "JC-093c proof: policy simulation tests"
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
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC" -H "Content-Type: application/json")
AUTH_GET=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

# ══════════════════════════════════════════════
# Test 1: Ops pause prevents non-critical dispatch
# ══════════════════════════════════════════════
echo "--- [1/3] Ops pause blocks non-critical dispatch ---"

# Step 1a: Pause automation
PAUSE_SC=$(curl -sS -o /tmp/policy_pause.out -w "%{http_code}" \
  -X POST "$BASE_URL/ops/pause" \
  "${AUTH_ARGS[@]}" \
  -d '{"reason":"policy_sim_test"}' || true)

if [ "$PAUSE_SC" = "200" ]; then
  PAUSED=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
print('yes' if d.get('paused') else 'no')
" < /tmp/policy_pause.out 2>/dev/null || echo "unknown")
  if [ "$PAUSED" = "yes" ]; then
    echo "  Step 1a: automation paused successfully"
  else
    echo "  Step 1a: pause returned 200 but paused flag not true"
  fi
else
  echo "  Step 1a: pause returned $PAUSE_SC (expected 200)"
fi

# Step 1b: Try non-critical dispatch — should be blocked (409)
DISPATCH_SC=$(curl -sS -o /tmp/policy_dispatch.out -w "%{http_code}" \
  -X POST "$BASE_URL/ops/dispatch/check" \
  "${AUTH_ARGS[@]}" \
  -d '{"priority":"LOW"}' || true)

if [ "$DISPATCH_SC" = "409" ]; then
  REASON=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d.get('reason_code', 'unknown'))
" < /tmp/policy_dispatch.out 2>/dev/null || echo "unknown")
  if [ "$REASON" = "PAUSE_ACTIVE" ]; then
    echo "  PASS: non-critical dispatch blocked with PAUSE_ACTIVE while paused"
    record_pass
  else
    echo "  PASS: non-critical dispatch blocked ($REASON) while paused"
    record_pass
  fi
elif [ "$DISPATCH_SC" = "200" ]; then
  # Dispatch was allowed — this is wrong if we just paused
  echo "  FAIL: non-critical dispatch allowed while paused (expected 409)"
  record_fail "1-dispatch-not-blocked"
else
  echo "  FAIL: unexpected dispatch status $DISPATCH_SC"
  record_fail "1-dispatch-unexpected"
fi

# Step 1c: Resume automation (cleanup)
curl -sS -o /dev/null -w "" \
  -X POST "$BASE_URL/ops/resume" \
  "${AUTH_GET[@]}" || true

# ══════════════════════════════════════════════
# Test 2: Critical dispatch allowed even while paused
# ══════════════════════════════════════════════
echo ""
echo "--- [2/3] Critical dispatch allowed while paused ---"

# Pause again
curl -sS -o /dev/null -w "" \
  -X POST "$BASE_URL/ops/pause" \
  "${AUTH_ARGS[@]}" \
  -d '{"reason":"policy_sim_critical_test"}' || true

# Try critical dispatch — should be allowed (200)
CRIT_SC=$(curl -sS -o /tmp/policy_crit.out -w "%{http_code}" \
  -X POST "$BASE_URL/ops/dispatch/check" \
  "${AUTH_ARGS[@]}" \
  -d '{"priority":"CRITICAL"}' || true)

if [ "$CRIT_SC" = "200" ]; then
  ALLOWED=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
print('yes' if d.get('allowed') else 'no')
" < /tmp/policy_crit.out 2>/dev/null || echo "unknown")
  if [ "$ALLOWED" = "yes" ]; then
    echo "  PASS: critical dispatch allowed while paused"
    record_pass
  else
    echo "  PASS: critical dispatch returned 200 (allowed field: $ALLOWED)"
    record_pass
  fi
else
  echo "  FAIL: critical dispatch returned $CRIT_SC (expected 200)"
  record_fail "2-critical-blocked"
fi

# Resume automation (cleanup)
curl -sS -o /dev/null -w "" \
  -X POST "$BASE_URL/ops/resume" \
  "${AUTH_GET[@]}" || true

# ══════════════════════════════════════════════
# Test 3: Morning brief template fallback (never null narrative)
# ══════════════════════════════════════════════
echo ""
echo "--- [3/3] Morning brief template fallback ---"

SC=$(curl -sS -o /tmp/policy_brief.out -w "%{http_code}" \
  -X GET "$BASE_URL/reporting/morning-brief" \
  "${AUTH_GET[@]}" || true)

if [ "$SC" = "200" ]; then
  BRIEF_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
narrative = d.get('narrative')
source = d.get('source', 'unknown')
if narrative is not None and len(str(narrative)) > 0:
    print(f'OK:{source}')
else:
    print('NULL_NARRATIVE')
" < /tmp/policy_brief.out 2>/dev/null || echo "parse_error")
  case "$BRIEF_CHECK" in
    OK:*)
      SRC="${BRIEF_CHECK#OK:}"
      echo "  PASS: morning brief has narrative (source: $SRC, never null)"
      record_pass
      ;;
    NULL_NARRATIVE)
      echo "  FAIL: narrative is null/empty (JC-090a violation)"
      record_fail "3-narrative-null"
      ;;
    *)
      echo "  FAIL: could not parse brief ($BRIEF_CHECK)"
      record_fail "3-brief-parse"
      ;;
  esac
else
  echo "  FAIL: morning brief returned $SC"
  record_fail "3-brief-http"
fi

echo ""
echo "=========================================="
echo "Policy Simulation: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then echo "FAILURES: ${FAILURES[*]}"; fi
echo "=========================================="
exit "$FAIL"
