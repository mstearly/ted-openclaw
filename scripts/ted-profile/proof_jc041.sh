#!/usr/bin/env bash
set -euo pipefail
rg -n "RECOMMENDATION_OUTCOMES_FILE|appendRecommendationOutcome|recommendation_outcomes" extensions/ted-sidecar/index.ts >/dev/null
rg -n "Recommendation Outcome Learning|recommendation_outcomes" ui/src/ui/views/ted.ts >/dev/null
echo "JC-041 proof placeholder: recommendation attribution wiring present"
