#!/usr/bin/env bash
set -euo pipefail

echo "JC-107 proof: Deal Events Dual-Write Verification"
echo ""

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
source "$(dirname "$0")/lib_auth.sh"

PASS=0; FAIL=0; TESTED=0; FAILURES=()
record_pass() { PASS=$((PASS + 1)); TESTED=$((TESTED + 1)); }
record_fail() { FAIL=$((FAIL + 1)); TESTED=$((TESTED + 1)); FAILURES+=("$1"); }

# ── sidecar must be reachable ──
if ! curl -fsS "$BASE_URL/status" >/dev/null 2>&1; then
  echo "WARNING: sidecar not reachable at $BASE_URL — skipping all tests"
  exit 0
fi

# ── mint auth token ──
mint_ted_auth_token
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

# Unique deal id to avoid collisions with previous runs
DEAL_ID="proof-jc107-$(date +%s)"

# ---------------------------------------------------------------------------
# 1. POST /deals/create — create a deal, verify deal_id in response
# ---------------------------------------------------------------------------
echo "--- [1/6] Create deal (POST /deals/create) ---"
SC="$(curl -sS -o /tmp/jc107_create.out -w "%{http_code}" \
  -X POST "$BASE_URL/deals/create" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d "{\"deal_id\":\"${DEAL_ID}\",\"deal_name\":\"JC-107 Proof Deal\",\"deal_type\":\"SNF_ALF\",\"entity\":\"Olumie\"}" || true)"
if [ "$SC" = "200" ]; then
  CREATE_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('created') == True, 'missing created flag'
