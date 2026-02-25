#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
echo "JC-069a proof: operator acceptance test — full JTBD delivery loop"
source "$(dirname "$0")/lib_auth.sh"

# ---------------------------------------------------------------------------
# Counters & tracking
# ---------------------------------------------------------------------------
PASS=0
FAIL=0
TESTED=0
GRAPH_AUTH_NEEDED=()
FAILURES=()

record_pass() {
  PASS=$((PASS + 1))
  TESTED=$((TESTED + 1))
}

record_fail() {
  local label="$1"
  FAIL=$((FAIL + 1))
  TESTED=$((TESTED + 1))
  FAILURES+=("$label")
}

record_graph_auth() {
  GRAPH_AUTH_NEEDED+=("$1")
}

# ---------------------------------------------------------------------------
# 1. Verify sidecar is healthy (GET /status)
# ---------------------------------------------------------------------------
echo ""
echo "--- [1/9] Sidecar health check (GET /status) ---"
STATUS_CODE="$(curl -sS -o /tmp/jc069_status.out -w "%{http_code}" \
  "$BASE_URL/status" || true)"
if [ "$STATUS_CODE" = "200" ]; then
  echo "  PASS: /status returned 200"
  record_pass
else
  echo "  FAIL: /status returned $STATUS_CODE (expected 200)"
  cat /tmp/jc069_status.out
  record_fail "status"
fi

# ---------------------------------------------------------------------------
# 2. Mint auth token
# ---------------------------------------------------------------------------
echo ""
echo "--- [2/9] Minting auth token ---"
mint_ted_auth_token
echo "  PASS: auth token minted"
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

# ---------------------------------------------------------------------------
# 3. Morning brief (GET /reporting/morning-brief) — verify 200, summary fields
# ---------------------------------------------------------------------------
echo ""
echo "--- [3/9] Morning brief (GET /reporting/morning-brief) ---"
CODE="$(curl -sS -o /tmp/jc069_brief.out -w "%{http_code}" \
  -X GET "$BASE_URL/reporting/morning-brief" \
  "${AUTH_ARGS[@]}" || true)"

if [ "$CODE" = "200" ]; then
  BRIEF_OK=true
  for field in '"generated_at"' '"summary"' '"recommendations"'; do
    if ! grep -q "$field" /tmp/jc069_brief.out; then
      echo "  FAIL: 200 response missing $field"
      BRIEF_OK=false
      break
    fi
  done
  if [ "$BRIEF_OK" = true ]; then
    echo "  PASS: morning-brief returned 200 with generated_at, summary, recommendations"
    record_pass
  else
    cat /tmp/jc069_brief.out
    record_fail "morning-brief"
  fi
else
  echo "  FAIL: expected 200, got $CODE"
  cat /tmp/jc069_brief.out
  record_fail "morning-brief"
fi

# ---------------------------------------------------------------------------
# 4. Inbox messages (GET /graph/olumie/mail/list) — accept 200 or 409
# ---------------------------------------------------------------------------
echo ""
echo "--- [4/9] Inbox messages (GET /graph/olumie/mail/list) ---"
CODE="$(curl -sS -o /tmp/jc069_inbox.out -w "%{http_code}" \
  -X GET "$BASE_URL/graph/olumie/mail/list" \
  "${AUTH_ARGS[@]}" || true)"

if [ "$CODE" = "200" ]; then
  if grep -q '"messages"' /tmp/jc069_inbox.out; then
    echo "  PASS: inbox returned 200 with messages"
    record_pass
  else
    echo "  FAIL: 200 response missing 'messages' field"
    cat /tmp/jc069_inbox.out
    record_fail "inbox"
  fi
elif [ "$CODE" = "409" ]; then
  if grep -q '"NOT_AUTHENTICATED"' /tmp/jc069_inbox.out; then
    echo "  PASS: inbox returned 409 NOT_AUTHENTICATED (Graph creds absent)"
    record_pass
    record_graph_auth "inbox"
  else
    echo "  FAIL: 409 response missing 'NOT_AUTHENTICATED' reason"
    cat /tmp/jc069_inbox.out
    record_fail "inbox"
  fi
else
  echo "  FAIL: expected 200 or 409, got $CODE"
  cat /tmp/jc069_inbox.out
  record_fail "inbox"
