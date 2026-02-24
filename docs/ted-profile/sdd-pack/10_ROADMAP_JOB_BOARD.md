# Roadmap & Job Board — OpenClaw Ted Profile (Mac)

**Generated:** 2026-02-17

This is the implementation backlog expressed as **job cards** (proof-based).

Legend:

- Status: `TODO` | `IN_PROGRESS` | `DONE` | `BLOCKED`
- Each job must record: proof commands + evidence (CI run, logs, screenshots).

---

## EPIC 0 — Baseline Alignment

### OC0.1 — Confirm Baseline Decision (OpenClaw + Sidecar)

- Status: DONE
- Goal: Lock in architecture choice so we don't rebuild the wrong baseline.
- DoD:
  - Spec pack adopted (this pack becomes source of truth).
  - Repo skeleton matches architecture.
- Proof:
  - Architecture review sign-off in `11_DECISION_LOG.md`.

---

## EPIC 1 — Mac Installer + Auto-Start

### OC1.1 — Build macOS installers (arm64 + intel)

- Status: TODO
- Goal: Produce installable DMGs for both architectures.
- DoD:
  - CI produces two artifacts per release.
- Proof:
  - Download artifacts; verify `.app` bundles open.

### OC1.2 — Auto-start on login/reboot (LaunchAgent)

- Status: TODO
- Goal: Services survive restarts.
- DoD:
  - After reboot, OpenClaw + Ted Engine are running without manual intervention.
- Proof:
  - Reboot test evidence (doctor/status OK).

---

## EPIC 2 — Ted Profile Security Hardening

### OC2.1 — Keychain-first secret store (no secrets in files)

- Status: TODO
- Goal: Secrets/tokens never stored in plaintext config/state.
- DoD:
  - secret scan passes; deep security audit GREEN.
- Proof:
  - security audit output; grep/sanity checks.

### OC2.2 — Deny-by-default plugins/tools; allowlists

- Status: TODO
- Goal: Reduce blast radius.
- DoD:
  - tool allowlist and endpoint allowlist in place.
- Proof:
  - attempts to call non-allowlisted endpoint fail.

---

## EPIC 3 — Sidecar Tooling (OpenClaw → Ted Engine)

### OC3.1 — Implement `ted-sidecar` tool wrapper

- Status: TODO
- Goal: OpenClaw can safely call Ted Engine over loopback.
- DoD:
  - allowlist enforced; token mint works; per-call profile selection works.
- Proof:
  - unit test for loopback restriction + allowlist.

### OC3.2 — Chat-first UX for “draft email” and “daily brief”

- Status: TODO
- Goal: Operator can run core workflows from chat.
- DoD:
  - tool invoked from chat; result shown; drafts created.
- Proof:
  - integration test + manual proof.

---

## EPIC 4 — M365 Draft-Only Workflows (Phase 1)

### OC4.1 — Graph profile setup (two profiles)

- Status: TODO
- Goal: Configure two tenants.
- DoD:
  - device-code sign-in works for both; token cache in Keychain.
- Proof:
  - doctor shows Graph ready for both profiles.
- See JC-056 for detailed setup.

### OC4.2 — Read inbox → create drafts

- Status: TODO
- Goal: Primary success metric.
- DoD:
  - system creates drafts in Outlook Drafts, never sends.
- Proof:
  - integration tests; screenshots optional.
- See JC-057, JC-058, JC-059 for implementation.

### OC4.3 — Calendar tentative holds (proposal → approve → apply)

- Status: TODO
- Goal: Draft-only scheduling assistance.
- DoD:
  - propose holds; requires approval; applies draft holds.
- Proof:
  - approval gate proof; calendar entry visible.
- See JC-063 for implementation.

---

## EPIC 5 — Release & Supportability

### OC5.1 — Doctor/setup wizard parity for Ted Profile

