# Council Critical Review — Cycle 011: Final QA Gate

**Filed:** 2026-02-24
**Status:** ALL FINDINGS RESOLVED — 24/24 fixes applied
**Scope:** Full-stack deep review + behavioral HTTP testing (107 tests)
**Auditors:** 5 parallel council agents (behavioral QA, sidecar code, extension code, UI code, architecture)

---

## Executive Summary

Five parallel auditors performed the deepest review yet — including 107 behavioral HTTP tests against the live sidecar. Extension layer passed clean (0 bugs). UI layer has minor UX gaps. Sidecar has 2 CRITICAL logic bugs that were introduced during Cycle 009-010 rapid builds.

| Category   | Findings                                                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRITICAL   | 2 — inbox ingestion crash (triageState.classified), HIPAA bypass on default-provider fallback                                                                                     |
| HIGH       | 3 — missing normalizeRoutePolicyKey entries, cron DOW=7 Sunday, req.destroy before sendJson                                                                                       |
| MEDIUM     | 9 — body guard gaps, missing audit writes, log rotation race, TZ offset fragile, exec boundary gaps, event schema drift, UI success feedback (x2), dead onExtractCommitments prop |
| LOW        | 10 — setup validate stale, double log, fromCharCode, map growth, MCP slug, dead props, 0-min edge, getElementById, doc counts, learningLedger dead                                |
| BEHAVIORAL | 106/107 PASS (99.1%) — 1 fail: oversized body handler                                                                                                                             |

---

## CRITICAL Findings

### C11-001: `triageState.classified` does not exist — crashes inbox ingestion

- **Location:** server.mjs — `_runInboxIngestionCycleInner()`, ingestion dedup check
- **Root cause:** `triageStateFromLines()` returns `{ all, open }`. Code references `triageState.classified` which is `undefined`. Calling `.has()` on undefined throws TypeError.
- **Impact:** Every ingestion cycle crashes silently. Scheduled inbox ingestion is non-functional.
- **Fix:** Change `triageState.classified.has(itemId)` to `triageState.all.has(itemId)`

### C11-002: HIPAA bypass on default-provider fallback path

- **Location:** server.mjs — `selectLlmProvider()`, HIPAA check on default fallback
- **Root cause:** Entity override lookup at line ~3588 was fixed to be case-insensitive, but the HIPAA check at line ~3623 on the default-provider fallback still uses raw `entityContext` as property key. If config key is `"everest"` but context is `"Everest"`, the HIPAA check is skipped.
- **Impact:** HIPAA-required entity data routed to non-HIPAA provider when casing differs.
- **Fix:** Use `entityKey` (the case-insensitive lookup result) instead of `entityContext` for the HIPAA check

---

## HIGH Findings

### C11-003: Missing `normalizeRoutePolicyKey` entries

