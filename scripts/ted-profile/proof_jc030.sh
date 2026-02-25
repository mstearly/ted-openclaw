#!/usr/bin/env bash
set -euo pipefail

echo "JC-030 proof: threshold governance and early unlock controls"

rg -n "ted\\.gates\\.set|GATE_OVERRIDES_FILE|resolveEffectiveFrictionKpis|acknowledge_risk" extensions/ted-sidecar/index.ts >/dev/null
rg -n "Threshold and Unlock Controls|Apply Thresholds|Reset Defaults|acknowledge relaxed thresholds" ui/src/ui/views/ted.ts >/dev/null
rg -n "tedThresholdManual|tedThresholdAcknowledgeRisk|applyTedThresholds" ui/src/ui/controllers/ted.ts ui/src/ui/app.ts ui/src/ui/app-view-state.ts ui/src/ui/app-render.ts >/dev/null

echo "OK: threshold controls with risk acknowledgement are wired"
