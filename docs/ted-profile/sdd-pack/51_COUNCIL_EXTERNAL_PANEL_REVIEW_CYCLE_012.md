# Council Critical Review — Cycle 012: External Panel Findings & Launch Readiness Audit

**Filed:** 2026-02-24
**Status:** OPEN — 12 findings cataloged, remediation plan pending
**Scope:** External expert panel (Stein, Katz, Mehta, Cole) evaluated Ted launch readiness. Council cross-referenced all claims against actual codebase. This document records validated findings, refuted claims, and new gaps identified.
**Auditors:** 8 council seats + 4 external panelists (Architecture, Healthcare M&A Ops, Governance/Compliance, Launch/Adoption)

---

## Executive Summary

An external expert panel independently reviewed Ted's architecture, deal operations, governance, and launch readiness. The Council performed a code-level fact-check of every claim against the actual implementation in `server.mjs` (~12,060 lines), `index.ts` (~9,390 lines), and the full config/UI stack.

**Key outcome:** The panel's architecture review was performed against _documentation and conversation summaries_, not the codebase. Several claims are factually incorrect (connectors DO NOT fail silently, audit trail IS comprehensive). However, the panel identified three legitimate blind spots that no current council seat covers: healthcare M&A domain realism, clinical PHI taxonomy, and voice training pipeline.

| Category | Findings                                                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| CRITICAL | 0                                                                                                                                          |
| HIGH     | 3 — PHI detection scope limitation, voice training pipeline absent, process supervisor missing                                             |
| MEDIUM   | 5 — Deal owner responsiveness tracking, intake standardization, auto-brief on deal create, Builder review cadence, day-1 adoption playbook |
| LOW      | 4 — Data room quarantine (future risk), Prestige entity scope, feedback loop explicitness, panel working from stale info                   |
| REFUTED  | 4 — Connector silent failure (FALSE), no audit trail (FALSE), Telegram dependency (FALSE), no Codex governance (FALSE)                     |

---

## Panel Claims: Validated vs. Refuted

### Claims REFUTED by Code Inspection

**R-1: "Connectors fail silently" (Stein)**

- **Reality:** `graphFetchWithRetry()` (server.mjs ~line 4507) implements 3 retries, exponential backoff, 429 Retry-After. Every failure emits named events: `graph.network_retry`, `graph.rate_limited`, `graph.auth.refresh_failed`. Nothing is silent.
- **Evidence:** 17 auth guards, `ensureValidToken()` per-profile mutex, event log entries on every retry.

**R-2: "No audit trail for governance overrides" (Mehta)**

- **Reality:** Dual-write pattern logs every operator action to `audit_trail.jsonl` AND `event_log.jsonl`. `x-ted-approval-source: operator` header is logged on all confirmation-gated actions. Override trail is complete and tamper-evident (append-only JSONL).

**R-3: "Telegram as Day-1 channel is limited" (Cole)**

- **Reality:** Ted runs on OpenClaw (VS Code extension) with 23 operator surface cards, 135 gateway methods, and 62 agent tools. No Telegram dependency exists or is planned. Panel was working from outdated context.

**R-4: "Codex Builder has no governance" (Stein)**

- **Reality:** Builder lane is explicitly gated: spec -> tests/evals -> human review -> staged rollout. Council mandates proof-based promotion. Improvement proposals surface in UI card for operator review. `improvement_proposals_ledger.jsonl` tracks all proposals.

---

## Validated Findings

### HIGH Severity

### C12-001: PHI Detection Limited to Regex Patterns — No Clinical NER

- **Location:** server.mjs — `redactPhiFromMessages()` (~line 3730)
- **Root cause:** PHI redaction uses hardcoded regex for SSN, DOB, room/bed numbers, MRN only. No Named Entity Recognition (NER) for patient names, physician names, clinical terms, or diagnosis codes.
- **Impact:**
  - Adequate for email text processing (catches common structured PHI patterns)
  - Inadequate for data room document content if file reading is added in future
  - Does NOT scan SharePoint document content (currently metadata-only, so not an active risk)
  - Regex-only detection should not be claimed as "HIPAA compliant" — it is a defense-in-depth layer
