#!/usr/bin/env bash
set -euo pipefail
rg -n "operator_flow|primary_approval_surface|secondary_approval_surface" extensions/ted-sidecar/index.ts ui/src/ui/types.ts >/dev/null
rg -n "Operator Workflow \(Clint View\)|primary_approval_surface|draft_review_surface" ui/src/ui/views/ted.ts >/dev/null
echo "JC-047 proof placeholder: operator flow and approval path clarity wiring present"
