#!/usr/bin/env bash
# proof_builder_lane.sh — Behavioral proof: Builder Lane (Codex) endpoints
# Tests: pattern detection, status, metrics, generation, calibration, shadow, amplify, archetype, voice
set -euo pipefail

BASE="${TED_BASE_URL:-http://127.0.0.1:7779}"
PASS=0
FAIL=0

ok()   { PASS=$((PASS+1)); echo "  PASS: $1"; }
fail() { FAIL=$((FAIL+1)); echo "  FAIL: $1"; }

echo "=== Builder Lane Proof ==="

# 1. GET /ops/builder-lane/status
echo "[1] GET /ops/builder-lane/status"
HTTP=$(curl -s -o /tmp/bl_status.json -w "%{http_code}" "$BASE/ops/builder-lane/status")
if [ "$HTTP" = "200" ]; then
  ok "status returns 200"
else
  fail "status returned $HTTP (expected 200)"
fi
if jq -e '.ok' /tmp/bl_status.json >/dev/null 2>&1; then
  ok "status body has ok field"
else
  fail "status body missing ok field"
fi

# 2. GET /ops/builder-lane/patterns
echo "[2] GET /ops/builder-lane/patterns"
HTTP=$(curl -s -o /tmp/bl_patterns.json -w "%{http_code}" "$BASE/ops/builder-lane/patterns")
if [ "$HTTP" = "200" ]; then
  ok "patterns returns 200"
else
  fail "patterns returned $HTTP (expected 200)"
fi
if jq -e '.ok' /tmp/bl_patterns.json >/dev/null 2>&1; then
  ok "patterns body has ok field"
else
  fail "patterns body missing ok field"
fi

# 3. GET /ops/builder-lane/improvement-metrics
echo "[3] GET /ops/builder-lane/improvement-metrics"
HTTP=$(curl -s -o /tmp/bl_metrics.json -w "%{http_code}" "$BASE/ops/builder-lane/improvement-metrics")
if [ "$HTTP" = "200" ]; then
  ok "improvement-metrics returns 200"
else
  fail "improvement-metrics returned $HTTP (expected 200)"
fi

# 4. POST /ops/builder-lane/calibration-response
echo "[4] POST /ops/builder-lane/calibration-response"
HTTP=$(curl -s -o /tmp/bl_cal.json -w "%{http_code}" -X POST "$BASE/ops/builder-lane/calibration-response" \
  -H "Content-Type: application/json" \
  -d '{"prompt_id":"cal-test-001","response":"4/5 — good tone","domain":"tone"}')
if [ "$HTTP" = "200" ]; then
  ok "calibration-response returns 200"
else
  fail "calibration-response returned $HTTP (expected 200)"
fi
if jq -e '.recorded' /tmp/bl_cal.json >/dev/null 2>&1; then
  ok "calibration response recorded"
else
  fail "calibration response missing recorded field"
fi

# 5. POST /ops/builder-lane/calibration-response — missing response field
echo "[5] POST /ops/builder-lane/calibration-response — missing response"
HTTP=$(curl -s -o /tmp/bl_cal_err.json -w "%{http_code}" -X POST "$BASE/ops/builder-lane/calibration-response" \
  -H "Content-Type: application/json" \
  -d '{"prompt_id":"cal-test-002","domain":"tone"}')
if [ "$HTTP" = "400" ]; then
  ok "calibration-response rejects missing response with 400"
else
  fail "calibration-response returned $HTTP (expected 400)"
fi

# 6. POST /ops/builder-lane/amplify
echo "[6] POST /ops/builder-lane/amplify"
HTTP=$(curl -s -o /tmp/bl_amp.json -w "%{http_code}" -X POST "$BASE/ops/builder-lane/amplify" \
  -H "Content-Type: application/json" \
  -d '{"domain":"tone","multiplier":3}')
# May return 404 if no signals exist for "tone" — that's valid behavior
if [ "$HTTP" = "200" ] || [ "$HTTP" = "404" ]; then
  ok "amplify returns 200 or 404 (no signals)"
else
  fail "amplify returned $HTTP (expected 200 or 404)"
fi

# 7. POST /ops/builder-lane/amplify — missing domain
echo "[7] POST /ops/builder-lane/amplify — missing domain"
HTTP=$(curl -s -o /tmp/bl_amp_err.json -w "%{http_code}" -X POST "$BASE/ops/builder-lane/amplify" \
  -H "Content-Type: application/json" \
  -d '{"multiplier":3}')
if [ "$HTTP" = "400" ]; then
  ok "amplify rejects missing domain with 400"
else
  fail "amplify returned $HTTP (expected 400)"
fi

# 8. POST /ops/onboarding/archetype-select
echo "[8] POST /ops/onboarding/archetype-select"
HTTP=$(curl -s -o /tmp/bl_arch.json -w "%{http_code}" -X POST "$BASE/ops/onboarding/archetype-select" \
  -H "Content-Type: application/json" \
  -d '{"archetype_id":"direct_dealmaker"}')
if [ "$HTTP" = "200" ]; then
  ok "archetype-select returns 200"
else
  fail "archetype-select returned $HTTP (expected 200)"
fi
if jq -e '.archetype_id' /tmp/bl_arch.json >/dev/null 2>&1; then
  ok "archetype-select returns archetype_id"
else
  fail "archetype-select missing archetype_id"
fi

# 9. POST /ops/onboarding/archetype-select — invalid archetype
echo "[9] POST /ops/onboarding/archetype-select — invalid archetype"
HTTP=$(curl -s -o /tmp/bl_arch_err.json -w "%{http_code}" -X POST "$BASE/ops/onboarding/archetype-select" \
  -H "Content-Type: application/json" \
  -d '{"archetype_id":"nonexistent"}')
if [ "$HTTP" = "400" ]; then
  ok "archetype-select rejects invalid archetype with 400"
else
  fail "archetype-select returned $HTTP (expected 400)"
fi

# 10. GET /ops/onboarding/voice-extract-status
echo "[10] GET /ops/onboarding/voice-extract-status"
HTTP=$(curl -s -o /tmp/bl_voice.json -w "%{http_code}" "$BASE/ops/onboarding/voice-extract-status")
if [ "$HTTP" = "200" ]; then
  ok "voice-extract-status returns 200"
else
  fail "voice-extract-status returned $HTTP (expected 200)"
fi
if jq -e '.status' /tmp/bl_voice.json >/dev/null 2>&1; then
  ok "voice-extract-status has status field"
else
  fail "voice-extract-status missing status field"
fi

# 11. POST /ops/builder-lane/shadow/{id} — 404 for nonexistent proposal
echo "[11] POST /ops/builder-lane/shadow/nonexistent"
HTTP=$(curl -s -o /tmp/bl_shadow.json -w "%{http_code}" -X POST "$BASE/ops/builder-lane/shadow/nonexistent" \
  -H "Content-Type: application/json" \
  -d '{}')
if [ "$HTTP" = "404" ]; then
  ok "shadow start returns 404 for nonexistent proposal"
else
  fail "shadow start returned $HTTP (expected 404)"
fi

# 12. GET /ops/builder-lane/shadow/nonexistent — 404
echo "[12] GET /ops/builder-lane/shadow/nonexistent"
HTTP=$(curl -s -o /tmp/bl_shadow_status.json -w "%{http_code}" "$BASE/ops/builder-lane/shadow/nonexistent")
if [ "$HTTP" = "404" ]; then
  ok "shadow status returns 404 for nonexistent"
else
  fail "shadow status returned $HTTP (expected 404)"
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && echo "ALL PASS" || echo "SOME FAILURES"
exit "$FAIL"
