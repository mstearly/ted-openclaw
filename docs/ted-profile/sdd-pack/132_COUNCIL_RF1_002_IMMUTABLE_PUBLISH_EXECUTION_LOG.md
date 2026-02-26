# SDD 132: RF1-002 Immutable Publish Behavior Execution Log

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Task:** SDD 129 `RF1-002`

---

## 1. Scope

Execute RF1-002 requirements:

1. Publish new workflow versions instead of mutating version in place.
2. Preserve active version pointer while retaining prior versions.
3. Emit explicit version-published events and audit evidence.

---

## 2. Implemented Changes

1. Workflow upsert now performs immutable version publish semantics:
   - new definition hash + changed content => increments `workflow_version`
   - sets `supersedes_version` to prior active version
   - updates active pointer in registry `workflows`
2. Version history persisted to dedicated lineage ledger:
   - `sidecars/ted-engine/artifacts/workflows/workflow_versions.jsonl`
   - records contain full published workflow snapshot + metadata
3. Legacy history backfill on first post-RF1-002 publish:
   - existing active version is persisted once as `backfilled_from_legacy: true`
4. API lineage surface added to `GET /ops/workflows`:
   - `version_lineage`
   - `lineage_count`
5. New event and audit evidence:
   - event: `workflow.registry.version_published`
   - audit: `WORKFLOW_REGISTRY_VERSION_PUBLISH`

---

## 3. Evidence Surfaces

1. Runtime logic:
   - `sidecars/ted-engine/server.mjs`
2. Event taxonomy update:
   - `sidecars/ted-engine/config/event_schema.json`
3. Contract/integration assertions:
   - `sidecars/ted-engine/tests/contracts.test.mjs`

---

## 4. Validation

Executed:

```bash
node scripts/ted-profile/validate-roadmap-master.mjs
pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/contracts.test.mjs sidecars/ted-engine/tests/config-schemas.test.mjs sidecars/ted-engine/tests/roadmap-governance.test.mjs sidecars/ted-engine/tests/gateway-contracts.test.mjs
```

Result:

1. Governance validator passed.
2. Contract + schema suites passed (1484/1484).
3. Integration assertion confirmed:
   - repeated workflow upsert with changed definition increments `workflow_version`
   - lineage exposed in API
   - `workflow.registry.version_published` present in event stream

---

## 5. Exit Decision

RF1-002 is complete.

Next task:

1. Start RF1-003 run-level version pinning and snapshot reference.
