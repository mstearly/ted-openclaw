#!/usr/bin/env bash
set -euo pipefail

echo "JC-033 proof: core task flow redesign"

test -f docs/ted-profile/sdd-pack/23_TED_UI_TASK_AUDIT.md
test -f docs/ted-profile/job-cards/JC-033-core-task-flow-redesign.md
rg -n "Execution Plan|Work Item Details|View Details|Run proof|Recommended Next Actions|Create New Work Item|Save Changes|Example: Daily Ops Brief" ui/src/ui/views/ted.ts >/dev/null
rg -n "ted-job-card-detail|scrollIntoView" ui/src/ui/views/ted.ts ui/src/ui/app-render.ts >/dev/null

echo "OK: core task flow surfaces are present"