- Status: TODO
- Goal: Non-engineer can self-diagnose.
- DoD:
  - doctor highlights missing configs; links to fix.
- Proof:
  - screenshot + test.

### OC5.2 — Release checklist + rollback procedure

- Status: TODO
- Goal: predictable shipping.
- DoD:
  - release docs + CI gates.
- Proof:
  - checklist used for a release.

---

## EPIC 6 — Operator Value and Friction Governance

### OC6.1 — Canonical operator loop is first-class

- Status: TODO
- Goal: Keep all Day-1 capability mapped to one operator flow.
- DoD:
  - Morning brief, draft queue, approval/escalation, and end-of-day digest are explicitly linked in spec/tasks/job cards.
- Proof:
  - Story and job-card traceability matrix shows each implemented slice maps to the loop.

### OC6.2 — Friction budget KPIs enforced

- Status: TODO
- Goal: Prevent shipping features that increase operator overhead.
- DoD:
  - Friction KPI thresholds are documented and release-blocking in gates.
- Proof:
  - Release evidence includes KPI snapshot and pass/fail decision.

### OC6.3 — Fail-closed explainability contract complete

- Status: TODO
- Goal: Every blocked action is actionable to operator.
- DoD:
  - "what blocked", "why", and "next safe step" fields are present for all deny paths.
- Proof:
  - Negative-path test outputs include reason code plus remediation guidance.

---

## EPIC 7 — Council Co-Work Assurance

### OC7.1 — Expanded council interrogation pass is mandatory

- Status: DONE
- Goal: prevent co-work quality regressions by enforcing expert interrogation before promotion.
- DoD:
  - All new permanent council seats participate in review with written findings.
  - Interrogation questions are answered for each promotion slice.
- Proof:
  - Council review artifact updated with findings and remediation decisions.

### OC7.2 — Workflow-vs-agent boundary contract

- Status: TODO
- Goal: minimize unsafe agentic behavior and unnecessary complexity.
- DoD:
  - Each promoted slice declares deterministic workflow path vs adaptive agent path.
- Proof:
  - Slice artifact includes boundary contract and negative-path tests.

### OC7.3 — Evals and fast-repair coverage

- Status: TODO
- Goal: ensure operator trust and correction speed at co-work scale.
- DoD:
  - Golden eval sets for drafting/extraction/escalation are active.
  - Fast repair (<10s correction flow) is tested for operator-facing slices.
- Proof:
  - Eval and fast-repair evidence attached to release gating.

---

## EPIC 8 — Council Cycle 001 Remediation Backlog (JC-012+)

### OC8.1 — JC-012 Workflow-vs-agent boundary contract

- Status: DONE
- Goal: make deterministic vs adaptive behavior explicit and enforceable.
- DoD:
  - Boundary contract artifact exists per promoted slice.
  - Undefined execution path fails closed with explainability fields.
- Proof:
  - `scripts/ted-profile/proof_jc012.sh`

### OC8.2 — JC-013 Sidecar auth boundary hardening

- Status: DONE
- Goal: enforce auth contract on all non-health sidecar routes.
- DoD:
  - Non-health routes require auth.
  - `/status` and `/doctor` remain unauthenticated health endpoints.
- Proof:
  - `scripts/ted-profile/proof_jc013.sh`

### OC8.3 — JC-014 Orchestration idempotency and resume integrity

- Status: DONE
- Goal: ensure retries and restarts do not duplicate side effects or lose intent.
- DoD:
  - Idempotency key + dedupe behavior enforced for write-like operations.
  - Retry/backoff and resume consistency are deterministic.
- Proof:
  - `scripts/ted-profile/proof_jc014.sh`

### OC8.4 — JC-015 Offline evals and regression gates

- Status: DONE
- Goal: add reproducible quality gates beyond endpoint smoke checks.
- DoD:
  - Gold eval corpus is versioned and runner is wired into release gates.
  - Regression below threshold blocks promotion.
