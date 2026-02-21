#!/usr/bin/env bash
set -euo pipefail

echo "JC-015 proof: offline evals and regression gates"

EVAL_DIR="docs/ted-profile/evals"
RUNNER="scripts/ted-profile/run_eval_gates.sh"

[ -d "$EVAL_DIR" ] || {
  echo "FAIL: missing eval corpus dir: $EVAL_DIR"
  exit 1
}

[ -x "$RUNNER" ] || {
  echo "FAIL: missing executable eval runner: $RUNNER"
  exit 1
}

"$RUNNER"

echo "OK: eval runner completed"
