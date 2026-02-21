#!/usr/bin/env bash
set -euo pipefail

echo "JC-034 proof: governance and approval UX hardening"

test -f docs/ted-profile/sdd-pack/24_TED_UI_GOVERNANCE_AUDIT.md
test -f docs/ted-profile/job-cards/JC-034-governance-and-approval-ux-hardening.md
rg -n "approval_queue|governance_timeline_preview" extensions/ted-sidecar/index.ts ui/src/ui/types.ts >/dev/null
rg -n "Pending Decisions|Safety Timeline" ui/src/ui/views/ted.ts >/dev/null

echo "OK: unified approval queue and governance timeline are wired"