- Proof:
  - `scripts/ted-profile/proof_jc015.sh`

### OC8.5 — JC-016 Fast-repair and explainability completion gate

- Status: DONE
- Goal: enforce sub-10-second operator correction flow and complete deny-path explainability.
- DoD:
  - Median fast-repair proof <= 10 seconds.
  - Deny-path contract fields present on all governed routes.
- Proof:
  - `scripts/ted-profile/proof_jc016.sh`

### OC8.6 — JC-017 Darwin packaging closure

- Status: BLOCKED
- Goal: close final mac installer gate on macOS runner.
- DoD:
  - Preflight and packaging pass on Darwin with artifact evidence.
- Proof:
  - `scripts/ted-profile/proof_jc017.sh`

### OC8.7 — JC-018 Ted discoverability and console visibility

- Status: DONE
- Goal: make Ted capabilities explicit when operator expects agents/skills visibility in console.
- DoD:
  - `/ted catalog` available from plugin command surface.
  - Discoverability metadata exposed additively via health payload.
  - No non-health auth boundary regression.
- Proof:
  - `scripts/ted-profile/proof_jc018.sh`

### OC8.8 — JC-019 Ted workbench dashboard surface

- Status: DONE
- Goal: reduce operator friction with a first-class Ted dashboard in Control UI.
- DoD:
  - `Ted` tab renders sidecar health, job-card status, friction KPIs, and council recommendations.
  - Dashboard remains read-only for Day-1 and preserves governance ceilings.
- Proof:
  - `scripts/ted-profile/proof_jc019.sh`

### OC8.9 — JC-020 Ted workbench data-source correctness

- Status: DONE
- Goal: restore trust in dashboard metrics by ensuring source discovery is runtime-safe.
- DoD:
  - Job-card totals are computed from discovered source of truth.
  - UI shows source diagnostics when discovery fails.
- Proof:
  - `scripts/ted-profile/proof_jc020.sh`

### OC8.10 — JC-021 Persona and role-card studio

- Status: DONE
- Goal: allow governed persona lifecycle directly in Ted UI.
- Proof:
  - `scripts/ted-profile/proof_jc021.sh`

### OC8.11 — JC-022 Job-card board and proof runner

- Status: DONE
- Goal: enable dependency-ordered build control from Ted UI.
- Proof:
  - `scripts/ted-profile/proof_jc022.sh`

### OC8.12 — JC-023 Governance console

- Status: TODO
- Goal: expose policy checks and explainability interactions in Ted UI.
- Proof:
  - `scripts/ted-profile/proof_jc023.sh`

### OC8.13 — JC-024 Ops control console

- Status: TODO
- Goal: expose pause/resume/rate/retry controls with fail-closed behavior.
- Proof:
  - `scripts/ted-profile/proof_jc024.sh`

### OC8.14 — JC-025 Triage and filing console

- Status: TODO
- Goal: consolidate triage/linkage/filing workflows in governed UI.
- Proof:
  - `scripts/ted-profile/proof_jc025.sh`

### OC8.15 — JC-026 Graph profile manager and diagnostics

- Status: TODO
- Goal: remove shell-only friction for profile auth and Graph diagnostics.
- Proof:
  - `scripts/ted-profile/proof_jc026.sh`

### OC8.16 — JC-027 Unified approval surface

- Status: TODO
- Goal: one certification surface for risky decisions.
- Proof:
  - `scripts/ted-profile/proof_jc027.sh`

### OC8.17 — JC-028 KPI and evals dashboard

- Status: TODO
- Goal: expose promotion gates as first-class operator metrics.
- Proof:
  - `scripts/ted-profile/proof_jc028.sh`

### OC8.18 — JC-029 Intake recommender and job-card draft studio

- Status: DONE
- Goal: reduce onboarding friction for new work with governed, structured job-card recommendations.
- Proof:
  - `scripts/ted-profile/proof_jc029.sh`

