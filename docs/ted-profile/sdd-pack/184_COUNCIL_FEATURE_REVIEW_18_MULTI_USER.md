# SDD 184 - Council Feature Review 18: `multi_user`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `multi_user`

Current registry posture:

1. Plane: `experience`
2. Lifecycle: `proposed`
3. Maturity: `0`
4. Fragility: `83`
5. Dependencies: none
6. Usage telemetry gap: `invocation_count_30d`, `adoption_ratio_30d`, and `success_rate_30d` are `null`

## 2. Internal implementation evidence reviewed

Council reviewed current operator identity posture and rollout assumptions:

1. Capability maturity explicitly marks `multi_user` as not present for current single-operator deployment (`config/capability_maturity.json`).
2. Rollout cohorts are keyed to `operator_id` and currently pin internal cohort to `ted-local-operator` (`config/rollout_policy.json`, `modules/rollout_policy.mjs`).
3. Runtime default operator key is single-operator oriented (`OPERATOR_KEY=ted-local-operator` in `server.mjs`).
4. Registry marks feature as `proposed` with maturity `0` and high fragility `83` (`config/feature_registry.json`).
5. Competitive landscape artifact marks multi-user posture as behind across benchmark peers (`config/competitive_landscape.json`).

Internal strengths confirmed:

1. System already carries an `operator_id` dimension in rollout logic, which is useful scaffolding.
2. Governance model can gate user expansion through policy-controlled cohorts.

Observed implementation gaps:

1. No workspace/member/role model exists in state or contracts.
2. No RBAC policy artifact ties feature access to role scopes.
3. No multi-actor conflict semantics for shared drafts, tasks, or approvals.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked multi-user readiness against modern co-work patterns:

1. Notion sharing and permissions model reinforces explicit workspace/member role boundaries.
2. Jira permission model reinforces project-level permission granularity and least-privilege defaults.
3. Microsoft Entra RBAC guidance reinforces policy-managed role assignment and auditable privileges.

Council inference:

1. Current platform is intentionally single-operator and should stay that way until a real multi-operator mandate exists.
2. If activated, multi-user requires foundational architecture work, not incremental UI-only changes.

## 4. Overlap and missing-capability assessment

Keep:

1. `multi_user` should remain a distinct deferred feature to avoid accidental partial rollout.

Avoid-overlap rule:

1. Do not spread multi-user behavior into unrelated features (drafts/tasks/memory) before a unified identity and RBAC layer exists.

Missing capability:

1. Core identity, membership, role, and tenancy model with auditable permissions.

## 5. Council actions (prioritized)

1. Keep feature frozen unless explicit business trigger is approved.
   - Owner: `council.board`
   - Acceptance: no roadmap activation without signed multi-operator requirement and risk approval.
2. Draft multi-user architecture ADR bundle.
   - Owner: `council.architecture`
   - Acceptance: ADRs define workspace model, role hierarchy, access boundaries, and migration strategy.
3. Introduce RBAC policy artifact.
   - Owner: `council.control`
   - Acceptance: role-to-route mapping and deny-by-default checks exist before any user expansion.
4. Define collaboration conflict model.
   - Owner: `council.state`
   - Acceptance: deterministic semantics for concurrent draft/task/proposal edits are documented and test-covered.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `role_based_multi_operator_access_controls`
   - `assistant_in_context_user_workflows`
   - `meeting_and_task_summary_assistance`
   - `template_driven_onboarding_and_activation`
   - `operator_digest_with_actionable_next_steps`
3. `source_refs.notes` should be updated to mark deep re-review pass.

## 7. Disposition

1. Keep feature deferred/frozen.
2. Do not implement partial multi-user behavior before identity and RBAC foundation.
3. Continue recursive loop to feature 19.

## External references

1. Notion sharing and permissions: https://www.notion.so/help/sharing-and-permissions
2. Jira permission overview: https://www.atlassian.com/software/jira/guides/permissions/overview
3. Microsoft Entra RBAC custom roles overview: https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/custom-overview
