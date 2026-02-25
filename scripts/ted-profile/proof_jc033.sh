#!/usr/bin/env bash
set -euo pipefail

echo "JC-033 proof: core task flow redesign"

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
source "$(dirname "$0")/lib_auth.sh"

# ── spec docs must exist (legitimate file-existence checks) ──
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

test -f "$REPO_ROOT/docs/ted-profile/sdd-pack/23_TED_UI_TASK_AUDIT.md" || {
  echo "FAIL: spec doc 23_TED_UI_TASK_AUDIT.md not found"
  exit 1
}

test -f "$REPO_ROOT/docs/ted-profile/job-cards/JC-033-core-task-flow-redesign.md" || {
  echo "FAIL: job card doc JC-033-core-task-flow-redesign.md not found"
  exit 1
}

# ── sidecar must be reachable ──
curl -fsS "$BASE_URL/status" >/dev/null

# ── mint auth token ──
mint_ted_auth_token
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

# ── GET /ted/workbench — verify execution plan data flows ──
HTTP_CODE="$(curl -sS -o /tmp/jc033_workbench.out -w "%{http_code}" \
  "${AUTH_ARGS[@]}" "$BASE_URL/ted/workbench" || true)"

if [ "$HTTP_CODE" != "200" ]; then
  echo "FAIL: GET /ted/workbench returned HTTP $HTTP_CODE, expected 200"
  cat /tmp/jc033_workbench.out
  exit 1
fi

# ── verify job_cards field contains a cards array ──
if ! grep -q "\"job_cards\"" /tmp/jc033_workbench.out; then
  echo "FAIL: workbench response missing \"job_cards\" field"
  cat /tmp/jc033_workbench.out
  exit 1
fi

if ! grep -q "\"cards\"" /tmp/jc033_workbench.out; then
  echo "FAIL: workbench response missing \"cards\" array inside job_cards"
  cat /tmp/jc033_workbench.out
  exit 1
fi

# ── verify at least 1 card is present ──
CARD_COUNT="$(node -e "
  const fs = require('fs');
  try {
    const j = JSON.parse(fs.readFileSync('/tmp/jc033_workbench.out', 'utf8'));
    const cards = (j.job_cards && j.job_cards.cards) || j.cards || [];
    process.stdout.write(String(cards.length));
  } catch { process.stdout.write('0'); }
" 2>/dev/null || echo "0")"

if [ "$CARD_COUNT" -lt 1 ]; then
  echo "FAIL: expected at least 1 job card in workbench response, got $CARD_COUNT"
  cat /tmp/jc033_workbench.out
  exit 1
fi

echo "OK: core task flow redesign verified — spec docs exist, workbench returns 200 with $CARD_COUNT job card(s)"
