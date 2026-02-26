# SDD 134: RF1-004 Legacy Run Upcaster and Backfill Execution Log

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Task:** SDD 129 `RF1-004`

---

## 1. Scope

Execute RF1-004 requirements:

1. Add upcaster coverage for legacy workflow run and friction rollup records.
2. Add one-time backfill command for historical run metadata normalization.
3. Record backfill execution results to audit, policy, and event evidence surfaces.

---

## 2. Implemented Changes

1. Added shared workflow run metadata normalization module:
   - `buildWorkflowMetadataLookupFromRegistry(...)`
   - `applyWorkflowMetadataFallback(...)`
   - `upcastWorkflowRunRecord(...)`
   - `upcastFrictionRollupRecord(...)`
   - `backfillWorkflowMetadataBatch(...)`
2. Wired runtime upcasters in sidecar:
   - `workflow_runs` now upcasts legacy records (schema + metadata fallback)
   - `friction_rollups` upcaster upgraded from schema-only to metadata-aware upcast
3. Workflow run list path now reads through `workflow_runs` upcaster chain before endpoint filtering.
4. Added one-time backfill command:
   - `scripts/ted-profile/backfill-workflow-run-metadata.mjs`
   - supports `--dry-run`
   - rewrites ledgers atomically when changes are required
   - records evidence to:
     - `artifacts/audit/audit.jsonl`
     - `artifacts/event_log/event_log.jsonl`
     - `artifacts/policy/policy.jsonl`
5. Added event taxonomy entry:
   - `workflow.registry.run_metadata_backfilled`
6. Added compatibility and idempotence test coverage:
   - integration contract test for legacy run records missing RF1 metadata
   - JSONL/property tests for backfill and upcaster idempotence

---

## 3. Evidence Surfaces

1. Runtime and helper implementation:
   - `sidecars/ted-engine/server.mjs`
   - `sidecars/ted-engine/modules/workflow_run_metadata.mjs`
2. Backfill command:
   - `scripts/ted-profile/backfill-workflow-run-metadata.mjs`
3. Event taxonomy:
   - `sidecars/ted-engine/config/event_schema.json`
4. Test evidence:
   - `sidecars/ted-engine/tests/contracts.test.mjs`
   - `sidecars/ted-engine/tests/helpers/test-server.mjs`
   - `sidecars/ted-engine/tests/jsonl-roundtrip.test.mjs`
   - `sidecars/ted-engine/tests/properties.test.mjs`
5. Inventory/handoff:
   - `docs/ted-profile/sdd-pack/114_COUNCIL_R0_001_ACTIVE_PLAN_WAVE_INVENTORY.md`

---

## 4. Validation

Executed:

```bash
node scripts/ted-profile/validate-roadmap-master.mjs
pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/jsonl-roundtrip.test.mjs sidecars/ted-engine/tests/properties.test.mjs
pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/contracts.test.mjs sidecars/ted-engine/tests/config-schemas.test.mjs sidecars/ted-engine/tests/roadmap-governance.test.mjs sidecars/ted-engine/tests/gateway-contracts.test.mjs sidecars/ted-engine/tests/jsonl-roundtrip.test.mjs sidecars/ted-engine/tests/properties.test.mjs
node scripts/ted-profile/backfill-workflow-run-metadata.mjs --dry-run
```

Result:

1. Governance validator passed.
2. RF1-004 gate suites passed (`jsonl-roundtrip` + `properties`).
3. Full sidecar regression bundle passed (1533/1533).
4. Backfill dry-run executed successfully with deterministic summary output.

---

## 5. Exit Decision

RF1-004 is complete.

Next task:

1. Start RF2-001 migration manifest and registry loader.
