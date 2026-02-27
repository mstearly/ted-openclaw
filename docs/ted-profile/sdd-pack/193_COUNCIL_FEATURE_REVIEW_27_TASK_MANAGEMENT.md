# SDD 193 - Council Feature Review 27: `task_management`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `task_management`

Current registry posture:

1. Plane: `experience`
2. Lifecycle: `mature`
3. Maturity: `3`
4. Fragility: `58`
5. Dependencies: none
6. Usage telemetry gap: `invocation_count_30d`, `adoption_ratio_30d`, and `success_rate_30d` are `null`

## 2. Internal implementation evidence reviewed

Council reviewed task lifecycle coverage across commitments, GTD actions, and M365 surfaces:

1. Planner and To Do listing routes normalize task objects and emit `planner.task.*` and `todo.task.*` events (`server.mjs`).
2. Task creation/update helpers write through to Graph APIs and append task lifecycle events/ledgers (`server.mjs`).
3. Commitment extraction route converts email content into structured obligations with output-contract validation and fallback handling (`server.mjs`).
4. Reconciliation route proposes Planner/To Do writes for missing local commitments/actions and records proposal ledgers (`server.mjs`).
5. Proposal approval path is operator-gated and emits governance block events when approval headers are absent (`server.mjs`).
6. Registry runtime events include planner/todo/commitment/gtd categories for feature observability (`config/feature_registry.json`, `config/event_schema.json`).

Internal strengths confirmed:

1. Core task lifecycle spans capture, normalization, proposal, approval, and write execution.
2. Human approval is enforced before cross-system mutations.
3. Planner and To Do are both integrated into a single workflow model.

Observed implementation gaps:

1. Prioritization is still mostly implicit and lacks explicit policy scoring.
2. Reconciliation matching can drift due fuzzy title matching.
3. Usage telemetry fields remain null.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked task-management posture against modern co-work baselines:

1. Microsoft Planner API guidance reinforces explicit task-state lifecycle and assignment semantics.
2. Microsoft To Do API guidance reinforces personal-task normalization and list-level semantics.
3. Microsoft Graph best practices reinforce resilient, least-surprise task synchronization behavior.

Council inference:

1. Feature breadth is strong and competitive for core task operations.
2. Biggest value gap is intelligent prioritization and deterministic identity mapping.

## 4. Overlap and missing-capability assessment

Keep:

1. `task_management` should remain an experience-plane feature and not be collapsed into `reconciliation_engine`.

Avoid-overlap rule:

1. `reconciliation_engine` owns cross-system consistency; `task_management` owns operator-visible task semantics and workflows.

Missing capability:

1. Policy-driven priority scoring and queue ranking across commitments, GTD actions, Planner tasks, and To Do tasks.

## 5. Council actions (prioritized)

1. Add explicit priority scoring policy.
   - Owner: `council.experience`
   - Acceptance: task ranking uses urgency, due risk, and effort with explainable score components.
2. Add deterministic external mapping IDs.
   - Owner: `council.state`
   - Acceptance: task crosswalk keys reduce fuzzy-match drift in reconciliation.
3. Add operator backlog digest automation.
   - Owner: `council.control`
   - Acceptance: daily digest highlights stale/high-risk tasks with recommended next actions.
4. Populate usage telemetry fields.
   - Owner: `council.qa`
   - Acceptance: usage_signals derive from task route/event activity each cycle.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `unified_task_lifecycle_with_owner_and_due_date_accountability`
   - `assistant_in_context_user_workflows`
   - `meeting_and_task_summary_assistance`
   - `template_driven_onboarding_and_activation`
   - `operator_digest_with_actionable_next_steps`
3. `source_refs.notes` should be updated to mark deep re-review pass.

## 7. Disposition

1. Keep feature active.
2. Prioritize policy-scored prioritization and deterministic cross-system mapping.
3. Recursive loop completed for all 27 features.

## External references

1. Microsoft Graph Planner overview: https://learn.microsoft.com/en-us/graph/api/resources/planner-overview?view=graph-rest-1.0
2. Microsoft Graph To Do overview: https://learn.microsoft.com/en-us/graph/api/resources/todo-overview?view=graph-rest-1.0
3. Microsoft Graph best practices: https://learn.microsoft.com/en-us/graph/best-practices-concept