- **Current mitigation:** SharePoint integration only handles metadata (file names, sizes, dates). File content never enters Ted's processing pipeline. HIPAA hard gate blocks non-cleared providers for Everest entity entirely.
- **Fix:**
  1. Document current PHI detection scope explicitly in architecture docs (what it catches, what it doesn't)
  2. Add manual review gate for data room document content processing (when implemented)
  3. Evaluate clinical NER service (AWS Comprehend Medical, Azure Health Text Analytics) for Phase 2
  4. **New council seat required** (Seat 10: Clinical PHI Specialist) to govern this domain

### C12-002: Voice Training Pipeline Not Implemented — Static Config Only

- **Location:** `sidecars/ted-engine/config/draft_style.json` — `voice_training` block
- **Root cause:** Config has `status: "pending"` and references "Extract from Clint's sent email archive (1,000+ sent emails via Graph API export)" but no code path exists to fetch sent emails, analyze patterns, or generate voice profiles.
- **Impact:**
  - Ted drafts using static tone rules and banned phrases only
  - Operator will spend more time rewriting Ted's drafts than writing their own if voice doesn't approximate reality
  - Adoption risk: draft queue becomes a friction point instead of a productivity gain
- **Current state:** `draft_style.json` has `preferred_tone`, `style_rules` (4 contexts), `signature_conventions`, `words_to_avoid` (6 phrases). Validation checks signature and disclaimer. Trust metrics track draft approval/rejection rates.
- **Fix:**
  1. **Pre-launch deliverable:** Operator provides 20-30 representative sent emails (mix of deal counterparty, internal team, casual, formal)
  2. Run LLM analysis to extract patterns (word choice, sentence structure, greeting/closing conventions, formality gradient)
  3. Generate voice profile entries in `draft_style.json` (expanded `style_rules` with extracted patterns)
  4. Post-launch: capture operator edits to drafts as signal for voice refinement (Codex Builder lane)

### C12-003: No Process Supervisor for Sidecar Auto-Restart

- **Location:** server.mjs — `process.on('uncaughtException')` (~line 12060)
- **Root cause:** Sidecar logs to event_log on crash then calls `process.exit(1)`. No process supervisor (systemd, pm2, launchd) configured for auto-restart. `ted-setup.sh` handles initial setup but doesn't install a process monitor.
- **Impact:**
  - If sidecar crashes, it stays down until operator manually restarts
  - In-flight HTTP handlers are lost (no checkpoint/resume)
  - Scheduled jobs (morning brief, inbox ingestion, EOD digest) stop firing
  - Ledger data is safe (append-only JSONL), but operational continuity breaks
- **Current mitigation:** JSONL ledgers survive crashes. `/ops/resume` endpoint exists for manual post-restart recovery. `uncaughtException` and `unhandledRejection` are caught and logged before exit.
- **Fix:**
  1. Add systemd unit file (Linux) or LaunchAgent plist (macOS) to `ted-setup.sh`
  2. Configure automatic restart with backoff (RestartSec=5, max 3 retries in 60s)
  3. Health check: `GET /status` returns 200 when sidecar is operational
  4. Add startup recovery: on boot, check for incomplete scheduled deliveries in `pending_delivery.jsonl`

### MEDIUM Severity

### C12-004: No Deal Owner Responsiveness Tracking

- **Location:** deals_ledger.jsonl — deal records track stage but not owner activity
- **Root cause:** Ted tracks deals by pipeline stage but has no "days since last update by owner" metric. If Maurice (key contact on ~50% of deals) goes dark for a week, Ted cannot flag the stall independently.
- **Impact:** Deals may stall without detection if the bottleneck is human responsiveness rather than stage-gate failure.
- **Fix:** Add `last_updated_by` and `last_updated_at` fields to deal events. Scheduler job checks for deals with >7 days since last owner activity and emits `deal.owner.stale` event.

### C12-005: No Structured Intake Format for External Updates

- **Location:** Inbox ingestion pipeline — `runInboxIngestionCycle()` (~line varies)
- **Root cause:** Maurice's weekly update arrives as a Word doc with inconsistent table format. Ted's inbox ingestion relies on LLM classification of freeform email content. No structured intake form or template exists.
- **Impact:** Intake quality depends entirely on LLM accuracy against inconsistent formatting. Risk of misclassification or missed items.
- **Fix:** Design a lightweight intake template (email form with required fields: deal name, stage update, next action, blockers). Provide to Maurice as preferred format. Ted continues to accept freeform as fallback.

### C12-006: No Auto-Brief Generation on Deal Creation

- **Location:** `POST /deals/create` handler in server.mjs
- **Root cause:** Deal creation stores the deal record but does not auto-trigger brief generation. Operator must separately request a brief. Deals at Stage 0 (Lead) may have no brief at all.
- **Impact:** 6 deals sitting at Lead with no brief means Ted cannot manage what he can't see. The brief-with-blanks approach makes gaps visible.
- **Fix:** After `POST /deals/create`, auto-generate a skeleton brief using `brief_config.json` template with `source: "template"` (no LLM required). Populate known fields, mark unknowns as "TBD". Emit `deal.brief.auto_generated` event.

### C12-007: Codex Builder Review Cadence Undefined

- **Location:** `improvement_proposals_ledger.jsonl` — no SLA or expiry
- **Root cause:** Improvement proposals accumulate in ledger and surface in UI card, but there is no review cadence, auto-expiry, or operator notification for stale proposals.
- **Impact:** Proposals pile up and become stale. Operator ignores the backlog. Builder lane value degrades.
- **Fix:** Add `created_at` tracking (already present). Scheduler job flags proposals older than 14 days as stale. UI card sorts by age and highlights stale items. Optional: weekly digest includes "N pending improvement proposals" count.

### C12-008: No Day-1/7/30 Operator Adoption Playbook

- **Location:** Documentation gap — no onboarding sequence doc
- **Root cause:** `onboarding_ramp.json` exists for technical progressive disclosure (feature unlock), but no operator-facing playbook exists for "what to do on day 1, day 7, day 30."
- **Impact:** Operator doesn't know which surface to use first, what to expect, or how to tell if Ted is working correctly. Risk of abandonment due to uncertainty.
- **Fix:** Create operator playbook doc (SDD pack or separate):
  - Day 1: Run setup validation, verify Graph auth, review morning brief
  - Day 7: Review draft queue accuracy, tune voice, confirm deal pipeline matches reality
  - Day 30: Review trust metrics, evaluate improvement proposals, assess time savings

### LOW Severity

### C12-009: Data Room Document Quarantine (Future Risk)

- **Location:** SharePoint routes — metadata-only currently
- **Root cause:** If SharePoint integration is extended to read file content (not just metadata), there is no PHI scanning gate on document content before it enters the event log.
- **Impact:** Future risk only — not active today. SharePoint currently returns metadata (names, sizes, dates) and never downloads file content.
- **Fix:** When file content reading is implemented, add PHI scanning gate before content enters processing pipeline. Route through `redactPhiFromMessages()` at minimum, clinical NER service for healthcare documents.

### C12-010: Prestige Entity Scope Undefined

- **Location:** `graph.profiles.json` — only olumie and everest profiles exist
- **Root cause:** Prestige is referenced in governance rules (vendor pricing confidentiality) but has no profile, no entity firewall, and scope is "TBD."
- **Impact:** If Prestige has any touchpoint with patient data or healthcare operations, entity firewall must extend before Ted handles Prestige work.
- **Fix:** Operator decision needed: Does Prestige need its own Graph profile? If yes, add to `graph.profiles.json` with appropriate scopes and entity separation rules. If no (Prestige is personal/non-operational), document the exclusion.

### C12-011: Learning Feedback Loop Not Explicit Per-Deal

- **Location:** Codex Builder Lane — improvement proposals
- **Root cause:** Builder lane captures validator failures and low approval rates globally, but doesn't surface "here's what I learned from this specific deal" per deal.
- **Impact:** Operator cannot confirm or correct Ted's pattern recognition on a deal-by-deal basis. Drift may go unnoticed.
- **Fix:** After deal reaches Closed or Dead, auto-generate a deal retrospective: extraction accuracy, brief quality, draft approval rate, missed commitments. Surface as improvement proposal linked to deal ID.

### C12-012: External Panel Working from Stale Information

- **Location:** Panel context — not code
- **Root cause:** The panel reviewed Ted based on conversation summaries and architecture descriptions, not the actual codebase. This led to 4 factually incorrect claims (R-1 through R-4).
- **Impact:** Operator may lose confidence in panel findings if incorrect claims are presented alongside valid ones.
- **Fix:** Future external reviews should include a "code reality check" step where panel claims are verified against the implementation before being presented to the operator. Council performs this function.

---

## Remediation Priority

### Wave 1 — HIGH (pre-launch or launch-week)

- **C12-002:** Voice training — operator provides 20-30 sent emails, Matt extracts patterns into config
- **C12-003:** Process supervisor — add systemd/launchd auto-restart to `ted-setup.sh`
- **C12-001:** PHI scope documentation — document what regex catches and doesn't

### Wave 2 — MEDIUM (first 30 days)

- **C12-006:** Auto-brief on deal creation
- **C12-004:** Deal owner responsiveness tracking
- **C12-008:** Operator adoption playbook
- **C12-005:** Structured intake template for Maurice
- **C12-007:** Builder review cadence + stale proposal flagging

### Wave 3 — LOW (backlog)

- **C12-009:** Data room quarantine (implement when file content reading is added)
- **C12-010:** Prestige entity decision (operator input needed)
- **C12-011:** Per-deal learning retrospective
- **C12-012:** Panel review process improvement

---

## Council Seat Gap Analysis

The external panel exposed blind spots that map to missing expertise. The Council recommends adding 2 new permanent seats:

| New Seat                                                | Justification                                                                                                                                                                                                                                                         | Reference                                     |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Seat 9: Healthcare M&A Operations Specialist**        | No current seat understands deal flow realism, data room conventions, intake standardization, or regulatory filing requirements. Katz's findings (C12-004, C12-005, C12-006) would not have been caught by existing seats.                                            | See `52_COUNCIL_SEAT_EXPANSION_SEATS_9_10.md` |
| **Seat 10: Clinical Data & PHI Recognition Specialist** | Seat 5 (Security) and Seat 7 (Data Privacy) cover technical security and general privacy. Neither covers clinical terminology, PHI taxonomy in healthcare M&A context, or de-identification standards. C12-001 and C12-009 require domain expertise neither seat has. | See `52_COUNCIL_SEAT_EXPANSION_SEATS_9_10.md` |

Additionally, **Seat 6 (Product Lead)** scope should be expanded to include adoption playbook design and voice calibration methodology (addressing C12-002 and C12-008).

---

## Answers to Operator's Direct Questions

### Q1: Has Matt specified failure/recovery behavior for the Sidecar and connectors?

**Connectors: YES — fully specified and robust.**

- `graphFetchWithRetry()`: 3 retries, exponential backoff, 429 Retry-After
- `ensureValidToken()`: per-profile mutex, automatic refresh
- 17 auth guards, named events on every failure

**Sidecar process: PARTIAL — crash logging exists, auto-restart does not.**

- `uncaughtException`/`unhandledRejection` caught and logged
- Graceful shutdown on SIGINT/SIGTERM
- No process supervisor for auto-restart (C12-003)
- No checkpoint/resume for in-flight requests
- JSONL ledgers survive crashes; operational continuity requires manual restart

### Q2: Is there a PHI detection layer in the document ingestion pipeline?

**Yes, but scope-limited.**

- `redactPhiFromMessages()` runs regex patterns (SSN, DOB, room/bed, MRN) on all text before LLM calls
- HIPAA hard gate blocks non-cleared providers for Everest entity entirely
- SharePoint integration is metadata-only — file content never enters processing pipeline
- No clinical NER, no document-level PHI scanning, no data room quarantine
- **Adequate for launch with manual review gate on data room documents for first 30 days**

### Q3: Voice training — should the operator be doing voice training?

**Yes — it's a pre-launch deliverable, but it's lightweight.**

- Operator provides 20-30 representative sent emails (mix of contexts)
- Matt extracts patterns into `draft_style.json` expanded config
- Not a training session — a sample collection exercise
- Post-launch: operator edits to drafts become signal for voice refinement via Builder lane

---

## Appendix: External Panel Review Process (C12-012)

### Problem

External panel reviewed Ted based on conversation summaries, not the codebase. This led to 4 factually incorrect claims (R-1 through R-4) that could undermine operator confidence.

### Recommended Process for Future External Reviews

1. **Panel receives architecture docs** (Blueprint, Planes-Artifacts-Owners, Future-State-Framing) — NOT conversation summaries
2. **Panel submits claims as testable hypotheses** (e.g., "I believe connectors fail silently" → "Test: force a Graph API timeout and check event log")
3. **Council fact-checks every claim** against actual code before presenting to operator
4. **Findings doc separates VALIDATED from REFUTED** claims with code references
5. **Operator receives only the validated findings** + a note on what was refuted and why

### Template for External Panel Engagement

| Step                     | Owner              | Deliverable                                |
| ------------------------ | ------------------ | ------------------------------------------ |
| 1. Scope definition      | Operator + Council | List of questions/domains for panel review |
| 2. Documentation package | Council            | Architecture docs + relevant code excerpts |
| 3. Panel review          | External panelists | Written findings with testable claims      |
| 4. Code-level fact-check | Council            | Validated vs. Refuted analysis             |
| 5. Consolidated report   | Council            | Single findings doc with remediation plan  |
| 6. Operator briefing     | Council            | Answers to operator's direct questions     |

---

_Filed by the Council. Cycle 012: External Panel Launch Readiness Cross-Reference._
