# SDD 191 - Council Feature Review 25: `self_healing`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `self_healing`

Current registry posture:

1. Plane: `control`
2. Lifecycle: `graduated`
3. Maturity: `4`
4. Fragility: `40`
5. Dependencies: `event_sourcing`, `governance_choke_point`
6. Usage telemetry gap: `invocation_count_30d`, `adoption_ratio_30d`, and `success_rate_30d` are `null`

## 2. Internal implementation evidence reviewed

Council reviewed autonomous recovery logic and operator escalation controls:

1. Self-healing module exposes governance routes for status, circuit breakers, provider health, config drift reconcile, compaction, and proposal expiry (`modules/self_healing.mjs`).
2. Autonomy eligibility and demotion logic is implemented per task type with evented demotion triggers (`self_healing.autonomy.demotion_triggered`).
3. Engagement tracking and disengagement assessment are implemented with explicit telemetry (`self_healing.engagement.recorded`, `self_healing.disengagement.level_changed`).
4. Zombie draft detection and dead-letter handling protect queue integrity (`self_healing.draft.zombie_detected`, `self_healing.draft.dead_lettered`).
5. Scheduler job `self_healing_maintenance` runs daily and executes drift checks, proposal expiry, and zombie handling (`modules/scheduler.mjs`, `config/ted_agent.json`).
6. Status endpoint reports compaction and provider/circuit-breaker state for operator visibility.

Internal strengths confirmed:

1. Self-healing is broad, operational, and auditable.
2. Autonomy promotion/demotion logic is anchored to correction evidence.
3. Recovery operations are exposed through explicit control routes.

Observed implementation gaps:

1. Some zombie paths dead-letter without a controlled retry queue when token/context is missing.
2. Thresholds remain mostly hardcoded rather than fully policy-driven.
3. Registry usage telemetry remains null.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked self-healing posture against modern reliability guidance:

1. NIST AI RMF playbook reinforces monitored, governed recovery loops with explicit human override paths.
2. Google SRE alerting-on-SLO guidance reinforces measurable reliability targets and actionable alerts.
3. OpenTelemetry event conventions reinforce consistent recovery and failure event semantics.

Council inference:

1. Self-healing coverage is strong and production-oriented.
2. Next leverage is policy externalization and retry-quality hardening.

## 4. Overlap and missing-capability assessment

Keep:

1. `self_healing` remains a control-plane reliability feature and should not be merged into scheduler.

Avoid-overlap rule:

1. Scheduler triggers maintenance cadence; self-healing owns recovery policy and remediation actions.

Missing capability:

1. Policy-configurable retry queues and SLO-linked escalation thresholds.

## 5. Council actions (prioritized)

1. Externalize self-healing thresholds into policy artifact.
   - Owner: `council.control`
   - Acceptance: autonomy, drift, and zombie thresholds are loaded from config with startup validation.
2. Add retry-queue path for recoverable zombie drafts.
   - Owner: `council.state`
   - Acceptance: recoverable cases are retried before dead-letter and produce explicit retry outcome events.
3. Add self-healing SLO board.
   - Owner: `council.experience`
   - Acceptance: dashboard reports drift MTTR, dead-letter rate, and demotion triggers.
4. Populate usage telemetry fields.
   - Owner: `council.qa`
   - Acceptance: feature usage_signals derive from self-healing route and event volumes.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `autonomous_recovery_with_human_escalation_thresholds`
   - `policy_as_code_fail_closed_defaults`
   - `eval_driven_release_controls`
   - `human_approval_for_high_impact_changes`
   - `audit_reason_codes_and_traceability`
3. `source_refs.notes` should be updated to mark deep re-review pass.

## 7. Disposition

1. Keep feature active.
2. Prioritize policy externalization and retry hardening.
3. Continue recursive loop to feature 26.

## External references

1. NIST AI RMF playbook: https://airc.nist.gov/AI_RMF_Knowledge_Base/Playbook
2. Google SRE workbook alerting on SLOs: https://sre.google/workbook/alerting-on-slos/
3. OpenTelemetry semantic events: https://opentelemetry.io/docs/specs/semconv/general/events/
