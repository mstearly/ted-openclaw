# Council Cycle 010 — Resolution Tracking

**Filed:** 2026-02-24
**Status:** ALL 36 FINDINGS RESOLVED
**Scope:** All 36 findings from `48_COUNCIL_CRITICAL_REVIEW_CYCLE_010.md`

---

## Resolution Summary

| Severity  | Total  | Resolved (Prior) | Resolved (This Session) | Status           |
| --------- | ------ | ---------------- | ----------------------- | ---------------- |
| CRITICAL  | 3      | 3                | 0                       | COMPLETE         |
| HIGH      | 7      | 7                | 0                       | COMPLETE         |
| MEDIUM    | 14     | 10               | 4                       | COMPLETE         |
| LOW       | 12     | 0                | 12                      | COMPLETE         |
| **Total** | **36** | **20**           | **16**                  | **ALL RESOLVED** |

---

## Previously Resolved (20 findings)

### CRITICAL — All 3 Complete

- [x] **C10-001:** `mintBearerToken()` — `crypto.randomBytes(12)` replaces `Math.random()`
- [x] **C10-002:** `_ingestionRunning` mutex on `runInboxIngestionCycle()`
- [x] **C10-003:** `_discoveryRunning` mutex on `runDiscoveryPipeline()`

### HIGH — All 7 Complete

- [x] **C10-004:** `lastResp = resp` in `graphFetchWithRetry()`
- [x] **C10-005:** `mcpCallInternal()` checks `response.ok`
- [x] **C10-006:** `_tickRunning` reentrancy guard + `clearInterval` in shutdown
- [x] **C10-007:** `readJsonBodyGuarded || {}` → `if (!body) return;`
- [x] **C10-008:** `syncRejectBusy`/`syncRejectError` wired through UI
- [x] **C10-009:** `resolveUpnToUserId` uses `graphFetchWithRetry`, dead typeof removed
- [x] **C10-010:** schedulerTick wrapped with catch + event logging

### MEDIUM — 10 of 14 Complete

- [x] **C10-011:** 4 agent tools got `x-ted-approval-source: operator` header
- [x] **C10-012:** Facility alerts moved before headline computation
- [x] **C10-014:** Triage read moved outside inner loop (O(n\*m) → O(n+m))
- [x] **C10-015:** 4 new routes added to `executionBoundaryPolicy`
- [x] **C10-016:** `appendEvent("triage.ingested")` added in ingestion loop
- [x] **C10-017:** Policy snapshot properties fixed (`hard_ban_strings`, `default_mode`)
- [x] **C10-018:** `syncApproveResult` cleared on reject/reload/reconcile
- [x] **C10-019:** `recommendationError` displayed in Pending Decisions card
- [x] **C10-022:** EOD digest double triage read eliminated
- [x] **C10-024:** Dead `typeof ensureValidToken` guards removed (3 locations)

---

## Remaining — 16 Findings to Resolve

### MEDIUM — All 4 Resolved

- [x] **C10-013:** EOD digest stats moved BEFORE LLM call — `commitmentsCompletedToday`, `actionsCompletedToday`, `waitingForReceivedToday`, `meetingsDebriefed` now included in `digestData`
- [x] **C10-020:** Quiet hours reads `operator_profile.json` timezone, uses `Intl.DateTimeFormat` for correct local hour
- [x] **C10-021:** `meetingUpcoming` now calls `fetchCalendarEventsInternal()` per profile (next 4hr window), hardcoded data retained as fallback only
- [x] **C10-023:** 34 missing gateway methods added to `index.ts` — total gateway count 94 → 128. Covers calendar, drafts, deals, ops, scheduler, pending deliveries, pause/resume, triage, filing, learning, governance, diagnostics

### LOW — All 12 Resolved

- [x] **C10-030:** `stripHtml()` helper — removes script/style/head blocks, converts block tags to newlines, decodes 7 HTML entity types including `&#NNN;`/`&#xHH;`, collapses whitespace. 3 callsites updated.
- [x] **C10-031:** Morning brief + EOD digest compute date boundaries using `Intl.DateTimeFormat('en-CA', { timeZone })` for operator-local midnight
- [x] **C10-032:** `cronFieldMatches(field, value)` helper — supports `*`, exact, comma, range, step, combined range+step. All 5 cron fields use it.
- [x] **C10-033:** `rotateLogIfNeeded()` called on every `logLine()` — checks date, closes/renames old stream, opens new one
- [x] **C10-034:** `process.on('uncaughtException')` now calls `setTimeout(() => process.exit(1), 200)` after logging
- [x] **C10-035:** 56 TedViewProps changed from optional `?` to required — all confirmed always-passed in `app-render.ts`
- [x] **C10-036:** Dead `createValidationError` variable removed from views/ted.ts
- [x] **C10-037:** `prompt()` replaced with inline forms — deep work session (minutes+label inputs) and graph sync (profile dropdown). 5 new state fields, 10 new props wired through.
- [x] **C10-038:** 13 error/result fields standardized from `string` (init `""`) to `string | null` (init `null`) across 4 files
- [x] **C10-039:** `callAuthenticatedTedRoute` and `callAuthenticatedTedGetRoute` now prefer `payload?.error` → `payload?.message` → governance fields → status fallback
- [x] **C10-040:** `readJsonlLines()` logs `JSONL_PARSE_WARNING` with file path and 100-char line preview on corrupt lines
- [x] **C10-041:** 36 critical catch blocks received `logLine()` logging (Graph API, scheduler, data writes, file reads, auth). 13 intentional no-ops received `/* intentional: ... */` comments.

---

## Verification Results

```
✅ node --check sidecars/ted-engine/server.mjs — PASS
✅ npx tsc --noEmit — PASS (0 errors)
```

## Execution Summary

| Agent     | Files                                                                                | Findings Resolved                                                                             |
| --------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Sidecar   | `server.mjs`                                                                         | C10-013, C10-020, C10-021, C10-030, C10-031, C10-032, C10-033, C10-034, C10-040, C10-041 (10) |
| Extension | `index.ts`                                                                           | C10-023 (+34 gateway methods), C10-039 (2)                                                    |
| UI        | `views/ted.ts`, `controllers/ted.ts`, `app-view-state.ts`, `app.ts`, `app-render.ts` | C10-035, C10-036, C10-037, C10-038 (4)                                                        |

---

_Filed by the Council. Cycle 010 — ALL 36 FINDINGS RESOLVED._
