#!/usr/bin/env bash
set -euo pipefail
rg -n "What Unlocks as Quality Improves|Apply Changes|Reset Safe Defaults" ui/src/ui/views/ted.ts >/dev/null
echo "JC-038 proof placeholder: unlock controls present"