fi

# ---------------------------------------------------------------------------
# 5. Draft generation (POST /graph/olumie/drafts/generate) — accept 200 or 409
# ---------------------------------------------------------------------------
echo ""
echo "--- [5/9] Draft generation (POST /graph/olumie/drafts/generate) ---"
CODE="$(curl -sS -o /tmp/jc069_drafts.out -w "%{http_code}" \
  -X POST "$BASE_URL/graph/olumie/drafts/generate" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"max_drafts":3}' || true)"

if [ "$CODE" = "200" ]; then
  if grep -q '"drafts"' /tmp/jc069_drafts.out; then
    echo "  PASS: drafts returned 200 with drafts"
    record_pass
  else
    echo "  FAIL: 200 response missing 'drafts' field"
    cat /tmp/jc069_drafts.out
    record_fail "drafts"
  fi
elif [ "$CODE" = "409" ]; then
  if grep -q '"NOT_AUTHENTICATED"' /tmp/jc069_drafts.out; then
    echo "  PASS: drafts returned 409 NOT_AUTHENTICATED (Graph creds absent)"
    record_pass
    record_graph_auth "drafts"
  else
    echo "  FAIL: 409 response missing 'NOT_AUTHENTICATED' reason"
    cat /tmp/jc069_drafts.out
    record_fail "drafts"
  fi
else
  echo "  FAIL: expected 200 or 409, got $CODE"
  cat /tmp/jc069_drafts.out
  record_fail "drafts"
fi

# ---------------------------------------------------------------------------
# 6. Deadline extraction (POST /extraction/deadlines) — verify 200, candidates
# ---------------------------------------------------------------------------
echo ""
echo "--- [6/9] Deadline extraction (POST /extraction/deadlines) ---"
CODE="$(curl -sS -o /tmp/jc069_deadlines.out -w "%{http_code}" \
  -X POST "$BASE_URL/extraction/deadlines" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"text":"The Smith closing is scheduled for 2026-03-15. The filing deadline is March 20, 2026. Please respond by next Friday."}' || true)"

if [ "$CODE" = "200" ]; then
  if grep -q '"candidates"' /tmp/jc069_deadlines.out; then
    CANDIDATE_COUNT="$(node -e "
      const fs = require('fs');
      try {
        const j = JSON.parse(fs.readFileSync('/tmp/jc069_deadlines.out','utf8'));
        process.stdout.write(String((j.candidates || []).length));
      } catch { process.stdout.write('0'); }
    " 2>/dev/null || echo "0")"
    if [ "$CANDIDATE_COUNT" -ge 2 ]; then
      echo "  PASS: deadline extraction returned 200 with $CANDIDATE_COUNT candidates"
      record_pass
    else
      echo "  FAIL: expected at least 2 candidates, got $CANDIDATE_COUNT"
      cat /tmp/jc069_deadlines.out
      record_fail "deadlines"
    fi
  else
    echo "  FAIL: 200 response missing 'candidates' array"
    cat /tmp/jc069_deadlines.out
    record_fail "deadlines"
  fi
else
  echo "  FAIL: expected 200, got $CODE"
  cat /tmp/jc069_deadlines.out
  record_fail "deadlines"
fi

# ---------------------------------------------------------------------------
# 7. Calendar hold (POST /graph/olumie/calendar/event/create) — accept 200 or 409
# ---------------------------------------------------------------------------
echo ""
echo "--- [7/9] Calendar hold (POST /graph/olumie/calendar/event/create) ---"
CODE="$(curl -sS -o /tmp/jc069_calendar.out -w "%{http_code}" \
  -X POST "$BASE_URL/graph/olumie/calendar/event/create" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"subject":"JC-069 Acceptance Test Hold","start_datetime":"2026-03-01T10:00:00","end_datetime":"2026-03-01T11:00:00"}' || true)"

if [ "$CODE" = "200" ]; then
  echo "  PASS: calendar event creation returned 200"
  record_pass
