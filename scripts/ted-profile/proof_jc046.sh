#!/usr/bin/env bash
set -euo pipefail
rg -n "fetchIntegrationSnapshot|fetchM365ProfileStatus|integrations:" extensions/ted-sidecar/index.ts >/dev/null
rg -n "Integration Health|m365_profiles|toneForIntegrationStatus" ui/src/ui/views/ted.ts ui/src/ui/types.ts >/dev/null
echo "JC-046 proof placeholder: integration health plane wiring present"
