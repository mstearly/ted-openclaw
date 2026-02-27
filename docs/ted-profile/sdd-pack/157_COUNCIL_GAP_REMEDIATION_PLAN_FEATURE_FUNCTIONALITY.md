# SDD 157 - Council Gap Remediation Plan: Features and Functionality

Date: 2026-02-27
Status: Execution-ready plan
Parents: SDD 151, SDD 153, SDD 155, SDD 156

## 1. Council review prompt

Question addressed: how do we solve the gaps observed in council learning after DFA-OS rollout?

## 2. Gaps identified

1. Capability-to-adoption gap: many features exist, but adoption and repeat usage are uneven.
2. Connector reality gap: external-service reliability risk remains the dominant fragility source.
3. Evidence quality gap: decisions are now ledger-driven, but signal quality and completeness must harden.
4. Operator narrative gap: features are technically present but not always framed as "jobs-to-be-done" outcomes.

## 3. Council recommendations by gap

## Gap 1 - Capability-to-adoption gap

Goal: convert underused mature features into repeatable operator value.

Plan:

1. Build feature activation catalog with workflow templates for top low-usage opportunities.
2. Add in-product nudges tied to role and current workload context.
3. Add "time-to-value" and repeat-use KPIs per feature.
4. Run monthly activation experiments with target deltas.
5. Keep only experiments with measurable improvement.

## Gap 2 - Connector reality gap

Goal: reduce runtime fragility from live integrations.

Plan:

1. Stand up connector certification matrix by provider (auth, pagination, retries, error classes).
2. Add connector-specific replay and canary suites for Monday, RightSignature, Graph, and MCP external connectors.
3. Add synthetic fault drills (token expiration, rate-limit, network jitter, malformed payloads).
4. Add per-connector SLO budget and automatic de-risking actions.
5. Gate promotion on connector reliability evidence, not implementation completeness.

## Gap 3 - Evidence quality gap

Goal: improve trust in DFA-OS scoring outputs.

Plan:

1. Add feature telemetry quality checks (event presence, schema compliance, cardinality sanity).
2. Add coverage tests asserting runtime_signals maps to emitted event families.
3. Add ledger consistency checks for health/opportunity/trigger cross-artifact coherence.
4. Add weekly score-drift review to identify noise or threshold miscalibration.
5. Version fragility formula changes and require before/after impact notes.

## Gap 4 - Operator narrative gap

Goal: keep feature execution aligned to Clint's jobs and outcomes.

Plan:

1. For each high-priority feature, attach explicit JTBD statement and expected outcome metric.
2. Surface a weekly operator digest: "what changed, why it matters, what to do next".
3. Add board-ready language in opportunity briefs (business value, blocker, next action).
4. Add a "feature usage coaching" section in monthly summary.
5. Track closure rate of coachable actions.

## 4. Remediation waves

## Wave G1 - Activation foundation

Dependencies: SDD 156 Track A daily/weekly loop active.

Tasks:

1. Create `feature_activation_catalog.json` with initial top 10 candidates.
2. Define experiment template and success criteria.
3. Add activation experiment tracker ledger.
4. Add weekly activation review script.
5. Add first board-ready activation brief section.

Acceptance:

1. Every low-usage high-value feature has an activation hypothesis.
2. Experiments are tracked with baseline and delta.

## Wave G2 - Connector certification hardening

Dependencies: G1.

Tasks:

1. Create `connector_certification_matrix.json`.
2. Add connector reliability test suite skeleton and fixtures.
3. Add live credential readiness checklist for each connector.
4. Add connector reliability summary generator for board packet.
5. Add promotion gate rule requiring connector certification status.

Acceptance:

1. Connector maturity is measured by live-behavior evidence.
2. Fragility for connector features becomes explainable and actionable.

## Wave G3 - Signal quality and score trust

Dependencies: G2.

Tasks:

1. Add telemetry quality validator script for feature events.
2. Add governance ledger consistency checker.
3. Add automated score-drift report (weekly).
4. Add advisory threshold tuning report.
5. Promote tuned thresholds after one stable cycle.

Acceptance:

1. Feature scores are trusted by council and operator.
2. False alarms are reduced and documented.

## Wave G4 - Operator coaching and narrative loop

Dependencies: G3.

Tasks:

1. Add weekly coaching digest generator from DFA-OS outputs.
2. Add board summary section mapping feature deltas to operator outcomes.
3. Add role-specific recommendations in UI card/tooling.
4. Add closure tracking for recommended actions.
5. Add monthly retrospective on adoption and friction reduction.

Acceptance:

1. Operator sees clear, actionable guidance weekly.
2. Feature usage and outcome KPIs show measurable upward trend.

## 5. Deep research round (targeted)

Required now for gap closure quality.

Research tracks:

1. Leading activation patterns for AI copilots in operations-heavy environments.
2. Reliability engineering patterns for API-heavy agent systems.
3. Metrics design for feature adoption and operator trust calibration.

Output requirement:

1. For each track, produce design deltas and concrete task updates to Waves G1-G4.
2. Update SDD 157 once with evidence-backed adjustments.

## 6. Immediate next actions

1. Start G1 Task 1-3 immediately.
2. Open G2 certification matrix scaffolding in parallel.
3. Schedule the targeted deep research round and enforce design-delta output.
4. Review updated plan with operator before enabling hard promotion gate changes.
