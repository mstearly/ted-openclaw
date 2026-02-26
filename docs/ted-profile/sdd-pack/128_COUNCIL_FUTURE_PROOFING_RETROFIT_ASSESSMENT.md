# SDD 128: Council Future-Proofing Retrofit Assessment

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Context:** SDD 99-127 execution sequence + current platform state

---

## 1. Council Question (interpreted)

If Ted/OpenClaw had been designed from day zero for the full roadmap (transport optimization, mobile governance, workflow engine, multi-connector growth, long-horizon upgrades), what would be structurally different, and what should we change now to avoid:

1. Future functionality lockout.
2. Upgrade regressions for users running live workflows.

---

## 2. Council Verdict

This is a real problem to solve now.

Reason:

1. Core architecture is strong (event log + ledgers, policy gates, contract tests, friction telemetry).
2. But several durability seams are still v1-only and will become risk multipliers as module count and live workflow volume increase.

If left as-is, the most likely failure mode is not immediate outage; it is slow compatibility debt that makes safe upgrades expensive and brittle.

---

## 3. What Would Be Different If Built For Full Scope From Day 0

### A. Workflow definitions would be immutable and version-addressable

Current:

1. `workflow_registry.json` stores mutable workflow entries.
2. `workflow_run` records include `workflow_id`/`workflow_name`, but not immutable definition hash/version snapshot.

Day-0 design difference:

1. Every run would bind to `workflow_id + workflow_version + definition_hash`.
2. Published versions would be append-only; edits create a new version.

### B. Migration system would be generalized, not one-off

Current:

1. Config migration runner only executes `001_baseline_schema_versions` and warns on unknown migrations.

Day-0 design difference:

1. Registered migration chain with preflight, dry-run, rollback markers, and compatibility report per release.

### C. Event and ledger contracts would have explicit compatibility policy

Current:

1. `_schema_version` exists and upcasters exist, but global current schema stays at v1 and policy is implicit.

Day-0 design difference:

1. Formal compatibility window (N-1/N-2), explicit deprecation timeline, and mandatory upcaster tests for each schema bump.

### D. Release process would include mandatory replay-by-version gates

Current:

1. Replay/eval artifacts exist, but upgrade safety is still partly process-driven.

Day-0 design difference:

1. Every release candidate would be blocked unless replay can re-run recent real workflow traces across old/new code paths with invariant checks.

### E. Feature rollouts would be sticky and cohort-scoped across all subsystems

Current:

1. Transport has canary policy and fallback controls.
2. Other major features still rely on enable/disable toggles without universal rollout semantics.

Day-0 design difference:

1. A shared rollout framework would provide tenant/workflow stickiness, circuit-breaker auto-rollback, and exposure telemetry for every risky feature.

---

## 4. Council Assessment of Current Platform (Strengths vs Gaps)

## Strengths Already In Place

1. Plane 2/5 event-sourced core with append-only ledgers and startup validation.
2. API version header and minimum supported API metadata.
3. Route/output contract suites and replay/evaluation infrastructure.
4. Governance precedence and fail-closed policy artifacts (including new mobile policy contract).
5. Friction metrics and workflow risk linting.

## Gaps To Close Now

1. Workflow version identity and run-level definition pinning are missing.
2. Migration runner architecture is not yet scalable for multi-step evolution.
3. Compatibility/deprecation policy is not codified as a release gate contract.
4. Replay safety is not yet enforced as a universal upgrade gate for all risky planes.
5. Shared rollout framework is inconsistent outside selected tracks.

---

## 5. No-Regret Retrofit Changes (Recommended)

Each proposal includes planes and event/ledger impact.

