# SDD 169 - Council Feature Review 03: `config_migration`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `config_migration`

Current registry posture:

1. Plane: `control`
2. Lifecycle: `graduated`
3. Maturity: `3`
4. Fragility: `48`
5. Dependencies: `schema_versioning`
6. Usage telemetry gap: all `usage_signals` fields are `null` (no observed adoption signal)

## 2. Internal implementation evidence reviewed

Council reviewed the concrete migration control path end-to-end:

1. Startup validation hard-fails on invalid migration manifest and on unresolved partial migration state (`server.mjs`, startup validation block and critical exit path).
2. Runtime migration runner writes atomic state updates, creates pre-migration backups, emits `config.migrated` on success, and emits `config.migration.failed` or `config.migration.blocked_by_partial_failure` on failure/lock.
3. Manifest validation enforces ordered sequence, no gaps, valid dependency graph, and registry parity (`modules/migration_registry.mjs`).
4. Migration state machine records checkpoint, applied, and failure metadata with explicit rollback checkpoint pointer (`modules/migration_state.mjs`).
5. Baseline migration is idempotent and uses atomic file writes for each config (`migrations/001_baseline_schema_versions.mjs`).
6. Dry-run report script exists, is deterministic, and is tested (`scripts/ted-profile/migration-dry-run-report.mjs`, `tests/migration-dry-run.test.mjs`).

Internal strengths confirmed:

1. Fail-closed safety on partial failures.
2. Deterministic ordering and dependency enforcement.
3. Audit-grade migration events and state snapshots.

Observed implementation gaps:

1. Manifest currently defines only one migration (`migration_manifest.json`), so there is no exercised multi-step dependency chain in production.
2. No operator-facing rollback command endpoint exists; rollback metadata is captured but execution is manual.
3. No staged migration class model (for example pre-start versus post-deploy classes).

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council compared implementation against primary-source migration practices:

1. Kubernetes deprecation guidance emphasizes predictable version transitions and migration-before-removal discipline.
2. GitLab migration guidance separates normal and post-deployment migrations to reduce deploy-time risk in production.
3. Stripe API versioning guidance emphasizes explicit compatibility windows and controlled upgrade transitions instead of silent breaking changes.
4. OpenTelemetry semantic event conventions reinforce consistent event contracts for migration observability and incident triage.

Council inference:

1. Current implementation is strong on safety and traceability.
2. Biggest delta to top-tier practice is migration lifecycle policy depth, not core runner correctness.

## 4. Overlap and missing-capability assessment

Keep:

1. `config_migration` remains distinct from `schema_versioning`; schema versioning defines compatibility contract, while config migration executes state transformation.

Avoid-overlap rule:

1. Do not duplicate schema compatibility logic in migration handlers; migration handlers should consume the contract from `schema_versioning` policies.

Missing capability:

1. No formal migration classing (`online`, `post_deploy`, `manual_backfill`) and no policy gate tying class to rollout windows.

## 5. Council actions (prioritized)

1. Add migration class policy and enforcement.
   - Owner: `council.governance`
   - Acceptance: manifest entries require `class`; validator fails when class is missing/invalid.
2. Add rollback execution path bound to checkpoint metadata.
   - Owner: `council.state`
   - Acceptance: deterministic rollback command can restore from `rollback_checkpoint_path` and emits `config.migration.rollback.*` events.
3. Add migration dry-run gate into CI for changed config schemas.
   - Owner: `council.contract`
   - Acceptance: pull requests touching migration or config schema fail if dry-run report contains `error > 0`.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `safe_configuration_migration_with_rollback_checkpoints`
   - `policy_as_code_fail_closed_defaults`
   - `eval_driven_release_controls`
   - `human_approval_for_high_impact_changes`
   - `audit_reason_codes_and_traceability`
3. `source_refs.notes` should remain marked completed, but completion now references this deep re-review artifact.

## 7. Disposition

1. Keep feature active.
2. Promote from documentation-only to implementation tasks for migration classes and rollback automation.
3. Continue recursive loop to feature 04.

## External references

1. Kubernetes deprecated API migration guide: https://kubernetes.io/docs/reference/using-api/deprecation-guide/
2. GitLab database migrations: https://docs.gitlab.com/development/database/migrations/
3. Stripe API versioning: https://docs.stripe.com/api/versioning
4. OpenTelemetry events semantic conventions: https://opentelemetry.io/docs/specs/semconv/general/events/
