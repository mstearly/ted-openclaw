# SDD 129: Council Future Proofing Retrofit Task Level Plan

**Status:** Completed  
**Version:** v1  
**Date:** 2026-02-26  
**Parents:** SDD 106, SDD 112, SDD 114, SDD 128  
**Mandate:** Convert SDD 128 retrofit recommendations into dependency-ordered, test-gated implementation waves with smallest executable tasks.

---

## 1. Program Goal

Deliver future-proofing upgrades without breaking live user workflows by making workflow execution, migrations, replay safety, rollout controls, and deprecation policy explicit release-governed contracts.

Success criteria:

1. Existing workflows continue to run unchanged during rollout.
2. New workflow runs are immutable-version attributable.
3. Migrations are deterministic, dry-runnable, and auditable.
4. Replay and rollout safety become release gates, not optional checks.
5. Connector expansion and route evolution remain backward-safe.

---

## 2. SDD Alignment

| Scope                                           | Alignment                       | Evidence surface                                             |
| ----------------------------------------------- | ------------------------------- | ------------------------------------------------------------ |
| Governance choke point and policy-first rollout | SDD 42, SDD 106, SDD 110        | sidecar startup validation, policy ledger, route contracts   |
| Event-sourced truth and upgrade safety          | SDD 42, SDD 76, SDD 128         | event log, ledgers, upcasters, migration state               |
| Transport and workflow reliability controls     | SDD 99, SDD 108, SDD 128        | transport policy, workflow registry, friction rollups        |
| Test and release gates                          | SDD 63, SDD 64, SDD 75, SDD 112 | vitest matrix, replay runs, proof scripts, CI gates          |
| Connector governance for expansion              | SDD 103, SDD 111, SDD 128       | connector admission policies, audit ledger, webhook controls |

Program rule:

1. Every retrofit task must identify impacted plane(s) and event or ledger writes before implementation.

---

## 3. Execution Rules

1. No breaking route or workflow shape change ships without backward-compatible handling.
2. Every wave is test-gated before the next wave starts.
3. Every policy/config addition is startup-validated fail-closed.
4. Every ledger schema change includes an upcaster and replay-safe fallback.
5. Every execution task closes with explicit evidence note in an execution log.

---

## 4. Wave Order

1. Wave RF0: Charter and baseline lock
2. Wave RF1: Workflow version pinning and immutable publish model
3. Wave RF2: Migration engine hardening and dry-run safety
4. Wave RF3: Replay gate and rollout controller foundation
5. Wave RF4: Connector contract hardening and deprecation contract
6. Wave RF5: Integrated certification and release readiness package

---

## 5. Task Board

## Wave RF0: Charter and baseline lock

### RF0-001 Compatibility charter artifact and validator

1. Add compatibility charter config artifact (support window, deprecation SLA, compatibility classes).
2. Add validator in governance module and startup fail-closed wiring.
3. Add charter validation to roadmap validator script.

Dependencies:

1. None

Acceptance:

1. Startup blocks invalid compatibility policy.
2. Charter is queryable and auditable as policy state.

Test gate:

1. `node scripts/ted-profile/validate-roadmap-master.mjs`
2. `pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/roadmap-governance.test.mjs sidecars/ted-engine/tests/config-schemas.test.mjs`

### RF0-002 Baseline replay and route contract freeze

1. Capture baseline replay sample set from existing workflow runs and friction rollups.
2. Freeze route contract snapshots for impacted workflow and migration endpoints.
3. Save baseline metrics for regression comparison (job_friction_score, failure ratios, retry recovery).

Dependencies:

1. RF0-001

Acceptance:

1. Baseline replay set is versioned and reproducible.
2. Baseline KPI snapshot is stored for later pass/fail comparisons.

Test gate:

1. `pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/contracts.test.mjs sidecars/ted-engine/tests/gateway-contracts.test.mjs`

---

## Wave RF1: Workflow version pinning and immutable publish model

### RF1-001 Workflow schema evolution

1. Extend workflow registry schema with `workflow_version`, `definition_hash`, `published_at`, `supersedes_version`.
2. Add canonical hash generator for normalized workflow definition.
3. Keep backward-compatible read path for legacy entries missing new fields.

Dependencies:

1. RF0-002

Acceptance:

1. Legacy workflow definitions still load.
2. New and updated definitions receive deterministic hash and version metadata.

Test gate:

1. `pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/config-schemas.test.mjs`
2. Add or update workflow registry schema tests for legacy and new shape parity.

