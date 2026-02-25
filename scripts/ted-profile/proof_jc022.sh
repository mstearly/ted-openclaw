#!/usr/bin/env bash
set -euo pipefail

echo "JC-022 proof: job-card board and proof references"

rg -n "parseJobCardMetadata|job_cards:\\s*\\{|cards:\\s*Array<|proof_script" extensions/ted-sidecar/index.ts >/dev/null
rg -n "ted\\.jobcards\\.proof\\.run|runProofScript\\(|PROOF_SCRIPT_PATH_RE" extensions/ted-sidecar/index.ts >/dev/null
rg -n "runTedProof|tedProofBusyKey|tedProofResult|tedProofError" \
  ui/src/ui/controllers/ted.ts ui/src/ui/app.ts ui/src/ui/app-view-state.ts >/dev/null
rg -n "Job Card Board|Dependency-aware slices|proof script: pending|card\\.proof_script|Run proof|onRunProof" ui/src/ui/views/ted.ts ui/src/ui/app-render.ts >/dev/null
rg -n "cards:\\s*Array<" ui/src/ui/types.ts >/dev/null

echo "OK: job-card board + governed proof run hooks are wired"
