#!/usr/bin/env bash
set -euo pipefail

echo "JC-035 proof: KPI and evals observability cockpit"

test -f docs/ted-profile/sdd-pack/26_TED_UI_GOVERNED_EXECUTION_PLAN.md
test -f docs/ted-profile/job-cards/JC-035-kpi-evals-observability-cockpit.md
rg -n "kpi_history_preview|eval_history_preview" extensions/ted-sidecar/index.ts ui/src/ui/types.ts >/dev/null
rg -n "Trend Snapshot|Proof Check History" ui/src/ui/views/ted.ts >/dev/null

echo "OK: KPI/eval observability surfaces are wired"
