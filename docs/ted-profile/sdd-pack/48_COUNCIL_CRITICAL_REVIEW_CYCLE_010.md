# Council Critical Review — Cycle 010: Deep Alignment Audit

**Filed:** 2026-02-23
**Status:** FINDINGS COMPLETE — Remediation In Progress
**Scope:** Full-stack deep review: sidecar, extension, UI, architecture alignment, cross-cutting concerns
**Auditors:** 5 parallel council agents (sidecar, extension, UI, architecture, cross-cutting)

---

## Executive Summary

Five parallel auditors performed code-level inspection across all layers. The architecture remains A+ and governance framework is solid, but the Cycle 009 rapid-build left behind concurrency gaps, inconsistent pattern adoption, and several logic errors.

| Category | Findings                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRITICAL | 3 — predictable token generation, no mutex on ingestion/discovery                                                                                         |
| HIGH     | 7 — graphFetchWithRetry bug, mcpCallInternal no status check, scheduler reentrancy, double-fire on body parse, UI sync reject state dead, cache unbounded |
| MEDIUM   | 14 — missing approval headers, data ordering bugs, config drift, missing execution boundary                                                               |
| LOW      | 12 — dead code, minor UX, doc drift                                                                                                                       |

---

## CRITICAL Findings

### C10-001: `mintBearerToken()` uses `Math.random()` — Predictable Token

- **Location:** server.mjs:902
- **Impact:** Token consists of timestamp + 8 chars of non-crypto randomness. Local process could brute-force.
- **Fix:** Replace `Math.random()` with `crypto.randomBytes(16).toString("hex")`

### C10-002: No mutex on `runInboxIngestionCycle()`

- **Location:** server.mjs — called from schedulerTick() AND POST /ops/ingestion/run
- **Impact:** Concurrent runs read same ingestedIds, create duplicate triage items
- **Fix:** Add `_ingestionRunning` boolean guard, return early if set

### C10-003: No mutex on `runDiscoveryPipeline()`

- **Location:** server.mjs — called from POST /ops/onboarding/discover
- **Impact:** Concurrent discovery runs create duplicate records
- **Fix:** Add `_discoveryRunning` boolean guard

---

## HIGH Findings

### C10-004: `lastResp` never assigned in `graphFetchWithRetry()`

- **Location:** server.mjs:4374
- **Impact:** If final retry gets 429/5xx, response is lost, throws instead of returning
- **Fix:** Assign `lastResp = resp` before retry checks

### C10-005: `mcpCallInternal()` doesn't check `response.ok`

- **Location:** server.mjs:8936
- **Impact:** Scheduler dispatch logs success even when loopback route returns 4xx/5xx
- **Fix:** Check `response.ok`, throw on failure

### C10-006: `schedulerTick()` has no reentrancy guard + shutdown doesn't clearInterval

- **Location:** server.mjs:9966, 11186
- **Impact:** Overlapping ticks cause duplicate job execution; shutdown may truncate JSONL
- **Fix:** Add `_tickRunning` flag, add `clearInterval(schedulerInterval)` in shutdown

### C10-007: `meetingPrepGenerate` uses `|| {}` after `readJsonBodyGuarded` — double-fire

- **Location:** server.mjs:6880 (also timeblockGenerate)
- **Impact:** If body parse fails (400 already sent), function continues executing, writes audit/events for failed request
- **Fix:** Change to `if (!body) return;`

### C10-008: `syncRejectBusy`/`syncRejectError` state not wired to UI view

- **Location:** app-view-state.ts:372-373 → NOT passed in app-render.ts → NOT in TedViewProps
- **Impact:** Sync rejection failures invisible to operator, reject button has no busy state
- **Fix:** Wire through app-render.ts to views/ted.ts

### C10-009: `upnToUserIdCache` grows without bounds

- **Location:** server.mjs:710
- **Impact:** Memory leak proportional to unique UPNs in long-running server
- **Fix:** Add TTL or LRU cap

### C10-010: `schedulerTick()` fire-and-forget from setInterval

