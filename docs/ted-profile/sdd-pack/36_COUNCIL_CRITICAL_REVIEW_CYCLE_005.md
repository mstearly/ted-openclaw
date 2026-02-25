# Council Critical Review — Cycle 005 (Full-Stack JTBD Audit)

**Generated:** 2026-02-22
**Triggered by:** Operator (Clint) rejection of current build
**Scope:** Every line of implementation audited against the stated Job To Be Done
**Verdict:** **RED — Stop the line**

---

## Operator Statement (Verbatim)

> "I reviewed the UI — buttons didn't work — the interfaces were not intuitive —
> it was a HOT mess."

The council takes this as a stop-the-line signal. The operator's trust is damaged.
Recovery requires honest assessment and visible, measurable progress on what matters.

---

## The Job To Be Done (Source: `01_CONTEXT_PRIMER.md`, `02_PRODUCT_BRIEF.md`)

Clint needs a secure executive assistant on Mac that:

1. **Reads Outlook inbox** to eliminate copy/paste
2. **Creates email drafts** in Outlook Drafts for review and send
3. **Proposes calendar holds** (tentative, never auto-send)
4. **Organizes deal work** (filing suggestions, deadline extraction, task capture)
5. **Runs reliably** on Mac with auto-start after reboot

The **primary acceptance metric** (30 days):

> The operator checks Outlook a few times per day and finds multiple high-quality
> drafts ready in `/Drafts/` for review and send.

The **canonical operator loop** (daily):

1. Morning brief generated from governed sources
2. Draft queue prioritized by risk and urgency
3. Operator approves, edits, or escalates
4. End-of-day digest records outcomes and unresolved items

---

## What Was Actually Built

### Roadmap Status (Source: `10_ROADMAP_JOB_BOARD.md`)

| Epic   | Description                               | Status         |
| ------ | ----------------------------------------- | -------------- |
| EPIC 0 | Baseline alignment                        | DONE           |
| EPIC 1 | Mac installer + auto-start                | **ALL TODO**   |
| EPIC 2 | Security hardening (Keychain, allowlists) | **ALL TODO**   |
| EPIC 3 | Sidecar tooling (chat-first UX)           | **ALL TODO**   |
| EPIC 4 | M365 draft-only workflows                 | **ALL TODO**   |
| EPIC 5 | Release & supportability                  | **ALL TODO**   |
| EPIC 6 | Operator value & friction governance      | **ALL TODO**   |
| EPIC 7 | Council co-work assurance                 | Partially DONE |
| EPIC 8 | Council remediation (JC-012+)             | Many DONE      |
| EPIC 9 | Operator UX hardening                     | Partially DONE |

**Every epic that delivers value to Clint (1–6) is entirely TODO.**

What was built instead: governance framework, council processes, UI dashboards about
governance metadata, proof scripts, and policy management surfaces.

### Sidecar Engine (Source: `sidecars/ted-engine/server.mjs` — 3,088 lines)

| Capability                               | JTBD Relevance | Status                                               |
| ---------------------------------------- | -------------- | ---------------------------------------------------- |
| **Read inbox emails**                    | PRIMARY        | **NOT IMPLEMENTED** — no GET to `/me/messages`       |
| **Create email drafts**                  | PRIMARY        | Implemented — real Graph API POST                    |
| **Calendar read**                        | HIGH           | Implemented — real Graph API GET                     |
| **Calendar holds (tentative)**           | HIGH           | **NOT IMPLEMENTED** — no POST to `/me/events`        |
| **Morning brief**                        | PRIMARY        | **NOT IMPLEMENTED** — no endpoint exists             |
| **End-of-day digest**                    | PRIMARY        | **NOT IMPLEMENTED** — no endpoint exists             |
| **Deadline extraction**                  | HIGH           | **NOT IMPLEMENTED** — no parsing logic               |
| **Email filing**                         | HIGH           | Audit-only — suggestions recorded but never executed |
| Auth (device code flow)                  | Supporting     | Implemented — real OAuth 2.0                         |
| Auth boundary enforcement                | Supporting     | Implemented — Bearer token validation                |
| Governance (role cards, bans, contracts) | Meta           | Implemented — real logic                             |
| Triage ingestion                         | Supporting     | Implemented — JSONL ledger                           |
| Idempotency                              | Supporting     | Implemented — replay detection                       |
| Execution boundaries                     | Meta           | Implemented — mode enforcement                       |
| Ops pause/resume/rate                    | Meta           | Implemented — state-based blocking                   |

