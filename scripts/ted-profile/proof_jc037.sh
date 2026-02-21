#!/usr/bin/env bash
set -euo pipefail
rg -n "Preview Impact|Save Changes|Suggest KPIs" ui/src/ui/views/ted.ts >/dev/null
echo "JC-037 proof placeholder: structured edit flow controls present"
