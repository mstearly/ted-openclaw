#!/usr/bin/env bash
set -euo pipefail

echo "JC-029 proof: intake recommender + card detail + recommendation decisions"

rg -n "ted\\.jobcards\\.detail|ted\\.recommendations\\.decide|ted\\.intake\\.recommend" extensions/ted-sidecar/index.ts >/dev/null
rg -n "Job Card Detail|New Job Intake|Recommend Settings|decision:" ui/src/ui/views/ted.ts >/dev/null
rg -n "loadTedJobCardDetail|decideTedRecommendation|runTedIntakeRecommendation" ui/src/ui/controllers/ted.ts ui/src/ui/app.ts ui/src/ui/app-view-state.ts >/dev/null
rg -n "onOpenJobCard|onRecommendationDecision|onRunIntakeRecommendation" ui/src/ui/app-render.ts >/dev/null

echo "OK: intake recommender workflow is wired end-to-end"
