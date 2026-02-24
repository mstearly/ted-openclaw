#!/usr/bin/env bash
set -euo pipefail

echo "JC-108 proof: Improvement Proposals (Codex Builder Lane)"
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

PROPOSAL_ID=""

# ---------------------------------------------------------------------------
# 1. GET /improvement/proposals — returns 200 with proposals array
# ---------------------------------------------------------------------------
echo "--- [1/6] List improvement proposals (GET /improvement/proposals) ---"
SC="$(curl -sS -o /tmp/jc108_list.out -w "%{http_code}" \
  -X GET "$BASE_URL/improvement/proposals" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$SC" = "200" ]; then
  LIST_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('ok') == True, 'missing ok flag'
assert 'proposals' in d, 'missing proposals key'
assert isinstance(d['proposals'], list), 'proposals is not a list'
assert 'total' in d, 'missing total count'
print('OK')
" < /tmp/jc108_list.out 2>/dev/null || echo "FAIL")"
  if [ "$LIST_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 200 — response has ok, proposals array, and total"
    record_pass
  else
    echo "  FAIL: HTTP 200 but response missing expected fields"
    record_fail "1-list-shape"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  cat /tmp/jc108_list.out 2>/dev/null || true
  record_fail "1-list-http"
fi

# ---------------------------------------------------------------------------
# 2. POST /improvement/proposals — create a proposal, get proposal_id
# ---------------------------------------------------------------------------
echo "--- [2/6] Create improvement proposal (POST /improvement/proposals) ---"
SC="$(curl -sS -o /tmp/jc108_create.out -w "%{http_code}" \
  -X POST "$BASE_URL/improvement/proposals" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"title":"Tighten banned-phrase validator","type":"contract_update","description":"Add 3 new banned phrases identified in cycle 006 failure aggregation.","source":"proof_script"}' || true)"
if [ "$SC" = "201" ]; then
  CREATE_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('ok') == True, 'missing ok flag'
assert 'proposal' in d, 'missing proposal object'
p = d['proposal']
assert 'proposal_id' in p, 'missing proposal_id'
assert p.get('status') == 'proposed', 'status should be proposed'
assert p.get('type') == 'contract_update', 'type mismatch'
print(p['proposal_id'])
" < /tmp/jc108_create.out 2>/dev/null || echo "FAIL")"
  if [ "$CREATE_CHECK" != "FAIL" ] && [ -n "$CREATE_CHECK" ]; then
    PROPOSAL_ID="$CREATE_CHECK"
    echo "  PASS: HTTP 201 — proposal created with proposal_id=${PROPOSAL_ID}"
    record_pass
  else
    echo "  FAIL: HTTP 201 but response missing expected fields"
    record_fail "2-create-shape"
  fi
else
  echo "  FAIL: expected 201, got $SC"
  cat /tmp/jc108_create.out 2>/dev/null || true
  record_fail "2-create-http"
fi

# ---------------------------------------------------------------------------
# 3. GET /improvement/proposals?status=proposed — verify created proposal appears
# ---------------------------------------------------------------------------
echo "--- [3/6] Filter proposals by status=proposed ---"
SC="$(curl -sS -o /tmp/jc108_filter.out -w "%{http_code}" \
  -X GET "$BASE_URL/improvement/proposals?status=proposed" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$SC" = "200" ]; then
  FILTER_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('ok') == True, 'missing ok flag'
proposals = d.get('proposals', [])
assert isinstance(proposals, list), 'proposals is not a list'
# All returned proposals should have status=proposed
for p in proposals:
    assert p.get('status') == 'proposed', f'unexpected status: {p.get(\"status\")}'
# If we have a proposal_id from test 2, verify it appears
target_id = '${PROPOSAL_ID}'
if target_id:
    found = any(p.get('proposal_id') == target_id for p in proposals)
    assert found, f'proposal {target_id} not in filtered results'
