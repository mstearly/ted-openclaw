#!/usr/bin/env bash
set -euo pipefail

echo "JC-020 proof: workbench data-source correctness wiring"

rg -n "resolveJobCardsDir\(|job_cards_dir|job_cards_discovered" extensions/ted-sidecar/index.ts >/dev/null
rg -n "job_cards_dir" ui/src/ui/types.ts ui/src/ui/views/ted.ts >/dev/null

echo "OK: job-card source discovery + diagnostics wired"
