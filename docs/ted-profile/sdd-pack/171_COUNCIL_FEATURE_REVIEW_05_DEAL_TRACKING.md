# SDD 171 - Council Feature Review 05: `deal_tracking`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `deal_tracking`

Current registry posture:

1. Plane: `experience`
2. Lifecycle: `mature`
3. Maturity: `3`
4. Fragility: `50`
5. Runtime signal family: `deal.*`
6. Usage telemetry gap: all `usage_signals` fields are `null`

## 2. Internal implementation evidence reviewed

Council reviewed the full deal workflow surface:

1. Deal create/update includes stage transition validation and idempotent create behavior.
2. Deal model includes important dates, investors, outside counsel, tasks, checklist, notes, and touch metadata.
3. Event dual-write exists to deal events ledger plus canonical event log (`deal.created`, `deal.stage.changed`, `deal.task.*`, etc.).
4. Stale-owner detection exists with thresholded check and `deal.owner.stale_check` event emission.
5. Retrospective generation compiles commitments, drafts, stage transitions, and timeline stats into per-deal learning artifact.
6. OIG update path exists for investor compliance status transitions.

Internal strengths confirmed:

1. Broad operational coverage for legal/transaction workflow.
2. Strong event taxonomy (`event_schema.json`) for downstream observability and automation.
3. Lifecycle continuity from intake to retrospective.

Observed implementation gaps:

1. No stage probability/forecasting model or weighted pipeline value metrics.
2. No stage-specific required fields or gating rules (for example mandatory compliance artifacts before stage advancement).
3. Minimal automation triggers on stage transitions (tasks/reminders are mostly manual route calls).
4. No dedicated high-depth test suite for deal route behavior under edge cases and concurrency.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked against leading sales and co-work workflow systems:

1. HubSpot emphasizes pipeline customization, required properties per stage, and stage-driven reporting.
2. Microsoft Dynamics sales process guidance emphasizes pipeline phase progression and chart-based forecast visibility.
3. Asana sales pipeline patterns emphasize collaborative pipeline execution using reusable project/task workflows.
4. Notion project management guidance emphasizes linked tasks, dependencies, and cross-view execution tracking.

Council inference:

1. Current feature is strong as a structured workflow record.
2. Primary value gap is predictive and automation depth, not CRUD breadth.

## 4. Overlap and missing-capability assessment

Keep:

1. `deal_tracking` should remain distinct as the transaction system-of-record feature.

Avoid-overlap rule:

1. `task_management` should remain generic cross-domain execution; deal-specific tasks stay in `deal_tracking` and sync outward through events instead of duplicated storage.

Missing capability:

1. Forecasting-grade pipeline intelligence (probability, expected close window, weighted value, and risk-adjusted backlog).

## 5. Council actions (prioritized)

1. Add stage probability and weighted value model.
   - Owner: `council.experience`
   - Acceptance: each deal stores `stage_probability` and `weighted_value`, surfaced in `GET /deals/list`.
2. Add stage-gate contracts with required evidence fields.
   - Owner: `council.contract`
   - Acceptance: stage transition validator blocks progression when required fields/artifacts are missing.
3. Add stage-trigger automations.
   - Owner: `council.state`
   - Acceptance: `deal.stage.changed` can auto-create scoped tasks/reminders and publish deterministic action traces.
4. Add dedicated route-level tests for deal workflow invariants.
   - Owner: `council.qa`
   - Acceptance: test suite covers stage transition validity, idempotency replay, stale-owner calculation, and retrospective generation.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `pipeline_visibility_and_next_best_action_guidance`
   - `assistant_in_context_user_workflows`
   - `meeting_and_task_summary_assistance`
   - `template_driven_onboarding_and_activation`
   - `operator_digest_with_actionable_next_steps`
3. `source_refs.notes` should remain completed with this deep re-review as canonical evidence.

## 7. Disposition

1. Keep feature active.
2. Prioritize forecasting and automation wave before adding new adjacent features.
3. Continue recursive loop to feature 06.

## External references

1. HubSpot deal pipelines: https://knowledge.hubspot.com/object-settings/set-up-and-customize-your-deal-pipelines-and-deal-stages
2. Microsoft Dynamics pipeline chart and sales process: https://learn.microsoft.com/en-us/dynamics365/sales/overview-sales-pipeline
3. Asana sales pipeline management template: https://asana.com/templates/sales-pipeline-management
4. Notion project management with dependencies and timelines: https://www.notion.com/product/projects
