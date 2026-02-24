# 45 — Council Critical Review: Cycle 007

**Date:** 2026-02-23
**Trigger:** Pre-ship readiness assessment — "Can this tool achieve Clint's productivity vision?"
**Council composition:** 6 counselors (Operator Productivity, Architecture Soundness, Data Integrity & Trust, Security & Governance, Integration Completeness, Vision Alignment)
**Overall verdict:** YELLOW — Not Ship-Ready

---

## Scorecard

| #   | Counselor                | Verdict | Score           | Key Finding                                                                  |
| --- | ------------------------ | ------- | --------------- | ---------------------------------------------------------------------------- |
| 1   | Operator Productivity    | YELLOW  | 42/100          | Entirely pull-based — zero proactive delivery, zero background automation    |
| 2   | Architecture Soundness   | YELLOW  | 62/100          | No top-level error boundary in HTTP server; monolith files unsustainable     |
| 3   | Data Integrity & Trust   | YELLOW  | 62/100          | Commitment extraction silently returns empty array on LLM failure            |
| 4   | Security & Governance    | YELLOW  | 72 sec / 58 gov | Agent can approve its own sync writes — approval gates bypassable            |
| 5   | Integration Completeness | RED     | 22/100          | Every credential field empty; draft "execute" doesn't send email             |
| 6   | Vision Alignment         | YELLOW  | 38/100          | 40% user stories done; core value prop (email/brief/calendar) non-functional |

---

## 10 Must-Fix Items

### P0 — Blockers (Cannot ship without these)

#### MF-1: Azure AD App Registration + Graph Auth

- **Counselor:** Integration
- **Impact:** Blocks ~60% of system value
- **Problem:** Both profiles have empty `tenant_id` and `client_id` in `graph.profiles.json`. Every Graph route returns 400 immediately.
- **Fix:** Operator (Clint/admin) registers apps in Azure AD, grants consent, completes device code flow. Engineering provides updated setup guide.
- **Effort:** 1-2 hours operator time + guide updates
- **Files:** `sidecars/ted-engine/config/graph.profiles.json`, `docs/ted-profile/sdd-pack/38_GRAPH_PROFILE_SETUP_GUIDE.md`
- **Status:** [ ] Not started
- **Depends on:** Operator action

#### MF-2: Token Refresh

- **Counselor:** Integration
- **Impact:** Sessions die after ~60-90 minutes without this
- **Problem:** No refresh token logic exists. `offline_access` scope is requested (so Azure AD returns a refresh_token), but when the access token expires the system just fails with `NOT_AUTHENTICATED`.
- **Fix:** When `hasUsableAccessToken()` returns false and a `refresh_token` exists in the stored token record, call `POST https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token` with `grant_type=refresh_token`. Store the new access_token + refresh_token.
- **Effort:** ~50 lines in `server.mjs` + `token_store.mjs`
- **Files:** `sidecars/ted-engine/server.mjs` (around `getTokenRecord()`), `sidecars/ted-engine/token_store.mjs`
- **Status:** [ ] Not started
- **Depends on:** Nothing (can be built now)

#### MF-3: Draft Execute Must Actually Send Email

- **Counselor:** Integration
- **Impact:** Entire draft approval pipeline is ceremonial without this
- **Problem:** `draftQueueExecute()` writes "executed" to a ledger but never calls the Graph API to send. `Mail.Send` scope isn't even requested.
- **Fix:** After state transition to "executed", call `POST https://graph.microsoft.com/v1.0/me/messages/{message_id}/send`. Add `Mail.Send` to requested scopes in `graph.profiles.json`.
- **Effort:** ~30 lines in `server.mjs`, scope update in config
- **Files:** `sidecars/ted-engine/server.mjs` (`draftQueueExecute`), `sidecars/ted-engine/config/graph.profiles.json`
- **Status:** [ ] Not started
- **Depends on:** MF-1 (needs working Graph auth to test)

#### MF-4: Fix Commitment Extraction Silent Failure

