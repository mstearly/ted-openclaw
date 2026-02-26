# SDD 91: Council Task-Level Wave Plan for SDD 89 and SDD 90

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parents:** SDD 89, SDD 90  
**Mandate:** Convert SDD 89 and SDD 90 into an execution-ready task board with dependency-ordered waves, acceptance criteria, and explicit friction-first analytics gates.

---

## 1. Program Goal

Deliver V1-V6 with D1-D8 deltas so Clint can run governed AI operations with:

1. Friction measured at run level and step level.
2. Evidence-driven optimization loops.
3. Safe connector/model governance.
4. Practical operator UX (no curl, no source edits for normal operations).

---

## 2. Wave Order (Council)

1. Wave A: D1 + D7 core (friction telemetry + outcomes surfaces)
2. Wave B: D5 baseline (connector admission and revalidation metadata)
3. Wave C: D8 setup wizard (post-install credentials, readiness gate)
4. Wave D: D2 replay harness + adversarial scenarios
5. Wave E: D3 workflow risk lint and explainability preview
6. Wave F: D4 memory confidence/harm controls
7. Wave G: D6 healing blast-radius boundaries and rollback triggers
8. Wave H: Consolidation, QA, and production readiness evidence

---

## 3. Task Board

## Wave A: Friction Telemetry and Outcomes Core

### A-001 Sidecar friction ledgers and telemetry hooks

1. Add friction ledgers under artifacts (`job_friction.jsonl`, `friction_rollups.jsonl`).
2. Emit per-step friction events during workflow execution.
3. Persist run-level friction rollups with derived metrics.

Acceptance:

1. Workflow run response contains `friction_summary`.
2. Friction events are queryable by workflow/run/trace.

### A-002 Sidecar outcomes APIs

1. Add `GET /ops/friction/summary`.
2. Add `GET /ops/friction/runs`.
3. Add `GET /ops/outcomes/dashboard`.
4. Add `GET /ops/outcomes/friction-trends`.
5. Add `GET /ops/outcomes/job/{job_id}`.

Acceptance:

1. APIs return stable response contracts with aggregate and drilldown data.
2. Dashboard recommendation derives from measured harmful drivers.

### A-003 Contracts and event taxonomy

1. Update route contracts for all new endpoints.
2. Add friction and outcomes event types to event schema.
3. Add route normalization and execution-boundary policy for new paths.

Acceptance:

1. Sidecar route handling and governance mode checks pass for new endpoints.

### A-004 Extension gateway methods

1. Add extension methods for friction summary/runs and outcomes endpoints.
2. Validate query/body parameter handling and safety bounds.

Acceptance:

1. UI can call all new endpoints through gateway methods.

### A-005 Ted UI outcomes surface

1. Add types and controller load methods.
2. Add new Execution Waves panel section for friction/outcomes.
3. Add buttons for summary, runs, trends, and per-job view.

Acceptance:

1. Operator can inspect friction and outcomes without curl.
2. Panel displays score, load, trend, and event evidence.

---

## Wave B: Connector Admission and Revalidation (D5 baseline)

### B-001 Trust policy schema extension

1. Add admission metadata fields (`attested_at`, `attestation_status`, `scope_verified`).
2. Add backward-compatible defaults.

Acceptance:

1. Existing configs load without migration breakage.

### B-002 Admission checklist endpoint

1. Add endpoint for connector admission validation result.
2. Include auth scope, trust tier, and test evidence summary.

Acceptance:

1. Non-attested connectors surface clear non-production reason.

### B-003 Periodic revalidation scaffold

1. Add scheduled revalidation pass placeholder with ledger records.
2. Expose last run status in UI.

Acceptance:

1. Revalidation status visible from Trust Center/Execution panel.

---

## Wave C: Post-Install Setup Wizard (D8)

### C-001 Sidecar setup state contract

1. Add setup state endpoint for Graph/provider readiness.
2. Add redacted diagnostics for missing credentials.

Acceptance:

1. Setup status clearly indicates what is missing and next action.

### C-002 Credential entry route (operator-driven)

1. Add secure write path for tenant/client/provider values via operator UI.
2. Store outside source and keep redaction-safe audit traces.

Acceptance:

1. No GUID/secret hardcoded in source; operator can enter after install.

### C-003 UI wizard

1. Build guided setup form and readiness checks.
2. Add “ready for live Graph smoke” indicator.

Acceptance:

1. Operator can complete setup end-to-end without editing files.

---

## Wave D: Replay and Adversarial Harness (D2)

### D-001 Golden task corpus

1. Define top job corpus (draft email, morning brief, meeting prep, commitments).
2. Add expected-output and expected-trajectory fixtures.

Acceptance:

1. Corpus is executable and versioned.

### D-002 Replay runner

1. Implement deterministic replay endpoint/script.
2. Capture pass/fail at output and trajectory levels.

Acceptance:

1. Replay results include per-step failure reasons.

### D-003 Adversarial pack

1. Add prompt-injection and tool contamination scenarios.
2. Add timeout cascade scenario.

Acceptance:

1. Safety failures are visible and block release when thresholds fail.

---

## Wave E: Workflow Risk Lint (D3)

### E-001 Risk lint engine

1. Validate risky nodes for missing approval checkpoints.
2. Emit explainability reasons before publish.

Acceptance:

1. High-risk workflow cannot publish without checkpoint.

### E-002 UI simulation upgrade

1. Show risk annotations and friction hotspot forecast.
2. Show policy explainability per node.

Acceptance:

1. Operator sees policy reason and friction forecast pre-run.

---

## Wave F: Memory Confidence and Harm Controls (D4)

### F-001 Memory confidence and decay policy

1. Add runtime thresholds and decay handling.
2. Add conflict resolution outcomes to audit/event logs.

Acceptance:

1. Runtime memory use is explainable and bounded by policy.

### F-002 Harm review queue

1. Add queue for contradictory/low-confidence memory influence.
2. Add operator review and override path.

Acceptance:

1. Operator can inspect and correct memory influence decisions.

---

## Wave G: Healing Blast-Radius Boundaries (D6)

### G-001 Playbook boundary policy

1. Add max entities/runs/config-drift limits.
2. Enforce dry-run shadow for new playbooks.

Acceptance:

1. No unbounded remediation actions possible.

### G-002 Auto rollback trigger

1. Trigger rollback when post-remediation friction worsens.
2. Persist rollback reason and evidence.

Acceptance:

1. Rollback events are auditable and linked to run traces.

---

## Wave H: Consolidation and Readiness

### H-001 Comprehensive QA pass

1. Build, tests, route contract verification.
2. Guided dry run with operator setup path.

Acceptance:

1. No regression across sidecar/extension/UI.

### H-002 Production evidence package

1. Live Graph smoke evidence and friction baseline.
2. Weekly friction-to-value report template.

Acceptance:

1. Council can certify production confidence with evidence.

---

## 4. Required Gates (All Waves)

1. `pnpm build` must pass.
2. New routes must be in route contracts.
3. Event types must be in event schema.
4. No hardcoded credential values.
5. Friction instrumentation must remain non-destructive and append-only.

---

## 5. Current Status

1. Wave A: In execution.
2. Waves B-H: Planned and queued by dependency.