### OC8.19 — JC-030 Threshold governance and early unlock controls

- Status: DONE
- Goal: allow controlled threshold tuning to unlock value sooner with explicit warning and risk acknowledgement.
- Proof:
  - `scripts/ted-profile/proof_jc030.sh`

### OC8.20 — JC-031 UI surface inventory and gap map

- Status: DONE
- Goal: establish a complete, accepted inventory before additional UX redesign.
- Proof:
  - `scripts/ted-profile/proof_jc031.sh`

### OC8.21 — JC-032 Information architecture and interaction contract

- Status: DONE
- Goal: lock IA and interaction contracts to prevent ad hoc UI sprawl.
- Proof:
  - `scripts/ted-profile/proof_jc032.sh`

### OC8.22 — JC-033 Core task flow redesign

- Status: DONE
- Goal: reduce operator friction on inspect/decide/prove/intake loop.
- Proof:
  - `scripts/ted-profile/proof_jc033.sh`

### OC8.23 — JC-034 Governance and approval UX hardening

- Status: DONE
- Goal: unify approval and governance explainability surfaces.
- Proof:
  - `scripts/ted-profile/proof_jc034.sh`

### OC8.24 — JC-035 KPI and evals observability cockpit

- Status: DONE
- Goal: expose trend-based quality signals for promotion decisions.
- Proof:
  - `scripts/ted-profile/proof_jc035.sh`

---

## EPIC 9 — Operator UX Hardening (Cycle 003)

### OC9.1 — JC-036 Policy center pages (guided config)

- Status: TODO
- Goal: convert raw policy docs into structured editable surfaces with impact preview and audit.
- Proof:
  - `scripts/ted-profile/proof_jc036.sh`

### OC9.2 — JC-037 Structured job-card editor

- Status: TODO
- Goal: reduce markdown dependence for core job-card operations.
- Proof:
  - `scripts/ted-profile/proof_jc037.sh`

### OC9.3 — JC-038 Unlock simulator and risk forecaster

- Status: TODO
- Goal: make threshold consequences explicit before apply.
- Proof:
  - `scripts/ted-profile/proof_jc038.sh`

### OC9.4 — JC-039 KPI cockpit (card + portfolio)

- Status: TODO
- Goal: expose readiness and drift at a glance.
- Proof:
  - `scripts/ted-profile/proof_jc039.sh`

### OC9.5 — JC-040 Guided intake wizard

- Status: TODO
- Goal: plain-English intake with AI-generated safe starter configuration.
- Proof:
  - `scripts/ted-profile/proof_jc040.sh`

### OC9.6 — JC-041 Recommendation outcome attribution

- Status: DONE
- Goal: automatically attribute recommendation decisions to impacted cards for measurable learning.
- Proof:
  - `scripts/ted-profile/proof_jc041.sh`

### OC9.7 — JC-042 Per-card promotion confidence

- Status: DONE
- Goal: compute and surface per-card promotion confidence from proof, KPI, dependency, and recommendation outcome signals.
- Proof:
  - `scripts/ted-profile/proof_jc042.sh`

### OC9.8 — JC-043 Policy change impact attribution

- Status: DONE
- Goal: attribute policy deltas to affected work areas and expected KPI effects.
- Proof:
  - `scripts/ted-profile/proof_jc043.sh`

### OC9.9 — JC-046 Integration health and readiness plane

- Status: DONE
- Goal: expose profile-level integration readiness and remediation guidance in Ted UI.
- Proof:
  - `scripts/ted-profile/proof_jc046.sh`

### OC9.10 — JC-047 Operator flow and approval path clarity

- Status: DONE
- Goal: make approval and draft-review workflow surfaces explicit from Clint's seat.
- Proof:
  - `scripts/ted-profile/proof_jc047.sh`

### OC9.11 — JC-048 Connector auth controls in Ted UI

