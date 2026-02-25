#!/usr/bin/env bash
set -euo pipefail
rg -n "POLICY_IMPACTS_FILE|appendPolicyImpact|readPolicyImpacts|comparePolicyConfigs" extensions/ted-sidecar/index.ts >/dev/null
rg -n "policy_impacts|Policy Change Attribution|toneForRiskDirection" ui/src/ui/views/ted.ts >/dev/null
echo "JC-043 proof placeholder: policy impact attribution wiring present"
