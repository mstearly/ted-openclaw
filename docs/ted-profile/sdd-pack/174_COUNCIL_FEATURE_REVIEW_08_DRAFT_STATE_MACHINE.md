# SDD 174 - Council Feature Review 08: `draft_state_machine`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `draft_state_machine`

Current registry posture:

1. Plane: `state`
2. Lifecycle: `graduated`
3. Maturity: `3`
4. Fragility: `60`
5. Dependency: `event_sourcing`
6. Usage telemetry gap: all `usage_signals` fields are `null`

## 2. Internal implementation evidence reviewed

Council reviewed the draft lifecycle implementation end-to-end:

1. A formal, documented state machine exists in runtime with explicit transitions across `drafted`, `pending_review`, `edited`, `approved`, `executed`, `archived`, plus `retry_pending` and `dead_lettered` (`server.mjs`, Draft Queue State Machine block).
2. Route handlers enforce transitions and return deterministic `409 invalid_state_transition` errors when operators attempt illegal moves (`POST /drafts/{id}/submit-review|edit|approve|execute|archive`).
3. Approval and execution are operator-gated by header (`x-ted-approval-source=operator`), and policy violations emit `governance.operator_required.blocked`.
4. Execution path performs hard preflight checks (`graph_message_id`, `from_profile`, Graph auth), emits `draft.execute_failed` on failures, and only transitions to `executed` on confirmed Graph send.
5. Edit and archive actions are connected to learning loops: style deltas, correction signals, and correction-to-fixture auto generation (`evaluation.correction_fixture.created`).
6. Self-healing module watches approved drafts for zombie conditions and writes dead-letter state with explicit reasons (`stale_draft`, `no_graph_message_id`) via `self_healing.draft.*` events.
7. Contracts and event taxonomy exist for all draft routes/events (`route_contracts.json`, `event_schema.json`).

Internal strengths confirmed:

1. Strong human-approval gating before send.
2. Auditable transition/event chain for each draft.
3. Tight coupling with evaluation and self-healing feedback loops.

Observed implementation gaps:

1. `retry_pending` is declared in transition policy but no runtime path currently writes that state.
2. `dead_lettered` transitions are scheduler-driven only; there is no dedicated operator remediation endpoint.
3. Queue state reconstruction is ledger-replay based for every read (`buildDraftQueueState`), which can become expensive as draft history grows.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked the feature against modern stateful workflow and approval patterns:

1. LangGraph guidance emphasizes explicit state graphs and durable execution for long-running human/agent workflows.
2. Microsoft Power Automate approvals guidance emphasizes explicit pending/approved/rejected control points before irreversible actions.
3. GitHub review workflows reinforce role-gated approvals before merge/execution outcomes.
4. OpenTelemetry event conventions reinforce consistent event naming and lifecycle observability as operating primitives.

Council inference:

1. Current design is directionally aligned with modern gated-workflow patterns.
2. Highest-value gap is retry/dead-letter operational ergonomics and scale optimization, not lifecycle semantics.

## 4. Overlap and missing-capability assessment

Keep:

1. `draft_state_machine` remains distinct from `email_handling`; this feature governs state transitions and execution control.

Avoid-overlap rule:

1. `email_handling` should produce draft candidates, but all send eligibility and transition legality stays owned by `draft_state_machine`.

Missing capability:

1. First-class remediation loop for dead-lettered drafts (`retry`, `rebind`, `dismiss`, `escalate`) with SLA tracking.

## 5. Council actions (prioritized)

1. Implement explicit retry state path.
   - Owner: `council.state`
   - Acceptance: `draft.execute_failed` transient errors write `retry_pending`, bounded retries are attempted, and retry outcomes are evented.
2. Add dead-letter operations endpoint set.
   - Owner: `council.experience`
   - Acceptance: operator can list/filter/retry/resolve dead-lettered drafts via governed routes with audit events.
3. Add queue snapshot/index optimization.
   - Owner: `council.state`
   - Acceptance: `GET /drafts/queue` does not require full ledger replay for steady-state reads and preserves correctness under append-only writes.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `stage_gated_draft_lifecycle_with_auditability`
   - `durable_execution_and_memory_state`
   - `event_sourced_traceability`
   - `idempotent_reconciliation_patterns`
   - `state_quality_feedback_loops`
3. `source_refs.notes` should be updated to mark this deep re-review as passed.

## 7. Disposition

1. Keep feature active.
2. Prioritize retry/dead-letter operations before new draft-channel expansion.
3. Continue recursive loop to feature 09.

## External references

1. LangGraph overview: https://docs.langchain.com/oss/python/langgraph/overview
2. LangGraph memory: https://docs.langchain.com/oss/python/langgraph/memory
3. Microsoft approvals in Power Automate: https://learn.microsoft.com/en-us/power-automate/approvals-get-started
4. GitHub pull request review workflow: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/getting-started/helping-others-review-your-changes
5. OpenTelemetry events semantic conventions: https://opentelemetry.io/docs/specs/semconv/general/events/