### RF1-002 Immutable publish behavior

1. Change workflow upsert behavior to publish new version records instead of in-place mutation.
2. Preserve active version pointer while retaining prior versions for replay.
3. Emit `workflow.registry.version_published` events and audit records.

Dependencies:

1. RF1-001

Acceptance:

1. Editing a workflow increments version and preserves previous versions.
2. Version lineage is visible in API and ledger state.

Test gate:

1. `pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/contracts.test.mjs`
2. Add focused tests for publish lineage and event emission.

### RF1-003 Run level version pinning and snapshot reference

1. Persist `workflow_version`, `definition_hash`, and snapshot reference in `workflow_run` and friction rollup records.
2. Ensure run execution resolves one immutable version before step execution starts.
3. Add compatibility fallback for legacy runs with missing version fields.

Dependencies:

1. RF1-002

Acceptance:

1. Every new run is attributable to one immutable workflow version.
2. Old run records remain queryable without errors.

Test gate:

1. `pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/contracts.test.mjs`
2. Add workflow run endpoint tests validating pinned metadata.

### RF1-004 Backfill and upcaster for legacy workflow runs

1. Add upcaster for older run records to inject compatibility defaults.
2. Add one-time backfill command for historical runs where needed.
3. Record backfill results to audit and policy/event logs.

Dependencies:

1. RF1-003

Acceptance:

1. No read path breaks on legacy records.
2. Backfill operation is idempotent.

Test gate:

1. `pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/jsonl-roundtrip.test.mjs sidecars/ted-engine/tests/properties.test.mjs`

---

## Wave RF2: Migration engine hardening and dry-run safety

### RF2-001 Migration manifest and registry loader

1. Introduce migration manifest with ordered migration registry metadata.
2. Replace hardcoded migration branch with registry executor.
3. Add migration integrity checks (duplicate id, order gaps, unknown dependencies).

Dependencies:

1. RF1-004

Acceptance:

1. Multiple migrations can execute in deterministic order.
2. Unknown migration ids fail with explicit errors.

Test gate:

1. Add migration runner unit tests for ordering and integrity failures.
2. `pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/config-schemas.test.mjs`

### RF2-002 Dry-run migration report path

1. Implement migration dry-run mode producing per-file and per-migration impact report.
2. Add CLI/script surface for pre-upgrade report generation.
3. Ensure dry-run makes no file writes.

Dependencies:

1. RF2-001

Acceptance:

1. Dry-run output is deterministic and machine-readable.
2. No config mutation occurs in dry-run path.

Test gate:

1. Add dry-run tests with fixture configs.
2. `node scripts/ted-profile/validate-roadmap-master.mjs`

### RF2-003 Fail-closed partial migration handling

1. Add transactional safeguards around migration state updates.
2. Emit explicit failure events and startup warning blocks for partial application risk.
3. Add rollback checkpoint metadata in migration state.

Dependencies:

1. RF2-002

Acceptance:

1. Partial migration states are detectable and actionable.
2. Startup behavior is deterministic under migration failure.

Test gate:

1. Add migration fault injection tests.
2. `pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/roadmap-governance.test.mjs sidecars/ted-engine/tests/config-schemas.test.mjs`

---

## Wave RF3: Replay gate and rollout controller foundation

### RF3-001 Replay gate contract and scenario pack

1. Define replay gate contract (required scenarios, pass thresholds, failure classes).
2. Build minimum scenario pack from RF0 baseline plus new workflow version cases.
3. Persist replay gate outputs as release evidence artifacts.

Dependencies:

1. RF2-003

Acceptance:

1. Replay gate can fail release on deterministic invariant violations.
2. Replay evidence references workflow version and definition hash.

Test gate:

1. `pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/llm-evaluation.test.mjs`
2. Replay runner validation command with baseline corpus.

### RF3-002 Shared rollout policy artifact and validator

1. Add rollout policy config supporting cohort rules, stickiness keys, rollback triggers.
2. Add startup validator and policy exposure endpoint.
3. Integrate with existing transport canary model for consistent semantics.

Dependencies:

1. RF3-001

Acceptance:

1. Rollout decisions are deterministic for identical identity context.
2. Rollback triggers and reason codes are auditable.

Test gate:

1. `pnpm vitest run src/gateway/openresponses-transport-config.test.ts src/gateway/openresponses-transport-runtime.test.ts src/gateway/openresponses-transport.test.ts`
2. Add rollout policy unit tests and sidecar validator tests.

