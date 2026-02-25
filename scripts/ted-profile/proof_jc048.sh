#!/usr/bin/env bash
set -euo pipefail
rg -n "ted\.integrations\.graph\.auth\.start|ted\.integrations\.graph\.auth\.poll|ted\.integrations\.graph\.auth\.revoke" extensions/ted-sidecar/index.ts >/dev/null
rg -n "Start sign-in|Check sign-in|Revoke" ui/src/ui/views/ted.ts >/dev/null
rg -n "startTedConnectorAuth|pollTedConnectorAuth|revokeTedConnectorAuth" ui/src/ui/controllers/ted.ts ui/src/ui/app.ts ui/src/ui/app-render.ts >/dev/null
echo "JC-048 proof placeholder: connector auth controls wired in sidecar + Ted UI"