- Status: DONE
- Goal: enable profile auth recovery (start/poll/revoke) directly from Ted integration surface.
- Proof:
  - `scripts/ted-profile/proof_jc048.sh`

### OC9.12 — JC-049 Approval ledger correlation view

- Status: DONE
- Goal: correlate recommendation decisions to linked cards and confidence signals in one govern panel.
- Proof:
  - `scripts/ted-profile/proof_jc049.sh`

---

## EPIC 10 — Council Cycle 005 Remediation (JTBD Delivery)

### OC10.1 — JC-056 Graph profile configuration and auth completion

- Status: BLOCKED (needs operator Azure AD credentials)
- Goal: complete Graph profile auth so downstream M365 workflows can proceed.
- DoD:
  - Device-code sign-in completes for all required profiles.
  - Token cache persisted in Keychain; doctor confirms Graph ready.
- Proof:
  - Manual verification pending operator credentials.

### OC10.2 — JC-057 Inbox reading endpoint

- Status: DONE
- Goal: expose inbox reading as a governed sidecar endpoint.
- DoD:
  - Endpoint returns inbox messages with pagination and filtering.
  - Auth boundary and allowlist enforced.
- Proof:
  - `scripts/ted-profile/proof_jc057.sh`

### OC10.3 — JC-058 Inbox scan to draft generation pipeline

- Status: TODO
- Goal: automate the scan-to-draft pipeline for incoming messages.
- DoD:
  - Inbox scan triggers draft generation with operator-approved templates.
  - Pipeline is idempotent and resume-safe.
- Proof:
  - `scripts/ted-profile/proof_jc058.sh`

### OC10.4 — JC-059 Draft review and operator approval UI

- Status: IN_PROGRESS
- Goal: provide operator-facing draft review and approval surface.
- DoD:
  - Drafts are presented for review with accept/reject/edit actions.
  - Approval gate enforced; no send without explicit operator approval.
- Proof:
  - `scripts/ted-profile/proof_jc059.sh`

### OC10.5 — JC-060 Morning brief endpoint

- Status: DONE
- Goal: deliver a structured morning brief to the operator.
- DoD:
  - Endpoint returns prioritized summary of inbox, calendar, and pending actions.
  - Brief respects profile boundaries and governance ceilings.
- Proof:
  - `scripts/ted-profile/proof_jc060.sh`

### OC10.6 — JC-061 Email filing execution

- Status: DONE (sidecar+extension; UI pending)
- Goal: automate email filing into governed folder structure.
- DoD:
  - Filing executes via sidecar and extension.
  - Filing rules are auditable and reversible.
- Proof:
  - `scripts/ted-profile/proof_jc061.sh`

### OC10.7 — JC-062 Deadline extraction

- Status: DONE (sidecar+extension; UI pending)
- Goal: extract actionable deadlines from email and calendar content.
- DoD:
  - Deadlines are extracted, structured, and surfaced to operator.
  - Extraction is deterministic and auditable.
- Proof:
  - `scripts/ted-profile/proof_jc062.sh`

### OC10.8 — JC-063 Calendar tentative holds

- Status: DONE (sidecar+extension)
- Goal: create tentative calendar holds pending operator approval.
- DoD:
  - Holds are proposed as tentative; require explicit approval to confirm.
  - Calendar entry visible with governance metadata.
- Proof:
  - `scripts/ted-profile/proof_jc063.sh`

### OC10.9 — JC-064 End-of-day digest endpoint

- Status: DONE (sidecar+extension)
- Goal: deliver a structured end-of-day digest summarizing actions taken and pending items.
- DoD:
  - Endpoint returns digest covering sent drafts, filed items, pending approvals, and upcoming deadlines.
  - Digest respects profile boundaries.
- Proof:
  - `scripts/ted-profile/proof_jc064.sh`

### OC10.10 — JC-065 Mac installer (arm64 + intel)

