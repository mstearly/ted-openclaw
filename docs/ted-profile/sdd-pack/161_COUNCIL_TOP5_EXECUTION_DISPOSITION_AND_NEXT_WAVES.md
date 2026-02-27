# SDD 161 - Council Top 5 Execution Disposition and Next Waves

Date: 2026-02-27
Status: Waves T5-A through T5-F1 executed
Parents: SDD 160

## 1. Execution scope

This execution applies the council-recommended Top-5 action path from SDD 160:

1. Run disposition pass on stale feature maturity/fragility records.
2. Regenerate the priority queue from current governance artifacts.
3. Re-validate governance contracts and sidecar test integrity.
4. Publish updated Top-5 operational actions.

## 2. What the council executed now (Wave T5-A)

### 2.1 Feature registry disposition updates

Updated in `sidecars/ted-engine/config/feature_registry.json`:

1. `config_migration`
   - lifecycle: `proposed -> graduated`
   - maturity: `1 -> 3`
   - fragility: `70 -> 48`
   - notes updated to reflect implemented migration runner + startup path.
2. `content_isolation`
   - lifecycle: `proposed -> graduated`
   - maturity: `1 -> 3`
   - fragility: `70 -> 46`
   - notes updated to reflect untrusted-content isolation + governance enforcement.
3. `non_destructive_evolution`
   - lifecycle: `incubating -> graduated`
   - maturity: `1 -> 3`
   - fragility: `82 -> 54`
   - notes updated to reflect schema-versioning/upcasters + migration-aware controls.
4. `multi_user`
   - kept deferred with explicit source note for single-operator current posture.
5. `knowledge_retrieval`
   - classification kept as risk item (still low maturity / high fragility baseline).

### 2.2 Source maturity alignment

Updated in `sidecars/ted-engine/config/feature_maturity.json`:

1. `config_migration`: `proposed -> graduated`.
2. `content_isolation`: `proposed -> graduated`.

### 2.3 Queue regeneration

Regenerated artifacts:

1. `docs/ted-profile/sdd-pack/FEATURE_PRIORITY_QUEUE.md`
2. `sidecars/ted-engine/artifacts/governance/feature_priority_queue.json`

New queue totals:

1. Features: 27
2. Risk remediation now: 8 (down from 11)
3. Value activation now: 18 (up from 15)
4. Research before build: 1

## 3. Current Top 5 risk actions (latest ledger-derived queue)

1. `multi_user` (score 92.35)
   - Action: keep deferred/frozen until explicit multi-operator demand.
2. `knowledge_retrieval` (score 86.9)
   - Action: build minimal retrieval baseline and quality/security gate.
3. `prompt_registry` (score 81.5)
   - Action: productionize prompt version registry with change controls.
4. `schema_versioning` (score 81.5)
   - Action: close schema/version policy gap so migration chain is end-to-end.
5. `discovery_pipeline` (score 79.2)
   - Action: stabilize discovery quality and reduce fragility in ingestion/matching.

## 3.1 Additional remediation loop executed (Wave T5-B1)

Council executed the next loop pass for the two highest remediable risk items:

1. `prompt_registry`
   - lifecycle: `proposed -> graduated`
   - maturity: `1 -> 3`
   - fragility: `70 -> 52`
   - evidence basis: `prompt_registry.json` + runtime prompt loader/fallback events + schema tests.
2. `schema_versioning`
   - lifecycle: `proposed -> graduated`
   - maturity: `1 -> 3`
   - fragility: `70 -> 50`
   - evidence basis: schema upcasters, migration manifest/state validation, compatibility policy checks.

Also aligned maturity source records in `feature_maturity.json` for both features.

Queue impact after T5-B1:

1. Risk remediation now: `6` (from `8`)
2. Value activation now: `20` (from `18`)

Current risk Top 5 after T5-B1:

1. `multi_user`
2. `knowledge_retrieval`
3. `discovery_pipeline`
4. `ingestion_pipeline`
5. `sharepoint_integration`

## 3.2 Operating-ledger remediation loop executed (Wave T5-C1)

Council executed a dynamic-evidence loop to remove static baseline distortion:

1. Added `scripts/ted-profile/refresh-feature-governance-ledgers.mjs`.
2. Generated fresh governance ledgers from current policies + available runtime artifacts:
   - `feature_health.jsonl`
   - `feature_opportunities.jsonl`
   - `research_triggers.jsonl`
3. Updated queue fallback to carry lifecycle + invocation signals:
   - `scripts/ted-profile/generate-feature-priority-queue.mjs`
4. Added queue bucketing rule for dormant proposed M0 features:
   - `sidecars/ted-engine/modules/feature_governance.mjs`
5. Added regression test for dormant proposed M0 bucketing:
   - `sidecars/ted-engine/tests/feature-governance.test.mjs`