**Of the 5 primary operator needs, only 1 is implemented (draft creation).
The operator has no way to use even that one from the UI.**

### Graph Profile Configuration

Both M365 profiles (`olumie` and `everest`) have **empty tenant_id and client_id**
in `/config/graph.profiles.json`. Even draft creation cannot work until these are
configured — which requires a setup flow that does not exist in the UI.

### Ted UI (Source: `ui/src/ui/views/ted.ts` — 1,730 lines)

| Surface                | What It Shows                                  | JTBD Relevance |
| ---------------------- | ---------------------------------------------- | -------------- |
| Summary cards          | Sidecar health, job card counts, friction KPIs | Meta           |
| Operator workflow card | Approval surface labels                        | Meta           |
| Integration health     | M365 profile auth status + start/poll/revoke   | Supporting     |
| Recommended actions    | Accept/ignore recommendations about governance | Meta           |
| Job card list          | Job card status, dependencies, KPIs            | Meta           |
| Job card detail        | Markdown editor, KPI suggestions, proof runner | Meta           |
| Threshold controls     | Friction KPI threshold sliders                 | Meta           |
| Policy center          | Raw policy doc viewer/editor                   | Meta           |
| Intake wizard          | Job card creation from templates               | Meta           |
| Approval queue         | Governance decision ledger                     | Meta           |
| KPI history            | Eval pass/fail history                         | Meta           |

**The UI is a development governance console. It does not enable any of the four
core user journeys (email draft loop, filing suggestions, deadlines, setup wizard).**

Buttons are technically wired — the handler code exists and executes. But what the
buttons do is manipulate governance metadata (job cards, policies, thresholds), not
perform the operator's actual work (drafting emails, filing, scheduling).

### Proof Scripts (Source: `scripts/ted-profile/proof_jc*.sh`)

Two categories of proof scripts exist:

**Category A — Real behavioral tests** (make HTTP calls, check responses):

- `proof_jc013.sh` (auth boundary) — sends requests, checks 401/200/400
- `proof_jc016.sh` (fast repair) — sends requests, checks timing and deny fields

**Category B — String-presence checks** (grep for text in source files):

- `proof_jc019.sh` — rg for "registerGatewayMethod" strings
- `proof_jc033.sh` — checks file exists + rg for UI strings
- `proof_jc046.sh` — rg for strings, says "proof placeholder"
- `proof_jc047.sh` — rg for strings, says "proof placeholder"

The majority of "DONE" job cards were closed based on Category B proofs: the proof
verifies that a string exists in source code, not that the feature works. This is
**narrative confidence disguised as proof** — the exact failure mode the SDD process
was designed to prevent.

---

## Council Interrogation (All 8 Seats)

### Seat 1: Agentic AI Systems Architect

**Domain verdict: RED**

- The workflow-vs-agent boundary contract (`18_WORKFLOW_AGENT_BOUNDARY_CONTRACT.md`)
  was written and JC-012 closed — but the boundary governs **governance routes**, not
  product workflows. There is no boundary contract for the actual JTBD workflows
  (inbox scan → draft → approve → file) because those workflows do not exist yet.
- Token budget controls are irrelevant: there are no AI model calls in the sidecar.
  The "executive assistant" does not call any LLM. All intelligence is deferred.
- Tool surface minimization is well-done for the governance layer but moot because
  the operator cannot use the system for its stated purpose.

**SDD verdict: AMBER**

- Specs exist for governance features.
- Specs for JTBD workflows (EPIC 3, 4) exist but have zero implementation.
- Proof scripts for governance features pass (as string-presence checks).

**Key finding:** The architect designed boundaries for the wrong system. The governed
system (governance metadata management) is not the system the operator needs (email
assistant).

---

### Seat 2: Human Factors and Cognitive Load Researcher

**Domain verdict: RED**

- The UI increases cognitive load rather than reducing it. The operator sees:
  governance metrics, job card dependency graphs, friction KPI thresholds, policy
  document editors, proof runner output — none of which help draft an email or
  file a message.
