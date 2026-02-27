# SDD 148: Council QA Plan 13 Execution Log (Q13-0 to Q13-3)

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent:** SDD 146  
**Scope:** Execute early Plan 13 waves recursively with validation evidence.

---

## 1. Waves Executed

1. `Q13-0` JTBD traceability baseline.
2. `Q13-1` Ted workflow execution UI journey harness (browser test suite scaffolding).
3. `Q13-2` source-level usability guardrails (contrast and control-presence node checks).
4. `Q13-3` friction attribution contract assertions on workflow run responses.

---

## 2. Deliverables

1. New plan artifacts:
   - `docs/ted-profile/sdd-pack/146_COUNCIL_QA_PLAN_EXTENSION_WORKFLOW_FIDELITY_AND_USABILITY.md`
   - `docs/ted-profile/sdd-pack/147_COUNCIL_JTBD_QA_TRACE_MATRIX.md`
2. Master QA index updated with new Plan 13 entry:
   - `docs/ted-profile/sdd-pack/64_QA_EXECUTION_ORDER.md`
3. Traceability metadata added to runtime configs:
   - `sidecars/ted-engine/config/replay_corpus.json`
   - `sidecars/ted-engine/config/workflow_registry.json`
4. Config enforcement tests added:
   - `sidecars/ted-engine/tests/config-schemas.test.mjs`
5. Workflow friction explainability contract test added:
   - `sidecars/ted-engine/tests/contracts.test.mjs`
6. Ted UI journey test suite added:
   - `ui/src/ui/views/ted.workflow.browser.test.ts`
7. Ted source-level usability guard test suite added:
   - `ui/src/ui/views/ted.workflow.node.test.ts`

---

## 3. Validation Evidence

1. `pnpm check`: pass.
2. `pnpm exec vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/config-schemas.test.mjs`: pass.
3. `pnpm exec vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/contracts.test.mjs`: pass.
4. `pnpm --dir ui exec vitest run --config vitest.node.config.ts src/ui/views/ted.workflow.node.test.ts`: pass.

---

## 4. Local Runtime Resolution

Browser-based UI suite host blocker is now mitigated without requiring root package install:

1. Added rootless runtime bootstrap script:
   - `scripts/ui-browser-runtime.sh`
2. Added local command:
   - `pnpm test:ui:browser:local`
3. Script behavior:
   - detects missing Playwright Chromium shared libs via `ldd`,
   - downloads mapped Ubuntu packages with `apt-get download`,
   - extracts shared libraries into user cache,
   - runs browser tests with `LD_LIBRARY_PATH` pointed at extracted runtime libs.

---

## 5. Next Wave Recommendation

1. Validate `ted-workflow-browser-gate` on CI runners with `playwright install --with-deps`.
2. Promote Plan 13 browser controls to required status checks after first green run.
3. Proceed to `Q13-4` enforcement gates after CI/browser promotion is active.

---

## 6. Q13-4 Progress Update

Implemented:

1. CI task `ted-workflow-browser-gate` added in `.github/workflows/ci.yml`.
2. Task command installs Playwright Chromium runtime with dependencies and runs:
   - `src/ui/views/ted.workflow.browser.test.ts`

Current status:

1. CI remains the canonical browser-gate.
2. Local host now has a rootless fallback path to execute the same browser gate command.