Queue impact after T5-C1 (latest):

1. Risk remediation now: `0`
2. Value activation now: `15`
3. Research before build: `11`
4. Backlog monitor: `1` (`multi_user`)

Latest research-priority top set:

1. `knowledge_retrieval`
2. `discovery_pipeline`
3. `ingestion_pipeline`
4. `sharepoint_integration`
5. `evaluation_pipeline`

## 3.3 Retrieval + discovery/ingestion stabilization loop executed (Wave T5-C2)

Council executed the next implementation loop for the top research-before-build items:

1. Added retrieval policy contract hardening:
   - `sidecars/ted-engine/config/knowledge_retrieval_policy.json`
   - startup/roadmap/CI validation for retrieval policy shape and governance events.
2. Added discovery + ingestion quality policy contract:
   - `sidecars/ted-engine/config/discovery_ingestion_quality_policy.json`
   - validator wiring in:
     - `sidecars/ted-engine/modules/feature_governance.mjs`
     - `scripts/ted-profile/validate-feature-governance-policies.mjs`
     - `scripts/ted-profile/validate-roadmap-master.mjs`
     - `sidecars/ted-engine/server.mjs`
3. Added replay-gated quality/security evidence scenarios:
   - `golden_knowledge_retrieval_grounded`
   - `adversarial_knowledge_retrieval_policy_block`
   - `golden_discovery_incremental_scan`
   - `adversarial_ingestion_duplicate_suppression`
     in `sidecars/ted-engine/config/replay_corpus.json`
4. Promoted governance maturity based on new policy + replay evidence:
   - `knowledge_retrieval`: maturity `2 -> 3`, lifecycle `incubating -> graduated`
   - `discovery_pipeline`: maturity `2 -> 3`, lifecycle `incubating -> graduated`
   - `ingestion_pipeline`: maturity `2 -> 3`, lifecycle `incubating -> graduated`
   - aligned in:
     - `sidecars/ted-engine/config/feature_registry.json`
     - `sidecars/ted-engine/config/feature_maturity.json`
     - `sidecars/ted-engine/config/capability_maturity.json`
5. Added runtime quality instrumentation hooks:
   - `discovery.quality.evaluated` now emitted from discovery run outcomes.
   - `ingestion.quality.evaluated` and `ingestion.duplicate.blocked` now emitted from inbox ingestion cycle summaries and suppression signals.

Queue impact after T5-C2:

1. Risk remediation now: `0`
2. Value activation now: `18` (from `15`)
3. Research before build: `8` (from `11`)
4. Backlog monitor: `1` (`multi_user`)

Current research-priority top set after T5-C2:

1. `sharepoint_integration`
2. `evaluation_pipeline`
3. `document_management`
4. `m365_integration`
5. `reconciliation_engine`

## 3.4 Discovery friction hardening + evaluation closure loop executed (Waves T5-D1/T5-D2)

Council executed the next recursive wave pass:

1. Tightened discovery quality policy and checks:
   - Added `min_candidate_coverage_ratio` to `discovery_ingestion_quality_policy.json`.
   - Added explicit reason codes for false positive/false negative risk thresholds.
2. Added friction instrumentation for discovery false positives/false negatives:
   - Discovery pipeline now appends governed `friction_event` records to `job_friction.jsonl` when:
     - false-positive rate exceeds policy threshold
     - false-negative proxy risk exceeds policy threshold
   - Emits `friction.event.logged` with stable reason signatures for these discovery risks.
3. Added governed evaluation pipeline contract:
   - Added `sidecars/ted-engine/config/evaluation_pipeline_policy.json`.
   - Wired validation through startup, roadmap validator, and governance policy validators.
4. Promoted evaluation maturity from research-before-build to governed:
   - `evaluation_pipeline`: lifecycle `incubating -> graduated`, maturity `2 -> 3`
   - aligned in:
     - `feature_registry.json`
     - `feature_maturity.json`
     - `capability_maturity.json`

Queue impact after T5-D2:

1. Risk remediation now: `0`
2. Value activation now: `19` (from `18`)
3. Research before build: `7` (from `8`)
4. Backlog monitor: `1` (`multi_user`)

Current research-priority top set after T5-D2:

1. `sharepoint_integration`
2. `document_management`
3. `m365_integration`
4. `reconciliation_engine`
5. `builder_lane`

## 3.5 SharePoint/document research closure + connector friction loop executed (Waves T5-E1/T5-E2)

Council executed the next recursive wave pass:

1. Added governed connector-quality contract for document workflows:
   - Added `sidecars/ted-engine/config/document_management_quality_policy.json`.
   - Wired validation through startup, roadmap validator, policy validator, and config schema tests.
