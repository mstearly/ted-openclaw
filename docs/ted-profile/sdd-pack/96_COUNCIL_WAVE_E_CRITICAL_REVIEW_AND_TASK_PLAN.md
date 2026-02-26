# SDD 96: Council Wave E Critical Review and Task Plan — Workflow Risk Lint + Explainability Preview

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent:** SDD 91 (Wave E)

---

## 1. Critical Review Verdict

**Verdict:** READY TO EXECUTE (with immediate enforcement required).

Critical findings from code review before Wave E execution:

1. Workflow publish path (`POST /ops/workflows`) accepted high-risk route nodes with no approval checkpoint.
2. No pre-publish lint endpoint existed for operator explainability or policy reason preview.
3. UI workflow card allowed save/run operations but had no per-node risk annotation or friction hotspot forecast.
4. Existing friction telemetry (Wave A) and workflow runtime records were sufficient to seed a forecast model without new infra dependencies.

Conclusion: Wave E should execute now; no external blocker remains.

---

## 2. Task-Level Plan

### E-001 Risk lint engine

1. `E-001-001` Add deterministic lint evaluator in sidecar for workflow definitions.
   - Output: `lint`, `node_annotations`, `policy_explainability`, `friction_forecast`.
2. `E-001-002` Add publish gate to `POST /ops/workflows`.
   - Rule: block publish when high-risk node lacks approval checkpoint.
   - Response: `409` with explainability and next-safe-step payload.
3. `E-001-003` Add dedicated lint preview route.
   - Route: `POST /ops/workflows/lint`.
   - Supports inline workflow JSON and registry lookup by `workflow_id`.
4. `E-001-004` Emit auditable workflow lint events.
   - Include pass/fail, blocker count, and hotspot summary.

### E-002 UI simulation and explainability preview

1. `E-002-001` Add extension gateway method for lint route.
2. `E-002-002` Add UI state/controller model for lint request/result.
3. `E-002-003` Add workflow card controls for lint execution.
4. `E-002-004` Render policy explainability and friction hotspot forecast pre-run.

---

## 3. Dependencies and Order

1. Sidecar lint evaluator (`E-001-001`) must ship before publish gate (`E-001-002`).
2. Publish gate and lint route (`E-001-002`, `E-001-003`) must ship before UI control wiring.
3. Extension method (`E-002-001`) must ship before controller/UI wiring (`E-002-002` to `E-002-004`).
4. Contracts/event taxonomy updates must ship in same wave to preserve governance completeness.

---

## 4. Acceptance Gates

1. High-risk workflow without approval checkpoint cannot publish.
2. Lint response includes policy explainability reasons and actionable next-safe-step text.
3. Operator UI can preview risk annotations and friction hotspot forecast before publish/run.
4. `pnpm check` and `pnpm build` must pass after Wave E changes.

---

## 5. Residual Risks

1. Forecast model is heuristic-first and should be calibrated against real run data over time.
2. Condition-step runtime remains placeholder and continues to surface warning-level lint findings.
