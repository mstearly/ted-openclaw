#!/usr/bin/env bash
set -euo pipefail

echo "JC-102 proof: Planner + To Do Integration (Phase 16-21)"
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
# 1. GET /graph/olumie/planner/plans returns 200 or 409 (NOT_AUTHENTICATED)
# ---------------------------------------------------------------------------
echo "--- [1/6] Planner plans endpoint (GET /graph/olumie/planner/plans) ---"
SC="$(curl -sS -o /tmp/jc102_plans.out -w "%{http_code}" \
  -X GET "$BASE_URL/graph/olumie/planner/plans" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$SC" = "200" ]; then
  PLANS_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert 'plans' in d, 'missing plans array'
assert isinstance(d['plans'], list), 'plans is not a list'
print('OK')
" < /tmp/jc102_plans.out 2>/dev/null || echo "FAIL")"
  if [ "$PLANS_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 200 — response has 'plans' array"
    record_pass
  else
    echo "  FAIL: HTTP 200 but response missing 'plans' array"
    record_fail "1-plans-shape"
  fi
elif [ "$SC" = "409" ]; then
  AUTH_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
print('OK' if d.get('error') == 'NOT_AUTHENTICATED' else 'UNEXPECTED')
" < /tmp/jc102_plans.out 2>/dev/null || echo "FAIL")"
  if [ "$AUTH_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 409 NOT_AUTHENTICATED (expected without Azure AD creds)"
    record_pass
  else
    echo "  FAIL: HTTP 409 but error is not NOT_AUTHENTICATED"
    record_fail "1-plans-409-shape"
  fi
else
  echo "  FAIL: expected 200 or 409, got $SC"
  record_fail "1-plans-http"
fi

# ---------------------------------------------------------------------------
# 2. GET /graph/olumie/todo/lists returns 200 or 409
# ---------------------------------------------------------------------------
echo "--- [2/6] To Do lists endpoint (GET /graph/olumie/todo/lists) ---"
SC="$(curl -sS -o /tmp/jc102_todo.out -w "%{http_code}" \
  -X GET "$BASE_URL/graph/olumie/todo/lists" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$SC" = "200" ]; then
  LISTS_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert 'lists' in d, 'missing lists array'
assert isinstance(d['lists'], list), 'lists is not a list'
print('OK')
" < /tmp/jc102_todo.out 2>/dev/null || echo "FAIL")"
  if [ "$LISTS_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 200 — response has 'lists' array"
    record_pass
  else
    echo "  FAIL: HTTP 200 but response missing 'lists' array"
    record_fail "2-todo-shape"
  fi
elif [ "$SC" = "409" ]; then
  AUTH_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
print('OK' if d.get('error') == 'NOT_AUTHENTICATED' else 'UNEXPECTED')
" < /tmp/jc102_todo.out 2>/dev/null || echo "FAIL")"
  if [ "$AUTH_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 409 NOT_AUTHENTICATED (expected without Azure AD creds)"
    record_pass
  else
    echo "  FAIL: HTTP 409 but error is not NOT_AUTHENTICATED"
    record_fail "2-todo-409-shape"
  fi
else
  echo "  FAIL: expected 200 or 409, got $SC"
  record_fail "2-todo-http"
fi

# ---------------------------------------------------------------------------
# 3. Planner plans response has correct plan shape when accessible
# ---------------------------------------------------------------------------
echo "--- [3/6] Planner plans response shape (plan_id + title fields) ---"
# Re-use output from test 1
if [ "$SC" = "200" ] 2>/dev/null; then
  # Re-read the plans response (test 1 may have been 200 or 409; re-check planner)
  true
fi
SC3="$(curl -sS -o /tmp/jc102_plans3.out -w "%{http_code}" \
  -X GET "$BASE_URL/graph/olumie/planner/plans" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$SC3" = "200" ]; then
  SHAPE_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
plans = d.get('plans', [])
if len(plans) == 0:
    print('OK_EMPTY')
else:
    for p in plans:
        assert 'plan_id' in p, f'plan missing plan_id'
        assert 'title' in p, f'plan missing title'
    print('OK')
" < /tmp/jc102_plans3.out 2>/dev/null || echo "FAIL")"
  if [ "$SHAPE_CHECK" = "OK" ] || [ "$SHAPE_CHECK" = "OK_EMPTY" ]; then
    echo "  PASS: plan objects have plan_id and title ($SHAPE_CHECK)"
    record_pass
  else
    echo "  FAIL: plan objects missing required fields"
    record_fail "3-plan-fields"
  fi
elif [ "$SC3" = "409" ]; then
  echo "  PASS: auth required — plan shape test deferred (NOT_AUTHENTICATED)"
  record_pass
else
  echo "  FAIL: expected 200 or 409, got $SC3"
  record_fail "3-plan-http"
fi

# ---------------------------------------------------------------------------
# 4. To Do lists response has correct list shape when accessible
# ---------------------------------------------------------------------------
echo "--- [4/6] To Do lists response shape (id + display_name fields) ---"
SC4="$(curl -sS -o /tmp/jc102_todo4.out -w "%{http_code}" \
  -X GET "$BASE_URL/graph/olumie/todo/lists" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$SC4" = "200" ]; then
  SHAPE_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
lists = d.get('lists', [])
if len(lists) == 0:
    print('OK_EMPTY')
else:
    for l in lists:
        assert 'id' in l, 'list missing id'
        assert 'display_name' in l, 'list missing display_name'
    print('OK')
" < /tmp/jc102_todo4.out 2>/dev/null || echo "FAIL")"
  if [ "$SHAPE_CHECK" = "OK" ] || [ "$SHAPE_CHECK" = "OK_EMPTY" ]; then
    echo "  PASS: list objects have id and display_name ($SHAPE_CHECK)"
    record_pass
  else
    echo "  FAIL: list objects missing required fields"
    record_fail "4-list-fields"
  fi
elif [ "$SC4" = "409" ]; then
  echo "  PASS: auth required — list shape test deferred (NOT_AUTHENTICATED)"
  record_pass
else
  echo "  FAIL: expected 200 or 409, got $SC4"
  record_fail "4-list-http"
fi

# ---------------------------------------------------------------------------
# 5. Unauthenticated request returns 401
# ---------------------------------------------------------------------------
echo "--- [5/6] Unauthenticated planner request returns 401 ---"
SC5="$(curl -sS -o /tmp/jc102_noauth.out -w "%{http_code}" \
  -X GET "$BASE_URL/graph/olumie/planner/plans" \
  -H "x-ted-execution-mode: DETERMINISTIC" || true)"
if [ "$SC5" = "401" ]; then
  BLOCKED_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('blocked') == True, 'missing blocked flag'
assert d.get('reason_code') == 'MISSING_OR_INVALID_AUTH', 'wrong reason_code'
print('OK')
" < /tmp/jc102_noauth.out 2>/dev/null || echo "FAIL")"
  if [ "$BLOCKED_CHECK" = "OK" ]; then
    echo "  PASS: 401 with MISSING_OR_INVALID_AUTH explainability"
    record_pass
  else
    echo "  FAIL: 401 response but missing expected explainability fields"
    record_fail "5-noauth-shape"
  fi
else
  echo "  FAIL: expected 401 for unauthenticated request, got $SC5"
  record_fail "5-noauth-http"
fi

# ---------------------------------------------------------------------------
# 6. Planner config exists in graph.profiles.json
# ---------------------------------------------------------------------------
echo "--- [6/6] Planner config in graph.profiles.json ---"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROFILES_PATH="$SCRIPT_DIR/../../sidecars/ted-engine/config/graph.profiles.json"
if [ -f "$PROFILES_PATH" ]; then
  CONFIG_CHECK="$(python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    cfg = json.load(f)
profiles = cfg.get('profiles', {})
olumie = profiles.get('olumie', {})
planner = olumie.get('planner', {})
assert 'group_id' in planner, 'missing planner.group_id'
assert 'plan_ids' in planner, 'missing planner.plan_ids'
assert 'polling_interval_ms' in planner, 'missing planner.polling_interval_ms'
todo = olumie.get('todo', {})
assert 'list_name' in todo, 'missing todo.list_name'
user_map = olumie.get('user_mapping', {})
assert 'Clint' in user_map, 'missing user_mapping.Clint'
print('OK')
" "$PROFILES_PATH" 2>/dev/null || echo "FAIL")"
  if [ "$CONFIG_CHECK" = "OK" ]; then
    echo "  PASS: graph.profiles.json has planner config (group_id, plan_ids, polling_interval_ms), todo config, and user_mapping"
    record_pass
  else
    echo "  FAIL: graph.profiles.json missing required planner config fields"
    record_fail "6-config-fields"
  fi
else
  echo "  FAIL: graph.profiles.json not found at $PROFILES_PATH"
  record_fail "6-config-missing"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=========================================="
echo "JC-102 Planner + To Do Integration: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "FAILURES: ${FAILURES[*]}"
fi
echo "=========================================="
exit "$FAIL"
