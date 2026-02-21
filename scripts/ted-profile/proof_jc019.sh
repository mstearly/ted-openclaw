#!/usr/bin/env bash
set -euo pipefail

echo "JC-019 proof: Ted workbench dashboard surface"

rg -n "registerGatewayMethod\(\"ted.workbench\"" extensions/ted-sidecar/index.ts >/dev/null
rg -n "state\.tab === \"ted\"" ui/src/ui/app-render.ts >/dev/null
rg -n "loadTedWorkbench" ui/src/ui/app.ts ui/src/ui/app-settings.ts ui/src/ui/controllers/ted.ts >/dev/null
rg -n "\bted:\s*\"/ted\"" ui/src/ui/navigation.ts >/dev/null
rg -n "ted:\s*\"Ted\"" ui/src/i18n/locales/en.ts >/dev/null

echo "OK: Ted workbench dashboard wiring and SDD hooks detected"
