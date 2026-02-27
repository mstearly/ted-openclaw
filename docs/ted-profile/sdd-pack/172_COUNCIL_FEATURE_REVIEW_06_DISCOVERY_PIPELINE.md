# SDD 172 - Council Feature Review 06: `discovery_pipeline`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `discovery_pipeline`

Current registry posture:

1. Plane: `state`
2. Lifecycle: `graduated`
3. Maturity: `3`
4. Fragility: `58`
5. Dependencies: none
6. Usage telemetry gap: all `usage_signals` fields are `null`

## 2. Internal implementation evidence reviewed

Council reviewed runtime and policy behavior in detail:

1. Inbox ingestion enforces single-run lock, idempotent suppression, triage dedup checks, and quality evaluation events.
2. Discovery pipeline executes multi-surface scan phases (mail, calendar, planner, to-do) and writes discovery ledger snapshots.
3. Discovery quality scoring computes dedup precision, false-positive rate, candidate coverage, and entity-link confidence, then emits `discovery.quality.evaluated`.
4. Policy thresholds are externalized in `discovery_ingestion_quality_policy.json` and validated by test coverage.
5. Route contracts expose `/ops/ingestion/run`, `/ops/ingestion/status`, and `/ops/onboarding/discovery-status` for operational observability.
6. Replay and config tests enforce discovery/ingestion scenario presence (`golden_discovery_incremental_scan`, `adversarial_ingestion_duplicate_suppression`).

Internal strengths confirmed:

1. Quality metrics are explicitly computed and evented, not implicit.
2. There is governance coupling between policy thresholds and runtime reason codes.
3. Discovery and ingestion are already separated as two distinct operational loops.

Observed implementation gaps:

1. Policy requires incremental scan cursor, but runtime discovery currently uses time-window scans and does not persist Graph delta query tokens.
2. Candidate extraction still relies heavily on keyword heuristics for deal and commitment discovery.
3. `/ops/onboarding/discover` route contract has no required response fields, which weakens contract quality for automation clients.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked against leading modern patterns:

1. Microsoft Graph delta query guidance emphasizes persisted cursors for efficient incremental synchronization and lower replay drift.
2. Slack enterprise search patterns emphasize unified cross-surface discovery experiences with relevance controls.
3. Atlassian Rovo positions search plus agent context grounding as a core productivity loop.
4. LangGraph guidance reinforces durable execution and explicit state persistence for multi-step agent workflows.

Council inference:

1. Existing design has strong quality gating.
2. Highest value gap is incremental cursor durability plus semantic ranking, not additional raw ingestion endpoints.

## 4. Overlap and missing-capability assessment

Keep:

1. `discovery_pipeline` remains distinct from `ingestion_pipeline`; discovery is broad context mapping, ingestion is continuous message intake.

Avoid-overlap rule:

1. Do not move ingestion duplicate-suppression logic into discovery; discovery should consume ingestion quality signals, not duplicate them.

Missing capability:

1. Persistent incremental sync cursor and semantic candidate ranking for lower false-negative risk.

## 5. Council actions (prioritized)

1. Add cursor-based incremental discovery state.
   - Owner: `council.state`
   - Acceptance: discovery stores and advances per-surface delta tokens and reports cursor freshness.
2. Add semantic candidate ranking layer.
   - Owner: `council.experience`
   - Acceptance: candidate scoring combines keyword and semantic signals; quality report includes semantic precision metric.
3. Tighten route contract for discovery run endpoint.
   - Owner: `council.contract`
   - Acceptance: `POST /ops/onboarding/discover` contract includes required fields (`ok`, `discovery`, `quality`, `run_id`).
4. Add triage-correction feedback loop into discovery quality.
   - Owner: `council.governance`
   - Acceptance: reclassifications update discovery false-positive/false-negative calibration.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `signal_discovery_with_precision_recall_guardrails`
   - `durable_execution_and_memory_state`
   - `event_sourced_traceability`
   - `idempotent_reconciliation_patterns`
   - `state_quality_feedback_loops`
3. `source_refs.notes` should remain completed with this deep re-review as canonical evidence.

## 7. Disposition

1. Keep feature active.
2. Prioritize incremental-cursor and semantic ranking upgrades before adding new discovery surfaces.
3. Continue recursive loop to feature 07.

## External references

1. Microsoft Graph delta query overview: https://learn.microsoft.com/en-us/graph/delta-query-overview
2. Slack search in your organization: https://slack.com/help/articles/202528808-Search-in-Slack
3. Atlassian Rovo guided tour: https://www.atlassian.com/software/rovo/guided-tour
4. LangGraph overview: https://docs.langchain.com/oss/python/langgraph/overview