| Change                                                                                              | Plane(s) | Reads                                    | Writes                                                                 | Why now                                                   |
| --------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| 1. Versioned workflow publishing (`workflow_version`, `definition_hash`, immutable publish records) | 2, 5     | `workflow_registry`, `workflow_runs`     | `workflow.registry.version_published`, `workflow_runs`, `audit_ledger` | Prevents silent behavior drift across upgrades            |
| 2. Run snapshot pinning (store resolved workflow definition in run record)                          | 2, 5     | `workflow_registry`                      | `workflow_runs`, `friction_rollups`                                    | Keeps historical runs replayable and comparable           |
| 3. Migration registry engine (ordered migration manifest + dry-run report + rollback checkpoint)    | 2, 5     | `migration_state`, config files          | `migration_state`, `event_log` (`config.migrated.*`), `audit_ledger`   | Converts migrations from ad hoc to productized            |
| 4. Event/ledger compatibility charter (support window + deprecation policy + mandatory upcasters)   | 2, 5     | `event_schema`, route/output contracts   | `policy_ledger`, `event_log` (`compat.policy.updated`)                 | Avoids lockout as schema versions diverge                 |
| 5. Universal replay gate in CI/release (`N` recent runs + fixtures)                                 | 2, 3, 5  | `replay_runs`, ledgers, fixtures         | `replay_runs`, `trust_ledger`, release evidence artifact               | Catches regressions before user impact                    |
| 6. Shared rollout controller (cohort, stickiness, rollback trigger) for non-transport features      | 1, 2, 3  | policy configs, tenant/workflow identity | `policy_ledger`, `ops_ledger`, `event_log` (`rollout.*`)               | Makes risky features reversible without emergency patches |
| 7. Connector contract hardening (idempotency key, callback authenticity, retry policy as schema)    | 2, 4, 5  | connector events/webhooks                | `event_log`, domain ledgers, `audit_ledger`                            | Critical for Monday/RightSignature scale-up               |
| 8. Deprecation and sunset contract (`deprecated_routes/tools`, enforcement date)                    | 1, 2, 3  | route/tool registry                      | `policy_ledger`, status surfaces                                       | Keeps upgrades explicit for operators and clients         |

---

## 6. Recommended Execution Approach (How Council Should Solve)

## Phase FP-0: Decision Contract (1-2 days)

1. Ratify compatibility policy scope: workflow, config, event, route, connector.
2. Define support window and sunset SLA.
3. Ratify promotion gate: no release without replay safety report.

Exit criteria:

1. One signed compatibility charter artifact in `config/` and board-level gate statement.

## Phase FP-1: Workflow Upgrade Safety (3-5 days)

1. Add `workflow_version` + `definition_hash` to workflow publish contract.
2. Update `workflow_run` persistence to include pinned version/hash + snapshot reference.
3. Add upcaster/backfill path for legacy runs.

Exit criteria:

1. Existing workflows still execute.
2. New runs are immutably attributable to a specific definition version.

## Phase FP-2: Migration Engine Hardening (3-4 days)

1. Replace single-ID migration branch with registry/manifest executor.
2. Implement `--dry-run` migration report command.
3. Emit migration evidence events and fail-closed on partial unsafe states.

Exit criteria:

1. Multiple migrations can execute deterministically with rollback checkpoint data.

## Phase FP-3: Replay Gate + Rollout Controller (4-6 days)

1. Standardize replay pack for high-risk routes/workflows.
2. Enforce replay gate in CI and pre-release checks.
3. Add rollout policy artifact for sticky cohort rollout and rollback triggers.

Exit criteria:

1. Any risky change has deterministic replay evidence and reversible rollout controls.

## Phase FP-4: Connector and Deprecation Safety (3-5 days)

1. Enforce connector idempotency/authenticity schema in admission policies.
2. Publish explicit deprecated/sunset fields in status/contract surfaces.
3. Add operator-facing warnings before deprecation cutoff.

Exit criteria:

1. Connector additions no longer require bespoke reliability policy work.
2. Upgrade path is explicit to operators before breakpoints.

---

## 7. Priority (If Council Must Choose)

1. **Do first:** FP-1 workflow version pinning and FP-2 migration engine hardening.
2. **Do second:** FP-3 replay gate and rollout controller.
3. **Do third:** FP-4 connector/deprecation hardening.

Rationale:

1. FP-1/FP-2 directly protect existing live workflows from upgrade drift.
2. FP-3/FP-4 scale safety as feature velocity increases.

---

## 8. External Pattern References (trusted)

1. Temporal workflow evolution patterns (`patching`, worker versioning): keep in-flight executions deterministic across code changes.  
   https://docs.temporal.io/patching
2. Kubernetes API deprecation policy: explicit multi-release support/sunset model.  
   https://kubernetes.io/docs/reference/using-api/deprecation-policy/
3. Stripe API versioning: backwards-compatible additions + explicit version contracts.  
   https://docs.stripe.com/api/versioning
4. OpenFeature evaluation context: standardized targeting context for rollout stickiness.  
   https://openfeature.dev/docs/reference/concepts/evaluation-context/
5. Microsoft Graph webhook delivery guidance: validation windows, retries, throttling behavior.  
   https://learn.microsoft.com/graph/change-notifications-delivery-webhooks
6. SemVer 2.0.0: contract-first signaling for compatible vs breaking change intent.  
   https://semver.org/

---

## 9. Final Council Position

Proceed with retrofit now. The architecture is strong enough to evolve safely, but only if workflow version pinning, migration generalization, and replay-gated rollout become first-class release controls before broader module/connector expansion.