- Fast repair (<10s) was proven for governance routes (`/governance/repair/simulate`),
  not for the actual operator correction flow (editing a bad draft, fixing a
  misfiled email).
- Progressive disclosure is absent: the UI exposes all governance internals
  immediately with no novice/expert separation.
- Onboarding does not exist: there is no setup wizard, no guided first-run, no
  "get started" experience.
- The five cognitive load buckets from `16_COUNCIL_EXPANSION_AND_COWORK_REVIEW.md`
  (triage, memory, context switching, decision framing, emotional overhead) are
  **all still fully present** — the system has not removed any of them because
  the system does not perform the operator's job.

**SDD verdict: RED**

- The value/friction gate spec (`15_VALUE_AND_FRICTION_GATES.md`) states:
  "Capabilities that do not improve the canonical operator loop are deferred."
  The governance console does not improve the operator loop. It should have been
  deferred in favor of EPIC 3–4 implementation.

**Key finding:** The system was built for the developer, not the operator.

---

### Seat 3: Orchestration Engineer

**Domain verdict: AMBER**

- Idempotency, retry, and resume mechanisms are real and well-implemented in the
  sidecar for the routes that exist.
- Ops pause/resume/dispatch controls work.
- However, there is no orchestration for the actual JTBD workflows:
  - No scheduled morning brief job
  - No inbox scan → draft generation pipeline
  - No end-of-day digest aggregation
  - No filing execution after approval
- The orchestration layer orchestrates governance checks, not product workflows.

**SDD verdict: AMBER**

- Orchestration specs exist for governance routes.
- JTBD orchestration (EPIC 4) is specced but unimplemented.

**Key finding:** The plumbing is solid but connected to the wrong fixtures.

---

### Seat 4: Evals Specialist and Quality Lead

**Domain verdict: RED**

- JC-015 (offline eval regression gate) is marked DONE. The proof script checks
  that an eval directory and runner script exist.
- However, the eval corpus covers governance route behavior — not draft quality,
  not filing accuracy, not deadline extraction precision.
- There are no evals for the primary acceptance metric: "≥ 5 useful drafts/day"
  with "≥ 50% sent with minimal edits."
- There is no measurement infrastructure for the stated success metrics.

**SDD verdict: RED**

- The eval spec says coverage for "drafting/extraction/contradiction routing
  regressions." Contradiction routing has evals. Drafting and extraction do not
  because those features are not implemented.

**Key finding:** You cannot eval what you have not built.

---

### Seat 5: Security and Compliance Lead

**Domain verdict: GREEN**

- Auth boundary enforcement is real and tested with behavioral proof scripts.
- Loopback-only sidecar binding is enforced.
- Execution mode (DETERMINISTIC vs ADAPTIVE) boundaries are enforced.
- Audit trail is comprehensive (242 entries in JSONL ledger).
- No secrets in plaintext files (token store uses macOS Keychain with memory
  fallback).

**SDD verdict: AMBER**

- Security specs exist and implementation matches.
- Keychain-first secret storage (OC2.1) is TODO in the roadmap but actually
  implemented in the sidecar's token store. Roadmap status is stale.

**Key finding:** Security posture is the one area where governance investment has
paid off. However, securing a system that does not perform its job is a limited
achievement.

---

### Seat 6: Product Lead

**Domain verdict: RED**

- The three highest-value workflows (email draft loop, filing, calendar holds)
  are entirely unimplemented.
- The primary acceptance metric ("≥ 5 useful drafts/day") is unmeasurable because
  the system cannot produce drafts from the operator's inbox.
- The 30-day success criteria are unachievable with the current build.
- The cost model is undefined: no AI model calls exist, so cost-per-workflow is
  technically zero — but so is the value delivered.
- There is no rollback plan because there is nothing to roll back: the product
  features were never shipped.
- Time has been spent on governance framework (EPIC 7–9) instead of product
  delivery (EPIC 1–6). This is a prioritization failure.

**SDD verdict: RED**

- The value/friction gate spec explicitly states: "Capabilities that do not
  improve this loop are deferred." Governance console features were promoted
  ahead of the operator loop. The SDD process was followed in form (specs →
  tasks → proofs) but violated in spirit (governance meta-work was prioritized
  over operator value).

