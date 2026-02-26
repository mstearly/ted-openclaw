# SDD 143: RF4-003 Connector Replay and Callback Failure Drills Execution Log

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Task:** SDD 129 `RF4-003`

---

## 1. Scope

Execute RF4-003 requirements:

1. Add replay scenarios for duplicate webhook delivery and callback auth failures.
2. Validate idempotent handling and retry policy behavior.
3. Emit explicit reason codes and escalation traces for connector drill outcomes.

---

## 2. Implemented Changes

1. Extended replay simulation to support connector-specific drill assertions and telemetry:
   - `sidecars/ted-engine/server.mjs`
   - added connector drill evaluator with:
     - duplicate delivery/idempotency mutation checks
     - retry policy and retry budget checks
     - callback authenticity rejection checks
     - explicit reason code capture and escalation trace emission
   - replay run summary now includes `connector_failures`
   - replay run event emission now includes:
     - `evaluation.connector.drill.completed`
     - `evaluation.connector.drill.escalated`
2. Added RF4-003 replay corpus scenarios:
   - `sidecars/ted-engine/config/replay_corpus.json`
   - scenarios added:
     - `connector_duplicate_webhook_delivery`
     - `connector_callback_auth_failure`
   - each scenario includes connector expectations for idempotency, retry policy, reason codes, and escalation traces
3. Updated replay gate contract requirements:
   - `sidecars/ted-engine/config/replay_gate_contract.json`
   - contract version bumped to `rf4-003-v1`
   - required scenario list now includes both connector drill scenarios
4. Updated runtime fallback contract/corpus metadata:
   - `sidecars/ted-engine/server.mjs`
   - fallback replay contract version aligned to `rf4-003-v1`
   - fallback corpus metadata updated to RF4 wave marker
5. Updated event taxonomy:
   - `sidecars/ted-engine/config/event_schema.json`
   - added evaluation namespace entries for connector drill completion and escalation events
6. Added focused contract integration coverage:
   - `sidecars/ted-engine/tests/contracts.test.mjs`
   - asserts connector drill replay outcomes include:
     - duplicate delivery/idempotency assertions
     - callback auth reason code (`CALLBACK_AUTH_SIGNATURE_INVALID`)
     - escalation traces and emitted connector evaluation events
7. Updated wave inventory handoff:
   - `docs/ted-profile/sdd-pack/114_COUNCIL_R0_001_ACTIVE_PLAN_WAVE_INVENTORY.md`
   - RF4-003 marked complete and handoff advanced to RF5-001

---

## 3. Evidence Surfaces

1. Runtime replay implementation:
   - `sidecars/ted-engine/server.mjs`
2. Replay and policy artifacts:
   - `sidecars/ted-engine/config/replay_corpus.json`
   - `sidecars/ted-engine/config/replay_gate_contract.json`
   - `sidecars/ted-engine/config/event_schema.json`
3. Test evidence:
   - `sidecars/ted-engine/tests/contracts.test.mjs`
   - `sidecars/ted-engine/tests/config-schemas.test.mjs`
   - `sidecars/ted-engine/tests/roadmap-governance.test.mjs`
4. Replay release-gate artifact:
   - `/tmp/rf4-003-replay-gate-summary.json`
5. Inventory/handoff:
   - `docs/ted-profile/sdd-pack/114_COUNCIL_R0_001_ACTIVE_PLAN_WAVE_INVENTORY.md`

---

## 4. Validation

Executed:

```bash
pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/contracts.test.mjs sidecars/ted-engine/tests/config-schemas.test.mjs sidecars/ted-engine/tests/roadmap-governance.test.mjs
pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/contracts.test.mjs
node scripts/ted-profile/validate-roadmap-master.mjs
node scripts/ted-profile/ci-replay-rollout-gate.mjs --output /tmp/rf4-003-replay-gate-summary.json
pnpm check
```

Result:

1. Sidecar contract/governance/config suites passed (1288/1288).
2. Focused contract replay suite passed (1043/1043).
3. Roadmap + governance validators passed.
4. Replay release gate passed with:
   - status `pass`
   - replay contract version `rf4-003-v1`
   - replay pass rate `1.0`
5. Repository check gate passed (format, type-aware lint, TS checks).

---

## 5. Exit Decision

RF4-003 is complete.

Next task:

1. Start RF5-001 full regression matrix and integrated certification package.
