#!/usr/bin/env bash
# ted-setup.sh — First-run setup for Ted OpenClaw
# Guides operator through configuration, authentication, and verification.
set -euo pipefail

SIDECAR_HOST="127.0.0.1"
SIDECAR_PORT="48080"
BASE_URL="http://${SIDECAR_HOST}:${SIDECAR_PORT}"
CONFIG_DIR="$(cd "$(dirname "$0")/../sidecars/ted-engine/config" && pwd)"
GRAPH_PROFILES="${CONFIG_DIR}/graph.profiles.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $1"; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Ted OpenClaw — First-Run Setup     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# ── Phase 0: Prerequisites ──
info "Phase 0: Checking prerequisites..."

if ! command -v node &>/dev/null; then
  fail "Node.js not found. Install Node.js >= 18 and try again."
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  fail "Node.js version is $NODE_VERSION. Need >= 18."
  exit 1
fi
ok "Node.js $(node -v)"

if ! command -v curl &>/dev/null; then
  fail "curl not found. Install curl and try again."
  exit 1
fi
ok "curl available"

if [ ! -f "$GRAPH_PROFILES" ]; then
  fail "Config file not found: $GRAPH_PROFILES"
  exit 1
fi
ok "Config directory found"

# ── Phase 1: Operator Identity ──
echo ""
info "Phase 1: Operator identity"

read -rp "Operator display name [Clint Phillips]: " OP_NAME
OP_NAME="${OP_NAME:-Clint Phillips}"

read -rp "Timezone [America/Indiana/Indianapolis]: " OP_TZ
OP_TZ="${OP_TZ:-America/Indiana/Indianapolis}"

ok "Operator: ${OP_NAME} (${OP_TZ})"

# ── Phase 2: Microsoft 365 Configuration ──
echo ""
info "Phase 2: Microsoft 365 configuration"
info "You need Azure AD app registration(s) with these permissions:"
info "  User.Read, offline_access, Mail.ReadWrite, Mail.Send,"
info "  Calendars.ReadWrite, Tasks.ReadWrite, Group.Read.All"
echo ""

is_valid_guid() {
  [[ "$1" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$ ]]
}