- Status: TODO
- Goal: produce installable Mac artifacts for both architectures.
- DoD:
  - CI produces arm64 and intel installers per release.
  - Installer bundles open and pass preflight checks.
- Proof:
  - `scripts/ted-profile/proof_jc065.sh`

### OC10.11 — JC-066 Auto-start on reboot (LaunchAgent)

- Status: TODO
- Goal: ensure services survive restarts without manual intervention.
- DoD:
  - LaunchAgent configuration installed; services running after reboot.
  - Doctor/status confirms healthy state post-reboot.
- Proof:
  - `scripts/ted-profile/proof_jc066.sh`

### OC10.12 — JC-067 Setup wizard (guided first-run)

- Status: TODO
- Goal: provide a guided first-run experience for non-engineer operators.
- DoD:
  - Wizard walks through profile setup, auth, and initial configuration.
  - Wizard validates each step before proceeding.
- Proof:
  - `scripts/ted-profile/proof_jc067.sh`

### OC10.13 — JC-068 Behavioral proof suite (replaces string-presence proofs)

- Status: TODO
- Goal: upgrade proof infrastructure from string-presence checks to behavioral assertions.
- DoD:
  - Proof scripts validate behavior and outcomes, not just string matches.
  - Existing proofs migrated to behavioral format.
- Proof:
  - `scripts/ted-profile/proof_jc068.sh`

### OC10.14 — JC-069 Operator acceptance test

- Status: TODO
- Goal: end-to-end operator acceptance covering the full JTBD delivery loop.
- DoD:
  - Acceptance test exercises morning brief, draft queue, approval, filing, and end-of-day digest.
  - Test passes with operator sign-off.
- Proof:
  - `scripts/ted-profile/proof_jc069.sh`

---

## EPIC 11 — LLM Integration + Copilot Extension Agent

