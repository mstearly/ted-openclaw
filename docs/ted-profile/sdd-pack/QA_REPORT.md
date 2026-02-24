# Ted Operations Console — Comprehensive QA Report

**Date:** 2026-02-22
**Scope:** Full stack audit — Sidecar (`server.mjs`), Extension (`index.ts`), UI (`views/ted.ts`, `controllers/ted.ts`, `app.ts`, `app-render.ts`, `app-view-state.ts`, `types.ts`)
**Auditors:** 4 parallel councilor agents (Sidecar, Extension, UI Views, State Wiring)
**Verdict:** RED — 1 CRITICAL security bug, 8 HIGH defects (2 are root-cause data bugs), 12 MEDIUM, 12 LOW

---

## Executive Summary

The Ted Operations Console has solid architectural foundations — the 4-layer state wiring chain (controller → app.ts → app-render → view) is verified clean with all 50+ fields wired correctly. All 22 controller functions and 24 gateway methods are implemented. However, two HIGH-severity regex bugs in the extension silently break KPI extraction and proof script validation, explaining the operator's report of empty KPIs and "No proof script linked" messages. A CRITICAL information disclosure bug leaks server filesystem paths to the browser.

---

## Findings by Severity

### CRITICAL (1)

| ID          | Layer     | What                                                                                              | Location             | Impact                                                                         |
| ----------- | --------- | ------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| **C-EXT-1** | Extension | `fullPath` (absolute server path) leaked to UI via `...record` spread in job card detail response | `index.ts:2420-2430` | Information disclosure — browser learns `/home/mattstearly/GitRepos/...` paths |

**Fix:** Destructure explicitly, exclude `fullPath` and `contents` from the spread.

---

### HIGH (8)

| ID           | Layer     | What                                                                                                           | Location                     | Impact                                                                                                             |
| ------------ | --------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **H-EXT-1**  | Extension | `\Z` is not valid JavaScript regex — `extractSection()` returns empty for last section in any markdown file    | `index.ts:1342,1478`         | **ROOT CAUSE: KPIs empty when `## Friction KPI Evidence` is last section; policy config section extraction fails** |
| **H-EXT-2**  | Extension | Proof script allowlist `proof_jc\d+.sh` rejects `proof_jc011_mac_preflight.sh`, `proof_deal_workflow.sh`, etc. | `index.ts:275`               | "No proof script linked" for valid scripts; "Run proof" blocked with allowlist error                               |
| **H-SRV-1**  | Sidecar   | Deal timeline reads from nonexistent `audit.jsonl` instead of triage ledger                                    | `server.mjs:2690-2691`       | Timeline always returns empty array                                                                                |
| **H-SRV-2**  | Sidecar   | `readJsonBody` has no request body size limit                                                                  | `server.mjs:3254-3264`       | OOM possible via oversized POST body                                                                               |
| **H-VIEW-1** | UI View   | Morning Brief `deals_summary` and `recent_activity` arrays never rendered                                      | `views/ted.ts:598-643`       | Operator sees aggregate numbers but no deal or activity details                                                    |
| **H-VIEW-2** | UI View   | `onUpdateDeal` prop exists but never called; deal detail is read-only                                          | `views/ted.ts:143,1400-1533` | No way to update deal stage/status/tasks from UI                                                                   |
| **H-VIEW-3** | UI View   | Pending Decisions approval queue has no action buttons                                                         | `views/ted.ts:2038-2073`     | Operator sees pending items but cannot approve/dismiss                                                             |
| **H-WIRE-1** | Wiring    | `updateTedDeal` does not reload deal detail/list after successful update                                       | `controllers/ted.ts:708`     | Stale data shown after deal update                                                                                 |

---

### MEDIUM (12)