- **Counselor:** Data Integrity
- **Impact:** "Career-ending miss" — Clint sees "no commitments" when extraction actually failed
- **Problem:** When LLM fails or returns garbage, `detected = []` and `extraction_source: "fallback"`. Empty array from fallback is indistinguishable from "no commitments in this email."
- **Fix:** Return `status: "extraction_failed"` field alongside `extraction_source: "fallback"` when LLM produces unusable output. UI should show "Extraction unavailable — manual review required" instead of "No commitments detected."
- **Effort:** ~20 lines sidecar + ~10 lines UI
- **Files:** `sidecars/ted-engine/server.mjs` (`extractCommitmentsFromEmail`), `ui/src/ui/views/ted.ts` (extraction display)
- **Status:** [ ] Not started
- **Depends on:** Nothing (can be built now)

#### MF-5: Add Top-Level try/catch in HTTP Server

- **Counselor:** Architecture
- **Impact:** Unhandled throw leaves HTTP responses hanging, can crash process
- **Problem:** `http.createServer(async (req, res) => { ... })` has no wrapping try/catch. 85+ async handlers — any unhandled throw is fatal.
- **Fix:** Wrap the entire request handler in try/catch. Log error, send 500 if response not yet ended. Add `process.on('unhandledRejection')` and `process.on('uncaughtException')` handlers.
- **Effort:** ~15 lines
- **Files:** `sidecars/ted-engine/server.mjs` (around `http.createServer`)
- **Status:** [ ] Not started
- **Depends on:** Nothing (can be built now)

---

### P1 — High Impact (Should fix before operator handoff)

#### MF-6: Scheduled Delivery (Background Automation)

- **Counselor:** Operator Productivity
- **Impact:** Without this, Clint must remember to click "Generate" every morning — inverts the value prop
- **Problem:** No cron runner, no scheduled execution engine, no push delivery. `ted_agent.json` has cron templates (7am, 5pm) but nothing executes them.
- **Fix:** Implement a lightweight interval-based scheduler in the sidecar that triggers morning brief generation at configured times and writes results to a "pending delivery" ledger. Extension can poll or push notification.
- **Effort:** ~100-150 lines sidecar + extension wiring
- **Files:** `sidecars/ted-engine/server.mjs` (new scheduler module), config for schedule times
- **Status:** [ ] Not started
- **Depends on:** MF-1 (needs Graph data to generate useful briefs)

#### MF-7: Reconciliation Duplicate Prevention

- **Counselor:** Data Integrity
- **Impact:** If Graph API fails during reconciliation, system proposes creating duplicates of everything
- **Problem:** When Planner/To Do API returns error, remote tasks appear as empty array. Reconciliation sees "everything is missing remotely" and proposes creating all local items as new remote tasks.
- **Fix:** Before creating sync proposals, check if existing pending proposals already cover the same `local_id` + `target_system`. Skip if duplicate. Also: if remote fetch failed, mark reconciliation as `partial` and don't generate proposals for the failed service.
- **Effort:** ~40 lines
- **Files:** `sidecars/ted-engine/server.mjs` (`reconcile`)
- **Status:** [ ] Not started
- **Depends on:** Nothing (can be built now)

#### MF-8: Separate Agent Authority from Operator Authority

- **Counselor:** Security & Governance
- **Impact:** Undermines the entire governance model if agent can auto-approve writes
- **Problem:** An LLM agent can call `ted_sync_approve` tool and execute writes to Planner/To Do. The tool has a `confirmation` gate but that's agent-to-agent, not agent-to-human. Same for `ted_improvement_apply`.
- **Fix:** Write-action tools that affect external systems must require operator confirmation through the UI or a dedicated approval surface — not just agent tool confirmation gates. Add these tools to a `REQUIRES_OPERATOR_CONFIRMATION` set that the governance hook enforces.
- **Effort:** ~60 lines extension + ~30 lines sidecar
- **Files:** `extensions/ted-sidecar/index.ts` (tool registration), `sidecars/ted-engine/server.mjs` (execution boundary policy)
- **Status:** [ ] Not started
- **Depends on:** Nothing (can be built now)

