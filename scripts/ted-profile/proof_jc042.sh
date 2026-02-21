#!/usr/bin/env bash
set -euo pipefail
rg -n "computePromotionConfidence|promotion_confidence|promotionBandForScore" extensions/ted-sidecar/index.ts >/dev/null
rg -n "promotion confidence|Promotion confidence|labelForConfidenceBand" ui/src/ui/views/ted.ts >/dev/null
echo "JC-042 proof placeholder: per-card promotion confidence wiring present"
