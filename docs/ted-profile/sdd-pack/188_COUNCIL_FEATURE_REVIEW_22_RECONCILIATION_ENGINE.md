# SDD 188 - Council Feature Review 22: `reconciliation_engine`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `reconciliation_engine`

Current registry posture:

1. Plane: `state`
2. Lifecycle: `graduated`
3. Maturity: `3`
4. Fragility: `60`
5. Dependencies: `m365_integration`
6. Usage telemetry gap: `invocation_count_30d`, `adoption_ratio_30d`, and `success_rate_30d` are `null`

## 2. Internal implementation evidence reviewed

Council reviewed reconciliation mechanics, governance gates, and drift handling:

1. `/graph/{profile_id}/sync/reconcile` compares local commitments/actions against remote Planner and To Do states (`server.mjs`).
2. Reconciliation builds dedup keys from prior proposal ledger entries to prevent duplicate write proposals (`server.mjs`).
3. Partial service failures produce `sync.reconciliation.service_failed` signals and return `status=partial` instead of silent success (`server.mjs`).
4. Proposals are persisted and surfaced through `sync.write.proposed|approved|executed` events and sync ledger records (`server.mjs`).
5. Approval flow requires explicit operator confirmation header and emits governance block events when missing (`server.mjs`).
6. Evaluation graders include `reconciliation_drift` schema checks for `drift_items` and `proposed_writes` (`config/evaluation_graders.json`).

Internal strengths confirmed:

1. Reconciliation is proposal-based and approval-gated, reducing destructive sync risk.
2. Drift evidence is auditable and replayable.
3. Partial-failure signaling prevents false health assumptions.

Observed implementation gaps:

1. Matching logic is title-substring based and vulnerable to false matches/misses.
2. Deterministic external mapping IDs are not consistently used.
3. Usage telemetry fields remain null.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked reconciliation posture against integration reliability standards:

1. Microsoft Graph best practices reinforce resilient network behavior and conservative mutation semantics.
2. Microsoft Graph delta-query guidance reinforces incremental drift detection over full polling.
3. OpenTelemetry event guidance reinforces contract-stable drift/proposal event streams.
4. NIST AI RMF emphasizes managed human oversight for high-impact cross-system writes.

Council inference:

1. Approval-gated proposal model is aligned with best practice.
2. Highest leverage is deterministic identity mapping and stronger matching precision.

## 4. Overlap and missing-capability assessment

Keep:

1. `reconciliation_engine` should remain separate from `task_management`; reconciliation owns cross-system consistency, not task semantics.

Avoid-overlap rule:

1. `m365_integration` handles connector transport; `reconciliation_engine` handles drift logic and write proposals.

Missing capability:

1. Stable external-ID mapping to replace fuzzy title-based matching.

## 5. Council actions (prioritized)

1. Add deterministic mapping keys.
   - Owner: `council.state`
   - Acceptance: proposals and drift checks use persistent local-to-remote IDs for Planner/To Do entities.
2. Add precision/recall replay metrics for matching.
   - Owner: `council.qa`
   - Acceptance: replay includes known-conflict corpora and reports match precision/recall.
3. Add reconciliation SLO slice.
   - Owner: `council.control`
   - Acceptance: dashboard shows drift volume, proposal backlog age, and approval latency.
4. Populate usage telemetry fields.
   - Owner: `council.experience`
   - Acceptance: `usage_signals` populate from reconcile/proposal activity.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `idempotent_task_reconciliation_with_etag_guards`
   - `human_approval_before_cross_system_writeback`
   - `sync_conflict_ledger_and_retry_window`
   - `idempotent_cross_system_reconciliation_with_conflict_handling`
   - `durable_execution_and_memory_state`
   - `event_sourced_traceability`
   - `idempotent_reconciliation_patterns`
   - `state_quality_feedback_loops`
3. `source_refs.notes` should be updated to mark deep re-review pass.

## 7. Disposition

1. Keep feature active.
2. Prioritize deterministic mapping and matching quality coverage.
3. Continue recursive loop to feature 23.

## External references

1. Microsoft Graph best practices: https://learn.microsoft.com/en-us/graph/best-practices-concept
2. Microsoft Graph delta query: https://learn.microsoft.com/en-us/graph/delta-query-overview
3. OpenTelemetry semantic events: https://opentelemetry.io/docs/specs/semconv/general/events/
4. NIST AI RMF 1.0: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
