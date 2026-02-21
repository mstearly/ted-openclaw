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

### OC4.2 — Read inbox → create drafts

- Status: TODO
- Goal: Primary success metric.
- DoD:
  - system creates drafts in Outlook Drafts, never sends.
- Proof:
  - integration tests; screenshots optional.

### OC4.3 — Calendar tentative holds (proposal → approve → apply)

- Status: TODO
- Goal: Draft-only scheduling assistance.
- DoD:
  - propose holds; requires approval; applies draft holds.
- Proof:
  - approval gate proof; calendar entry visible.

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
