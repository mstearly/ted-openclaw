#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
echo "JC-077-080 proof: Meeting lifecycle + Commitments + GTD + Enhanced briefs"
source "$(dirname "$0")/lib_auth.sh"

curl -fsS "$BASE_URL/status" >/dev/null
mint_ted_auth_token
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

# 1. GET /meeting/upcoming returns enriched meeting list
CODE="$(curl -sS -o /tmp/jc077_upcoming.out -w "%{http_code}" \
  -X GET "$BASE_URL/meeting/upcoming?hours=24" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: GET /meeting/upcoming returned $CODE"
  cat /tmp/jc077_upcoming.out
  exit 1
fi
grep -q '"meetings"' /tmp/jc077_upcoming.out || {
  echo "FAIL: response missing 'meetings' field"
  cat /tmp/jc077_upcoming.out
  exit 1
}
echo "OK: GET /meeting/upcoming returns meetings"

# 2. POST /meeting/prep/{event_id} generates prep packet
CODE="$(curl -sS -o /tmp/jc077_prep.out -w "%{http_code}" \
  -X POST "$BASE_URL/meeting/prep/test-event-001" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"attendees":["isaac@example.com"],"context":"Deal review"}' || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: POST /meeting/prep returned $CODE"
  cat /tmp/jc077_prep.out
  exit 1
fi
grep -q '"prep_packet"' /tmp/jc077_prep.out || {
  echo "FAIL: response missing 'prep_packet' field"
  cat /tmp/jc077_prep.out
  exit 1
}
echo "OK: POST /meeting/prep generates prep packet"

# 3. POST /meeting/debrief extracts deliverables
CODE="$(curl -sS -o /tmp/jc077_debrief.out -w "%{http_code}" \
  -X POST "$BASE_URL/meeting/debrief" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"event_id":"test-event-001","summary":"Isaac agreed to send PSA by Friday. Clint will review DD checklist."}' || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: POST /meeting/debrief returned $CODE"
  cat /tmp/jc077_debrief.out
  exit 1
fi
grep -q '"deliverables"' /tmp/jc077_debrief.out || {
  echo "FAIL: response missing 'deliverables' field"
  cat /tmp/jc077_debrief.out
  exit 1
}
echo "OK: POST /meeting/debrief extracts deliverables"

# 4. POST /commitments/create creates a commitment
CODE="$(curl -sS -o /tmp/jc078_create.out -w "%{http_code}" \
  -X POST "$BASE_URL/commitments/create" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"owner":"isaac","description":"Send PSA draft","due_date":"2026-02-28","entity":"olumie","source":"meeting:test-event-001"}' || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: POST /commitments/create returned $CODE"
  cat /tmp/jc078_create.out
  exit 1
fi
grep -q '"commitment_id"' /tmp/jc078_create.out || {
  echo "FAIL: response missing 'commitment_id' field"
  cat /tmp/jc078_create.out
  exit 1
}
echo "OK: POST /commitments/create works"

# 5. GET /commitments/list returns commitments
CODE="$(curl -sS -o /tmp/jc078_list.out -w "%{http_code}" \
  -X GET "$BASE_URL/commitments/list" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: GET /commitments/list returned $CODE"
  cat /tmp/jc078_list.out
  exit 1
fi
grep -q '"commitments"' /tmp/jc078_list.out || {
  echo "FAIL: response missing 'commitments' field"
  cat /tmp/jc078_list.out
  exit 1
}
echo "OK: GET /commitments/list returns commitments"

# 6. POST /gtd/actions/create creates an action
CODE="$(curl -sS -o /tmp/jc079_create.out -w "%{http_code}" \
  -X POST "$BASE_URL/gtd/actions/create" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"description":"Review DD checklist for Acme deal","entity":"olumie","context":"deal:acme-001","energy":"high","time_estimate_min":60}' || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: POST /gtd/actions/create returned $CODE"
  cat /tmp/jc079_create.out
  exit 1
fi
grep -q '"action_id"' /tmp/jc079_create.out || {
  echo "FAIL: response missing 'action_id' field"
  cat /tmp/jc079_create.out
  exit 1
}
echo "OK: POST /gtd/actions/create works"

# 7. GET /gtd/actions/list returns actions
CODE="$(curl -sS -o /tmp/jc079_list.out -w "%{http_code}" \
  -X GET "$BASE_URL/gtd/actions/list" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: GET /gtd/actions/list returned $CODE"
  cat /tmp/jc079_list.out
  exit 1
fi
grep -q '"actions"' /tmp/jc079_list.out || {
  echo "FAIL: response missing 'actions' field"
  cat /tmp/jc079_list.out
  exit 1
}
echo "OK: GET /gtd/actions/list returns actions"

# 8. Verify morning brief includes meeting/commitment/action data
CODE="$(curl -sS -o /tmp/jc080_brief.out -w "%{http_code}" \
  -X GET "$BASE_URL/reporting/morning-brief" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$CODE" != "200" ]; then
  echo "FAIL: GET /reporting/morning-brief returned $CODE"
  cat /tmp/jc080_brief.out
  exit 1
fi
grep -q '"meetings_today"' /tmp/jc080_brief.out || {
  echo "FAIL: morning brief missing 'meetings_today' field"
  cat /tmp/jc080_brief.out
  exit 1
}
grep -q '"commitments_snapshot"' /tmp/jc080_brief.out || {
  echo "FAIL: morning brief missing 'commitments_snapshot' field"
  cat /tmp/jc080_brief.out
  exit 1
}
grep -q '"actions_snapshot"' /tmp/jc080_brief.out || {
  echo "FAIL: morning brief missing 'actions_snapshot' field"
  cat /tmp/jc080_brief.out
  exit 1
}
echo "OK: morning brief includes meeting + commitment + action data"

echo ""
echo "JC-077-080 PASS: Meeting lifecycle, commitments, GTD actions, and enhanced briefs all verified."
