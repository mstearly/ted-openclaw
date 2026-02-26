# SDD 97: Council Wave E Execution Log — Workflow Risk Lint and Explainability Preview

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent:** SDD 91 (Wave E)

---

## 1. Scope Executed

Wave E baseline delivered across sidecar, extension, and UI:

1. Pre-publish workflow risk lint engine.
2. Publish blocking for high-risk nodes missing approval checkpoints.
3. Explainability and friction hotspot forecast preview in operator UI.

---

## 2. Delivered

1. New sidecar lint endpoint:
   - `POST /ops/workflows/lint`
2. Publish gating on `POST /ops/workflows`:
   - Returns `409` and blocks publish when lint has blocking findings.
3. Lint response includes:
   - per-node risk annotations
   - policy explainability reasons with next-safe-step
   - friction forecast with hotspot ranking
4. New workflow lint events in taxonomy:
   - `workflow.risk_lint.completed`
   - `workflow.risk_hotspots.forecasted`
   - `workflow.risk_lint.failed`
   - `workflow.publish.blocked_by_lint`
5. Extension gateway method:
   - `ted.ops.workflows.lint`
6. Ted UI workflow card upgrades:
   - Risk Lint action
   - lint result summary (blocking/warnings)
   - pre-run friction score + top hotspot
   - explainability and hotspot detail preview

---

## 3. Acceptance Mapping

1. **E-001:** High-risk workflow cannot publish without approval checkpoint (`POST /ops/workflows` lint gate).
2. **E-001:** Explainability reasons emitted before publish via lint response payload.
3. **E-002:** UI exposes risk annotations and hotspot forecast before run/publish.
4. **E-002:** Operator can inspect policy reason and next-safe-step guidance from UI.

---

## 4. Validation

1. `node --check sidecars/ted-engine/server.mjs` passes.
2. JSON parse checks for updated governance files pass.
3. `pnpm check` passes.
4. `pnpm build` passes.

---

## 5. Follow-Up

1. Add route-risk overrides in config for operator-tunable lint severity.
2. Add CI gate to require lint pass for workflow JSON edits in PRs.
3. Calibrate hotspot weights using observed friction rollups from live workflow runs.
