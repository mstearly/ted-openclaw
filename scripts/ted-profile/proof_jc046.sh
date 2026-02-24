#!/usr/bin/env bash
set -euo pipefail

echo "JC-046 proof: integration health and readiness plane"
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

# ── Test 1: GET /ted/workbench returns 200 ──
echo "--- [1/3] GET /ted/workbench returns 200 ---"
SC=$(curl -sS -o /tmp/jc046_workbench.out -w "%{http_code}" \
  "${AUTH_ARGS[@]}" "$BASE_URL/ted/workbench" || true)
if [ "$SC" = "200" ]; then
  echo "  PASS: workbench returned 200"
  record_pass
else
  echo "  FAIL: expected 200, got $SC"
  record_fail "1-workbench-status"
fi

# ── Test 2: Response contains integrations.m365_profiles array ──
echo "--- [2/3] Response has integrations.m365_profiles array ---"
HAS_INTEGRATIONS=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
profiles = d.get('integrations', {}).get('m365_profiles', None)
if profiles is not None and isinstance(profiles, list):
    print('yes')
else:
    print('no')
" < /tmp/jc046_workbench.out 2>/dev/null || echo "parse_error")

if [ "$HAS_INTEGRATIONS" = "yes" ]; then
  echo "  PASS: integrations.m365_profiles array present"
  record_pass
else
  echo "  FAIL: integrations.m365_profiles missing or not an array ($HAS_INTEGRATIONS)"
  record_fail "2-integrations-field"
fi

# ── Test 3: Each profile has profile_id, status, next_step ──
echo "--- [3/3] Each profile has profile_id, status, next_step ---"
PROFILE_CHECK=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
profiles = d.get('integrations', {}).get('m365_profiles', [])
if len(profiles) == 0:
    print('EMPTY')
    sys.exit(0)
required = ['profile_id', 'status', 'next_step']
for i, p in enumerate(profiles):
    for f in required:
        if f not in p:
            print(f'MISSING:{f}:profile[{i}]')
            sys.exit(0)
print(f'OK:{len(profiles)}')
" < /tmp/jc046_workbench.out 2>/dev/null || echo "parse_error")

case "$PROFILE_CHECK" in
  OK:*)
    COUNT="${PROFILE_CHECK#OK:}"
    echo "  PASS: $COUNT profile(s) each have profile_id, status, next_step"
    record_pass
    ;;
  EMPTY)
    echo "  FAIL: m365_profiles array is empty"
    record_fail "3-profiles-empty"
    ;;
  MISSING:*)
    echo "  FAIL: profile $PROFILE_CHECK"
    record_fail "3-profiles-fields"
    ;;
  *)
    echo "  FAIL: could not parse profiles ($PROFILE_CHECK)"
    record_fail "3-profiles-parse"
    ;;
esac

echo ""
echo "=========================================="
echo "JC-046 Integration Health: $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then echo "FAILURES: ${FAILURES[*]}"; fi
echo "=========================================="
exit "$FAIL"
