#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
echo "JC-005 proof (proof-first): filing suggestions queue"

# Precondition: sidecar must be running
curl -fsS "$BASE_URL/status" >/dev/null

# Must exist after implementation
LIST_CODE="$(curl -sS -o /tmp/jc005_list.out -w "%{http_code}" "$BASE_URL/filing/suggestions/list" || true)"
if [ "$LIST_CODE" = "404" ]; then
  echo "EXPECTED_FAIL_UNTIL_JC005_IMPLEMENTED: missing /filing/suggestions/list"
  cat /tmp/jc005_list.out || true
  exit 1
fi

if [ "$LIST_CODE" != "200" ]; then
  echo "FAIL: expected 200 from list, got $LIST_CODE"
  cat /tmp/jc005_list.out || true
  exit 1
fi

echo "OK: /filing/suggestions/list exists (next: functional proof after implementation)"
