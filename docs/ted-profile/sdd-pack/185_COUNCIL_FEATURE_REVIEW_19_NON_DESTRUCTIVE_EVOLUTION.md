# SDD 185 - Council Feature Review 19: `non_destructive_evolution`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `non_destructive_evolution`

Current registry posture:

1. Plane: `contract`
2. Lifecycle: `graduated`
3. Maturity: `3`
4. Fragility: `54`
5. Dependencies: `schema_versioning`, `config_migration`
6. Usage telemetry gap: `invocation_count_30d`, `adoption_ratio_30d`, and `success_rate_30d` are `null`

## 2. Internal implementation evidence reviewed

Council reviewed compatibility and migration controls that prevent destructive change:

1. `compatibility_policy.json` defines support window, deprecation notice requirements, compatibility classes, and release gates.
2. Runtime computes compatibility status surfaces and injects route deprecation notices via `applyRouteDeprecationNotice()` (`server.mjs`).
3. Deprecation notices emit auditable `policy.deprecation.notice_served` events (`server.mjs`).
4. Roadmap governance validator enforces compatibility/deprecation structure and fail-closed policy quality checks (`modules/roadmap_governance.mjs`).
5. Migration manifest/state artifacts maintain ordered migration execution and partial-failure state (`config/migration_manifest.json`, `config/migration_state.json`).
6. Startup validation blocks rollout when migration partial failure is active (`server.mjs`).

Internal strengths confirmed:

1. Compatibility and deprecation controls are explicit and machine-validated.
2. Change notices are surfaced to clients, not only internal logs.
3. Migration state is persisted with checkpoint and rollback context.

Observed implementation gaps:

1. Migration manifest currently has only one baseline migration.
2. Deprecation policy enforcement after sunset is policy-defined but minimally exercised in replay.
3. Registry usage telemetry remains null for this feature.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked evolution posture against platform-governance patterns:

1. Azure architecture design principles reinforce resilience and evolvability via explicit interface contracts.
2. Backstage descriptor model reinforces ownership/lifecycle metadata near source.
3. GitHub protected-branch controls reinforce enforceable merge-time governance for compatibility-sensitive changes.

Council inference:

1. Core non-destructive controls are in place.
2. Next leverage point is scaling migration and sunset enforcement depth, not adding new policy types.

## 4. Overlap and missing-capability assessment

Keep:

1. `non_destructive_evolution` should remain a contract-plane governance feature distinct from runtime self-healing.

Avoid-overlap rule:

1. `schema_versioning` handles data-shape evolution mechanics; `non_destructive_evolution` owns compatibility guarantees across routes/contracts.

Missing capability:

1. Strong replay coverage for deprecation sunset transitions and post-sunset fail-closed behavior.

## 5. Council actions (prioritized)

1. Expand migration manifest depth.
   - Owner: `council.contract`
   - Acceptance: at least one additional real migration path is codified and replay-validated.
2. Add deprecation sunset enforcement replay set.
   - Owner: `council.qa`
   - Acceptance: tests prove announced, pending, and enforced phases produce correct response contracts.
3. Add compatibility evidence bundle to release gates.
   - Owner: `council.control`
   - Acceptance: release requires compatibility report artifact plus replay proof.
4. Populate usage telemetry fields.
   - Owner: `council.state`
   - Acceptance: usage_signals for this feature are auto-computed each operating cycle.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `backward_compatible_upgrade_paths_and_safe_rollouts`
   - `versioned_contract_registry`
   - `schema_compatibility_with_upcasters`
   - `ownership_enforced_at_merge`
   - `adr_backed_change_history`
3. `source_refs.notes` should be updated to mark deep re-review pass.

## 7. Disposition

1. Keep feature active.
2. Prioritize sunset enforcement replay and broader migration depth.
3. Continue recursive loop to feature 20.

## External references

1. Azure architecture design principles: https://learn.microsoft.com/en-us/azure/architecture/guide/design-principles/
2. Backstage descriptor format: https://backstage.io/docs/features/software-catalog/descriptor-format
3. GitHub protected branches: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