#### MF-9: Golden Fixtures Must Execute at Startup

- **Counselor:** Data Integrity
- **Impact:** Contract validation regression goes undetected
- **Problem:** 7 golden fixtures exist in `output_contracts.json` but `validateOutputContractsOnStartup()` only checks contract existence, never runs fixtures through validation.
- **Fix:** Extend startup validation to run each golden fixture through `validateLlmOutputContract()`. Log PASS/FAIL per fixture. If any fixture fails its own contract, log a prominent warning (don't crash — it's a regression signal).
- **Effort:** ~30 lines
- **Files:** `sidecars/ted-engine/server.mjs` (`validateOutputContractsOnStartup`)
- **Status:** [ ] Not started
- **Depends on:** Nothing (can be built now)

#### MF-10: Mac Installer / First-Run Experience

- **Counselor:** Vision Alignment
- **Impact:** A non-engineer cannot get this running
- **Problem:** No DMG, no setup wizard, no guided first-run. Requires manual `node server.mjs` and manual config editing.
- **Fix:** At minimum: a `setup.sh` script that validates prerequisites, prompts for Azure AD IDs, writes `graph.profiles.json`, starts the sidecar, and runs device code auth. Longer term: Mac DMG + LaunchAgent.
- **Effort:** ~200 lines for setup script; Mac packaging is a larger effort (JC-065/066)
- **Files:** New: `scripts/setup.sh` or `scripts/ted-setup.sh`
- **Status:** [ ] Not started
- **Depends on:** Requires macOS for full installer (JC-065/066)

---

## Execution Order Recommendation

The counselors recommend this sequence:

```
Wave A — Can be done NOW (no external dependencies):
  MF-5  Top-level try/catch         (~15 min)
  MF-4  Commitment extraction fix   (~30 min)
  MF-9  Golden fixture startup      (~30 min)
  MF-7  Reconciliation dedup        (~45 min)
  MF-8  Operator authority gates    (~1 hour)

Wave B — Requires MF-1 first (operator action):
  MF-1  Azure AD registration       (operator action, 1-2 hours)
  MF-2  Token refresh               (~1 hour engineering)
  MF-3  Draft execute sends email   (~30 min engineering)

Wave C — Requires Graph working (MF-1 + MF-2):
  MF-6  Scheduled delivery          (~2 hours engineering)
  MF-10 First-run experience        (~3 hours engineering)

Post-wave: Live acceptance test with real M365 data
```

---

## Agreed Strengths (All 6 Counselors)

1. **Governance architecture is real, not theater** — execution boundaries, hard bans, entity separation, fail-closed explainability
2. **Draft queue state machine is production-quality** — 6 states, enforced transitions, full audit trail
3. **Dual-write event sourcing is remarkably consistent** — 60+ call sites, every one has `appendEvent()`
4. **Zero external dependencies in sidecar** — no supply chain risk, fast startup
5. **53 registered agent tools with confirmation gates** — ready for multi-channel interaction day-1

## Agreed Weaknesses (All 6 Counselors)

1. **Empty credentials = zero M365 connectivity = zero value to Clint today**
2. **Monolith files** (server.mjs ~9,800 lines, index.ts ~7,800 lines) are unsustainable
3. **No background automation** — everything requires manual trigger
4. **JSONL storage lacks durability guarantees** — no fsync, no corruption detection, no rotation
5. **Never tested against real data** — all proofs use synthetic inputs

---

## Detailed Counselor Reports

### 1. Operator Productivity Counselor (Score: 42/100)

**Core finding:** The system is entirely pull-based with zero background automation, zero proactive notifications, and zero scheduled jobs. Adding a background scheduler and notification delivery channel would transform this from a passive dashboard into the proactive assistant Clint was promised.

