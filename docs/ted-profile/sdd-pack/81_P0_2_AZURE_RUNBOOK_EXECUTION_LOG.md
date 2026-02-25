# SDD 81: P0-2 Azure Runbook Execution Log

**Status:** Blocked on Operator Inputs
**Version:** v4
**Date:** 2026-02-25
**Source Plan:** SDD 78 Section 5, Wave B and Wave C
**Scope:** Execute P0-2/P0-4 runbook and capture blocker evidence

---

## 1. Runbook Start Status

P0-2 has been actively started in automation-prep mode.

Completed:

1. Added bootstrap utility for profile credential apply/check:
   - `scripts/ted-profile/p0-2-azure-bootstrap.mjs`
2. Defined deterministic env variable contract for operator-supplied values.
3. Prepared next-step sequence for device-code auth activation.

Blocked:

1. Real Azure tenant/app IDs are still required from operator.

---

## 2. Combined Execution Evidence (P0-2 then P0-4)

Executed command:

```bash
TED_START_SIDECAR=1 TED_GRAPH_PROFILE=olumie bash scripts/ted-profile/run_p0_2_p0_4.sh
```

Result snapshot:

1. P0-2 bootstrap check reports `olumie` and `everest` blocked due to missing/invalid GUIDs.
2. P0-4 smoke runner executed and returned:
   - `graph_status`: `PASS` (`200`)
   - `device_start`: `BLOCKED_CONFIG` (`400`)
   - `mail_list`: `BLOCKED_CONFIG` (`400`)
   - `calendar_list`: `BLOCKED_CONFIG` (`400`)
   - `planner_plans`: `BLOCKED_CONFIG` (`400`)
   - `todo_lists`: `BLOCKED_CONFIG` (`400`)
   - `sharepoint_sites`: `BLOCKED_AUTH` (`401`)
3. Summary: `pass=1 blocked=6 fail=0`

Council interpretation:

1. Runbook wiring is healthy and deterministic.
2. The blocker is external setup only: missing Azure tenant/client IDs and incomplete device auth.
3. P0-4 can move to full pass immediately after operator completes Section 3 input contract and device flow.

Runtime-only execution evidence (no config writes):

```bash
TED_GRAPH_PROFILE=olumie \
TED_OLUMIE_TENANT_ID="<guid>" \
TED_OLUMIE_CLIENT_ID="<guid>" \
TED_RUNTIME_SIDECAR_URL=http://127.0.0.1:48181 \
bash scripts/ted-profile/p0-2-runtime-prompt-smoke.sh
```

Observed:

1. P0-2 bootstrap reports `olumie: ready` from runtime env source.
2. Sidecar starts with runtime GUID overlay and `/graph/olumie/status` returns `200`.
3. No write to `graph.profiles.json` is required for this validation path.

---

## 3. Operator Input Contract

Set these environment variables before apply:

1. `TED_OLUMIE_TENANT_ID`
2. `TED_OLUMIE_CLIENT_ID`
3. `TED_EVEREST_TENANT_ID`
4. `TED_EVEREST_CLIENT_ID`

All values must be GUIDs.

---

## 4. Execution Commands

### 4.1 Check-only (safe, no writes)

```bash
node scripts/ted-profile/p0-2-azure-bootstrap.mjs
```

### 4.2 Apply with operator-provided values

```bash
TED_OLUMIE_TENANT_ID="<guid>" \
TED_OLUMIE_CLIENT_ID="<guid>" \
TED_EVEREST_TENANT_ID="<guid>" \
TED_EVEREST_CLIENT_ID="<guid>" \
node scripts/ted-profile/p0-2-azure-bootstrap.mjs --apply
```

### 4.3 Post-apply auth activation

1. Start sidecar.
2. `POST /graph/{profile}/auth/device/start`
3. Complete Microsoft device sign-in.
4. `POST /graph/{profile}/auth/device/poll`
5. `GET /graph/{profile}/status` and verify authenticated state.

### 4.4 Runtime prompt mode (no GUID persistence in repo files)

Use this when GUIDs must be typed after install and kept out of source-controlled config:

```bash
bash scripts/ted-profile/p0-2-runtime-prompt-smoke.sh
```

Notes:

1. Script prompts for profile tenant/client GUIDs (or consumes pre-set `TED_*` env vars).
2. Values are exported for process runtime only.
3. Sidecar uses runtime env overlay for `tenant_id`/`client_id`.
4. This validates P0-2/P0-4 wiring without committing GUIDs.

### 4.5 Install-time setup mode (persistent local runtime env, no repo writes)

The setup command now captures GUIDs at install time and stores them outside the repo:

```bash
bash scripts/ted-setup.sh
```

Output location:

1. `~/.openclaw/ted/graph-runtime.env` (or `${OPENCLAW_STATE_DIR}/ted/graph-runtime.env`)
2. File permissions: `600`
3. Sidecar restart prompt applies runtime credentials immediately.

---

## 5. Acceptance Criteria for P0-2 Completion

1. Active profile has valid GUID `tenant_id` and `client_id` via local config or runtime env overlay.
2. Device code auth completes for at least one profile.
3. `/graph/{profile}/status` reports authenticated state.
4. P0-4 smoke-test wave is unblocked.
