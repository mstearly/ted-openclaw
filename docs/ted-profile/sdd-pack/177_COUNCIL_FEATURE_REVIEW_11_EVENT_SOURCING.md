# SDD 177 - Council Feature Review 11: `event_sourcing`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `event_sourcing`

Current registry posture:

1. Plane: `state`
2. Lifecycle: `mature`
3. Maturity: `4`
4. Fragility: `25`
5. Dependencies: none
6. Usage telemetry gap: all `usage_signals` fields are `null`

## 2. Internal implementation evidence reviewed

Council reviewed event write/read and schema-evolution behavior directly:

1. Central append-only event log is implemented through `appendEvent()` and called across domain routes; audit writes are dual-written via `appendAudit()` into `audit` ledger plus `audit.action` event.
2. Event envelope is canonicalized in `event_schema.json` with explicit envelope fields and a large typed taxonomy (279 event types currently defined).
3. JSONL append helper auto-seeds `_schema_version: 1`, and read paths apply upcasting via `upcastRecord()` when ledger names are provided.
4. Baseline upcaster registration covers the broad ledger surface (core ledgers + replay + improvement + ingestion + delivery) to normalize legacy v0 records.
5. Specialized upcasters exist for `workflow_runs` and `friction_rollups` to backfill workflow metadata deterministically (`modules/workflow_run_metadata.mjs`).
6. Compatibility policy explicitly requires upcaster + replay evidence for event-ledger schema-breaking changes (`compatibility_policy.json`).

Internal strengths confirmed:

1. Clear append-only discipline with dual-write audit/event behavior.
2. Practical schema-evolution pipeline already implemented (not just policy text).
3. Broad event taxonomy supports cross-plane traceability.

Observed implementation gaps:

1. Event log integrity is append-only but not tamper-evident (no hash-chain/signature verification on each record).
2. Event reads are file-based JSONL scans; no first-class projection/index layer for high-volume query surfaces.
3. Upcaster pipeline currently runs at schema version `1`; there is limited demonstrated multi-hop (`v1->v2->v3`) upgrade complexity coverage.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked against mature event-driven operating patterns:

1. Fowler event-sourcing guidance emphasizes event stream as source-of-truth with replayable state reconstruction.
2. Stripe idempotency guidance reinforces deterministic write semantics and replay-safe command handling.
3. OpenTelemetry event conventions reinforce consistent event contracts for observability and incident analysis.
4. LangGraph durable execution guidance reinforces explicit state persistence and resumability in multi-step agent workflows.

Council inference:

1. Core architecture is ahead of typical lightweight workflow stacks.
2. Highest-value delta is integrity + projection scalability, not core event-sourcing validity.

## 4. Overlap and missing-capability assessment

Keep:

1. `event_sourcing` remains a foundational state-plane capability and should not be collapsed into `schema_versioning`.

Avoid-overlap rule:

1. `schema_versioning` owns compatibility rules and migration policy; `event_sourcing` owns append-only fact capture and replay semantics.

Missing capability:

1. Tamper-evident event integrity and projection-grade query acceleration for growing ledgers.

## 5. Council actions (prioritized)

1. Add tamper-evident integrity chain for event log writes.
   - Owner: `council.state`
   - Acceptance: each event stores/verifies chained digest metadata and integrity check endpoint reports drift.
2. Add projection/index layer for high-read event surfaces.
   - Owner: `council.experience`
   - Acceptance: `events/stats` and `events/recent` can serve from maintained projections without full-file scans.
3. Expand upcaster compatibility test matrix.
   - Owner: `council.contract`
   - Acceptance: replay suite proves multi-version upcast paths and fail-closed behavior on missing upcasters.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `append_only_event_ledger_with_replay_controls`
   - `durable_execution_and_memory_state`
   - `event_sourced_traceability`
   - `idempotent_reconciliation_patterns`
   - `state_quality_feedback_loops`
3. `source_refs.notes` should be updated to mark this deep re-review as passed.

## 7. Disposition

1. Keep feature active.
2. Prioritize integrity and projection improvements before broadening event consumers.
3. Continue recursive loop to feature 12.

## External references

1. Event Sourcing (Fowler): https://martinfowler.com/eaaDev/EventSourcing.html
2. Stripe idempotent requests: https://docs.stripe.com/api/idempotent_requests
3. OpenTelemetry events semantic conventions: https://opentelemetry.io/docs/specs/semconv/general/events/
4. LangGraph overview: https://docs.langchain.com/oss/python/langgraph/overview