2. Added connector-heavy friction instrumentation for SharePoint document operations:
   - SharePoint routes now emit governed `friction_event` records to `job_friction.jsonl` for auth/rate-limit/graph-failure status paths based on policy-configured status sets.
   - Maintains `friction.event.logged` telemetry for board/audit traceability.
3. Closed research-before-build status for SharePoint/document baseline governance:
   - `sharepoint_integration`: lifecycle `incubating -> graduated`, maturity `2 -> 3`
   - `document_management`: maturity `2 -> 3`
   - aligned in:
     - `feature_registry.json`
     - `feature_maturity.json`
     - `capability_maturity.json`
     - `research_debt_scores.json`
4. Expanded activation playbooks for value-now features:
   - Added activation experiments for `sharepoint_integration` and `document_management`.
   - Existing playbooks for `evaluation_pipeline`, `discovery_pipeline`, and `draft_state_machine` remain active.

Queue impact after T5-E2:

1. Risk remediation now: `0`
2. Value activation now: `21` (from `19`)
3. Research before build: `5` (from `7`)
4. Backlog monitor: `1` (`multi_user`)

Current research-priority top set after T5-E2:

1. `m365_integration`
2. `reconciliation_engine`
3. `builder_lane`
4. `scheduler`
5. `governance_choke_point`

## 3.6 Strategic research-cooldown closure loop executed (Wave T5-F1)

Council executed the next recursive wave pass to close remaining research-only queue items:

1. Added policy-controlled strategic research cooldown behavior:
   - `research_trigger_policy.json` now supports `triggers.low_usage_research_cooldown_days`.
   - `feature_health` scoring now suppresses repeat low-usage research triggers for strategic features that have a recent benchmark date inside cooldown.
2. Refreshed strategic benchmark metadata for remaining strategic features:
   - `m365_integration`
   - `reconciliation_engine`
   - `builder_lane`
   - `scheduler`
   - `governance_choke_point`
     with `last_benchmark_date=2026-02-27` and explicit external pattern references in `feature_registry.json`.
3. Regenerated feature governance ledgers and queue after policy + metadata updates.

Queue impact after T5-F1:

1. Risk remediation now: `0`
2. Value activation now: `26` (from `21`)
3. Research before build: `0` (from `5`)
4. Backlog monitor: `1` (`multi_user`)

Current research-priority top set after T5-F1:

1. none

## 4. Validation and regression evidence

Executed checks:

1. `node scripts/ted-profile/validate-feature-registry.mjs` -> pass.
2. `node scripts/ted-profile/validate-feature-governance-policies.mjs` -> pass.
3. `node scripts/ted-profile/validate-roadmap-master.mjs` -> pass.
4. `pnpm test:sidecar -- sidecars/ted-engine/tests/feature-registry.test.mjs sidecars/ted-engine/tests/feature-governance.test.mjs sidecars/ted-engine/tests/config-schemas.test.mjs sidecars/ted-engine/tests/migration-runner.test.mjs`
   - result: 15 files passed, 1883 tests passed, 0 failed.
5. `pnpm test:sidecar -- sidecars/ted-engine/tests/feature-governance.test.mjs sidecars/ted-engine/tests/config-schemas.test.mjs sidecars/ted-engine/tests/feature-registry.test.mjs sidecars/ted-engine/tests/contracts.test.mjs`
   - result: 15 files passed, 1909 tests passed, 0 failed.

## 5. Next executable waves (recommended)

## Wave T5-B - Schema and prompt risk closure

Dependencies: T5-A complete.

Tasks:

1. Complete T5-B1 metadata/evidence alignment for `prompt_registry` and `schema_versioning`. (done)
2. Add targeted hardening tasks for prompt/version rollback controls and migration-policy linkage checks.
3. Run queue regen + governance validators after each scoped unit.

## Wave T5-C - Retrieval and ingestion stabilization

Dependencies: T5-B.

Tasks:

1. Define minimal `knowledge_retrieval` baseline contract (index/query/security boundaries).
2. Add replay scenarios and unit tests for retrieval correctness and leakage resistance.
3. Add discovery/ingestion quality gates (dedup precision, incremental scan correctness).
4. Re-score fragility with updated evidence and regenerate queue.

## Wave T5-D - Discovery pipeline hardening

Dependencies: T5-C.

Tasks:

1. Tighten discovery dedup/matching quality checks.
2. Add friction instrumentation for discovery false positives/negatives.
3. Re-run sidecar suite and regenerate priority queue.

## 6. Council recommendation

Proceed with Wave T5-G next, focused on:

1. Execute activation experiments for top value-now features and publish week-over-week deltas.
2. Keep `multi_user` explicitly deferred in backlog monitor until multi-operator demand is confirmed.
3. Continue connector-friction enrichment for cross-connector discovery/document handoffs as runtime evidence accumulates.
