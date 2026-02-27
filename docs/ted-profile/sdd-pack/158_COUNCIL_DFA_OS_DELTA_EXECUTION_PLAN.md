# SDD 158 - Council Delta Execution Plan (DFA-OS Alignment Hardening)

Date: 2026-02-27
Status: Execution-ready
Parents: SDD 151, SDD 153, SDD 155, SDD 156, SDD 157

## 1. Purpose

Apply trusted-source deltas identified in the council research check so DFA-OS is:

1. Operationally executable (not advisory-only)
2. Release-gate enforceable
3. Connector-reliability aware
4. Context/transport policy-governed
5. MCP trust-tier controlled
6. Board-auditable with deterministic artifacts

## 2. Delta principles

1. Keep existing DFA-OS architecture; extend with policy contracts and runtime gates.
2. Prefer additive controls over breaking workflow changes.
3. Fail closed only after one advisory cycle.
4. Every new policy must have validator + CI + startup coverage.

## 3. Wave map (task-level)

## Wave R0 - Policy contract baseline

Dependencies: none.

Tasks:

1. Add `feature_operating_cadence_policy.json`.
2. Add `feature_release_gate_policy.json`.
3. Add `feature_decision_policy.json`.
4. Add `feature_activation_catalog.json`.
5. Add `connector_certification_matrix.json`.
6. Add `transport_policy.json`.
7. Add `context_policy.json`.
8. Extend `mcp_trust_policy.json` with trust-tier safety defaults.

Acceptance:

1. All new policy artifacts validate structurally.
2. Policy intent is machine-readable and versioned.

## Wave R1 - Validator and governance engine

Dependencies: R0.

Tasks:

1. Add module validators for all R0 policies.
2. Add release-gate evaluator (hard-fail + advisory warnings + reason codes).
3. Add feature decision queue generator with deterministic bucketing:
   - `RISK_REMEDIATION_NOW`
   - `VALUE_ACTIVATION_NOW`
   - `RESEARCH_BEFORE_BUILD`
   - `BACKLOG_MONITOR`
4. Add operating cadence status builder (daily/weekly/monthly health).
5. Add tests for validators and evaluator outputs.

Acceptance:

1. Release-gate and queue output are deterministic for same inputs.
2. Validation failures are explicit and actionable.

## Wave R2 - Runtime endpoint wiring

Dependencies: R1.

Tasks:

1. Add `/ops/feature-operating/status` (GET).
2. Add `/ops/feature-release-gate/evaluate` (POST).
3. Add `/ops/feature-priority-queue` (GET).
4. Persist ledgers:
   - `feature_operating_runs.jsonl`
   - `feature_release_gate.jsonl`
   - `feature_priority_queue.jsonl`
5. Emit events:
   - `feature.operating.daily.completed`
   - `feature.operating.weekly.completed`
   - `feature.operating.monthly.completed`
   - `feature.release_gate.evaluated`
   - `feature.priority_queue.generated`

Acceptance:

1. Endpoints return contract-stable payloads.
2. Ledger and event evidence exists for every run.

## Wave R3 - Startup and CI hardening

Dependencies: R2.

Tasks:

1. Extend startup validation to include all new policy artifacts.
2. Extend `validate-roadmap-master.mjs` to validate new artifacts.
3. Add `validate-feature-governance-policies.mjs`.
4. Wire CI feature-registry gate to include governance policy validation.
5. Update required-config test inventory.

Acceptance:

1. Misconfigured policy fails fast in startup and CI.
2. CI artifacts include release-gate summary JSON.

## Wave R4 - Boardroom narrative + docs

Dependencies: R3.

Tasks:

1. Publish execution log for R0-R3 with file-level evidence.
2. Publish board-ready recommendation delta summary.
3. Link transport/context/MCP controls to feature maturity narratives.

Acceptance:

1. Operator can explain policy state, gates, and current blockers from docs only.

## 4. Execution order

1. R0
2. R1
3. R2
4. R3
5. R4

Parallelization:

1. R0 policy authoring can run in parallel by artifact group.
2. R1 tests can be written while R2 endpoint wiring is in progress.

## 5. Definition of done

1. New policy contracts exist and validate.
2. Release gate and priority queue run in runtime and CI.
3. Cadence status endpoint is live and ledger-backed.
4. Event schema + route contracts cover new endpoints/events.
5. Sidecar tests pass and no regressions are introduced.

## 6. Immediate execution commitment

Council will execute waves R0 through R4 recursively in this order, with scoped housekeeping commits after each meaningful unit.
