#!/usr/bin/env bash
set -euo pipefail

echo "JC-021 proof: persona role-card studio validation path"

rg -n "ted\\.governance\\.rolecards\\.validate" extensions/ted-sidecar/index.ts >/dev/null
rg -n "callAuthenticatedTedRoute\\(|/governance/role-cards/validate" extensions/ted-sidecar/index.ts >/dev/null

rg -n "validateTedRoleCard|tedRoleCardJson|tedRoleCardBusy|tedRoleCardResult|tedRoleCardError" \
  ui/src/ui/controllers/ted.ts ui/src/ui/app.ts ui/src/ui/app-view-state.ts >/dev/null

rg -n "Persona Role Card Validator|Validate Role Card|onRoleCardValidate|onRoleCardJsonChange" \
  ui/src/ui/views/ted.ts ui/src/ui/app-render.ts >/dev/null

echo "OK: governed role-card validation is wired in Ted UI"
