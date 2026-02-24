#!/usr/bin/env bash
set -euo pipefail

BASE="http://127.0.0.1:48080"
OPERATOR_KEY="${TED_ENGINE_OPERATOR_KEY:-ted-local-operator}"
DEAL_ID="gw_proof_$(date +%s)"
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

echo "=== Deal Gateway Round-Trip Proof ==="
echo "Minting auth token..."
TOKEN=$(curl -s -X POST "$BASE/auth/mint" \
  -H "Content-Type: application/json" \
  -d "{\"operator_key\":\"$OPERATOR_KEY\"}" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
if [ -z "$TOKEN" ]; then
  echo "FATAL: Could not mint auth token"
  exit 1
fi
AUTH=(-H "Authorization: Bearer $TOKEN")
echo "Tests sidecar endpoints that back ted.deals.* gateway methods"
echo "Deal ID: $DEAL_ID"
echo ""

# ted.deals.create -> POST /deals/create
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/create" \
  -H "Content-Type: application/json" -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"deal_id\":\"$DEAL_ID\",\"deal_name\":\"Gateway Proof\",\"deal_type\":\"SOFTWARE\",\"entity\":\"Olumie\"}")
check "ted.deals.create" "200" "$STATUS"

# ted.deals.list -> GET /deals/list
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -H "X-Ted-Execution-Mode: DETERMINISTIC" "$BASE/deals/list")
check "ted.deals.list" "200" "$STATUS"

# ted.deals.get -> GET /deals/{deal_id}
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -H "X-Ted-Execution-Mode: DETERMINISTIC" "$BASE/deals/$DEAL_ID")
check "ted.deals.get" "200" "$STATUS"

# ted.deals.update -> POST /deals/{deal_id}/update
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/update" \
  -H "Content-Type: application/json" -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"stage\":\"data_room_access\",\"status\":\"active\"}")
check "ted.deals.update" "200" "$STATUS"

# ted.deals.dates.add -> POST /deals/{deal_id}/dates
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/dates" \
  -H "Content-Type: application/json" -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"label\":\"Closing Date\",\"date\":\"2026-06-01\",\"type\":\"closing_date\"}")
check "ted.deals.dates.add" "200" "$STATUS"

# ted.deals.investors.add -> POST /deals/{deal_id}/investors
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/investors" \
  -H "Content-Type: application/json" -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"name\":\"Gateway Fund I\"}")
check "ted.deals.investors.add" "200" "$STATUS"

# ted.deals.investors.update -> POST /deals/{deal_id}/investors/update
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/investors/update" \
  -H "Content-Type: application/json" -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"name\":\"Gateway Fund I\",\"oig_status\":\"clear\",\"state_exclusion_status\":\"clear\"}")
check "ted.deals.investors.update" "200" "$STATUS"

# ted.deals.counsel.add -> POST /deals/{deal_id}/counsel
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/counsel" \
  -H "Content-Type: application/json" -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"firm_name\":\"Gateway Legal\",\"matter\":\"SPA Review\"}")
check "ted.deals.counsel.add" "200" "$STATUS"

# ted.deals.counsel.invoice -> POST /deals/{deal_id}/counsel/invoice
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/counsel/invoice" \
  -H "Content-Type: application/json" -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"firm_name\":\"Gateway Legal\",\"amount\":5000,\"date\":\"2026-03-15\",\"description\":\"Initial review\"}")
check "ted.deals.counsel.invoice" "200" "$STATUS"

# ted.deals.tasks.add -> POST /deals/{deal_id}/tasks
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/tasks" \
  -H "Content-Type: application/json" -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"task\":\"Review data room docs\",\"owner\":\"Ted\"}")
check "ted.deals.tasks.add" "200" "$STATUS"

# ted.deals.tasks.update -> POST /deals/{deal_id}/tasks/update
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/tasks/update" \
  -H "Content-Type: application/json" -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"task_index\":0,\"status\":\"done\"}")
check "ted.deals.tasks.update" "200" "$STATUS"

# ted.deals.checklist.update -> POST /deals/{deal_id}/checklist
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/checklist" \
  -H "Content-Type: application/json" -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"action\":\"add\",\"item\":\"Title search\"}")
check "ted.deals.checklist.update (add)" "200" "$STATUS"

# ted.deals.notes.add -> POST /deals/{deal_id}/notes
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" -X POST "$BASE/deals/$DEAL_ID/notes" \
  -H "Content-Type: application/json" -H "X-Ted-Execution-Mode: DETERMINISTIC" \
  -d "{\"text\":\"Gateway proof note\",\"author\":\"Ted\"}")
check "ted.deals.notes.add" "200" "$STATUS"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && echo "ALL PASS" || echo "SOME FAILURES"
exit "$FAIL"
