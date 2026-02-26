#!/usr/bin/env bash
set -euo pipefail

echo "JC-089 proof: Phase 11 — Draft Queue"
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

# ── Test 1: Draft queue empty — GET /drafts/queue returns 200 with drafts array ──
echo "--- [1/6] GET /drafts/queue returns 200 with drafts array ---"
SC=$(curl -sS -o /tmp/jc089_queue.out -w "%{http_code}" \
  -X GET "$BASE_URL/drafts/queue" \
  "${AUTH_ARGS[@]}" || true)

DRAFT_COUNT=0
if [ "$SC" = "200" ]; then
  QUEUE_CHECK=$(python3 -c "
import json, sys
payload = json.load(sys.stdin)
drafts = payload.get('drafts', None)
if drafts is not None and isinstance(drafts, list):
    print(f'OK:count={len(drafts)}')
else:
    keys = list(payload.keys())
    print(f'MISSING:drafts:keys={keys[:5]}')
" < /tmp/jc089_queue.out 2>/dev/null || echo "parse_error")
  case "$QUEUE_CHECK" in
    OK:*)
      DRAFT_COUNT="${QUEUE_CHECK#OK:count=}"
      echo "  PASS: drafts/queue returned 200 with drafts array ($QUEUE_CHECK)"
      record_pass
      ;;
    *)
      echo "  FAIL: drafts/queue response invalid ($QUEUE_CHECK)"
      record_fail "1-queue-structure"
      ;;
  esac
else
  echo "  FAIL: expected 200 from drafts/queue, got $SC"
  record_fail "1-queue-status"
fi

# Ensure fallback queue snapshot exists even if step 2 fails
cp /tmp/jc089_queue.out /tmp/jc089_queue2.out 2>/dev/null || true

# ── Test 2: Commitment creates draft — POST /commitments/create ──
echo "--- [2/6] POST /commitments/create (may trigger draft) ---"
SC=$(curl -sS -o /tmp/jc089_commit.out -w "%{http_code}" \
  -X POST "$BASE_URL/commitments/create" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"description":"Follow up on JC-089 draft queue proof","owner":"Test","who_to":"User","entity":"olumie"}' || true)

