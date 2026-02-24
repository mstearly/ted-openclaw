#!/usr/bin/env bash
set -euo pipefail

echo "JC-059 proof: MCP server and tool registry"
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

# ── Test 1: POST /mcp tools/list returns 200 with tools array ──
echo "--- [1/3] POST /mcp tools/list returns tools array ---"
SC=$(curl -sS -o /tmp/jc059_tools.out -w "%{http_code}" \
  -X POST "$BASE_URL/mcp" \
  "${AUTH_ARGS[@]}" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' || true)

if [ "$SC" = "200" ]; then
  TOOL_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
tools = d.get('result', {}).get('tools', None)
if tools is not None and isinstance(tools, list) and len(tools) > 0:
    print(f'OK:{len(tools)}')
elif tools is not None and isinstance(tools, list):
    print('EMPTY')
else:
    print('MISSING')
" < /tmp/jc059_tools.out 2>/dev/null || echo "parse_error")
  case "$TOOL_CHECK" in
    OK:*)
      COUNT="${TOOL_CHECK#OK:}"
      echo "  PASS: MCP tools/list returned $COUNT tools"
      record_pass
      ;;
    EMPTY)
      echo "  FAIL: tools array is empty"
      record_fail "1-tools-empty"
      ;;
    *)
      echo "  FAIL: response missing result.tools ($TOOL_CHECK)"
      record_fail "1-tools-missing"
      ;;
  esac
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "1-mcp-status"
fi

# ── Test 2: POST /mcp resources/list returns resources array ──
echo "--- [2/3] POST /mcp resources/list returns resources array ---"
SC=$(curl -sS -o /tmp/jc059_resources.out -w "%{http_code}" \
  -X POST "$BASE_URL/mcp" \
  "${AUTH_ARGS[@]}" \
  -d '{"jsonrpc":"2.0","id":2,"method":"resources/list","params":{}}' || true)

if [ "$SC" = "200" ]; then
  RES_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
resources = d.get('result', {}).get('resources', None)
if resources is not None and isinstance(resources, list) and len(resources) > 0:
    print(f'OK:{len(resources)}')
elif resources is not None and isinstance(resources, list):
    print('EMPTY')
else:
    print('MISSING')
" < /tmp/jc059_resources.out 2>/dev/null || echo "parse_error")
  case "$RES_CHECK" in
    OK:*)
      COUNT="${RES_CHECK#OK:}"
      echo "  PASS: MCP resources/list returned $COUNT resources"
      record_pass
      ;;
    EMPTY)
      echo "  FAIL: resources array is empty"
      record_fail "2-resources-empty"
      ;;
    *)
      echo "  FAIL: response missing result.resources ($RES_CHECK)"
      record_fail "2-resources-missing"
      ;;
  esac
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "2-mcp-resources-status"
fi

# ── Test 3: POST /mcp tools/call with ted_status returns valid result ──
echo "--- [3/3] POST /mcp tools/call ted_status returns result ---"
SC=$(curl -sS -o /tmp/jc059_call.out -w "%{http_code}" \
  -X POST "$BASE_URL/mcp" \
  "${AUTH_ARGS[@]}" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"ted_status","arguments":{}}}' || true)

if [ "$SC" = "200" ]; then
  CALL_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
result = d.get('result')
error = d.get('error')
if error:
    print(f'ERROR:{error.get(\"message\",\"unknown\")}')
elif result is not None:
    content = result.get('content', [])
    if len(content) > 0:
        print('OK')
    else:
        print('EMPTY_CONTENT')
else:
    print('NO_RESULT')
" < /tmp/jc059_call.out 2>/dev/null || echo "parse_error")
  case "$CALL_CHECK" in
    OK)
      echo "  PASS: tools/call ted_status returned content"
      record_pass
      ;;
    ERROR:*)
      echo "  FAIL: tools/call returned error: ${CALL_CHECK#ERROR:}"
      record_fail "3-call-error"
      ;;
    *)
      echo "  FAIL: unexpected tools/call result ($CALL_CHECK)"
      record_fail "3-call-result"
      ;;
  esac
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "3-mcp-call-status"
fi

echo ""
echo "=========================================="
echo "JC-059 MCP Server: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then echo "FAILURES: ${FAILURES[*]}"; fi
echo "=========================================="
exit "$FAIL"
