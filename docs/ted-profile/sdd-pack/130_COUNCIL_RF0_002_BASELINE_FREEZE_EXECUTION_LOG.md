# SDD 130: RF0-002 Baseline Replay and Route Contract Freeze Execution Log

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Task:** SDD 129 `RF0-002`

---

## 1. Scope

Execute RF0-002 baseline lock requirements:

1. Capture reproducible replay sample baseline.
2. Freeze route contracts for impacted workflow and migration surfaces.
3. Persist baseline KPI snapshot for later regression gates.

---

## 2. Implemented Artifacts

1. RF0 baseline lock config:
   - `sidecars/ted-engine/config/retrofit_rf0_baseline_lock.json`
2. Deterministic baseline generator:
   - `scripts/ted-profile/generate-retrofit-rf0-baseline.mjs`
3. Startup fail-closed validation wiring:
   - `sidecars/ted-engine/modules/roadmap_governance.mjs`
   - `sidecars/ted-engine/server.mjs`
   - `scripts/ted-profile/validate-roadmap-master.mjs`

---

## 3. Baseline Freeze Content

1. Replay sample set sourced from `config/replay_corpus.json`:
   - 7 scenarios total
   - 4 golden + 3 adversarial
2. Route contract freeze captured for:
   - Workflow endpoints:
     - `GET /ops/workflows`
     - `POST /ops/workflows`
     - `POST /ops/workflows/lint`
     - `POST /ops/workflows/run`
     - `GET /ops/workflows/runs`
   - Migration-observability endpoints:
     - `GET /status`
     - `GET /doctor`
     - `GET /ops/setup/validate`
     - `GET /ops/setup/state`
3. Baseline KPI snapshot stored in config:
   - `avg_job_friction_score`
   - `failure_ratio`
   - `retry_recovery_ratio`
   - status counts

Current ledger snapshot in repo has no committed workflow/friction runs, so baseline KPI totals are `0` and serve as explicit pre-run baseline state.

---

## 4. Test and Validation Evidence

Executed:

```bash
node scripts/ted-profile/validate-roadmap-master.mjs
pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/contracts.test.mjs sidecars/ted-engine/tests/gateway-contracts.test.mjs
pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/roadmap-governance.test.mjs sidecars/ted-engine/tests/config-schemas.test.mjs
```

Result:

1. Roadmap and governance validators passed.
2. Contract suites passed (1250/1250).
3. Governance/config suites passed (226/226).

---

## 5. Exit Decision

RF0-002 is complete.

Next task:

1. Start RF1-001 workflow schema evolution (`workflow_version`, `definition_hash`, publish metadata).