| ID           | Layer     | What                                                                        | Location                 |
| ------------ | --------- | --------------------------------------------------------------------------- | ------------------------ |
| **M-EXT-1**  | Extension | No kill timer on proof script `spawn("bash", ...)` execution                | `index.ts:749`           |
| **M-EXT-2**  | Extension | `/deals/{deal_id}/timeline` sidecar endpoint has no gateway method          | (missing registration)   |
| **M-EXT-3**  | Extension | 9 triage/filing sidecar endpoints have no gateway methods                   | (missing registrations)  |
| **M-EXT-4**  | Extension | Deal CRUD methods pass untrusted input fields to sidecar without validation | `index.ts:3434-3893`     |
| **M-EXT-5**  | Extension | Auth token cache has TOCTOU race for concurrent mint requests               | `index.ts:274,1860`      |
| **M-SRV-1**  | Sidecar   | Bearer token uses `Math.random()` not crypto                                | `server.mjs:524-525`     |
| **M-SRV-2**  | Sidecar   | Default operator key is well-known `ted-local-operator`                     | `server.mjs:55`          |
| **M-SRV-3**  | Sidecar   | Empty POST body returns `{}` not `null`                                     | `server.mjs:3260-3262`   |
| **M-SRV-4**  | Sidecar   | TOCTOU race on deal file read-modify-write                                  | `server.mjs:2053-2058`   |
| **M-SRV-5**  | Sidecar   | Idempotency key changes HTTP status from 201 to 200                         | `server.mjs:1799-2103`   |
| **M-VIEW-1** | UI View   | EOD Digest `unresolved.items` sub-array not displayed                       | `views/ted.ts:714-722`   |
| **M-VIEW-2** | UI View   | Job cards hard-capped at 12 with no overflow indicator                      | `views/ted.ts:1549`      |
| **M-VIEW-3** | UI View   | Promotion confidence dropdown change not auto-saved, no unsaved indicator   | `views/ted.ts:1716-1736` |
| **M-VIEW-4** | UI View   | Deal "Back" button makes network call instead of clearing cached detail     | `views/ted.ts:1404-1407` |
| **M-VIEW-5** | UI View   | `tedDealAction*` props declared but never rendered in template              | `views/ted.ts:138-140`   |
| **M-VIEW-6** | UI View   | `<select>` elements use `.value` without `?selected` — unreliable in Lit    | `views/ted.ts:1086-1116` |

---

### LOW (12)

| ID           | Layer     | What                                                               | Location                 |
| ------------ | --------- | ------------------------------------------------------------------ | ------------------------ |
| **L-SRV-1**  | Sidecar   | `createDeal` returns 200 instead of 201                            | `server.mjs:2102`        |
| **L-SRV-2**  | Sidecar   | Double triage ledger read in EOD digest                            | `server.mjs:4215-4238`   |
| **L-SRV-3**  | Sidecar   | Single-deal GET returns raw JSON without normalization             | `server.mjs:2174-2194`   |
| **L-SRV-4**  | Sidecar   | Mail folder param not validated against allowlist                  | `server.mjs:3496-3504`   |
| **L-SRV-5**  | Sidecar   | `/status` and `/doctor` are identical                              | `server.mjs:4613`        |
| **L-EXT-1**  | Extension | Sidecar responses passed to UI without runtime shape validation    | `index.ts:1891-1945`     |
| **L-EXT-2**  | Extension | Unused `jobCardFiles` variable                                     | `index.ts:1498`          |
| **L-VIEW-1** | UI View   | "No proof check linked yet" shows on all cards without scripts     | `views/ted.ts:1577`      |
| **L-VIEW-2** | UI View   | Intake first example button has hardcoded `active` class           | `views/ted.ts:1859`      |
| **L-VIEW-3** | UI View   | Deal pipeline stage color makes all non-closed deals look alarming | `views/ted.ts:1382`      |
| **L-VIEW-4** | UI View   | Recommendations list has no empty-state message                    | `views/ted.ts:1268-1311` |
| **L-VIEW-5** | UI View   | No collapse/expand for sections in "all" tab view                  | `views/ted.ts:386-390`   |

---

## State Wiring Audit — PASS