**Architecture:** SDD-42 (Copilot Extension Architecture) + SDD-43 (LLM Implementation Plan)
**Strategy:** Day 1 = Direct OpenAI API (Clint's ChatGPT Pro), Day 2 = MCP Server + Copilot Extension, Day 3 = Azure OpenAI for Everest HIPAA

### OC11.1 — JC-070 LLM Provider Infrastructure

- Status: TODO
- Goal: establish provider router, config, and selection logic in sidecar.
- DoD:
  - `config/llm_provider.json` created with OpenAI Direct default.
  - `routeLlmCall()` dispatches to correct provider per entity/job.
  - HIPAA blocking enforced for Everest on non-BAA providers.
  - `GET/POST /ops/llm-provider` routes operational.
  - Extension gateway methods `ted.llm.provider.get/set` registered.
- Proof:
  - `scripts/ted-profile/proof_jc070.sh`

### OC11.2 — JC-071 LLM-Enhanced Endpoints

- Status: TODO
- Goal: upgrade template-based endpoints to LLM-powered with graceful fallback.
- DoD:
  - Draft generation uses LLM with `draft_style.json` tone matching.
  - Morning brief includes LLM narrative synthesis.
  - EOD digest includes LLM summarization + next-day priorities.
  - Triage classification uses LLM when pattern confidence < 80%.
  - Deadline extraction merges regex + LLM results.
  - All endpoints fall back to template if LLM unavailable.
- Proof:
  - Behavioral tests for each enhanced endpoint.

### OC11.3 — JC-072 UI LLM Provider Selection

- Status: TODO
- Goal: allow Clint to view and change LLM provider from Ted UI.
- DoD:
  - LLM Provider card in Operate tab with default dropdown, per-entity status, per-job overrides.
  - Types, state, controller, view, and wiring all complete.
- Proof:
  - UI compile check (`npx tsc --noEmit`).

### OC11.4 — JC-073 MCP Server

- Status: TODO
- Goal: expose Ted capabilities as MCP tools for VS Code / JetBrains / Copilot Chat integration.
- DoD:
  - `/mcp` route handles Streamable HTTP transport.
  - Read-only tools (status, brief, digest, deals, mail, triage) registered.
  - Resources (config files, audit trail) exposed.
  - Draft-capable tools with governance gating registered.
- Proof:
  - `scripts/ted-profile/proof_mcp_tools.sh`

### OC11.5 — JC-074 Legacy Copilot Extension Webhook (Optional)

- Status: TODO
- Goal: SSE webhook for GitHub.com Copilot Chat integration.
- DoD:
  - `/copilot/webhook` route with signature verification and SSE protocol.
  - Intent classification and `copilotLlmCall()` to Copilot API.
  - Governance pipeline applied to all responses.
- Proof:
  - `scripts/ted-profile/proof_copilot_webhook.sh`

### OC11.6 — JC-075 LLM/MCP Proof Scripts

- Status: TODO
- Goal: behavioral proofs for all new LLM and MCP capabilities.
- DoD:
  - `proof_jc070.sh` verifies provider GET/POST routes.
  - `proof_mcp_tools.sh` verifies MCP tool listing and execution.
- Proof:
  - Scripts pass against running sidecar.

### OC11.7 — JC-076 Agent Tool Registration + Ted Agent (iMessage Value Flow)

- Status: TODO
- Goal: bridge Ted's capabilities into OpenClaw's agent system so they flow through iMessage and all channels. Create a dedicated Ted agent optimized for mobile operator use.
- DoD:
  - 8 read-only agent tools registered via `api.registerTool()` (status, brief, digest, mail, drafts, deadlines, deal list, deal get).
  - 5 write agent tools with confirmation gate (mail move, calendar create, deal CRUD).
  - `before_tool_call` governance hook enforces entity boundaries, hard bans, autonomy ladder, and write confirmation.
  - Ted Agent config template with minimal tool profile, mobile-optimized system prompt, and cron job templates for scheduled brief/digest delivery to iMessage.
  - All tools accessible to LLM agent during iMessage conversations.
- Proof:
  - `scripts/ted-profile/proof_jc076.sh` — verifies tool registration, read tool callable, write tool returns preview without confirmation, governance hook blocks cross-entity call.

---

## EPIC 12 — Operator Command Center (Meeting Lifecycle + Commitments + GTD)

**Architecture:** SDD-44 (Operator Command Center Architecture)
**Strategy:** Meeting prep packets + commitment tracking + GTD action management. All accessible via iMessage and UI.

### OC12.1 — JC-077 Meeting Lifecycle

- Status: TODO
- Goal: full meeting lifecycle management — prep packets before, debrief capture after, deliverable split (Ted-owned vs Clint-owned).
- DoD:
  - `GET /meeting/upcoming` returns enriched meeting list with attendee context, related deals, and open commitments.
  - `POST /meeting/prep/{event_id}` generates prep packet.
  - `POST /meeting/debrief` processes transcript/summary into structured deliverables.
  - Extension gateway methods and agent tools registered.
  - Meeting prep UI surface in Operate tab.
- Proof:
  - `scripts/ted-profile/proof_jc077_080.sh`

### OC12.2 — JC-078 Commitment Tracking

- Status: TODO
- Goal: track who-owes-what-to-whom across all entities and deals. Auto-extract from emails and meeting debriefs.
- DoD:
  - CRUD endpoints for commitments with follow-up draft generation.
  - LLM-powered commitment extraction from text.
  - Morning brief includes overdue commitments; EOD digest includes completion counts.
  - Extension gateway methods and agent tools registered.
- Proof:
  - `scripts/ted-profile/proof_jc077_080.sh`

### OC12.3 — JC-079 GTD Action Management

- Status: TODO
- Goal: structured next-actions and waiting-for lists bridging triage, deals, and commitments.
- DoD:
  - Actions and waiting-for JSONL ledgers with CRUD endpoints.
  - Bridge: triage ingest → action creation, deal tasks → GTD actions.
  - Extension gateway methods and agent tools registered.
- Proof:
  - `scripts/ted-profile/proof_jc077_080.sh`

### OC12.4 — JC-080 Enhanced Briefs

- Status: TODO
- Goal: morning brief and EOD digest include meeting, commitment, and action data.
- DoD:
  - Morning brief includes `meetings_today`, `commitments_snapshot`, `actions_snapshot`.
  - EOD digest includes completion counts for all new data types.
- Proof:
  - `scripts/ted-profile/proof_jc077_080.sh`

---

## EPIC 13 — Calendar Intelligence + PARA Filing

**Architecture:** SDD-44 (Operator Command Center Architecture)
**Strategy:** Time-block planning for protected deep work. PARA classification enhances existing filing system.

### OC13.1 — JC-081 Time-Block Planning

- Status: TODO
- Goal: generate daily time-block plans that protect deep work and sync to calendar with operator approval.
- DoD:
  - `POST /planning/timeblock/generate` produces proposed plan from task sources.
  - `POST /planning/timeblock/{plan_id}/apply` syncs approved plan to calendar.
  - `POST /planning/deep-work/protect` sets busy status on deep work blocks.
  - Daily Plan UI surface in Operate tab with approve controls.
  - Agent tools for iMessage access.
- Proof:
  - `scripts/ted-profile/proof_jc081_083.sh`

### OC13.2 — JC-082 PARA Filing Classification

- Status: TODO
- Goal: enhance filing suggestions with PARA taxonomy (Project/Area/Resource/Archive).
- DoD:
  - `config/para_rules.json` with classification rules.
  - `POST /filing/para/classify` returns PARA category with rationale.
  - `GET /filing/para/structure` returns current folder structure.
  - Filing suggestions include `para_category` and `para_path` fields.
- Proof:
  - `scripts/ted-profile/proof_jc081_083.sh`

### OC13.3 — JC-083 Deep Work Metrics

- Status: TODO
- Goal: track and report deep work hours, plan adherence, actual vs target.
- DoD:
  - `GET /reporting/deep-work-metrics` returns weekly metrics.
  - Morning brief includes "Deep work this week" line.
  - EOD digest includes "Deep work today" line.
- Proof:
  - `scripts/ted-profile/proof_jc081_083.sh`

---

## EPIC 14 — Adoption Engineering

**Architecture:** SDD-44 (Operator Command Center Architecture)
**Strategy:** Onboarding ramp, notification budget, trust dashboard. Design principles from BJ Fogg, James Clear, Nir Eyal.

### OC14.1 — JC-084 Notification Budget + Onboarding Ramp

- Status: TODO
- Goal: prevent feature overload on Day 1; enforce notification limits to prevent Ted from becoming noise.
- DoD:
  - `config/notification_budget.json` with daily push max, quiet hours, batch window.
  - `config/onboarding_ramp.json` with phased feature rollout over 6 weeks.
  - Sidecar enforces both configs before push notifications and feature exposure.
- Proof:
  - `scripts/ted-profile/proof_jc084_086.sh`

### OC14.2 — JC-085 Trust Dashboard

- Status: TODO
- Goal: surface operator trust signals — approval rate, edit rate, time saved, autonomy promotion eligibility.
- DoD:
  - `GET /reporting/trust-metrics` returns all metrics.
  - "Trust & Performance" card in Operate tab.
  - Autonomy promotion eligibility displayed.
- Proof:
  - `scripts/ted-profile/proof_jc084_086.sh`

### OC14.3 — JC-086 Progressive Disclosure in Briefs

- Status: TODO
- Goal: morning brief and EOD digest include headline (5-second) and summary (60-second) fields for iMessage delivery.
- DoD:
  - Brief responses include `headline` and `summary` fields.
  - iMessage delivery uses headline; UI renders progressive disclosure.
- Proof:
  - `scripts/ted-profile/proof_jc084_086.sh`
