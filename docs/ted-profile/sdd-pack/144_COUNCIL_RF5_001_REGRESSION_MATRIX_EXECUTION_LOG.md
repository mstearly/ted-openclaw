# SDD 144: RF5-001 Full Regression Matrix Execution Log

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Task:** SDD 129 `RF5-001`

---

## 1. Scope

Execute RF5-001 requirements:

1. Run sidecar, gateway, and e2e suites for impacted tracks.
2. Run replay gate and compare against RF0 baseline thresholds.
3. Run contract and schema validators for all retrofit artifacts.

---

## 2. Executed Matrix

Mandatory command set executed in order:

1. `pnpm check`
2. `pnpm build`
3. `node scripts/ted-profile/validate-roadmap-master.mjs`
4. `pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/roadmap-governance.test.mjs sidecars/ted-engine/tests/config-schemas.test.mjs sidecars/ted-engine/tests/contracts.test.mjs`
5. `pnpm vitest run src/gateway/openresponses-transport-config.test.ts src/gateway/openresponses-transport-runtime.test.ts src/gateway/openresponses-transport.test.ts src/gateway/openresponses-http.context-semantics.test.ts src/gateway/server-runtime-config.test.ts`
6. `pnpm vitest run --config vitest.e2e.config.ts src/gateway/openresponses-http.e2e.test.ts src/gateway/openresponses-parity.e2e.test.ts`

Additional RF5 acceptance evidence run:

7. `node scripts/ted-profile/ci-replay-rollout-gate.mjs --output /tmp/rf5-001-replay-gate-summary.json`
8. Baseline KPI comparison artifact generated: `/tmp/rf5-001-baseline-kpi-comparison.json`

---

## 3. Results Summary

1. `pnpm check`: passed (format, tsgo, type-aware lint).
2. `pnpm build`: passed.
3. Roadmap/governance validator: passed.
4. Sidecar governance/contract matrix: passed (1288/1288).
5. Gateway transport/runtime matrix: passed (23/23).
6. Gateway e2e matrix: passed (20/20).
7. Replay release gate: passed (`rf4-003-v1`, pass rate `1.0`, connector failures `0`).
8. RF0 baseline KPI comparison: within tolerance (`within_tolerance: true`).

---

## 4. Acceptance Decision

RF5-001 accepted.

Acceptance criteria status:

1. All mandatory gates pass: **Yes**.
2. Baseline reliability KPI regression outside approved tolerance: **No**.

---

## 5. Evidence References

1. Test/build command outputs from this execution session.
2. Replay gate summary: `/tmp/rf5-001-replay-gate-summary.json`
3. Replay evidence: `/tmp/rf5-001-replay-gate-summary.release_evidence.jsonl`
4. Baseline comparison artifact: `/tmp/rf5-001-baseline-kpi-comparison.json`

---

## 6. Handoff

Next task:

1. Execute RF5-002 execution log and board readiness packet.