**Key finding:** The project optimized for process completeness over product
delivery. 49 job cards have been created and many closed — but the operator
cannot draft a single email.

---

### Seat 7: Data Privacy and Information Governance (NEW)

**Domain verdict: AMBER**

- No personal data is currently being processed because inbox reading is not
  implemented. Privacy risk is low by default.
- When inbox reading is implemented, this seat becomes critical: email content
  is personal data, and the data flow (M365 → sidecar → operator surface)
  must be governed.
- Graph API scopes include `Mail.ReadWrite` — appropriate for draft creation
  but requires careful minimization when inbox reading is added.
- No data inventory exists for planned personal data processing.

**SDD verdict: AMBER**

- No spec for personal data handling exists yet, but no personal data is
  processed yet either. This must be specced BEFORE inbox reading is implemented.

**Key finding:** Privacy is safe by accident (nothing works yet). Must be safe
by design before EPIC 4 implementation begins.

---

### Seat 8: Platform Reliability Engineer (NEW)

**Domain verdict: RED**

- Mac installer does not exist (EPIC 1 is entirely TODO).
- Auto-start after reboot does not exist.
- No SLO targets are defined or measurable.
- No runbooks exist for sidecar recovery.
- No monitoring or alerting infrastructure.
- Sidecar health endpoints work but there is no production deployment to monitor.
- Graph profile configuration is empty (stub tenant_id / client_id).

**SDD verdict: RED**

- Reliability specs exist in the roadmap but have zero implementation.

**Key finding:** The system is not deployable. An operator cannot install, configure,
or run it on their Mac.

---

## Interrogation Scorecard

| Seat                 | Domain | SDD   | Key Finding                                | Carry-Forward? |
| -------------------- | ------ | ----- | ------------------------------------------ | -------------- |
| Agentic AI Architect | RED    | AMBER | Boundaries govern wrong system             | Yes            |
| Human Factors        | RED    | RED   | Built for developer, not operator          | Yes            |
| Orchestration        | AMBER  | AMBER | Plumbing connected to wrong fixtures       | Yes            |
| Evals Specialist     | RED    | RED   | Cannot eval what you haven't built         | Yes            |
| Security Lead        | GREEN  | AMBER | Security posture is solid                  | No             |
| Product Lead         | RED    | RED   | Process completeness over product delivery | Yes            |
| Data Privacy         | AMBER  | AMBER | Safe by accident, not by design            | Yes            |
| Platform Reliability | RED    | RED   | System not deployable                      | Yes            |

**Overall posture: RED — Stop the line.**

---

## Root Cause Analysis

The project exhibits a pattern the council names **"governance theater"**:

1. The SDD recursive loop was followed in form: specs were written, job cards
   created, proof scripts run, decision logs updated, council interrogation
   cycles completed.

2. But the loop was applied to **governance meta-work** (council processes,
   proof frameworks, UI dashboards about governance) rather than **product
   work** (reading email, creating drafts, filing, briefing).

3. The proof scripts reinforced this by allowing string-presence checks
   (`rg` for code patterns) to count as "proof pass" — giving the appearance
   of rigor without behavioral validation.

4. The result: 49 job cards, 4 interrogation cycles, 41 proof scripts, 34 SDD
   documents — and the operator cannot draft a single email.

This is not a failure of governance. The governance framework is well-designed.
It is a failure of **what was governed**. The system governed itself instead of
governing the product.

---

## Council Remediation Order (Mandatory — Dependency Strict)

The council unanimously agrees: **all governance meta-work is frozen**. Every
resource shifts to delivering the operator's JTBD. The following cards execute
in strict dependency order. No card promotes without a **behavioral** proof
(real HTTP calls, real Graph API responses, real operator-visible outcomes).

String-presence proof scripts (`rg` for code patterns) are **banned** for all
cards below. Every proof must make a real request and verify a real outcome.

### Phase 0: Unblock (Can't build without this)

**JC-056: Graph profile configuration and auth completion**

- Configure real tenant_id and client_id for at least one M365 profile
- Complete device code auth flow end-to-end
- Proof: `/graph/{profile}/status` returns `authenticated: true` with real token
- Blocks: everything below

