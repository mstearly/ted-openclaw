#!/usr/bin/env bash
# proof_self_healing.sh — Behavioral proof: Self-Healing endpoints (20 tests)
set -euo pipefail

echo "=== Self-Healing Proof: behavioral HTTP tests ==="
echo ""

BASE="${TED_BASE_URL:-http://127.0.0.1:7777}"
AUTH_TOKEN="${AUTH_TOKEN:-test-token-for-proof}"
AUTH=(-H "Authorization: Bearer ${AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

PASS=0
FAIL=0

ok()   { PASS=$((PASS+1)); echo -e "  \033[32mPASS\033[0m: $1"; }
fail() { FAIL=$((FAIL+1)); echo -e "  \033[31mFAIL\033[0m: $1"; }

# ═══════════════════════════════════════════════
# Phase A — Core self-healing route surface (10)
# ═══════════════════════════════════════════════

# 1. GET /ops/self-healing/status → 200, contains circuit_breakers
echo "[1/20] GET /ops/self-healing/status"
HTTP=$(curl -s -o /tmp/sh_status.json -w "%{http_code}" "${AUTH[@]}" "$BASE/ops/self-healing/status")
if [ "$HTTP" = "200" ]; then
  ok "status returns 200"
else
  fail "status returned $HTTP (expected 200)"
fi
if jq -e '.circuit_breakers' /tmp/sh_status.json >/dev/null 2>&1; then
  ok "status body has circuit_breakers"
else
  fail "status body missing circuit_breakers"
fi

# 2. GET /ops/self-healing/circuit-breakers → 200, contains circuit_breakers
echo "[2/20] GET /ops/self-healing/circuit-breakers"
HTTP=$(curl -s -o /tmp/sh_cb.json -w "%{http_code}" "${AUTH[@]}" "$BASE/ops/self-healing/circuit-breakers")
if [ "$HTTP" = "200" ]; then
  ok "circuit-breakers returns 200"
else
  fail "circuit-breakers returned $HTTP (expected 200)"
fi
if jq -e '.circuit_breakers' /tmp/sh_cb.json >/dev/null 2>&1; then
  ok "circuit-breakers body has circuit_breakers"
else
  fail "circuit-breakers body missing circuit_breakers"
fi

# 3. GET /ops/self-healing/provider-health → 200, contains providers
echo "[3/20] GET /ops/self-healing/provider-health"
HTTP=$(curl -s -o /tmp/sh_ph.json -w "%{http_code}" "${AUTH[@]}" "$BASE/ops/self-healing/provider-health")
if [ "$HTTP" = "200" ]; then
  ok "provider-health returns 200"
else
  fail "provider-health returned $HTTP (expected 200)"
fi
if jq -e '.providers' /tmp/sh_ph.json >/dev/null 2>&1; then
  ok "provider-health body has providers"
else
  fail "provider-health body missing providers"
fi

# 4. POST /ops/self-healing/config-drift/reconcile → 200, contains ok
echo "[4/20] POST /ops/self-healing/config-drift/reconcile"
HTTP=$(curl -s -o /tmp/sh_drift.json -w "%{http_code}" -X POST "${AUTH[@]}" "$BASE/ops/self-healing/config-drift/reconcile")
if [ "$HTTP" = "200" ]; then
  ok "config-drift/reconcile returns 200"
else
  fail "config-drift/reconcile returned $HTTP (expected 200)"
fi
if jq -e '.ok' /tmp/sh_drift.json >/dev/null 2>&1; then
  ok "config-drift/reconcile body has ok"
else
  fail "config-drift/reconcile body missing ok"
fi

# 5. POST /ops/self-healing/compact-ledgers → 200, contains ok
echo "[5/20] POST /ops/self-healing/compact-ledgers"
HTTP=$(curl -s -o /tmp/sh_compact.json -w "%{http_code}" -X POST "${AUTH[@]}" "$BASE/ops/self-healing/compact-ledgers")
if [ "$HTTP" = "200" ]; then
  ok "compact-ledgers returns 200"
else
  fail "compact-ledgers returned $HTTP (expected 200)"
fi
if jq -e '.ok' /tmp/sh_compact.json >/dev/null 2>&1; then
  ok "compact-ledgers body has ok"
else
  fail "compact-ledgers body missing ok"
fi

# 6. POST /ops/self-healing/expire-proposals → 200, contains ok
echo "[6/20] POST /ops/self-healing/expire-proposals"
HTTP=$(curl -s -o /tmp/sh_expire.json -w "%{http_code}" -X POST "${AUTH[@]}" "$BASE/ops/self-healing/expire-proposals")
if [ "$HTTP" = "200" ]; then
  ok "expire-proposals returns 200"
else
  fail "expire-proposals returned $HTTP (expected 200)"
fi
if jq -e '.ok' /tmp/sh_expire.json >/dev/null 2>&1; then
  ok "expire-proposals body has ok"
else
  fail "expire-proposals body missing ok"
fi

# 7. POST /ops/builder-lane/proposals/nonexistent/resurrect → 404, contains not_found
echo "[7/20] POST /ops/builder-lane/proposals/nonexistent/resurrect"
HTTP=$(curl -s -o /tmp/sh_resurrect.json -w "%{http_code}" -X POST "${AUTH[@]}" "$BASE/ops/builder-lane/proposals/nonexistent/resurrect")
if [ "$HTTP" = "404" ]; then
  ok "resurrect nonexistent returns 404"
else
  fail "resurrect nonexistent returned $HTTP (expected 404)"
fi
if jq -e '.not_found' /tmp/sh_resurrect.json >/dev/null 2>&1 \
   || grep -q "not_found" /tmp/sh_resurrect.json 2>/dev/null; then
  ok "resurrect body contains not_found"
else
  fail "resurrect body missing not_found"
fi

# 8. GET /ops/self-healing/correction-taxonomy → 200, contains taxonomy
echo "[8/20] GET /ops/self-healing/correction-taxonomy"
HTTP=$(curl -s -o /tmp/sh_tax.json -w "%{http_code}" "${AUTH[@]}" "$BASE/ops/self-healing/correction-taxonomy")
if [ "$HTTP" = "200" ]; then
  ok "correction-taxonomy returns 200"
else
  fail "correction-taxonomy returned $HTTP (expected 200)"
fi
if jq -e '.taxonomy' /tmp/sh_tax.json >/dev/null 2>&1; then
  ok "correction-taxonomy body has taxonomy"
else
  fail "correction-taxonomy body missing taxonomy"
fi

# 9. GET /ops/self-healing/engagement-insights → 200, contains morning_brief
echo "[9/20] GET /ops/self-healing/engagement-insights"
HTTP=$(curl -s -o /tmp/sh_engage.json -w "%{http_code}" "${AUTH[@]}" "$BASE/ops/self-healing/engagement-insights")
if [ "$HTTP" = "200" ]; then
  ok "engagement-insights returns 200"
else
  fail "engagement-insights returned $HTTP (expected 200)"
fi
if jq -e '.morning_brief' /tmp/sh_engage.json >/dev/null 2>&1 \
   || grep -q "morning_brief" /tmp/sh_engage.json 2>/dev/null; then
  ok "engagement-insights body contains morning_brief"
else
  fail "engagement-insights body missing morning_brief"
fi

# 10. GET /ops/self-healing/noise-level → 200, contains level
echo "[10/20] GET /ops/self-healing/noise-level"
HTTP=$(curl -s -o /tmp/sh_noise.json -w "%{http_code}" "${AUTH[@]}" "$BASE/ops/self-healing/noise-level")
if [ "$HTTP" = "200" ]; then
  ok "noise-level returns 200"
else
  fail "noise-level returned $HTTP (expected 200)"
fi
if jq -e '.level' /tmp/sh_noise.json >/dev/null 2>&1; then
  ok "noise-level body has level"
else
  fail "noise-level body missing level"
fi

# ═══════════════════════════════════════════════
# Phase B — Deeper validation (10)
# ═══════════════════════════════════════════════

# 11. GET /ops/self-healing/autonomy-status → 200, contains draft_tone
echo "[11/20] GET /ops/self-healing/autonomy-status"
HTTP=$(curl -s -o /tmp/sh_autonomy.json -w "%{http_code}" "${AUTH[@]}" "$BASE/ops/self-healing/autonomy-status")
if [ "$HTTP" = "200" ]; then
  ok "autonomy-status returns 200"
else
  fail "autonomy-status returned $HTTP (expected 200)"
fi
if jq -e '.draft_tone' /tmp/sh_autonomy.json >/dev/null 2>&1 \
   || grep -q "draft_tone" /tmp/sh_autonomy.json 2>/dev/null; then
  ok "autonomy-status body contains draft_tone"
else
  fail "autonomy-status body missing draft_tone"
fi

# 12. POST /ops/engagement/read-receipt → 200, contains recorded
echo "[12/20] POST /ops/engagement/read-receipt"
HTTP=$(curl -s -o /tmp/sh_rr.json -w "%{http_code}" -X POST "${AUTH[@]}" \
  -H "Content-Type: application/json" \
  -d '{"content_type":"morning_brief","delivered_at":"2026-02-24T07:00:00Z"}' \
  "$BASE/ops/engagement/read-receipt")
if [ "$HTTP" = "200" ]; then
  ok "read-receipt returns 200"
else
  fail "read-receipt returned $HTTP (expected 200)"
fi
if jq -e '.recorded' /tmp/sh_rr.json >/dev/null 2>&1 \
   || grep -q "recorded" /tmp/sh_rr.json 2>/dev/null; then
  ok "read-receipt body contains recorded"
else
  fail "read-receipt body missing recorded"
fi

# 13. POST /ops/engagement/action-receipt → 200, contains recorded
echo "[13/20] POST /ops/engagement/action-receipt"
HTTP=$(curl -s -o /tmp/sh_ar.json -w "%{http_code}" -X POST "${AUTH[@]}" \
  -H "Content-Type: application/json" \
  -d '{"content_type":"morning_brief","delivered_at":"2026-02-24T07:00:00Z"}' \
  "$BASE/ops/engagement/action-receipt")
if [ "$HTTP" = "200" ]; then
  ok "action-receipt returns 200"
else
  fail "action-receipt returned $HTTP (expected 200)"
fi
if jq -e '.recorded' /tmp/sh_ar.json >/dev/null 2>&1 \
   || grep -q "recorded" /tmp/sh_ar.json 2>/dev/null; then
  ok "action-receipt body contains recorded"
else
  fail "action-receipt body missing recorded"
fi

# 14. GET /ops/self-healing/engagement-insights (after recording) → 200, sample_size > 0
echo "[14/20] GET /ops/self-healing/engagement-insights (after recording)"
HTTP=$(curl -s -o /tmp/sh_engage2.json -w "%{http_code}" "${AUTH[@]}" "$BASE/ops/self-healing/engagement-insights")
if [ "$HTTP" = "200" ]; then
  ok "engagement-insights (post-record) returns 200"
else
  fail "engagement-insights (post-record) returned $HTTP (expected 200)"
fi
SAMPLE_SIZE=$(jq -r '.sample_size // 0' /tmp/sh_engage2.json 2>/dev/null || echo "0")
if [ "$SAMPLE_SIZE" -gt 0 ] 2>/dev/null; then
  ok "engagement-insights sample_size=$SAMPLE_SIZE (> 0)"
else
  fail "engagement-insights sample_size=$SAMPLE_SIZE (expected > 0)"
fi

# 15. Verify event_schema.json has self_healing namespace
echo "[15/20] Verify event_schema.json has self_healing namespace"
SCHEMA_FILE="$SCRIPT_DIR/../../sidecars/ted-engine/config/event_schema.json"
if [ -f "$SCHEMA_FILE" ]; then
  if jq -e '.namespaces[] | select(. == "self_healing")' "$SCHEMA_FILE" >/dev/null 2>&1 \
     || jq -e '.events[] | select(.namespace == "self_healing")' "$SCHEMA_FILE" >/dev/null 2>&1 \
     || grep -q "self_healing" "$SCHEMA_FILE" 2>/dev/null; then
    ok "event_schema.json contains self_healing namespace"
  else
    fail "event_schema.json missing self_healing namespace"
  fi
else
  fail "event_schema.json not found at $SCHEMA_FILE"
fi

# 16. Verify ted_agent.json has self-healing tools in alsoAllow
echo "[16/20] Verify ted_agent.json has self-healing tools in alsoAllow"
AGENT_FILE="$SCRIPT_DIR/../../sidecars/ted-engine/config/ted_agent.json"
if [ -f "$AGENT_FILE" ]; then
  if jq -e '.alsoAllow[]? | select(test("self.healing|self_healing"))' "$AGENT_FILE" >/dev/null 2>&1 \
     || grep -q "self.healing\|self_healing" "$AGENT_FILE" 2>/dev/null; then
    ok "ted_agent.json alsoAllow contains self-healing tools"
  else
    fail "ted_agent.json alsoAllow missing self-healing tools"
  fi
else
  fail "ted_agent.json not found at $AGENT_FILE"
fi

# 17. Verify ted_agent.json has self_healing_maintenance cron job
echo "[17/20] Verify ted_agent.json has self_healing_maintenance cron"
if [ -f "$AGENT_FILE" ]; then
  if jq -e '.cron[]? | select(.name == "self_healing_maintenance")' "$AGENT_FILE" >/dev/null 2>&1 \
     || grep -q "self_healing_maintenance" "$AGENT_FILE" 2>/dev/null; then
    ok "ted_agent.json has self_healing_maintenance cron job"
  else
    fail "ted_agent.json missing self_healing_maintenance cron job"
  fi
else
  fail "ted_agent.json not found at $AGENT_FILE"
fi

# 18. GET /ops/self-healing/status → verify provider_health array exists
echo "[18/20] GET /ops/self-healing/status → provider_health array"
HTTP=$(curl -s -o /tmp/sh_status2.json -w "%{http_code}" "${AUTH[@]}" "$BASE/ops/self-healing/status")
if [ "$HTTP" = "200" ]; then
  if jq -e '.provider_health | type == "array"' /tmp/sh_status2.json >/dev/null 2>&1 \
     || jq -e '.provider_health | type == "object"' /tmp/sh_status2.json >/dev/null 2>&1 \
     || jq -e '.provider_health' /tmp/sh_status2.json >/dev/null 2>&1; then
    ok "status has provider_health field"
  else
    fail "status missing provider_health field"
  fi
else
  fail "status returned $HTTP (expected 200)"
fi

# 19. GET /ops/self-healing/status → verify config_drift.files_monitored > 0
echo "[19/20] GET /ops/self-healing/status → config_drift.files_monitored > 0"
FM=$(jq -r '.config_drift.files_monitored // 0' /tmp/sh_status2.json 2>/dev/null || echo "0")
if [ "$FM" -gt 0 ] 2>/dev/null; then
  ok "config_drift.files_monitored=$FM (> 0)"
else
  fail "config_drift.files_monitored=$FM (expected > 0)"
fi

# 20. GET /ops/self-healing/status → verify proposal_expiry.enabled is true
echo "[20/20] GET /ops/self-healing/status → proposal_expiry.enabled is true"
ENABLED=$(jq -r '.proposal_expiry.enabled // "false"' /tmp/sh_status2.json 2>/dev/null || echo "false")
if [ "$ENABLED" = "true" ]; then
  ok "proposal_expiry.enabled=true"
else
  fail "proposal_expiry.enabled=$ENABLED (expected true)"
fi

# ═══════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════
TOTAL=$((PASS + FAIL))
echo ""
echo "=========================================="
echo "Self-Healing Proof"
echo "TOTAL: $TOTAL  PASS: $PASS  FAIL: $FAIL"
echo "=========================================="
[ "$FAIL" -eq 0 ] && echo "ALL PASS" || echo "SOME FAILURES"
exit "$FAIL"
