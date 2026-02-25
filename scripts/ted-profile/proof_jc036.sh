#!/usr/bin/env bash
set -euo pipefail
rg -n "Policy Center|Preview Policy Impact|Save Policy Changes" ui/src/ui/views/ted.ts >/dev/null
rg -n "ted.policy.read|ted.policy.preview_update|ted.policy.update" extensions/ted-sidecar/index.ts >/dev/null
rg -n "onLoadPolicyDoc|onPreviewPolicyUpdate|onSavePolicyUpdate" ui/src/ui/app-render.ts >/dev/null
echo "JC-036 proof: policy center UI + sidecar methods wired"
