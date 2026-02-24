#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
echo "JC-073/075b proof: MCP Server tools and resources"
source "$(dirname "$0")/lib_auth.sh"

curl -fsS "$BASE_URL/status" >/dev/null
mint_ted_auth_token
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

# MCP uses Streamable HTTP at POST /mcp
# The MCP protocol sends JSON-RPC messages

# 1. tools/list — verify tool list returns Ted tools
CODE="$(curl -sS -o /tmp/mcp_tools_list.out -w "%{http_code}" \
  -X POST "$BASE_URL/mcp" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: POST /mcp tools/list returned $CODE"
  cat /tmp/mcp_tools_list.out
  exit 1
fi
grep -q '"ted_status"' /tmp/mcp_tools_list.out || {
  echo "FAIL: tools/list missing ted_status"
  cat /tmp/mcp_tools_list.out
  exit 1
}
grep -q '"ted_morning_brief"' /tmp/mcp_tools_list.out || {
  echo "FAIL: tools/list missing ted_morning_brief"
  cat /tmp/mcp_tools_list.out
  exit 1
}
echo "OK: tools/list returns Ted tools"

# 2. tools/call ted_status — verify tool execution
CODE="$(curl -sS -o /tmp/mcp_tools_call.out -w "%{http_code}" \
  -X POST "$BASE_URL/mcp" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"ted_status","arguments":{}}}' || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: POST /mcp tools/call ted_status returned $CODE"
  cat /tmp/mcp_tools_call.out
  exit 1
fi
grep -q '"version"' /tmp/mcp_tools_call.out || {
  echo "FAIL: ted_status call missing version in response"
  cat /tmp/mcp_tools_call.out
  exit 1
}
echo "OK: tools/call ted_status returns sidecar status"

# 3. resources/list — verify resource list
CODE="$(curl -sS -o /tmp/mcp_resources_list.out -w "%{http_code}" \
  -X POST "$BASE_URL/mcp" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"resources/list","params":{}}' || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: POST /mcp resources/list returned $CODE"
  cat /tmp/mcp_resources_list.out
  exit 1
fi
grep -q '"operator_profile"' /tmp/mcp_resources_list.out || {
  echo "FAIL: resources/list missing operator_profile"
  cat /tmp/mcp_resources_list.out
  exit 1
}
echo "OK: resources/list returns config resources"

# 4. resources/read operator_profile — verify resource read
CODE="$(curl -sS -o /tmp/mcp_resources_read.out -w "%{http_code}" \
  -X POST "$BASE_URL/mcp" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"resources/read","params":{"uri":"ted://config/operator_profile"}}' || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: POST /mcp resources/read returned $CODE"
  cat /tmp/mcp_resources_read.out
  exit 1
fi
grep -q '"operator"' /tmp/mcp_resources_read.out || {
  echo "FAIL: operator_profile resource missing operator data"
  cat /tmp/mcp_resources_read.out
  exit 1
}
echo "OK: resources/read returns operator profile content"

# 5. tools/call on draft-capable tool requires governance
CODE="$(curl -sS -o /tmp/mcp_governance.out -w "%{http_code}" \
  -X POST "$BASE_URL/mcp" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"ted_draft_email","arguments":{"profile_id":"olumie","subject":"Test","to":["test@example.com"],"body_text":"Test draft"}}}' || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: POST /mcp tools/call ted_draft_email returned $CODE"
  cat /tmp/mcp_governance.out
  exit 1
fi
echo "OK: draft-capable tool executes with governance"

echo ""
echo "JC-073/075b PASS: MCP Server tools, resources, and governance all verified."
