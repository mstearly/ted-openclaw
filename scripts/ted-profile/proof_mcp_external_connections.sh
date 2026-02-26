#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
source "$(dirname "$0")/lib_auth.sh"

echo "Proof: external MCP server registry + dynamic MCP tool surface"

curl -fsS "$BASE_URL/status" >/dev/null
mint_ted_auth_token
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

echo "[1/5] list external MCP servers"
CODE="$(curl -sS -o /tmp/mcp_ext_list.out -w "%{http_code}" \
  "$BASE_URL/ops/mcp/external/servers" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: list servers -> $CODE"
  cat /tmp/mcp_ext_list.out
  exit 1
fi
grep -q '"servers"' /tmp/mcp_ext_list.out || {
  echo "FAIL: response missing servers"
  cat /tmp/mcp_ext_list.out
  exit 1
}

echo "[2/5] upsert must require operator approval"
CODE="$(curl -sS -o /tmp/mcp_ext_upsert_blocked.out -w "%{http_code}" \
  -X POST "$BASE_URL/ops/mcp/external/servers/upsert" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"server_id":"proofext","url":"http://127.0.0.1:9/mcp"}' || true)"
if [ "$CODE" != "403" ]; then
  echo "FAIL: expected 403 without approval, got $CODE"
  cat /tmp/mcp_ext_upsert_blocked.out
  exit 1
fi

echo "[3/5] upsert with operator approval"
CODE="$(curl -sS -o /tmp/mcp_ext_upsert_ok.out -w "%{http_code}" \
  -X POST "$BASE_URL/ops/mcp/external/servers/upsert" \
  "${AUTH_ARGS[@]}" \
  -H "x-ted-approval-source: operator" \
  -H "Content-Type: application/json" \
  -d '{"server_id":"proofext","url":"http://127.0.0.1:9/mcp","enabled":true}' || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: upsert with approval -> $CODE"
  cat /tmp/mcp_ext_upsert_ok.out
  exit 1
fi

echo "[4/5] MCP tools/list includes connection management tools"
CODE="$(curl -sS -o /tmp/mcp_ext_tools_list.out -w "%{http_code}" \
  -X POST "$BASE_URL/mcp" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: /mcp tools/list -> $CODE"
  cat /tmp/mcp_ext_tools_list.out
  exit 1
fi
grep -q '"ted_external_mcp_servers"' /tmp/mcp_ext_tools_list.out || {
  echo "FAIL: tools/list missing ted_external_mcp_servers"
  cat /tmp/mcp_ext_tools_list.out
  exit 1
}

echo "[5/5] test endpoint returns connectivity result"
CODE="$(curl -sS -o /tmp/mcp_ext_test.out -w "%{http_code}" \
  -X POST "$BASE_URL/ops/mcp/external/servers/test" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"server_id":"proofext"}' || true)"
if [ "$CODE" != "200" ] && [ "$CODE" != "502" ]; then
  echo "FAIL: expected 200 or 502 from test endpoint, got $CODE"
  cat /tmp/mcp_ext_test.out
  exit 1
fi

# cleanup test server
curl -sS -o /tmp/mcp_ext_remove.out -w "%{http_code}" \
  -X POST "$BASE_URL/ops/mcp/external/servers/remove" \
  "${AUTH_ARGS[@]}" \
  -H "x-ted-approval-source: operator" \
  -H "Content-Type: application/json" \
  -d '{"server_id":"proofext"}' >/tmp/mcp_ext_remove.code || true

REMOVE_CODE="$(cat /tmp/mcp_ext_remove.code)"
if [ "$REMOVE_CODE" != "200" ] && [ "$REMOVE_CODE" != "404" ]; then
  echo "WARN: cleanup remove returned $REMOVE_CODE"
fi

echo "PASS: external MCP registry and control surface verified."
