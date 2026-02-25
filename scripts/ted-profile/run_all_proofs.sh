#!/usr/bin/env bash
set -euo pipefail

# ─── Ted Proof Suite Runner ───
# Runs all behavioral proof scripts sequentially and aggregates results.
# Usage: bash scripts/ted-profile/run_all_proofs.sh [--quick]
#   --quick: Only run high-coverage proofs (jc087+)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"

TOTAL_SCRIPTS=0
PASSED_SCRIPTS=0
FAILED_SCRIPTS=0
SKIPPED_SCRIPTS=0
FAILED_LIST=()

QUICK_MODE=false
if [ "${1:-}" = "--quick" ]; then
  QUICK_MODE=true
fi

echo "============================================"
echo "  Ted Proof Suite Runner"
echo "  $(date -Iseconds)"
echo "  Sidecar: $BASE_URL"
echo "  Mode: $([ "$QUICK_MODE" = true ] && echo 'Quick (high-coverage only)' || echo 'Full')"
echo "============================================"
echo ""

# ── Check sidecar is reachable ──
if ! curl -fsS "$BASE_URL/status" >/dev/null 2>&1; then
  echo "FATAL: Sidecar not reachable at $BASE_URL"
  echo "Start the sidecar first: node sidecars/ted-engine/server.mjs"
  exit 1
fi
echo "Sidecar reachable at $BASE_URL"
echo ""

# ── Determine which proofs to run ──
if [ "$QUICK_MODE" = true ]; then
  # High-coverage proofs only (Phase 6+)
  PROOFS=(
    proof_jc087.sh
    proof_jc088.sh
    proof_jc089.sh
    proof_jc090.sh
    proof_jc091.sh
    proof_jc092.sh
    proof_jc102.sh
    proof_jc103.sh
    proof_jc102_extract.sh
    proof_jc107.sh
    proof_jc108.sh
    proof_jc109.sh
    proof_jc110.sh
    proof_jc111.sh
    proof_jc112_auth.sh
    proof_jc113_reporting.sh
    proof_jc114_state_violations.sh
    proof_jc115_sync.sh
    proof_golden_fixtures.sh
    proof_policy_simulation.sh
  )
else
  # All proofs in order
  PROOFS=(
    proof_jc046.sh
    proof_jc047.sh
    proof_jc057.sh
    proof_jc058.sh
    proof_jc059.sh
    proof_jc060.sh
    proof_jc061.sh
    proof_jc062.sh
    proof_jc063.sh
    proof_jc069.sh
    proof_jc076.sh
    proof_jc087.sh
    proof_jc088.sh
    proof_jc089.sh
    proof_jc090.sh
    proof_jc091.sh
    proof_jc092.sh
    proof_jc102.sh
    proof_jc103.sh
    proof_jc102_extract.sh
    proof_jc107.sh
    proof_jc108.sh
    proof_jc109.sh
    proof_jc110.sh
    proof_jc111.sh
    proof_jc112_auth.sh
    proof_jc113_reporting.sh
    proof_jc114_state_violations.sh
    proof_jc115_sync.sh
    proof_golden_fixtures.sh
    proof_policy_simulation.sh
    proof_deal_gateway.sh
    proof_deal_workflow.sh
  )
fi

# ── Run each proof ──
for proof in "${PROOFS[@]}"; do
  PROOF_PATH="$SCRIPT_DIR/$proof"
  if [ ! -f "$PROOF_PATH" ]; then
    echo "[SKIP] $proof — file not found"
    SKIPPED_SCRIPTS=$((SKIPPED_SCRIPTS + 1))
    continue
  fi
  TOTAL_SCRIPTS=$((TOTAL_SCRIPTS + 1))
  echo "────────────────────────────────────────"
  echo "[RUN]  $proof"
  echo "────────────────────────────────────────"
  if bash "$PROOF_PATH" 2>&1; then
    PASSED_SCRIPTS=$((PASSED_SCRIPTS + 1))
    echo "[PASS] $proof"
  else
    EXIT_CODE=$?
    FAILED_SCRIPTS=$((FAILED_SCRIPTS + 1))
    FAILED_LIST+=("$proof (exit $EXIT_CODE)")
    echo "[FAIL] $proof (exit code $EXIT_CODE)"
  fi
  echo ""
done

# ── Summary ──
echo ""
echo "============================================"
echo "  PROOF SUITE RESULTS"
echo "  $(date -Iseconds)"
echo "============================================"
echo "  TOTAL:   $TOTAL_SCRIPTS"
echo "  PASSED:  $PASSED_SCRIPTS"
echo "  FAILED:  $FAILED_SCRIPTS"
echo "  SKIPPED: $SKIPPED_SCRIPTS"
if [ ${#FAILED_LIST[@]} -gt 0 ]; then
  echo ""
  echo "  FAILURES:"
  for f in "${FAILED_LIST[@]}"; do
    echo "    - $f"
  done
fi
echo "============================================"

# Exit with failure count
exit "$FAILED_SCRIPTS"