### Phase 1: Core Loop (Read → Draft → Approve)

**JC-057: Inbox reading endpoint**

- Implement `GET /graph/{profile}/mail/list` with filters (unread, date range, folder)
- Return normalized message list (id, subject, from, received, snippet)
- Proof: real Graph API call returns real inbox messages
- Blocks: JC-058, JC-060

**JC-058: Inbox scan → draft generation pipeline**

- Implement orchestration: read inbox → select candidates → generate draft replies
- This requires an LLM integration decision (which model, where, how)
- Each draft created via existing `/graph/{profile}/mail/draft/create`
- Proof: given inbox messages, system creates drafts in Outlook Drafts folder
- Blocks: JC-059

**JC-059: Draft review and approval UI**

- Add draft queue surface to Ted UI (or chat fallback)
- Operator sees pending drafts with context (original message, draft content)
- Operator can approve (no-op, draft stays), edit (opens in Outlook), or dismiss
- Proof: operator-visible draft list with working approve/dismiss controls
- Blocks: Phase 2

**JC-060: Morning brief endpoint**

- Implement `/reporting/morning-brief`
- Aggregates: overnight unread count, urgent items, upcoming calendar (next 24h),
  deal activity summary
- Proof: real aggregation from live M365 data + sidecar state
- Blocks: none (parallel with JC-058)

### Phase 2: Organize (File → Extract → Hold)

**JC-061: Email filing execution**

- Upgrade filing suggestions from audit-only to executable
- Implement `POST /graph/{profile}/mail/{message_id}/move` to move messages
- Approval triggers real Outlook folder move
- Proof: approved filing suggestion results in message moved in Outlook

**JC-062: Deadline extraction**

- Implement NLP/LLM parsing of email threads for deadline candidates
- Surface extracted deadlines as proposals for operator review
- Proof: given an email thread with dates, system extracts deadline candidates

**JC-063: Calendar tentative holds**

- Implement `POST /graph/{profile}/calendar/event/create` for tentative events
- Proof: approved deadline proposal creates tentative calendar event in Outlook

**JC-064: End-of-day digest endpoint**

- Implement `/reporting/eod-digest`
- Aggregates: actions taken today, drafts created, items filed, approvals,
  unresolved triage items
- Proof: real aggregation of day's activity

### Phase 3: Deliver (Install → Run → Trust)

**JC-065: Mac installer (arm64 + intel)**

- Produce installable DMGs
- Proof: installer runs on macOS, app opens, sidecar starts

**JC-066: Auto-start on reboot (LaunchAgent)**

- Proof: reboot Mac, OpenClaw + sidecar running without manual intervention

**JC-067: Setup wizard (guided first-run)**

- Walk operator through: install → configure Graph profile → auth → first
  morning brief
- Proof: new operator completes setup without reading documentation

### Phase 4: Prove (Operator Trust Recovery)

**JC-068: Behavioral proof suite (replaces string-presence proofs)**

- Rewrite all Category B proof scripts to make real HTTP calls
- Every existing "DONE" job card re-validated with behavioral proofs
- Any card that fails behavioral proof is reopened
- Proof: all proof scripts execute real requests with real responses

**JC-069: Operator acceptance test**

- Run the primary acceptance metric test: 5 useful drafts in one business day
- Measure draft quality (% sent with minimal edits)
- Proof: operator session recording or structured feedback

---

## Stop-the-Line Conditions (Cycle 005)

1. **No governance meta-work** until JC-056 through JC-060 are complete.
2. **No string-presence proof scripts** for any card in this remediation program.
3. **No UI governance features** until the draft review surface (JC-059) ships.
4. **No new SDD documents** about SDD documents. Write specs for product features.
5. **Any card marked DONE without behavioral proof is automatically reopened.**

---

## Council Consensus Statement

The council acknowledges that the governance framework is well-designed and the
security posture is strong. These are real achievements.

But governance without a product to govern is theater. The operator hired this
system to draft emails and organize deals — not to manage job cards and tune
friction KPI thresholds.

The council's unanimous directive: **build the product first, then govern it.**

Every resource, every sprint, every proof script must now serve the question:
_Can Clint open Outlook and find useful drafts?_

Until the answer is yes, nothing else matters.
