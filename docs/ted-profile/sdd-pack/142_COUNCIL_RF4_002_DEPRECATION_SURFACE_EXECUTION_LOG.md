# SDD 142: RF4-002 Status and Deprecation Surface Execution Log

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Task:** SDD 129 `RF4-002`

---

## 1. Scope

Execute RF4-002 requirements:

1. Add `deprecated_routes` and `sunset_schedule` surfaces to status and policy endpoints.
2. Add warning metadata where deprecation applies.
3. Preserve behavior during support window (no immediate route break).

---

## 2. Implemented Changes

1. Added compatibility deprecation route schedule:
   - `sidecars/ted-engine/config/compatibility_policy.json`
   - deprecates `GET /doctor` in favor of `GET /status` with sunset/enforcement dates.
2. Expanded compatibility policy validation:
   - `sidecars/ted-engine/modules/roadmap_governance.mjs`
   - validates deprecation route entries:
     - route key format
     - schedule date format
     - status enum
3. Added runtime deprecation surfaces and warnings:
   - `sidecars/ted-engine/server.mjs`
   - added helpers for compatibility status surface and route notice lookup
   - `/status` now includes:
     - `deprecated_routes`
     - `sunset_schedule`
   - `/doctor` now includes deprecation warning metadata:
     - `deprecation_notice`
   - policy GET surfaces now include compatibility metadata:
     - `/ops/llm-routing-policy`
     - `/ops/mcp/trust-policy`
     - `/ops/rollout-policy`
   - added dedicated policy endpoint:
     - `GET /ops/compatibility-policy`
4. Added deprecation telemetry events:
   - `policy.compatibility.queried`
   - `policy.deprecation.notice_served`
   - taxonomy updated in `sidecars/ted-engine/config/event_schema.json`
5. Updated route contracts and frozen baseline lock:
   - `sidecars/ted-engine/config/route_contracts.json`
   - `sidecars/ted-engine/config/retrofit_rf0_baseline_lock.json`

---

## 3. Evidence Surfaces

1. Runtime implementation:
   - `sidecars/ted-engine/server.mjs`
2. Governance/config artifacts:
   - `sidecars/ted-engine/config/compatibility_policy.json`
   - `sidecars/ted-engine/config/route_contracts.json`
   - `sidecars/ted-engine/config/event_schema.json`
   - `sidecars/ted-engine/config/retrofit_rf0_baseline_lock.json`
3. Test evidence:
   - `sidecars/ted-engine/tests/contracts.test.mjs`
   - `sidecars/ted-engine/tests/config-schemas.test.mjs`
   - `sidecars/ted-engine/tests/roadmap-governance.test.mjs`
4. Inventory/handoff:
   - `docs/ted-profile/sdd-pack/114_COUNCIL_R0_001_ACTIVE_PLAN_WAVE_INVENTORY.md`

---

## 4. Validation

Executed:

```bash
pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/contracts.test.mjs sidecars/ted-engine/tests/config-schemas.test.mjs sidecars/ted-engine/tests/roadmap-governance.test.mjs
node scripts/ted-profile/validate-roadmap-master.mjs
pnpm check
```

Result:

1. Contract/config/governance suites passed (1287/1287).
2. Roadmap validator passed including compatibility and retrofit baseline validation.
3. Repository check gate passed (format/type/lint).

---

## 5. Exit Decision

RF4-002 is complete.

Next task:

1. Start RF4-003 connector replay and callback failure drills.
