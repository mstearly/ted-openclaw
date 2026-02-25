#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
PROFILE_ID="${TED_GRAPH_PROFILE:-olumie}"
source "$(dirname "$0")/lib_auth.sh"

PASS=0
BLOCKED=0
FAIL=0

echo "P0-4 smoke runner"
echo "  base_url: $BASE_URL"
echo "  profile:  $PROFILE_ID"
echo ""

curl -fsS "$BASE_URL/status" >/dev/null
mint_ted_auth_token
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

check_endpoint() {
  local name="$1"
  local method="$2"
  local path="$3"
  local out="/tmp/p0-4-${name//[^a-zA-Z0-9_-]/_}.out"
  local code

  if [ "$method" = "GET" ]; then
    code="$(curl -sS -o "$out" -w "%{http_code}" "${AUTH_ARGS[@]}" "$BASE_URL$path" || true)"
  else
    code="$(curl -sS -o "$out" -w "%{http_code}" -X "$method" "${AUTH_ARGS[@]}" "$BASE_URL$path" || true)"
  fi

  local status
  case "$code" in
    200)
      status="PASS"
      PASS=$((PASS + 1))
      ;;
    400)
      status="BLOCKED_CONFIG"
      BLOCKED=$((BLOCKED + 1))
      ;;
    401 | 403 | 409)
      status="BLOCKED_AUTH"
      BLOCKED=$((BLOCKED + 1))
      ;;
    *)
      status="FAIL"
      FAIL=$((FAIL + 1))
      ;;
  esac

  printf "%-18s %-14s %3s %s\n" "$name" "$status" "$code" "$path"
}

printf "%-18s %-14s %3s %s\n" "step" "result" "sc" "endpoint"
printf "%-18s %-14s %3s %s\n" "------------------" "--------------" "---" "------------------------------"
check_endpoint "graph_status" "GET" "/graph/$PROFILE_ID/status"
check_endpoint "device_start" "POST" "/graph/$PROFILE_ID/auth/device/start"
check_endpoint "mail_list" "GET" "/graph/$PROFILE_ID/mail/list?limit=10"
check_endpoint "calendar_list" "GET" "/graph/$PROFILE_ID/calendar/list?days=7"
check_endpoint "planner_plans" "GET" "/graph/$PROFILE_ID/planner/plans"
check_endpoint "todo_lists" "GET" "/graph/$PROFILE_ID/todo/lists"
check_endpoint "sharepoint_sites" "GET" "/graph/$PROFILE_ID/sharepoint/sites"

echo ""
echo "summary: pass=$PASS blocked=$BLOCKED fail=$FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 2
fi
if [ "$BLOCKED" -gt 0 ]; then
  exit 1
fi