- **Location:** server.mjs:10173
- **Impact:** Unhandled rejection from corrupt config permanently kills scheduler
- **Fix:** Wrap callback with `.catch()`, add top-level try/catch

---

## MEDIUM Findings

### C10-011: 4 agent tools missing `x-ted-approval-source: operator` header

- `ted_improvement_review` (index.ts:7664)
- `ted_improvement_apply` (index.ts:7731)
- `ted_mail_move` (index.ts:5778)
- `ted_calendar_create` (index.ts:5874)

### C10-012: Facility alerts recommendation added AFTER headline computed

- **Location:** server.mjs — morning brief, line 6212 (after line 6064)
- **Fix:** Move facility alert push before headline computation

### C10-013: EOD digest commitment/action stats computed AFTER LLM call

- **Location:** server.mjs — EOD digest, lines 6435-6447 (after LLM at 6387)
- **Fix:** Move stat reads before LLM call, include in digestData

### C10-014: `readTriageLines()` called inside ingestion inner loop — O(n\*m) file reads

- **Location:** server.mjs:4826
- **Fix:** Read once before profile loop, maintain in-memory state

### C10-015: 4 new routes missing execution boundary policy

- `/ops/ingestion/run`, `/ops/ingestion/status`, `/ops/onboarding/discover`, `/ops/onboarding/discovery-status`

### C10-016: Missing `appendEvent()` in ingestion loop (dual-write violation)

- Ingestion creates triage items but no event logged

### C10-017: Policy snapshot uses wrong property names

- `banned_phrases` should be `hard_ban_strings` (server.mjs:170)
- `current_level`/`level` should be `default_mode` (server.mjs:171)

### C10-018: Stale `syncApproveResult` lingers after reject

- **Fix:** Clear in `rejectTedSyncProposal` and `loadTedSyncProposals`

### C10-019: `recommendationError` never displayed in Pending Decisions card

- **Location:** views/ted.ts:3318-3372
- **Fix:** Add error display div

### C10-020: Quiet hours uses server-local time, not operator timezone

- **Location:** server.mjs:4100-4102
- **Fix:** Use `Intl.DateTimeFormat` with operator timezone

### C10-021: `meetingUpcoming` always returns hardcoded sample data

- **Location:** server.mjs:6836-6876
- **Fix:** Port Graph calendar fetch from morning brief

### C10-022: Double triage file read in EOD digest

- **Location:** server.mjs:6277 + 6300
- **Fix:** Reuse first read

### C10-023: Missing gateway methods for 14+ sidecar routes

- Most impactful: `/graph/{profile}/calendar/list`, `/drafts/{id}/archive`, `/ops/scheduler`, `/ops/pending-deliveries`

### C10-024: Dead `typeof ensureValidToken === "function"` guards (3 locations)

- **Location:** server.mjs:717, 6765, 8371

---

## LOW Findings

- C10-030: HTML body stripping regex naive (server.mjs:4725)
- C10-031: Calendar UTC midnight vs operator local time (server.mjs:6109)
- C10-032: `cronMatchesNow` doesn't support comma/step syntax (server.mjs:9908)
- C10-033: `logStream` never closed for rotation
- C10-034: `uncaughtException` handler does not call `process.exit(1)`
- C10-035: Optional props in TedViewProps reduce type safety
- C10-036: Dead `createValidationError` variable in views/ted.ts:565
- C10-037: `prompt()` used for deep work session and graph sync input
- C10-038: Inconsistent nullability (`string | null` vs `string`) across state fields
- C10-039: POST error extraction in extension omits `payload?.error` field
- C10-040: `readJsonlLines` silently drops corrupt lines without logging
- C10-041: 60+ silently swallowed catch blocks in server.mjs

---

## Remediation Priority

### Wave 1 — CRITICAL + HIGH (fix immediately)

C10-001, C10-002, C10-003, C10-004, C10-005, C10-006, C10-007, C10-008, C10-009, C10-010

### Wave 2 — MEDIUM (fix in session)

C10-011 through C10-024

### Wave 3 — LOW (backlog)

C10-030 through C10-041

---

_Filed by the Council. Cycle 010 deep alignment audit._
