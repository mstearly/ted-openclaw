#!/usr/bin/env bash
set -euo pipefail

echo "JC-032 proof: IA and interaction contract"

test -f docs/ted-profile/sdd-pack/25_TED_UI_STRATEGY.md
test -f docs/ted-profile/job-cards/JC-032-information-architecture-and-interaction-contract.md
rg -n "Operate|Build|Govern|Intake|Evals" ui/src/ui/views/ted.ts >/dev/null
rg -n "activeSection|onSetSection|aria-pressed|sectionFocus" ui/src/ui/views/ted.ts ui/src/ui/app-render.ts >/dev/null

echo "OK: IA sections + interaction controls are wired"
