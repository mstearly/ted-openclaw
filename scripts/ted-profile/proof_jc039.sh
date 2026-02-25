#!/usr/bin/env bash
set -euo pipefail
rg -n "KPI signals|Trend Snapshot|Quality Trends" ui/src/ui/views/ted.ts >/dev/null
echo "JC-039 proof placeholder: KPI surfaces present"