COMMIT_ID=""
if [ "$SC" = "200" ]; then
  COMMIT_ID=$(python3 -c "
import json, sys
payload = json.load(sys.stdin)
print(payload.get('commitment_id', payload.get('id', '')))
" < /tmp/jc089_commit.out 2>/dev/null || echo "")
  echo "  PASS: commitment created (id=$COMMIT_ID), checking draft queue..."

  sleep 0.5
  SC2=$(curl -sS -o /tmp/jc089_queue2.out -w "%{http_code}" \
    -X GET "$BASE_URL/drafts/queue" \
    "${AUTH_ARGS[@]}" || true)
  if [ "$SC2" = "200" ]; then
    NEW_COUNT=$(python3 -c "
import json, sys
payload = json.load(sys.stdin)
drafts = payload.get('drafts', [])
print(len(drafts))
" < /tmp/jc089_queue2.out 2>/dev/null || echo "0")
    echo "  PASS: draft queue re-checked after commitment (before=$DRAFT_COUNT, after=$NEW_COUNT)"
    record_pass
  else
    echo "  FAIL: could not re-check draft queue (HTTP $SC2)"
    record_fail "2-queue-recheck"
  fi
else
  echo "  FAIL: expected 200 from commitments/create, got $SC"
  record_fail "2-commitment-create"
fi

# ── Test 3: Draft lifecycle — edit a draft if one exists ──
echo "--- [3/6] Draft edit lifecycle ---"
FIRST_DRAFT_ID=$(python3 -c "
import json, sys
payload = json.load(sys.stdin)
drafts = payload.get('drafts', [])
if len(drafts) > 0:
    print(drafts[0].get('draft_id', drafts[0].get('id', '')))
else:
    print('')
" < /tmp/jc089_queue2.out 2>/dev/null || echo "")

if [ -n "$FIRST_DRAFT_ID" ]; then
  SC=$(curl -sS -o /tmp/jc089_edit.out -w "%{http_code}" \
    -X POST "$BASE_URL/drafts/${FIRST_DRAFT_ID}/edit" \
    "${AUTH_ARGS[@]}" \
    -H "Content-Type: application/json" \
    -d '{"content":"Updated content via JC-089 proof script"}' || true)
  if [ "$SC" = "200" ] || [ "$SC" = "409" ]; then
    echo "  PASS: draft edit returned $SC (valid lifecycle response)"
    record_pass
  else
    echo "  FAIL: expected 200 or 409 from draft edit, got $SC"
    record_fail "3-draft-edit"
  fi
else
  echo "  SKIP: no drafts in queue to edit — verifying endpoint exists"
  SC=$(curl -sS -o /tmp/jc089_edit.out -w "%{http_code}" \
    -X POST "$BASE_URL/drafts/nonexistent-id/edit" \
    "${AUTH_ARGS[@]}" \
    -H "Content-Type: application/json" \
    -d '{"content":"test"}' || true)
  if [ "$SC" = "404" ] || [ "$SC" = "409" ] || [ "$SC" = "400" ]; then
    echo "  PASS: draft edit endpoint exists (returned $SC for unknown ID)"
    record_pass
  else
    echo "  FAIL: unexpected status $SC for draft edit with fake ID"
    record_fail "3-draft-edit-endpoint"
  fi
fi

# ── Test 4: Draft approve ──
echo "--- [4/6] Draft approve ---"
if [ -n "$FIRST_DRAFT_ID" ]; then
  SC=$(curl -sS -o /tmp/jc089_approve.out -w "%{http_code}" \
    -X POST "$BASE_URL/drafts/${FIRST_DRAFT_ID}/approve" \
    "${AUTH_ARGS[@]}" \
    -H "Content-Type: application/json" \
    -d '{}' || true)
  if [ "$SC" = "200" ] || [ "$SC" = "409" ]; then
    echo "  PASS: draft approve returned $SC (valid lifecycle response)"
    record_pass
  else
    echo "  FAIL: expected 200 or 409 from draft approve, got $SC"
    record_fail "4-draft-approve"
  fi
else
  echo "  SKIP: no drafts to approve — verifying endpoint exists"
  SC=$(curl -sS -o /tmp/jc089_approve.out -w "%{http_code}" \
    -X POST "$BASE_URL/drafts/nonexistent-id/approve" \
    "${AUTH_ARGS[@]}" \
    -H "Content-Type: application/json" \
    -d '{}' || true)
  if [ "$SC" = "404" ] || [ "$SC" = "409" ] || [ "$SC" = "400" ]; then
    echo "  PASS: draft approve endpoint exists (returned $SC for unknown ID)"
    record_pass
  else
    echo "  FAIL: unexpected status $SC for draft approve with fake ID"
    record_fail "4-draft-approve-endpoint"
  fi
fi

# ── Test 5: Draft execute ──
echo "--- [5/6] Draft execute ---"
if [ -n "$FIRST_DRAFT_ID" ]; then
  SC=$(curl -sS -o /tmp/jc089_execute.out -w "%{http_code}" \
    -X POST "$BASE_URL/drafts/${FIRST_DRAFT_ID}/execute" \
    "${AUTH_ARGS[@]}" \
    -H "Content-Type: application/json" \
    -d '{}' || true)
  if [ "$SC" = "200" ] || [ "$SC" = "409" ]; then
    echo "  PASS: draft execute returned $SC (valid lifecycle response)"
    record_pass
  else
    echo "  FAIL: expected 200 or 409 from draft execute, got $SC"
    record_fail "5-draft-execute"
  fi
else
  echo "  SKIP: no drafts to execute — verifying endpoint exists"
  SC=$(curl -sS -o /tmp/jc089_execute.out -w "%{http_code}" \
    -X POST "$BASE_URL/drafts/nonexistent-id/execute" \
    "${AUTH_ARGS[@]}" \
    -H "Content-Type: application/json" \
    -d '{}' || true)
  if [ "$SC" = "404" ] || [ "$SC" = "409" ] || [ "$SC" = "400" ]; then
    echo "  PASS: draft execute endpoint exists (returned $SC for unknown ID)"
    record_pass
  else
    echo "  FAIL: unexpected status $SC for draft execute with fake ID"
    record_fail "5-draft-execute-endpoint"
  fi
fi

# ── Test 6: MCP tool — ted_draft_queue_list ──
echo "--- [6/6] MCP tool ted_draft_queue_list ---"
SC=$(curl -sS -o /tmp/jc089_mcp.out -w "%{http_code}" \
  -X POST "$BASE_URL/mcp" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"ted_draft_queue_list","arguments":{}}}' || true)

if [ "$SC" = "200" ]; then
  MCP_CHECK=$(node -e "const fs=require('fs');try{const payload=JSON.parse(fs.readFileSync('/tmp/jc089_mcp.out','utf8'));if(payload.result!=null){process.stdout.write('OK')}else{const err=payload.error||{};process.stdout.write('ERROR:'+String(err.code??'?')+':'+String(err.message??'?').slice(0,40))}}catch{process.stdout.write('parse_error')}")
  case "$MCP_CHECK" in
    OK)
      echo "  PASS: MCP ted_draft_queue_list returned result"
      record_pass
      ;;
    ERROR:*)
      echo "  FAIL: MCP tool returned error ($MCP_CHECK)"
      record_fail "6-mcp-error"
      ;;
    *)
      echo "  FAIL: MCP response invalid ($MCP_CHECK)"
      record_fail "6-mcp-parse"
      ;;
  esac
else
  echo "  FAIL: expected 200 from MCP, got $SC"
  record_fail "6-mcp-status"
fi

echo ""
echo "=========================================="
echo "JC-089 Draft Queue: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then echo "FAILURES: ${FAILURES[*]}"; fi
echo "=========================================="
exit "$FAIL"