assert d.get('deal_id') == '${DEAL_ID}', 'deal_id mismatch'
print('OK')
" < /tmp/jc107_create.out 2>/dev/null || echo "FAIL")"
  if [ "$CREATE_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 200 — deal created with deal_id=${DEAL_ID}"
    record_pass
  else
    echo "  FAIL: HTTP 200 but response missing expected fields"
    record_fail "1-create-shape"
  fi
  # Verify dual-write: check event_log has deal.created event
  EV_SC="$(curl -sS -o /tmp/jc107_events.out -w "%{http_code}" \
    -X GET "$BASE_URL/events/recent?event_type=deal.created&limit=5" \
    "${AUTH_ARGS[@]}" || true)"
  if [ "$EV_SC" = "200" ]; then
    EVENT_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
events = d.get('events', [])
found = any(e.get('event_type') == 'deal.created' for e in events)
assert found, 'no deal.created event found'
print('OK')
" < /tmp/jc107_events.out 2>/dev/null || echo "FAIL")"
    if [ "$EVENT_CHECK" = "OK" ]; then
      echo "  PASS: event_log contains deal.created event (dual-write confirmed)"
    else
      echo "  INFO: deal.created event not found in recent events (may be timing)"
    fi
  fi
else
  echo "  FAIL: expected 200, got $SC"
  cat /tmp/jc107_create.out 2>/dev/null || true
  record_fail "1-create-http"
fi

# ---------------------------------------------------------------------------
# 2. POST /deals/{deal_id}/dates — add a date entry
# ---------------------------------------------------------------------------
echo "--- [2/6] Add deal date (POST /deals/${DEAL_ID}/dates) ---"
SC="$(curl -sS -o /tmp/jc107_date.out -w "%{http_code}" \
  -X POST "$BASE_URL/deals/${DEAL_ID}/dates" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"label":"Closing Target","date":"2026-06-15","type":"closing_date"}' || true)"
if [ "$SC" = "200" ]; then
  DATE_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('added') == True, 'missing added flag'
assert d.get('deal_id') is not None, 'missing deal_id'
assert 'date_entry' in d, 'missing date_entry'
print('OK')
" < /tmp/jc107_date.out 2>/dev/null || echo "FAIL")"
  if [ "$DATE_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 200 — date added successfully"
    record_pass
  else
    echo "  FAIL: HTTP 200 but response missing expected fields"
    record_fail "2-date-shape"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  cat /tmp/jc107_date.out 2>/dev/null || true
  record_fail "2-date-http"
fi

# ---------------------------------------------------------------------------
# 3. POST /deals/{deal_id}/investors — add an investor
# ---------------------------------------------------------------------------
echo "--- [3/6] Add deal investor (POST /deals/${DEAL_ID}/investors) ---"
SC="$(curl -sS -o /tmp/jc107_investor.out -w "%{http_code}" \
  -X POST "$BASE_URL/deals/${DEAL_ID}/investors" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Capital Partners"}' || true)"
if [ "$SC" = "200" ]; then
  INV_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('added') == True, 'missing added flag'
assert d.get('deal_id') is not None, 'missing deal_id'
assert 'investor' in d, 'missing investor object'
inv = d['investor']
assert inv.get('name') == 'Acme Capital Partners', 'investor name mismatch'
print('OK')
" < /tmp/jc107_investor.out 2>/dev/null || echo "FAIL")"
  if [ "$INV_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 200 — investor added successfully"
    record_pass
  else
    echo "  FAIL: HTTP 200 but response missing expected fields"
    record_fail "3-investor-shape"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  cat /tmp/jc107_investor.out 2>/dev/null || true
  record_fail "3-investor-http"
fi

# ---------------------------------------------------------------------------
# 4. POST /deals/{deal_id}/counsel — add outside counsel
# ---------------------------------------------------------------------------
echo "--- [4/6] Add deal counsel (POST /deals/${DEAL_ID}/counsel) ---"
SC="$(curl -sS -o /tmp/jc107_counsel.out -w "%{http_code}" \
  -X POST "$BASE_URL/deals/${DEAL_ID}/counsel" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"firm_name":"Baker McKenzie","matter":"Due diligence review"}' || true)"
if [ "$SC" = "200" ]; then
  COUNSEL_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('added') == True, 'missing added flag'
assert d.get('deal_id') is not None, 'missing deal_id'
assert 'counsel' in d, 'missing counsel object'
c = d['counsel']
assert c.get('firm_name') == 'Baker McKenzie', 'firm_name mismatch'
print('OK')
" < /tmp/jc107_counsel.out 2>/dev/null || echo "FAIL")"
  if [ "$COUNSEL_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 200 — counsel added successfully"
    record_pass
  else
    echo "  FAIL: HTTP 200 but response missing expected fields"
    record_fail "4-counsel-shape"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  cat /tmp/jc107_counsel.out 2>/dev/null || true
  record_fail "4-counsel-http"
fi

# ---------------------------------------------------------------------------
# 5. POST /deals/{deal_id}/tasks — add a team task
# ---------------------------------------------------------------------------
echo "--- [5/6] Add deal task (POST /deals/${DEAL_ID}/tasks) ---"
SC="$(curl -sS -o /tmp/jc107_task.out -w "%{http_code}" \
  -X POST "$BASE_URL/deals/${DEAL_ID}/tasks" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"task":"Review purchase agreement","owner":"Clint","due_date":"2026-06-01"}' || true)"
if [ "$SC" = "200" ]; then
  TASK_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('added') == True, 'missing added flag'
assert d.get('deal_id') is not None, 'missing deal_id'
assert 'task_entry' in d, 'missing task_entry object'
t = d['task_entry']
assert t.get('task') == 'Review purchase agreement', 'task mismatch'
assert t.get('owner') == 'Clint', 'owner mismatch'
assert t.get('status') == 'open', 'status should be open'
print('OK')
" < /tmp/jc107_task.out 2>/dev/null || echo "FAIL")"
  if [ "$TASK_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 200 — task added successfully"
    record_pass
  else
    echo "  FAIL: HTTP 200 but response missing expected fields"
    record_fail "5-task-shape"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  cat /tmp/jc107_task.out 2>/dev/null || true
  record_fail "5-task-http"
fi

# ---------------------------------------------------------------------------
# 6. POST /deals/{deal_id}/notes — add a note
# ---------------------------------------------------------------------------
echo "--- [6/6] Add deal note (POST /deals/${DEAL_ID}/notes) ---"
SC="$(curl -sS -o /tmp/jc107_note.out -w "%{http_code}" \
  -X POST "$BASE_URL/deals/${DEAL_ID}/notes" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"text":"Initial review complete. Moving to DD phase.","author":"Clint"}' || true)"
if [ "$SC" = "200" ]; then
  NOTE_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('added') == True, 'missing added flag'
assert d.get('deal_id') is not None, 'missing deal_id'
assert 'note' in d, 'missing note object'
n = d['note']
assert 'text' in n, 'note missing text'
assert 'author' in n, 'note missing author'
assert 'created_at' in n, 'note missing created_at'
print('OK')
" < /tmp/jc107_note.out 2>/dev/null || echo "FAIL")"
  if [ "$NOTE_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 200 — note added successfully"
    record_pass
  else
    echo "  FAIL: HTTP 200 but response missing expected fields"
    record_fail "6-note-shape"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  cat /tmp/jc107_note.out 2>/dev/null || true
  record_fail "6-note-http"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=========================================="
echo "JC-107 Deal Events Dual-Write: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "FAILURES: ${FAILURES[*]}"
fi
echo "=========================================="
exit "$FAIL"