| Category                              | Status                                                         |
| ------------------------------------- | -------------------------------------------------------------- |
| State field completeness (50+ fields) | PASS — all wired across 4 layers                               |
| Controller functions (22 total)       | PASS — all implemented with guard patterns                     |
| Type definitions                      | PASS — all complete and consistent                             |
| Missing wiring                        | PASS — no dangling references                                  |
| Deal state (9 fields)                 | PASS — declared in all layers                                  |
| KPI suggestion flow                   | PASS — end-to-end wiring verified                              |
| Gateway method alignment              | PASS — all 22 controller methods match extension registrations |

---

## Root Cause Analysis — User-Reported Issues

### "I don't see KPIs"

**Root cause: H-EXT-1** — `extractSection()` uses `\Z` (not valid in JavaScript regex). When `## Friction KPI Evidence` is the last section in a job card markdown, the regex fails silently and returns empty string, producing `kpi_signals: []`.

### "No proof script linked for this card"

**Root cause: H-EXT-2** — Proof script allowlist regex `proof_jc\d+.sh` is too narrow. Scripts with suffixed names (`proof_jc011_mac_preflight.sh`) or alternative prefixes (`proof_deal_workflow.sh`) are rejected. Additionally, the extraction regex in `extractSection` (H-EXT-1) may also prevent proof evidence parsing for last-section content.

### "Hold Promotion is not a pulldown"

**Finding: M-VIEW-3** — The promotion confidence band IS rendered as a `<select>` dropdown in the detail panel (lines 1716-1736), but only visible after clicking "View Details" on a specific job card. The card list shows it as a static pill. The dropdown changes markdown but does not auto-save, and there's no visual "unsaved" indicator.

### "Deal Pipeline is all I see"

**Root cause:** Sidecar was running but the UI requires clicking "Refresh" to load the workbench snapshot (defect H-UX-2 from Council Cycle 006). Without the snapshot, all sections gated on `snapshot ?` render as `nothing`.

---

## Fix Priority

### Immediate (this session)

1. **C-EXT-1** — Remove `fullPath` leak from job card detail response
2. **H-EXT-1** — Fix `\Z` → proper end-of-string anchor in `extractSection` and `upsertPolicyConfigSection`
3. **H-EXT-2** — Broaden proof script allowlist regex
4. **H-SRV-1** — Fix deal timeline to read from triage ledger
5. **H-SRV-2** — Add request body size limit
6. **H-VIEW-1** — Render Morning Brief `deals_summary` and `recent_activity`
7. **H-VIEW-2** — Wire deal update actions in detail view
8. **H-VIEW-3** — Add approve/dismiss buttons to approval queue

### Next session

- M-EXT-1: Add kill timer to proof script execution
- M-VIEW-1: Render EOD Digest unresolved item details
- M-VIEW-2: Add overflow indicator for job cards list
- M-VIEW-3: Add unsaved indicator to promotion confidence dropdown
- M-EXT-2/3: Register gateway methods for timeline, triage, filing

---

## Files Audited

| File                              | Lines | Findings                        |
| --------------------------------- | ----- | ------------------------------- |
| `sidecars/ted-engine/server.mjs`  | 4770  | 2 HIGH, 5 MEDIUM, 5 LOW         |
| `extensions/ted-sidecar/index.ts` | 3897  | 1 CRIT, 2 HIGH, 5 MEDIUM, 2 LOW |
| `ui/src/ui/views/ted.ts`          | 2271  | 3 HIGH, 6 MEDIUM, 5 LOW         |
| `ui/src/ui/controllers/ted.ts`    | 731   | 1 HIGH (wiring)                 |
| `ui/src/ui/app.ts`                | 576   | 0 (clean)                       |
| `ui/src/ui/app-render.ts`         | 1198  | 0 (clean)                       |
| `ui/src/ui/app-view-state.ts`     | 298   | 0 (clean)                       |
| `ui/src/ui/types.ts`              | 1010  | 0 (clean)                       |
