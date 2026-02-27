# SDD 190 - Council Feature Review 24: `schema_versioning`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `schema_versioning`

Current registry posture:

1. Plane: `contract`
2. Lifecycle: `graduated`
3. Maturity: `3`
4. Fragility: `50`
5. Dependencies: none
6. Usage telemetry gap: `invocation_count_30d`, `adoption_ratio_30d`, and `success_rate_30d` are `null`

## 2. Internal implementation evidence reviewed

Council reviewed versioning mechanics and migration safety paths:

1. Startup migration runner imports baseline migration and validates manifest/state before applying (`server.mjs`, `migrations/001_baseline_schema_versions.mjs`).
2. Migration manifest validator enforces non-empty ordered manifests with dependency correctness (`modules/migration_registry.mjs`).
3. Migration state helper tracks checkpoints, partial failures, rollback requirements, and failure reasons (`modules/migration_state.mjs`).
4. Runner blocks execution when active partial failure exists and emits `config.migration.blocked_by_partial_failure` (`server.mjs`).
5. Ledger upcaster pipeline registers and applies schema transforms for workflow and friction records (`server.mjs`, `modules/workflow_run_metadata.mjs`).
6. Migration tests cover runner behavior, dry-run output, and fault-injection paths (`tests/migration-runner.test.mjs`, `tests/migration-dry-run.test.mjs`, `tests/migration-fault-injection.test.mjs`).

Internal strengths confirmed:

1. Schema evolution controls are machine-validated and test-covered.
2. Partial-failure handling is explicit and fail-closed.
3. Upcaster mechanism exists for backward compatibility on ledgers.

Observed implementation gaps:

1. Manifest currently includes only one baseline migration.
2. Upcaster coverage is not yet guaranteed for every future schema-bump class.
3. Usage telemetry fields remain null.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked versioning posture against contract-governance practices:

1. Azure architecture design principles reinforce explicit compatibility and evolvability boundaries.
2. Backstage descriptor pattern reinforces source-near lifecycle/ownership metadata.
3. GitHub protected branches reinforce merge-time safeguards for schema-sensitive changes.

Council inference:

1. Schema versioning base is production-capable.
2. Next leverage is broader migration and upcaster completeness guarantees.

## 4. Overlap and missing-capability assessment

Keep:

1. `schema_versioning` remains the contract-plane mechanism for data-shape continuity.

Avoid-overlap rule:

1. `config_migration` orchestrates migration execution; `schema_versioning` defines shape compatibility semantics.

Missing capability:

1. Automatic check that every declared schema bump has a matching upcaster and replay proof.

## 5. Council actions (prioritized)

1. Add upcaster coverage gate.
   - Owner: `council.contract`
   - Acceptance: CI fails if schema version increments without declared upcaster and replay evidence.
2. Expand migration manifest and dry-run evidence.
   - Owner: `council.control`
   - Acceptance: additional real migrations include dry-run report and rollback checkpoint proof.
3. Add schema-evolution dashboard slice.
   - Owner: `council.state`
   - Acceptance: dashboard shows applied migrations, partial-failure count, and upcaster invocation stats.
4. Populate usage telemetry fields.
   - Owner: `council.experience`
   - Acceptance: usage_signals reflect migration/upcaster activity each cycle.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `schema_version_contracts_with_upcaster_chain`
   - `versioned_contract_registry`
   - `schema_compatibility_with_upcasters`
   - `ownership_enforced_at_merge`
   - `adr_backed_change_history`
3. `source_refs.notes` should be updated to mark deep re-review pass.

## 7. Disposition

1. Keep feature active.
2. Prioritize upcaster coverage gating and migration depth.
3. Continue recursive loop to feature 25.

## External references

1. Azure architecture design principles: https://learn.microsoft.com/en-us/azure/architecture/guide/design-principles/
2. Backstage descriptor format: https://backstage.io/docs/features/software-catalog/descriptor-format
3. GitHub protected branches: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