print('OK')
" < /tmp/jc108_filter.out 2>/dev/null || echo "FAIL")"
  if [ "$FILTER_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 200 — filtered proposals contain our created proposal"
    record_pass
  else
    echo "  FAIL: HTTP 200 but created proposal not in filtered results"
    record_fail "3-filter-shape"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  cat /tmp/jc108_filter.out 2>/dev/null || true
  record_fail "3-filter-http"
fi

# ---------------------------------------------------------------------------
# 4. POST /improvement/proposals/{id}/review — approve the proposal
# ---------------------------------------------------------------------------
echo "--- [4/6] Review proposal (POST /improvement/proposals/${PROPOSAL_ID}/review) ---"
if [ -z "$PROPOSAL_ID" ]; then
  echo "  SKIP: no proposal_id from test 2 — cannot review"
  record_fail "4-review-skip"
else
  SC="$(curl -sS -o /tmp/jc108_review.out -w "%{http_code}" \
    -X POST "$BASE_URL/improvement/proposals/${PROPOSAL_ID}/review" \
    "${AUTH_ARGS[@]}" \
    -H "Content-Type: application/json" \
    -d '{"verdict":"approved","notes":"Approved via JC-108 proof script."}' || true)"
  if [ "$SC" = "200" ]; then
    REVIEW_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('ok') == True, 'missing ok flag'
assert d.get('proposal_id') == '${PROPOSAL_ID}', 'proposal_id mismatch'
assert d.get('status') == 'approved', 'status should be approved'
assert 'reviewed_at' in d, 'missing reviewed_at timestamp'
print('OK')
" < /tmp/jc108_review.out 2>/dev/null || echo "FAIL")"
    if [ "$REVIEW_CHECK" = "OK" ]; then
      echo "  PASS: HTTP 200 — proposal approved successfully"
      record_pass
    else
      echo "  FAIL: HTTP 200 but response missing expected fields"
      record_fail "4-review-shape"
    fi
  else
    echo "  FAIL: expected 200, got $SC"
    cat /tmp/jc108_review.out 2>/dev/null || true
    record_fail "4-review-http"
  fi
fi

# ---------------------------------------------------------------------------
# 5. GET /improvement/failure-aggregation — returns aggregation object
# ---------------------------------------------------------------------------
echo "--- [5/6] Failure aggregation (GET /improvement/failure-aggregation) ---"
SC="$(curl -sS -o /tmp/jc108_agg.out -w "%{http_code}" \
  -X GET "$BASE_URL/improvement/failure-aggregation" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$SC" = "200" ]; then
  AGG_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('ok') == True, 'missing ok flag'
agg = d.get('aggregation', {})
assert 'total_failures' in agg, 'missing total_failures'
assert 'failure_by_intent' in agg, 'missing failure_by_intent'
assert 'recommendation' in agg, 'missing recommendation'
assert 'period_start' in agg, 'missing period_start'
assert 'period_end' in agg, 'missing period_end'
print('OK')
" < /tmp/jc108_agg.out 2>/dev/null || echo "FAIL")"
  if [ "$AGG_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 200 — aggregation has total_failures, failure_by_intent, recommendation"
    record_pass
  else
    echo "  FAIL: HTTP 200 but aggregation missing expected fields"
    record_fail "5-agg-shape"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  cat /tmp/jc108_agg.out 2>/dev/null || true
  record_fail "5-agg-http"
fi

# ---------------------------------------------------------------------------
# 6. GET /trust/autonomy/evaluate — returns evaluation object
# ---------------------------------------------------------------------------
echo "--- [6/6] Trust autonomy evaluation (GET /trust/autonomy/evaluate) ---"
SC="$(curl -sS -o /tmp/jc108_trust.out -w "%{http_code}" \
  -X GET "$BASE_URL/trust/autonomy/evaluate" \
  "${AUTH_ARGS[@]}" || true)"
if [ "$SC" = "200" ]; then
  TRUST_CHECK="$(python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d.get('ok') == True, 'missing ok flag'
ev = d.get('evaluation', {})
assert 'current_level' in ev, 'missing current_level'
assert 'eligible_for_promotion' in ev, 'missing eligible_for_promotion'
assert 'metrics' in ev, 'missing metrics'
m = ev['metrics']
assert 'validation_pass_rate' in m, 'missing validation_pass_rate'
assert 'draft_approval_rate' in m, 'missing draft_approval_rate'
assert 'consecutive_passes' in m, 'missing consecutive_passes'
assert 'promotion_threshold' in ev, 'missing promotion_threshold'
assert 'recommendation' in ev, 'missing recommendation'
print('OK')
" < /tmp/jc108_trust.out 2>/dev/null || echo "FAIL")"
  if [ "$TRUST_CHECK" = "OK" ]; then
    echo "  PASS: HTTP 200 — evaluation has current_level, eligible_for_promotion, metrics"
    record_pass
  else
    echo "  FAIL: HTTP 200 but evaluation missing expected fields"
    record_fail "6-trust-shape"
  fi
else
  echo "  FAIL: expected 200, got $SC"
  cat /tmp/jc108_trust.out 2>/dev/null || true
  record_fail "6-trust-http"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=========================================="
echo "JC-108 Improvement Proposals (Codex Builder): $PASS/$TESTED passed"
if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "FAILURES: ${FAILURES[*]}"
fi
echo "=========================================="
exit "$FAIL"