configure_profile() {
  local PROFILE_ID="$1"
  local DISPLAY_NAME="$2"
  echo ""
  info "Configuring profile: ${DISPLAY_NAME} (${PROFILE_ID})"

  # Check if already configured
  local EXISTING_TENANT
  EXISTING_TENANT=$(python3 -c "import json; d=json.load(open('${GRAPH_PROFILES}')); print(d['profiles']['${PROFILE_ID}'].get('tenant_id',''))" 2>/dev/null || echo "")
  if [ -n "$EXISTING_TENANT" ] && [ "$EXISTING_TENANT" != "" ]; then
    warn "Profile ${PROFILE_ID} already has tenant_id: ${EXISTING_TENANT}"
    read -rp "Reconfigure? [y/N]: " RECONFIG
    if [[ ! "$RECONFIG" =~ ^[Yy]$ ]]; then
      ok "Keeping existing ${PROFILE_ID} config"
      return 0
    fi
  fi

  local TENANT_ID=""
  while true; do
    read -rp "  Directory (Tenant) ID for ${DISPLAY_NAME}: " TENANT_ID
    if [ -z "$TENANT_ID" ]; then
      warn "Skipping ${PROFILE_ID} — you can configure it later"
      return 0
    fi
    if is_valid_guid "$TENANT_ID"; then break; fi
    fail "Invalid GUID format. Expected: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  done

  local CLIENT_ID=""
  while true; do
    read -rp "  Application (Client) ID for ${DISPLAY_NAME}: " CLIENT_ID
    if [ -z "$CLIENT_ID" ]; then
      warn "Skipping ${PROFILE_ID} — you can configure it later"
      return 0
    fi
    if is_valid_guid "$CLIENT_ID"; then break; fi
    fail "Invalid GUID format. Expected: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  done

  # Write to graph.profiles.json using python3
  python3 -c "
import json
with open('${GRAPH_PROFILES}', 'r') as f:
    data = json.load(f)
data['profiles']['${PROFILE_ID}']['tenant_id'] = '${TENANT_ID}'
data['profiles']['${PROFILE_ID}']['client_id'] = '${CLIENT_ID}'
with open('${GRAPH_PROFILES}', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
"
  ok "Wrote ${PROFILE_ID}: tenant=${TENANT_ID}, client=${CLIENT_ID}"
}

configure_profile "olumie" "Olumie Capital"
configure_profile "everest" "Everest Management Solutions"

# ── Phase 3: Start Sidecar ──
echo ""
info "Phase 3: Starting sidecar..."

# Check if already running
if curl -sf "${BASE_URL}/status" &>/dev/null; then
  ok "Sidecar already running at ${BASE_URL}"
else
  SIDECAR_DIR="$(cd "$(dirname "$0")/../sidecars/ted-engine" && pwd)"
  info "Starting: node ${SIDECAR_DIR}/server.mjs"
  cd "$SIDECAR_DIR"
  node server.mjs &
  SIDECAR_PID=$!
  echo "$SIDECAR_PID" > /tmp/ted-sidecar.pid

  # Poll for health
  RETRIES=0
  while [ $RETRIES -lt 15 ]; do
    if curl -sf "${BASE_URL}/status" &>/dev/null; then
      ok "Sidecar started (PID ${SIDECAR_PID})"
      break
    fi
    sleep 1
    RETRIES=$((RETRIES + 1))
  done

  if [ $RETRIES -ge 15 ]; then
    fail "Sidecar failed to start within 15 seconds"
    exit 1
  fi
fi

# ── Phase 4: Device Code Authentication ──
echo ""
info "Phase 4: Microsoft 365 authentication"

authenticate_profile() {
  local PROFILE_ID="$1"
  local DISPLAY_NAME="$2"

  echo ""
  info "Authenticating: ${DISPLAY_NAME} (${PROFILE_ID})"

  # Check if already authenticated
  local STATUS
  STATUS=$(curl -sf "${BASE_URL}/graph/${PROFILE_ID}/status" 2>/dev/null || echo '{}')
  local AUTH_STATE
  AUTH_STATE=$(echo "$STATUS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('auth_state','UNKNOWN'))" 2>/dev/null || echo "UNKNOWN")

  if [ "$AUTH_STATE" = "CONNECTED" ]; then
    ok "${DISPLAY_NAME} already authenticated"
    return 0
  fi

  # Start device code flow
  local START_RESP
  START_RESP=$(curl -sf -X POST "${BASE_URL}/graph/${PROFILE_ID}/auth/device/start" \
    -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo '{}')

  local USER_CODE
  USER_CODE=$(echo "$START_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('user_code',''))" 2>/dev/null || echo "")
  local VERIFICATION_URI
  VERIFICATION_URI=$(echo "$START_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('verification_uri',''))" 2>/dev/null || echo "")
  local DEVICE_CODE
  DEVICE_CODE=$(echo "$START_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('device_code',''))" 2>/dev/null || echo "")

  if [ -z "$USER_CODE" ] || [ -z "$DEVICE_CODE" ]; then
    warn "Could not start device code flow for ${PROFILE_ID}. Check credentials."
    return 0
  fi

  echo ""
  echo -e "  ${YELLOW}═══════════════════════════════════════════${NC}"
  echo -e "  ${YELLOW}  Open:  ${VERIFICATION_URI}${NC}"
  echo -e "  ${YELLOW}  Code:  ${USER_CODE}${NC}"
  echo -e "  ${YELLOW}═══════════════════════════════════════════${NC}"
  echo ""

  read -rp "  Press Enter after completing authentication (or 's' to skip): " SKIP
  if [[ "$SKIP" =~ ^[Ss]$ ]]; then
    warn "Skipped ${PROFILE_ID} authentication"
    return 0
  fi

  # Poll for completion
  local POLL_RESP
  POLL_RESP=$(curl -sf -X POST "${BASE_URL}/graph/${PROFILE_ID}/auth/device/poll" \
    -H "Content-Type: application/json" \
    -d "{\"device_code\": \"${DEVICE_CODE}\"}" 2>/dev/null || echo '{}')

  local STORED
  STORED=$(echo "$POLL_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('stored', False))" 2>/dev/null || echo "False")

  if [ "$STORED" = "True" ]; then
    ok "${DISPLAY_NAME} authenticated successfully"
  else
    warn "${DISPLAY_NAME} auth may still be pending. You can re-run this step later."
  fi
}

authenticate_profile "olumie" "Olumie Capital"
authenticate_profile "everest" "Everest Management Solutions"

# ── Phase 5: Activate Onboarding ──
echo ""
info "Phase 5: Activating onboarding..."

TODAY=$(date +%Y-%m-%d)
ONBOARD_RESP=$(curl -sf -X POST "${BASE_URL}/ops/onboarding/activate" \
  -H "Content-Type: application/json" \
  -d "{\"start_date\": \"${TODAY}\"}" 2>/dev/null || echo '{}')
ONBOARD_STATUS=$(echo "$ONBOARD_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status', d.get('error', 'unknown')))" 2>/dev/null || echo "unknown")

if [ "$ONBOARD_STATUS" = "activated" ]; then
  ok "Onboarding activated (start_date: ${TODAY})"
elif [ "$ONBOARD_STATUS" = "already_activated" ]; then
  ok "Onboarding already active"
else
  warn "Onboarding activation returned: ${ONBOARD_STATUS}"
fi

# ── Phase 6: Enable Scheduler (optional) ──
echo ""
info "Phase 6: Scheduler"
info "Ted can automatically generate morning briefs and EOD digests."
read -rp "Enable scheduler? [y/N]: " ENABLE_SCHED

if [[ "$ENABLE_SCHED" =~ ^[Yy]$ ]]; then
  SCHED_RESP=$(curl -sf -X POST "${BASE_URL}/ops/scheduler" \
    -H "Content-Type: application/json" \
    -d '{"enabled": true}' 2>/dev/null || echo '{}')
  ok "Scheduler enabled"
else
  info "Scheduler not enabled. You can enable it later via POST /ops/scheduler"
fi

# ── Phase 7: Verification ──
echo ""
info "Phase 7: Verification..."

FINAL_STATUS=$(curl -sf "${BASE_URL}/status" 2>/dev/null || echo '{}')
UPTIME=$(echo "$FINAL_STATUS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('uptime_seconds', 'unknown'))" 2>/dev/null || echo "unknown")
ok "Sidecar running (uptime: ${UPTIME}s)"

VALIDATE_RESP=$(curl -sf "${BASE_URL}/ops/setup/validate" 2>/dev/null || echo '{}')
BLOCKING=$(echo "$VALIDATE_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('blocking_issues',[])))" 2>/dev/null || echo "?")

if [ "$BLOCKING" = "0" ]; then
  ok "No blocking issues detected"
else
  warn "${BLOCKING} blocking issue(s) found — see GET /ops/setup/validate for details"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Setup complete!                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
info "Next steps:"
info "  1. Open OpenClaw and connect to Ted"
info "  2. Check GET ${BASE_URL}/reporting/morning-brief for your first brief"
info "  3. Try: curl ${BASE_URL}/status"
echo ""
