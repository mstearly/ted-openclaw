# SDD 138: RF3-001 Replay Gate Contract and Scenario Pack Execution Log

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Task:** SDD 129 `RF3-001`

---

## 1. Scope

Execute RF3-001 requirements:

1. Define replay gate contract with thresholds, required scenarios, and failure classes.
2. Build minimum scenario pack from RF0 baseline plus workflow-version safety scenarios.
3. Persist replay gate run output as release evidence artifacts.

---

## 2. Implemented Changes

1. Added replay gate contract artifact:
   - `sidecars/ted-engine/config/replay_gate_contract.json`
2. Added replay gate contract module:
   - `normalizeReplayGateContract(...)`
   - `validateReplayGateContract(...)`
3. Expanded replay corpus scenario pack:
   - added `workflow_version_lineage_integrity`
   - added `workflow_run_snapshot_pinning`
4. Refactored replay harness to contract-governed release gate:
   - thresholds now sourced from replay gate contract (with runtime overrides)
   - required scenario enforcement with explicit blocker class:
     - `missing_required_scenarios:<ids>`
   - response now includes `replay_gate_contract_version`
5. Added replay release evidence ledger writes:
   - `sidecars/ted-engine/artifacts/replay/release_evidence.jsonl`
   - record kind: `replay_release_evidence`
6. Startup/config governance integration:
   - startup validation now checks replay gate contract structure
   - roadmap validator script now validates replay gate contract
7. Added integration and schema assertions:
   - contract test verifies replay run contract metadata + evidence persistence
   - schema test verifies corpus includes all contract-required scenarios

---

## 3. Evidence Surfaces

1. Runtime implementation:
   - `sidecars/ted-engine/server.mjs`
   - `sidecars/ted-engine/modules/replay_gate_contract.mjs`
2. Config artifacts:
   - `sidecars/ted-engine/config/replay_gate_contract.json`
   - `sidecars/ted-engine/config/replay_corpus.json`
3. Test evidence:
   - `sidecars/ted-engine/tests/contracts.test.mjs`
   - `sidecars/ted-engine/tests/config-schemas.test.mjs`
4. Validator tooling:
   - `scripts/ted-profile/validate-roadmap-master.mjs`
5. Inventory/handoff:
   - `docs/ted-profile/sdd-pack/114_COUNCIL_R0_001_ACTIVE_PLAN_WAVE_INVENTORY.md`

---

## 4. Validation

Executed:

```bash
pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/contracts.test.mjs sidecars/ted-engine/tests/config-schemas.test.mjs sidecars/ted-engine/tests/roadmap-governance.test.mjs
pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/contracts.test.mjs sidecars/ted-engine/tests/config-schemas.test.mjs sidecars/ted-engine/tests/roadmap-governance.test.mjs sidecars/ted-engine/tests/gateway-contracts.test.mjs sidecars/ted-engine/tests/jsonl-roundtrip.test.mjs sidecars/ted-engine/tests/properties.test.mjs sidecars/ted-engine/tests/migration-runner.test.mjs sidecars/ted-engine/tests/migration-dry-run.test.mjs sidecars/ted-engine/tests/migration-fault-injection.test.mjs
node scripts/ted-profile/validate-roadmap-master.mjs
```

Result:

1. Replay contract integration test passed with evidence ledger assertions.
2. Config schema test passed with replay gate contract + required scenario parity checks.
3. Full sidecar regression bundle passed (1557/1557).
4. Governance validator passed including replay gate contract validation.

---

## 5. Exit Decision

RF3-001 is complete.

Next task:

1. Start RF3-002 rollout policy artifact and validator.
