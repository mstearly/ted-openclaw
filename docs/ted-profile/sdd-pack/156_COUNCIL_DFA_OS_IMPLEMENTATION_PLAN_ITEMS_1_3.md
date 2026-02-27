# SDD 156 - Council Implementation Plan for DFA-OS Items 1-3

Date: 2026-02-27
Status: Execution-ready plan
Parents: SDD 151, SDD 152, SDD 155

## 1. Scope

This plan operationalizes the three council directives:

1. Run DFA-OS as an operating loop, not static docs.
2. Make DFA-OS a release gate.
3. Use DFA-OS outputs to drive roadmap decisions.

## 2. Council intent

The system is now instrumented. The next objective is behavioral: force daily, weekly, and monthly decisions through DFA-OS artifacts so quality, risk, and value capture become predictable.

## 3. Implementation plan

## Track A - Operating loop (Item 1)

## Wave A0 - Cadence policy contract

Dependencies: none.

Tasks:

1. Add `sidecars/ted-engine/config/feature_operating_cadence_policy.json` with daily/weekly/monthly jobs.
2. Define run windows, owners, and escalation SLA per cadence.
3. Add validator `scripts/ted-profile/validate-feature-operating-cadence.mjs`.
4. Add startup config validation hook for cadence policy.
5. Add CI check for cadence policy validator.

Acceptance:

1. Cadence policy is schema-valid and startup/CI enforced.
2. Every cadence job has owner and SLA.

## Wave A1 - Daily loop automation

Dependencies: A0.

Tasks:

1. Add scheduler run for `GET /ops/feature-health?force=1` once daily.
2. Persist daily run evidence to `artifacts/governance/feature_operating_runs.jsonl`.
3. Emit event `feature.operating.daily.completed`.
4. Add run-failure escalation event `feature.operating.daily.failed`.
5. Add read endpoint `/ops/feature-operating/status` for latest cadence run health.

Acceptance:

1. Daily feature health runs automatically.
2. Failure is visible and auditable in ledger/events.

## Wave A2 - Weekly loop automation

Dependencies: A1.

Tasks:

1. Add scheduler run to generate low-usage brief weekly.
2. Run `scripts/ted-profile/generate-low-usage-opportunity-brief.mjs` automatically.
3. Append summary row to `feature_operating_runs.jsonl`.
4. Emit event `feature.operating.weekly.completed`.
5. Add operator reminder payload for unresolved low-usage opportunities.

Acceptance:

1. Weekly opportunity brief is produced without manual execution.
2. Unresolved opportunities are tracked week-over-week.

## Wave A3 - Monthly loop automation

Dependencies: A2.

Tasks:

1. Run board summary generator monthly.
2. Produce `docs/ted-profile/sdd-pack/153_COUNCIL_DFA_OS_BOARD_SUMMARY.md` on cadence.
3. Emit event `feature.operating.monthly.completed`.
4. Require board summary to include top fragility, top opportunities, and trigger queue deltas.
5. Add stale-artifact warning if monthly summary older than 35 days.

Acceptance:

1. Board-ready reporting runs on schedule.
2. Staleness is automatically flagged.

## Track B - Release gate (Item 2)

## Wave B0 - Release gate policy definition

Dependencies: none.

Tasks:

1. Add `sidecars/ted-engine/config/feature_release_gate_policy.json`.
2. Define hard fail rules:
   - changed feature with `fragility_score >= freeze threshold`,
   - changed feature with missing QA/security mappings,
   - strategic feature with open research trigger and no approved research delta artifact.
3. Define soft warning rules for advisory mode.
4. Add validator script and tests.
5. Add policy to startup/CI validation chain.

Acceptance:

1. Release gate policy is machine-readable and validated.
2. Hard fail and warning rules are explicit.

## Wave B1 - CI enforcement script

Dependencies: B0.

Tasks:

1. Add `scripts/ted-profile/evaluate-feature-release-gate.mjs`.
2. Detect changed feature IDs from git diff + feature registry mappings.
3. Evaluate release-gate conditions using latest health/opportunity/trigger ledgers.
4. Output deterministic JSON summary and non-zero exit on hard fail.
5. Publish CI artifact `feature-release-gate-summary.json`.

Acceptance:

1. CI fails deterministically on gate violations.
2. Every failure includes machine-readable reason codes.

## Wave B2 - Progressive enforcement rollout

Dependencies: B1.

Tasks:

1. Run advisory-only for one cycle and collect false positives.
2. Tune thresholds/weights once with evidence.
3. Switch policy to hard enforcement mode.
4. Add override workflow requiring operator reason + ticket reference.
5. Emit event `feature.release_gate.override.used`.

Acceptance:

1. Hard gate is active with low-noise thresholds.
2. Every override is auditable.

## Track C - Roadmap decision engine (Item 3)

## Wave C0 - Decision scoring model

Dependencies: none.

Tasks:

1. Add `sidecars/ted-engine/config/feature_decision_policy.json`.
2. Define score model combining fragility risk, maturity, and opportunity value.
3. Add class buckets:
   - `RISK_REMEDIATION_NOW`,
   - `VALUE_ACTIVATION_NOW`,
   - `RESEARCH_BEFORE_BUILD`,
   - `BACKLOG_MONITOR`.
4. Add validator and tests.
5. Add policy docs in SDD pack.

Acceptance:

1. Scoring logic is explicit and reproducible.
2. Every feature can be classified into one decision bucket.

## Wave C1 - Priority queue artifact

Dependencies: C0, B1.

Tasks:

1. Add `scripts/ted-profile/generate-feature-priority-queue.mjs`.
2. Generate `docs/ted-profile/sdd-pack/FEATURE_PRIORITY_QUEUE.md` weekly.
3. Include top 5 risk-remediation items and top 5 activation items.
4. Include owner, recommended task, and target evidence.
5. Emit event `feature.priority_queue.generated`.

Acceptance:

1. Weekly queue exists and is evidence-backed.
2. Queue entries are directly actionable.

## Wave C2 - Roadmap linkage

Dependencies: C1.

Tasks:

1. Add import path from priority queue into roadmap candidate intake.
2. Tag roadmap tasks with source (`dfa_os_risk`, `dfa_os_value`, `dfa_os_research`).
3. Require at least one weekly roadmap update sourced from DFA-OS queue.
4. Add governance check for stale queue-to-roadmap linkage.
5. Emit event `feature.roadmap_linkage.updated`.

Acceptance:

1. DFA-OS outputs materially influence roadmap updates.
2. Stale or ignored queue items are visible and escalated.

## 4. Integrated execution order

1. A0 -> A1 -> A2 -> A3
2. B0 -> B1 -> B2
3. C0 -> C1 -> C2

Parallelization guidance:

1. A0 and B0 can run in parallel.
2. C0 can run in parallel with A1/B1 once policies are stable.

## 5. Definition of done

1. Daily/weekly/monthly loops run automatically and are auditable.
2. Feature-aware release gate blocks unsafe changes in CI.
3. Roadmap intake is demonstrably driven by DFA-OS outputs.

## 6. First 10 executable tasks (immediate)

1. Create `feature_operating_cadence_policy.json`.
2. Create `feature_release_gate_policy.json`.
3. Create `feature_decision_policy.json`.
4. Build and wire cadence policy validator.
5. Build and wire release gate policy validator.
6. Build and wire decision policy validator.
7. Implement daily scheduler run + operating run ledger.
8. Implement release gate evaluator script + CI artifact publishing.
9. Implement priority queue generator script.
10. Add `/ops/feature-operating/status` endpoint.
