#!/usr/bin/env bash
set -euo pipefail

echo "JC-018 proof: discoverability surface and console visibility"
BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
CONFIG_PATH="${OPENCLAW_CONFIG_PATH:-$HOME/.openclaw/openclaw.json}"

curl -fsS "$BASE_URL/status" >/tmp/jc018_status.json

node - <<'NODE'
const fs = require('fs');
const payload = JSON.parse(fs.readFileSync('/tmp/jc018_status.json', 'utf8'));
if (!payload || typeof payload !== 'object') {
  throw new Error('status payload missing');
}
const catalog = payload.catalog;
if (!catalog || typeof catalog !== 'object') {
  throw new Error('catalog missing from status payload');
}
const commands = Array.isArray(catalog.commands) ? catalog.commands : [];
if (!commands.includes('/ted catalog')) {
  throw new Error('catalog command missing from discoverability payload');
}
if (catalog.non_health_auth_required !== true) {
  throw new Error('discoverability payload must assert non_health_auth_required=true');
}
NODE

NOAUTH_CODE="$(curl -sS -o /tmp/jc018_noauth.out -w "%{http_code}" \
  -X POST "$BASE_URL/governance/role-cards/validate" \
  -H "Content-Type: application/json" \
  -d '{}' || true)"
[ "$NOAUTH_CODE" = "401" ] || {
  echo "FAIL: non-health route auth boundary regressed (expected 401, got $NOAUTH_CODE)"
  cat /tmp/jc018_noauth.out
  exit 1
}

node - "$CONFIG_PATH" <<'NODE'
const fs = require('fs');
const configPath = process.argv[2];
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const authMode = config?.gateway?.auth?.mode;
const token = typeof config?.gateway?.auth?.token === 'string' ? config.gateway.auth.token.trim() : '';
const tedEnabled = config?.plugins?.entries?.['ted-sidecar']?.enabled === true;
if (authMode !== 'token' || token.length === 0) {
  throw new Error('gateway.auth token mode/token not configured');
}
if (!tedEnabled) {
  throw new Error('ted-sidecar plugin is not enabled in config');
}
NODE

rg -n "Usage: /ted doctor \| /ted status \| /ted catalog|action !== \"doctor\" && action !== \"status\" && action !== \"catalog\"" extensions/ted-sidecar/index.ts >/dev/null

echo "OK: discoverability surface verified and auth boundary preserved"