- **Location:** server.mjs — normalizeRoutePolicyKey regex table
- **Routes affected:** `/drafts/{draft_id}/submit-review`, `/graph/{profile_id}/sync/status`
- **Impact:** Execution boundary policy never enforced on these routes (dynamic segments don't match template keys)
- **Fix:** Add regex entries for both route patterns

### C11-004: `cronFieldMatches` does not handle DOW value `7` as Sunday alias

- **Location:** server.mjs — cronMatchesNow()
- **Impact:** Cron jobs with `7` for Sunday never fire. Standard cron accepts both 0 and 7 for Sunday.
- **Fix:** Normalize DOW field: replace `7` with `0` before matching

### C11-005: `req.destroy()` before `sendJson()` in oversized body handler

- **Location:** server.mjs — content-length body size guard
- **Impact:** Client receives connection reset instead of proper 413 JSON response
- **Fix:** Move `req.destroy()` after `sendJson()`, or remove it (response ends connection)

---

## MEDIUM Findings

### C11-006: ~44 callers of `readJsonBodyGuarded` missing `if (!body) return;`

- **Location:** server.mjs — throughout
- **Impact:** Unnecessary processing after 400/413 already sent. Not a crash (writableEnded guard), but wasted work and misleading double-logs.
- **Fix:** Add `if (!body) return;` after every `readJsonBodyGuarded` call

### C11-007: `reconcile()`, `syncApprove()`, `syncReject()` missing `appendAudit()`

- **Location:** server.mjs — sync operation handlers
- **Impact:** Sync operations invisible in audit trail
- **Fix:** Add appendAudit() calls to all three functions

### C11-008: `rotateLogIfNeeded()` race condition at midnight

- **Location:** server.mjs — log rotation function
- **Impact:** Two concurrent requests at midnight could both try to end() the stream
- **Fix:** Add `_rotateInProgress` boolean guard

### C11-009: Morning brief timezone offset assumes whole hours

- **Location:** server.mjs — todayStart/todayEnd calculation
- **Impact:** Wrong date boundaries for half-hour TZs (Asia/Kolkata +5:30, etc.)
- **Fix:** Use formatToParts() to get both hour and minute for offset calculation

### C11-010: 37 routes missing from `executionBoundaryPolicy`

- **Location:** server.mjs — executionBoundaryPolicy Map
- **Impact:** Execution mode control not enforced (auth still works as primary gate)
- **Fix:** Add all 37 routes with appropriate policy levels

### C11-011: 31 event types used in code but not in `event_schema.json`

- **Location:** config/event_schema.json
- **Impact:** Schema documentation stale, not runtime-enforced
- **Fix:** Add missing event type definitions

### C11-012: No success feedback after deep work session log (UI)

- **Location:** views/ted.ts — deep work card
- **Impact:** Operator gets no confirmation after logging session
- **Fix:** Render `tedDeepWorkSessionResult` in the template

### C11-013: No success feedback after sync proposal rejection (UI)

- **Location:** views/ted.ts — sync card
- **Impact:** Asymmetric UX (approve shows result, reject doesn't)
- **Fix:** Add result display after rejection

### C11-014: `onExtractCommitments` declared but never callable from UI

- **Location:** views/ted.ts — TedViewProps
- **Impact:** Dead prop code. Extraction only via agent tools.
- **Fix:** Either add "Extract" button in mail card or remove dead prop

---

## LOW Findings

- C11-020: `setupValidateEndpoint` reports scheduler as "not_implemented_yet" (stale)
- C11-021: `draftQueueEdit` sends double 400 log on null body
- C11-022: `stripHtml` uses `String.fromCharCode` instead of `fromCodePoint` (emoji edge case)
- C11-023: `mintedBearerTokens` Map unbounded growth potential
- C11-024: MCP `ted_deal_detail` tool skips `isSlugSafe` validation
- C11-025: Dead props `onTedDeepWorkSession`/`onTedGraphSyncStatus` in TedViewProps
- C11-026: Deep work "Start" button enabled for "0" minutes
- C11-027: `document.getElementById` in improvement form (fragile)
- C11-028: Doc counts stale (line counts, tool counts, gateway counts, ledger counts)
- C11-029: `learningLedgerPath` declared but never written to

---

## Behavioral Test Results

| Category        | Tests   | Pass    | Fail  |
| --------------- | ------- | ------- | ----- |
| Health + Status | 5       | 5       | 0     |
| Auth            | 8       | 8       | 0     |
| Config GETs     | 17      | 17      | 0     |
| CRUD            | 11      | 11      | 0     |
| Governance      | 10      | 10      | 0     |
| Policy/Ops      | 8       | 8       | 0     |
| Triage + Filing | 5       | 5       | 0     |
| Learning        | 3       | 3       | 0     |
| LLM Routes      | 5       | 5       | 0     |
| Graph Routes    | 10      | 10      | 0     |
| Scheduler       | 4       | 4       | 0     |
| MCP             | 4       | 4       | 0     |
| Additional      | 5       | 5       | 0     |
| Edge Cases      | 12      | 11      | 1     |
| **Total**       | **107** | **106** | **1** |

---

## Remediation Priority

### Wave 1 — CRITICAL + HIGH (fix immediately)

C11-001, C11-002, C11-003, C11-004, C11-005

### Wave 2 — MEDIUM (fix in session)

C11-006 through C11-014

### Wave 3 — LOW (fix in session)

C11-020 through C11-029

---

_Filed by the Council. Cycle 011 final QA gate._
