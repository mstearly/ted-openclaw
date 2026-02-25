#!/usr/bin/env bash
set -euo pipefail

echo "JC-102 Extraction proof: Commitment extraction from email"
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

# ---------------------------------------------------------------------------
# 1. POST extract-commitments returns 200 or 409
# ---------------------------------------------------------------------------
echo "--- [1/4] Extract commitments endpoint (POST /graph/olumie/mail/test-message-id/extract-commitments) ---"
SC="$(curl -sS -o /tmp/jc102_extract.out -w "%{http_code}" \
  -X POST "$BASE_URL/graph/olumie/mail/test-message-id/extract-commitments" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{}' || true)"
if [ "$SC" = "200" ]; then
  EXTRACT_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert 'detected' in d, 'missing detected array'
assert isinstance(d['detected'], list), 'detected is not a list'
assert 'source_email_id' in d, 'missing source_email_id'
print('OK')
" < /tmp/jc102_extract.out 2>/dev/null || echo "FAIL")"
  if [ "$EXTRACT_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 200 — response has 'detected' array and 'source_email_id'"
    record_pass
  else
    echo "  FAIL: HTTP 200 but response missing required fields"
    record_fail "1-extract-shape"
  fi
elif [ "$SC" = "409" ]; then
  AUTH_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
print('OK' if d.get('error') == 'NOT_AUTHENTICATED' else 'UNEXPECTED:' + str(d.get('error')))
" < /tmp/jc102_extract.out 2>/dev/null || echo "FAIL")"
  if [ "$AUTH_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 409 NOT_AUTHENTICATED (expected — auth required for Graph mail access)"
    record_pass
  else
    echo "  FAIL: HTTP 409 but unexpected error: $AUTH_CHECK"
    record_fail "1-extract-409"
  fi
else
  echo "  FAIL: expected 200 or 409, got $SC"
  record_fail "1-extract-http"
fi

# ---------------------------------------------------------------------------
# 2. Event schema includes extraction events
# ---------------------------------------------------------------------------
echo "--- [2/4] Event schema includes extraction.commitment.detected ---"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCHEMA_PATH="$SCRIPT_DIR/../../sidecars/ted-engine/config/event_schema.json"
if [ -f "$SCHEMA_PATH" ]; then
  SCHEMA_CHECK="$(python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    schema = json.load(f)
event_types = schema.get('event_types', {})
extraction = event_types.get('extraction', {})
assert 'extraction.commitment.detected' in extraction, 'missing extraction.commitment.detected'
assert 'extraction.commitment.confirmed' in extraction, 'missing extraction.commitment.confirmed'
assert 'extraction.commitment.rejected' in extraction, 'missing extraction.commitment.rejected'
print('OK')
" "$SCHEMA_PATH" 2>/dev/null || echo "FAIL")"
  if [ "$SCHEMA_CHECK" = "OK" ]; then
    echo "  PASS: event_schema.json has extraction.commitment.detected/confirmed/rejected"
    record_pass
  else
    echo "  FAIL: event_schema.json missing extraction event types"
    record_fail "2-schema-extraction"
  fi
else
  echo "  FAIL: event_schema.json not found at $SCHEMA_PATH"
  record_fail "2-schema-missing"
fi

# ---------------------------------------------------------------------------
# 3. Graph profile has Tasks.ReadWrite scope
# ---------------------------------------------------------------------------
echo "--- [3/4] Graph profile has Tasks.ReadWrite delegated scope ---"
PROFILES_PATH="$SCRIPT_DIR/../../sidecars/ted-engine/config/graph.profiles.json"
if [ -f "$PROFILES_PATH" ]; then
  SCOPE_CHECK="$(python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    cfg = json.load(f)
olumie = cfg.get('profiles', {}).get('olumie', {})
scopes = olumie.get('delegated_scopes', [])
assert 'Tasks.ReadWrite' in scopes, f'Tasks.ReadWrite not in scopes: {scopes}'
print('OK')
" "$PROFILES_PATH" 2>/dev/null || echo "FAIL")"
  if [ "$SCOPE_CHECK" = "OK" ]; then
    echo "  PASS: olumie profile has Tasks.ReadWrite in delegated_scopes"
    record_pass
  else
    echo "  FAIL: Tasks.ReadWrite not found in olumie delegated_scopes"
    record_fail "3-scope-missing"
  fi
else
  echo "  FAIL: graph.profiles.json not found at $PROFILES_PATH"
  record_fail "3-profiles-missing"
fi

# ---------------------------------------------------------------------------
# 4. Graph profile has user_mapping with Clint key
# ---------------------------------------------------------------------------
echo "--- [4/4] Graph profile has user_mapping configured ---"
if [ -f "$PROFILES_PATH" ]; then
  MAPPING_CHECK="$(python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    cfg = json.load(f)
olumie = cfg.get('profiles', {}).get('olumie', {})
user_mapping = olumie.get('user_mapping', {})
assert 'Clint' in user_mapping, f'Clint not in user_mapping: {list(user_mapping.keys())}'
assert isinstance(user_mapping['Clint'], str), 'Clint mapping is not a string'
assert len(user_mapping['Clint']) > 0, 'Clint mapping is empty string'
print('OK')
" "$PROFILES_PATH" 2>/dev/null || echo "FAIL")"
  if [ "$MAPPING_CHECK" = "OK" ]; then
    echo "  PASS: user_mapping has 'Clint' key with non-empty value"
    record_pass
  else
    echo "  FAIL: user_mapping missing or invalid Clint entry"
    record_fail "4-mapping-invalid"
  fi
else
  echo "  FAIL: graph.profiles.json not found at $PROFILES_PATH"
  record_fail "4-profiles-missing"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=========================================="
echo "JC-102 Extraction Proof: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "FAILURES: ${FAILURES[*]}"
fi
echo "=========================================="
exit "$FAIL"
