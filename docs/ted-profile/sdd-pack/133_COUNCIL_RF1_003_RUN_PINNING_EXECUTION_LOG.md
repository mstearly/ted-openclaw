# SDD 133: RF1-003 Run-Level Version Pinning Execution Log

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Task:** SDD 129 `RF1-003`

---

## 1. Scope

Execute RF1-003 requirements:

1. Persist workflow version metadata on workflow runs and friction rollups.
2. Resolve one immutable workflow version snapshot before run step execution.
3. Preserve backward-compatible reads for legacy run records with missing metadata.

---

## 2. Implemented Changes

1. Run execution now resolves immutable workflow metadata before step processing:
   - `workflow_version`
   - `definition_hash`
   - `workflow_snapshot_ref`
2. Workflow run and friction rollup ledger records persist pinned metadata for every new run.
3. Event and audit surfaces now include run-level version metadata:
   - run completion event payload includes workflow version + hash + snapshot reference
   - `WORKFLOW_RUN` audit record includes the same attribution fields
4. Legacy run compatibility fallback added:
   - list/read surfaces derive defaults from active workflow registry when old run records lack RF1 metadata
5. Startup ledger guard now includes workflow version lineage ledger path in integrity checks.

---

## 3. Evidence Surfaces

1. Runtime implementation:
   - `sidecars/ted-engine/server.mjs`
2. Contract and endpoint assertions:
   - `sidecars/ted-engine/tests/contracts.test.mjs`
3. Inventory/handoff status:
   - `docs/ted-profile/sdd-pack/114_COUNCIL_R0_001_ACTIVE_PLAN_WAVE_INVENTORY.md`

---

## 4. Validation

Executed:

```bash
node scripts/ted-profile/validate-roadmap-master.mjs
pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/contracts.test.mjs sidecars/ted-engine/tests/config-schemas.test.mjs sidecars/ted-engine/tests/roadmap-governance.test.mjs sidecars/ted-engine/tests/gateway-contracts.test.mjs
```

Result:

1. Governance validator passed.
2. Contract + schema suites passed (1485/1485).
3. New contract assertion confirmed:
   - `POST /ops/workflows/run` returns pinned `workflow_version`, `definition_hash`, and `workflow_snapshot_ref`
   - `GET /ops/workflows/runs` and `GET /ops/friction/summary` expose pinned metadata for new runs.

---

## 5. Exit Decision

RF1-003 is complete.

Next task:

1. Start RF1-004 legacy run upcaster and idempotent backfill path.