**Friction analysis:** Every workflow requires Clint to navigate to the right tab, find the right card, and click the right button. Morning brief, EOD digest, email triage, commitment extraction — all manual triggers. The 20-card UI creates cognitive overhead rather than reducing it.

**Missing workflows:**

- No "what changed since I last looked" summary
- No proactive deadline warnings
- No "you have 3 unreviewed drafts" notification
- No cross-entity daily priority ranking

### 2. Architecture Soundness Counselor (Score: 62/100)

**Architecture score breakdown:**

| Category                | Score |
| ----------------------- | ----- |
| Conceptual architecture | 90    |
| Code organization       | 35    |
| Data durability         | 30    |
| Error handling          | 55    |
| State management        | 65    |
| Dependency risk         | 85    |
| Observability           | 80    |
| Scalability             | 40    |

**Top risks:**

1. No top-level error boundary in HTTP server (CRITICAL)
2. JSONL data durability gap — no fsync, silent corruption discard (HIGH)
3. Monolith file size — two files = 17,690 lines (HIGH)
4. Full-file ledger reads on every request — O(n) per read (MEDIUM)
5. State explosion in UI — ~170 properties in flat namespace (MEDIUM)

**Technical debt (must fix):**

- Add top-level try/catch in HTTP server handler
- Add `process.on('unhandledRejection')` + `process.on('uncaughtException')`
- Add JSONL corruption detection on read (log warning with file + line number)
- Split `server.mjs` into route modules by domain area

**Acceptable debt for local tool:**

- Single-process architecture (fine for single user)
- In-memory token cache (fine with loopback-only)
- Synchronous file I/O (fine at current scale)
- No database (JSONL is appropriate for append-only at this scale)

### 3. Data Integrity & Trust Counselor (Score: 62/100)

**Trust assessment:** Would trust for read operations, dashboards, and advisory output today. Would NOT trust as system of record for legally significant commitments without P0 remediations.

**Data loss scenarios:**

| #   | Scenario                                           | Likelihood | Impact   |
| --- | -------------------------------------------------- | ---------- | -------- |
| 1   | Process crash between domain write and event write | Low        | Medium   |
| 2   | Partial JSONL write (truncated JSON line)          | Low        | High     |
| 3   | Commitment extraction returns [] on LLM failure    | Medium     | Critical |
| 4   | Extracted commitments not auto-persisted           | Medium     | Critical |
| 5   | Reconciliation duplicates on API failure           | Medium     | High     |
| 6   | Corrupted draft state transition causes regression | Low        | High     |

**Validation gaps:**

- No `max_length` enforcement (defined in contracts but never checked)
- No forbidden patterns for `morning_brief`, `eod_digest`, `triage_classify`, `deadline_extract`
- `triage_classify` validation accepts any non-empty string
- Golden fixtures are inert (never executed as regression tests)
- `deadline_extract` has no golden fixture

**Trust strengths:**

1. Execution boundary enforcement is real
2. Draft state machine correctly formalized
3. Dual-write discipline consistent across 60+ sites
4. Never-dark fallback works for brief/digest/draft
5. Trust ledger records every validation result

### 4. Security & Governance Counselor (Score: 72 security / 58 governance)

**Security strengths:**

- Loopback-only sidecar (127.0.0.1:48080) — zero network exposure
- Execution boundary enforcement with undeclared route blocking
- Auth token minting with HMAC + configurable TTL
- Token store uses macOS Keychain when available

**Governance gaps:**

1. Agent can approve its own sync writes (tool confirmation != operator confirmation)
2. Draft approval tagged `WORKFLOW_ONLY`, not `APPROVAL_FIRST`
3. Deal creation/updates require no human approval gate
4. LLM prompt injection not mitigated (no input sanitization before LLM calls)
5. Hard bans use string matching only — easy to bypass with Unicode/encoding tricks

**Previous RED verdict (Cycle 005) status:** Partially addressed. Execution boundaries are real now. But the agent-as-operator bypass path is a new form of governance theater.

### 5. Integration Completeness Counselor (Score: 22/100)