### RF3-003 Release gate wiring in CI

1. Add CI lane that blocks promotion on replay gate failure.
2. Add report publication and artifact retention for gate runs.
3. Add operator-facing summary of pass/fail and regression deltas.

Dependencies:

1. RF3-002

Acceptance:

1. CI fails closed on replay gate failure.
2. Release evidence package includes replay and rollout metrics.

Test gate:

1. CI workflow validation in PR lane.
2. Local verification: `pnpm check && pnpm build`

---

## Wave RF4: Connector contract hardening and deprecation contract

### RF4-001 Connector reliability policy schema upgrade

1. Extend connector admission policy with required idempotency key strategy.
2. Add callback authenticity requirements and retry/backoff policy fields.
3. Validate fail-closed for missing critical connector safety settings.

Dependencies:

1. RF3-003

Acceptance:

1. Connector cannot be admitted as production-ready without reliability policy completeness.

Test gate:

1. `node scripts/ted-profile/validate-roadmap-master.mjs`
2. `pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/roadmap-governance.test.mjs sidecars/ted-engine/tests/config-schemas.test.mjs`

### RF4-002 Status and contract-level deprecation surfaces

1. Add `deprecated_routes` and `sunset_schedule` surfaces to status and policy endpoints.
2. Add warning metadata in route/tool responses where deprecation applies.
3. Ensure no immediate behavior break for deprecated paths during support window.

Dependencies:

1. RF4-001

Acceptance:

1. Operator can see pending deprecations and enforcement dates.
2. Deprecation data is auditable and consistent across surfaces.

Test gate:

1. Route contract tests for deprecation fields.
2. `pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/contracts.test.mjs`

### RF4-003 Connector replay and callback failure drills

1. Add replay scenarios for duplicate webhook delivery and callback auth failures.
2. Validate idempotent handling and retry policy behavior.
3. Emit explicit failure reason codes and escalation traces.

Dependencies:

1. RF4-002

Acceptance:

1. Duplicate events do not create duplicate state mutations.
2. Invalid callbacks are rejected with auditable reason codes.

Test gate:

1. Connector replay suite and focused e2e tests.
2. Regression check against RF0 baseline KPIs.

---

## Wave RF5: Integrated certification and release readiness package

### RF5-001 Full regression matrix

1. Run sidecar, gateway, and e2e suites for impacted tracks.
2. Run replay gate and compare against baseline thresholds.
3. Run contract and schema validators for all new artifacts.

Dependencies:

1. RF4-003

Acceptance:

1. All mandatory gates pass.
2. No regression in baseline reliability KPIs outside approved tolerances.

Mandatory command set:

1. `pnpm check`
2. `pnpm build`
3. `node scripts/ted-profile/validate-roadmap-master.mjs`
4. `pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/roadmap-governance.test.mjs sidecars/ted-engine/tests/config-schemas.test.mjs sidecars/ted-engine/tests/contracts.test.mjs`
5. `pnpm vitest run src/gateway/openresponses-transport-config.test.ts src/gateway/openresponses-transport-runtime.test.ts src/gateway/openresponses-transport.test.ts src/gateway/openresponses-http.context-semantics.test.ts src/gateway/server-runtime-config.test.ts`
6. `pnpm vitest run --config vitest.e2e.config.ts src/gateway/openresponses-http.e2e.test.ts src/gateway/openresponses-parity.e2e.test.ts`

### RF5-002 Execution log and board readiness packet

1. Publish execution log with task outcomes, blockers, and evidence links.
2. Publish upgrade safety certification summary for operator-facing signoff.
3. Record go or no-go recommendation with residual risk list.

Dependencies:

1. RF5-001

Acceptance:

1. Council can certify readiness from evidence package without ad hoc verification.

---

## 6. Dependency Summary

1. RF0 must complete before RF1.
2. RF1 must complete before RF2.
3. RF2 must complete before RF3.
4. RF3 must complete before RF4.
5. RF5 is only valid after RF4 completion.

---

## 7. Ready To Execute Checklist

1. SDD 128 accepted as retrofit baseline.
2. Owners assigned per plane for RF1 to RF4 implementation slices.
3. Baseline replay and KPI snapshot recorded.
4. Test environment ready for sidecar and gateway suites.
5. CI lane ownership confirmed for replay gate enforcement.

Council readiness decision:

1. **READY TO EXECUTE** once owners are assigned to RF1 and RF2 first-wave tasks.
