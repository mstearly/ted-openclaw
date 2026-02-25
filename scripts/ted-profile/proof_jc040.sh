#!/usr/bin/env bash
set -euo pipefail
rg -n "Create New Work Item|Example:|Generate Recommended Setup" ui/src/ui/views/ted.ts >/dev/null
echo "JC-040 proof placeholder: intake wizard controls present"