**Integration matrix:**

| M365 Service | Read            | Write                    | Sync                | Status                |
| ------------ | --------------- | ------------------------ | ------------------- | --------------------- |
| Outlook Mail | Code exists     | Code exists (draft)      | None                | BLOCKED — empty creds |
| Calendar     | Code exists     | Partial (tentative only) | None                | BLOCKED — empty creds |
| Planner      | Code exists     | Code exists              | Reconciliation only | BLOCKED — empty creds |
| To Do        | Code exists     | Code exists              | Reconciliation only | BLOCKED — empty creds |
| OneDrive     | NOT IMPLEMENTED | NOT IMPLEMENTED          | NOT IMPLEMENTED     | Zero code             |
| SharePoint   | NOT IMPLEMENTED | NOT IMPLEMENTED          | NOT IMPLEMENTED     | Zero code             |
| Teams        | NOT IMPLEMENTED | NOT IMPLEMENTED          | NOT IMPLEMENTED     | Zero code             |

**Critical integration gaps:**

1. Every credential field is empty — nothing works
2. No token refresh — sessions die after 60-90 minutes
3. Draft execute doesn't send email — `Mail.Send` scope not even requested
4. OneDrive/SharePoint — zero implementation despite being in scope
5. Meeting "upcoming" endpoint returns hardcoded stubs

**Offline behavior:** System fails open for local features (ledgers, LLM) but fails hard for all Graph features. No retry logic, no circuit breaker, no queue-and-retry.

### 6. Vision Alignment Counselor (Score: 38/100)

**User story coverage:**

| Category   | Done   | Partial | Not Started | Blocked |
| ---------- | ------ | ------- | ----------- | ------- |
| P0 Day-1   | 19     | 7       | 8           | 2       |
| P0 Phase-1 | 8      | 4       | 4           | 0       |
| P1         | 12     | 5       | 9           | 0       |
| P2         | 0      | 0       | 4           | 0       |
| **Total**  | **39** | **16**  | **25**      | **2**   |

**Coverage: 39/97 DONE (40%), 55/97 with PARTIAL (57%)**

**Top vision gaps:**

1. Zero live M365 connection (blocks ~60% of value)
2. No external system connectors (Monday.com, DocuSign, Zoom, PACER — all zero)
3. No scheduled delivery (morning brief requires manual trigger)
4. No Everest visibility (facility health scores, alerts — infrastructure only, no data source)
5. No legal document templates or data room ingest

**Competitive position vs Microsoft Copilot:**

- Ted is architecturally superior in governance, entity separation, deal tracking, compliance
- Copilot works TODAY with zero setup inside Clint's existing M365
- Until Ted connects to M365, Copilot delivers infinite more value

**Ship/No-Ship: NO-SHIP** until P0 items 1-5 are addressed and a live acceptance test passes.

---

## Success Criteria for Green Rating

To move from YELLOW to GREEN, the council requires:

1. [ ] MF-1 through MF-5 resolved (all P0 blockers)
2. [ ] At least one Graph profile authenticated with real Azure AD credentials
3. [ ] End-to-end test: read 10 real emails, generate real drafts, send 1 approved draft
4. [ ] Commitment extraction tested against 5 real emails with known commitments
5. [ ] Morning brief generated with real inbox + calendar + deal data
6. [ ] MF-6 through MF-9 resolved (P1 items)
7. [ ] Operator (Clint) can start the system without engineering assistance

**Target scores after remediation:**

| Counselor                | Current | Target |
| ------------------------ | ------- | ------ |
| Operator Productivity    | 42      | 75+    |
| Architecture Soundness   | 62      | 80+    |
| Data Integrity & Trust   | 62      | 80+    |
| Security & Governance    | 72/58   | 80/75+ |
| Integration Completeness | 22      | 70+    |
| Vision Alignment         | 38      | 70+    |

---

_Filed by the Council of Six. Cycle 007. Next review: after Wave A + Wave B completion._
