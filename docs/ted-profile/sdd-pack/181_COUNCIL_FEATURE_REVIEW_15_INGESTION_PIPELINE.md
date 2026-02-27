# SDD 181 - Council Feature Review 15: `ingestion_pipeline`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `ingestion_pipeline`

Current registry posture:

1. Plane: `state`
2. Lifecycle: `graduated`
3. Maturity: `3`
4. Fragility: `57`
5. Dependencies: none
6. Usage telemetry gap: `invocation_count_30d`, `adoption_ratio_30d`, and `success_rate_30d` are `null`

## 2. Internal implementation evidence reviewed

Council reviewed ingestion controls across scheduler, runtime gates, and policy artifacts:

1. `scheduler` executes `inbox_ingestion` every 5 minutes on weekdays (`ted_agent.json`) and applies minute-level dedup before dispatch (`modules/scheduler.mjs`).
2. Ingestion quality policy enforces thresholds for idempotency, duplicate suppression, parse-error ceiling, and PII redaction requirements (`config/discovery_ingestion_quality_policy.json`).
3. Runtime ingestion cycle computes and emits `ingestion.quality.evaluated`, `ingestion.duplicate.blocked`, and `ingestion.cycle.completed` with measured suppression rate and reasons (`server.mjs`).
4. Discovery stage computes dedup precision, false-positive rate, and coverage, then emits `discovery.quality.evaluated` (`server.mjs`).
5. Replay assertions include duplicate-delivery detection and mutation-block checks in connector drills (`server.mjs`).
6. Policy schema validation fails closed on malformed `discovery_ingestion_quality_policy.json` at startup (`server.mjs`).

Internal strengths confirmed:

1. Idempotency and duplicate suppression are both policy-defined and runtime-measured.
2. Ingestion quality emits explicit reason codes, making drift diagnosable.
3. Scheduler and ingestion controls form an auditable control loop.

Observed implementation gaps:

1. Quality threshold failures emit telemetry but do not yet hard-freeze ingestion by policy.
2. Per-feature usage telemetry fields in registry remain null, limiting adoption analysis.
3. Delta-cursor adoption is partial across ingestion-related surfaces.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked ingestion posture against modern co-work and connector reliability patterns:

1. Microsoft Graph delta-query guidance reinforces incremental state sync over repeated full scans.
2. Microsoft Graph throttling guidance reinforces adaptive retry and backoff as first-class ingestion controls.
3. OpenTelemetry event conventions reinforce stable ingestion event contracts for cross-system observability.
4. NIST AI RMF reinforces measurable control-loop operations for high-impact automation paths.

Council inference:

1. Ingestion control foundations are strong and already measurable.
2. Highest leverage is converting threshold failures from advisory signals into governed enforcement actions.

## 4. Overlap and missing-capability assessment

Keep:

1. `ingestion_pipeline` should remain separate from `discovery_pipeline`; ingestion owns operational intake throughput and idempotency behavior.

Avoid-overlap rule:

1. `discovery_pipeline` decides what to discover; `ingestion_pipeline` decides how safely and repeatably intake is executed.

Missing capability:

1. Policy-driven automatic freeze/degrade mode when ingestion quality consistently breaches threshold.

## 5. Council actions (prioritized)

1. Add hard enforcement mode for ingestion quality breaches.
   - Owner: `council.control`
   - Acceptance: repeated below-threshold suppression or parse metrics trigger deterministic freeze/degraded mode and governance event.
2. Complete delta-cursor normalization for ingestion-adjacent reads.
   - Owner: `council.connector`
   - Acceptance: ingestion routes document cursor source and replay evidence for no-regression sync behavior.
3. Add feature-level usage telemetry population.
   - Owner: `council.state`
   - Acceptance: registry `usage_signals` fields auto-populate from ingestion events each cycle.
4. Add ingestion SLO dashboard card.
   - Owner: `council.experience`
   - Acceptance: operator view shows suppression rate, parse error rate, and recent breach reason codes.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `incremental_ingestion_with_duplicate_suppression`
   - `durable_execution_and_memory_state`
   - `event_sourced_traceability`
   - `idempotent_reconciliation_patterns`
   - `state_quality_feedback_loops`
3. `source_refs.notes` should be updated to mark deep re-review pass.

## 7. Disposition

1. Keep feature active.
2. Prioritize enforcement-mode upgrade before raising ingestion autonomy.
3. Continue recursive loop to feature 16.

## External references

1. Microsoft Graph delta query: https://learn.microsoft.com/en-us/graph/delta-query-overview
2. Microsoft Graph throttling guidance: https://learn.microsoft.com/en-us/graph/throttling
3. OpenTelemetry semantic events: https://opentelemetry.io/docs/specs/semconv/general/events/
4. NIST AI RMF 1.0: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
