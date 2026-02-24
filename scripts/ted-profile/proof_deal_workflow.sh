#!/usr/bin/env bash
set -euo pipefail

BASE="http://127.0.0.1:48080"
OPERATOR_KEY="${TED_ENGINE_OPERATOR_KEY:-ted-local-operator}"
DEAL_ID="proof_deal_$(date +%s)"
PASS=0
FAIL=0

check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  PASS  $label (HTTP $actual)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $label (expected $expected, got $actual)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Deal Workflow Proof ==="
echo "Minting auth token..."
TOKEN=$(curl -s -X POST "$BASE/auth/mint" \
  -H "Content-Type: application/json" \
  -d "{\"operator_key\":\"$OPERATOR_KEY\"}" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
if [ -z "$TOKEN" ]; then
  echo "FATAL: Could not mint auth token"
  exit 1
fi
AUTH=(-H "Authorization: Bearer $TOKEN")
echo "Deal ID: $DEAL_ID"
echo ""

# 1. Create deal
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/create" \
  -H "Content-Type: application/json" \
  -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"deal_id\":\"$DEAL_ID\",\"deal_name\":\"Proof Test Deal\",\"deal_type\":\"SNF_ALF\",\"entity\":\"Olumie\",\"stage\":\"deal_identified\"}")
check "Create deal" "200" "$STATUS"

# 2. Get deal
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -H "X-Ted-Execution-Mode: DETERMINISTIC" "$BASE/deals/$DEAL_ID")
check "Get deal" "200" "$STATUS"

# 3. Update deal (advance stage)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/update" \
  -H "Content-Type: application/json" \
  -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"stage\":\"nda_signed\"}")
check "Update deal stage" "200" "$STATUS"

# 4. Add important date
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/dates" \
  -H "Content-Type: application/json" \
  -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"label\":\"DD Period End\",\"date\":\"2026-04-15\",\"type\":\"dd_period_end\"}")
check "Add important date" "200" "$STATUS"

# 5. Add investor
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/investors" \
  -H "Content-Type: application/json" \
  -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"name\":\"Proof Investor LLC\"}")
check "Add investor" "200" "$STATUS"

# 6. Update investor OIG status
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/investors/update" \
  -H "Content-Type: application/json" \
  -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"name\":\"Proof Investor LLC\",\"oig_status\":\"clear\"}")
check "Update investor OIG" "200" "$STATUS"

# 7. Add outside counsel
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/counsel" \
  -H "Content-Type: application/json" \
  -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"firm_name\":\"Smith & Jones LLP\",\"matter\":\"PSA Review\"}")
check "Add counsel" "200" "$STATUS"

# 8. Add counsel invoice
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/counsel/invoice" \
  -H "Content-Type: application/json" \
  -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"firm_name\":\"Smith & Jones LLP\",\"amount\":7500,\"date\":\"2026-03-01\",\"description\":\"PSA draft review\"}")
check "Add counsel invoice" "200" "$STATUS"

# 9. Add team task
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/tasks" \
  -H "Content-Type: application/json" \
  -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"task\":\"Review financial statements\",\"owner\":\"Clint\",\"due_date\":\"2026-03-10\"}")
check "Add team task" "200" "$STATUS"

# 10. Update team task (complete it)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/tasks/update" \
  -H "Content-Type: application/json" \
  -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"task_index\":0,\"status\":\"done\"}")
check "Update team task" "200" "$STATUS"

# 11. Add checklist item
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/checklist" \
  -H "Content-Type: application/json" \
  -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"action\":\"add\",\"item\":\"Environmental Phase I\"}")
check "Add checklist item" "200" "$STATUS"

# 12. Update checklist item (complete it)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/checklist" \
  -H "Content-Type: application/json" \
  -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"action\":\"update\",\"item_index\":0,\"status\":\"complete\"}")
check "Update checklist item" "200" "$STATUS"

# 13. Add note
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/notes" \
  -H "Content-Type: application/json" \
  -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"text\":\"Initial due diligence review completed.\",\"author\":\"Ted\"}")
check "Add note" "200" "$STATUS"

# 14. Get timeline
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -H "X-Ted-Execution-Mode: DETERMINISTIC" "$BASE/deals/$DEAL_ID/timeline")
check "Get timeline" "200" "$STATUS"

# 15. List deals
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -H "X-Ted-Execution-Mode: DETERMINISTIC" "$BASE/deals/list")
check "List deals" "200" "$STATUS"

# 16. Duplicate create (should 409)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/create" \
  -H "Content-Type: application/json" \
  -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"deal_id\":\"$DEAL_ID\",\"deal_name\":\"Duplicate\"}")
check "Duplicate create (409)" "409" "$STATUS"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && echo "ALL PASS" || echo "SOME FAILURES"
exit "$FAIL"