elif [ "$CODE" = "409" ]; then
  if grep -q '"NOT_AUTHENTICATED"' /tmp/jc069_calendar.out; then
    echo "  PASS: calendar returned 409 NOT_AUTHENTICATED (Graph creds absent)"
    record_pass
    record_graph_auth "calendar"
  else
    echo "  FAIL: 409 response missing 'NOT_AUTHENTICATED' reason"
    cat /tmp/jc069_calendar.out
    record_fail "calendar"
  fi
else
  echo "  FAIL: expected 200 or 409, got $CODE"
  cat /tmp/jc069_calendar.out
  record_fail "calendar"
fi

# ---------------------------------------------------------------------------
# 8. Email filing (POST /graph/olumie/mail/test-id/move) — accept 200, 409, or 502
# ---------------------------------------------------------------------------
echo ""
echo "--- [8/9] Email filing (POST /graph/olumie/mail/test-id/move) ---"
CODE="$(curl -sS -o /tmp/jc069_filing.out -w "%{http_code}" \
  -X POST "$BASE_URL/graph/olumie/mail/test-id/move" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"destination_folder_id":"test-folder"}' || true)"

if [ "$CODE" = "200" ]; then
  echo "  PASS: email filing returned 200 (message moved)"
  record_pass
elif [ "$CODE" = "409" ]; then
  if grep -q '"NOT_AUTHENTICATED"' /tmp/jc069_filing.out; then
    echo "  PASS: email filing returned 409 NOT_AUTHENTICATED (Graph creds absent)"
    record_pass
    record_graph_auth "filing"
  else
    echo "  FAIL: 409 response missing 'NOT_AUTHENTICATED' reason"
    cat /tmp/jc069_filing.out
    record_fail "filing"
  fi
elif [ "$CODE" = "502" ]; then
  echo "  PASS: email filing returned 502 (Graph upstream error — endpoint wired)"
  record_pass
  record_graph_auth "filing"
else
  echo "  FAIL: expected 200, 409, or 502, got $CODE"
  cat /tmp/jc069_filing.out
  record_fail "filing"
fi

# ---------------------------------------------------------------------------
# 9. EOD digest (GET /reporting/eod-digest) — verify 200, summary fields
# ---------------------------------------------------------------------------
echo ""
echo "--- [9/9] EOD digest (GET /reporting/eod-digest) ---"
CODE="$(curl -sS -o /tmp/jc069_eod.out -w "%{http_code}" \
  -X GET "$BASE_URL/reporting/eod-digest" \
  "${AUTH_ARGS[@]}" || true)"

if [ "$CODE" = "200" ]; then
  EOD_OK=true
  for field in '"generated_at"' '"summary"' '"activity_log"'; do
    if ! grep -q "$field" /tmp/jc069_eod.out; then
      echo "  FAIL: 200 response missing $field"
      EOD_OK=false
      break
    fi
  done
  if [ "$EOD_OK" = true ]; then
    echo "  PASS: eod-digest returned 200 with generated_at, summary, activity_log"
    record_pass
  else
    cat /tmp/jc069_eod.out
    record_fail "eod-digest"
  fi
else
  echo "  FAIL: expected 200, got $CODE"
  cat /tmp/jc069_eod.out
  record_fail "eod-digest"
fi

# ---------------------------------------------------------------------------
# 10. Summary
# ---------------------------------------------------------------------------
echo ""
echo "=== JC-069 ACCEPTANCE TEST SUMMARY ==="
echo "Endpoints tested: $TESTED"
echo "Passed: $PASS"
echo "Failed: $FAIL"

if [ ${#GRAPH_AUTH_NEEDED[@]} -gt 0 ]; then
  GRAPH_LIST="$(IFS=', '; echo "${GRAPH_AUTH_NEEDED[*]}")"
  echo "Graph auth needed: $GRAPH_LIST (${#GRAPH_AUTH_NEEDED[@]} endpoints need real Azure AD credentials)"
else
  echo "Graph auth needed: none (all Graph endpoints returned 200)"
fi

if [ ${#FAILURES[@]} -gt 0 ]; then
  FAIL_LIST="$(IFS=', '; echo "${FAILURES[*]}")"
  echo "Failed endpoints: $FAIL_LIST"
fi

echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "RESULT: FAIL — $FAIL endpoint(s) returned unexpected errors"
  exit 1
fi

echo "RESULT: OK — all $TESTED endpoints responded correctly"
exit 0
