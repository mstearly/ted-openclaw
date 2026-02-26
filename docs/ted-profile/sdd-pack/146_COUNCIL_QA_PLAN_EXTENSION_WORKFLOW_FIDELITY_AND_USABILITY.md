# SDD 146: Council QA Plan Extension - Workflow Fidelity and Usability Integrity

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parents:** SDD 62, SDD 63, SDD 64, SDD 75, SDD 89, SDD 90  
**Mandate:** Decide whether natural workflow simulation and friction-first usability checks should be first-class QA gates, then define a task-level execution plan.

---

## 1. Council Understanding Of The Ask

Clint and the operator request a stronger QA posture that prevents avoidable end-user failures:

1. Test flows must match real work descriptions and job-to-be-done paths.
2. QA must measure friction in execution paths, not only final pass or fail.
3. UI regressions that operators notice immediately (broken buttons, unreadable contrast, inaccessible paths) must be blocked before release.
4. The plan must be practical and integrated with the current master QA system.

Council decision: **Yes, this must be part of the official QA plan as a release gate, not optional manual review.**

---

## 2. Current Capability Assessment

### 2.1 What is already strong

1. Workflow runtime and lint surfaces exist:
   - `POST /ops/workflows/lint`
   - `POST /ops/workflows/run`
   - `GET /ops/workflows/runs`
2. Friction and outcomes telemetry exists:
   - `GET /ops/friction/summary`
   - `GET /ops/friction/runs`
   - `GET /ops/outcomes/friction-trends`
3. Replay and adversarial harness exists:
   - `POST /ops/replay/run`
   - `GET /ops/replay/runs`
4. Contract test coverage is substantial in sidecar tests:
   - `sidecars/ted-engine/tests/contracts.test.mjs`
5. Large proof script library exists:
   - `scripts/ted-profile/proof_*.sh`

### 2.2 What is still missing

1. No Ted-specific UI workflow journey test suite is present in `ui/src/ui/views/` (no `ted.*.test.ts`).
2. No automated contrast or theme readability gate for Ted workbench cards in CI.
3. No automated guard that verifies clickable controls are keyboard reachable in Ted surfaces.
4. No explicit spec-to-test traceability matrix that maps each top operator JTBD flow to deterministic QA scenarios and release thresholds.

Conclusion: the platform has strong backend governance and telemetry, but missing operator-facing UX and end-to-end fidelity gates in automation.

---

## 3. External Research Summary And Why It Changes QA

Primary-source findings:

1. **W3C WCAG** requires minimum text contrast ratios and non-text contrast for UI components. This directly addresses unreadable dark-theme text and low-visibility controls.
2. **VS Code webview guidance** requires theme-aware styling including high-contrast variants. Ted UI must not assume one color scheme.
3. **Playwright guidance** recommends tests that focus on user-visible behavior and supports visual comparisons for regression detection.
4. **OpenAI eval guidance** emphasizes representative datasets and trace grading, aligning with friction-aware trajectory evaluation instead of output-only checks.
5. **OpenTelemetry GenAI semantic conventions** provide structure for trace and event correlation so friction telemetry can be actionable.
6. **GitHub protected branch required status checks** support hard release gates so these checks are enforceable.

Council inference:

1. This ask is not cosmetic; it is aligned with accepted QA and reliability practice.
2. Existing Ted friction telemetry can be leveraged immediately, but without UI and journey gates the system still risks operator-visible regressions.

---

## 4. Plan 13 Extension Scope

Plan 13 in SDD 64 is added as:

1. **Workflow Fidelity:** verify real operator journeys from trigger to completed job outcome.
2. **Usability Integrity:** verify interaction operability, readability, and accessibility in all supported themes.
3. **Friction Explainability:** verify every failed or degraded path emits machine-usable friction evidence with traceability.

---

## 5. Wave Plan With Task-Level Work

## Wave Q13-0 - JTBD Traceability Baseline

Goal: tie specs to executable QA cases.

Tasks:

1. Create `docs/ted-profile/sdd-pack/147_COUNCIL_JTBD_QA_TRACE_MATRIX.md`.
2. Define top operator scenarios (minimum 12) and map each to:
   - input setup
   - expected user-visible steps
   - expected final outcome
   - allowed friction envelope
3. Add scenario IDs to replay corpus and workflow registry metadata where applicable.
4. Define release thresholds per scenario class (critical, high, medium).

Dependencies: none  
Exit criteria:

1. Every critical JTBD flow has at least one deterministic test scenario ID.
2. Matrix reviewed and approved by council.

## Wave Q13-1 - Ted UI Journey Automation

Goal: prevent broken user paths before release.

Tasks:

1. Add Ted UI browser journey tests in `ui/src/ui/views/ted.workflow.browser.test.ts`.
2. Cover minimum flows:
   - load workflows
   - run workflow dry-run
   - run risk lint
   - inspect friction summary
   - inspect replay gate status
3. Validate control operability:
   - primary action buttons trigger expected state changes
   - loading and error states surface to operator
4. Wire tests into `pnpm test:ui` execution for CI use.

Dependencies: Q13-0  
Exit criteria:

1. All critical Ted UI flows execute in automated browser tests.
2. No silent no-op action for required controls.

## Wave Q13-2 - Theme and Accessibility Gate

Goal: block readability and keyboard failures.

Tasks:

1. Add theme matrix test runs for default light, default dark, and high contrast variants.
2. Add contrast assertions for critical text and action controls using WCAG thresholds.
3. Add keyboard reachability checks for major Ted action controls.
4. Add optional screenshot diff baseline for high-risk cards (workflow, outcomes, replay, trust).

Dependencies: Q13-1  
Exit criteria:

1. Contrast and keyboard checks pass for critical cards.
2. Theme regressions become CI-visible failures.

## Wave Q13-3 - Friction Attribution Hardening

Goal: ensure failures produce actionable diagnostics.

Tasks:

1. Enforce `trace_id`, `workflow_id`, `run_id`, `step_id`, `reason_code` presence in friction event payloads for journey scenarios.
2. Add assertions that failed UI journeys correlate to friction and outcome events.
3. Add a regression check that blocked actions include explainability payloads.
4. Publish a short "failure triage drilldown" runbook for operators and developers.

Dependencies: Q13-0, Q13-1  
Exit criteria:

1. Every failed critical scenario has attributable friction evidence.
2. Explainability gaps are treated as release blockers.

## Wave Q13-4 - CI and Release Gate Enforcement

Goal: make these checks mandatory.

Tasks:

1. Add CI job steps for:
   - Ted UI journey tests
   - theme and accessibility checks
   - friction attribution assertions
2. Mark checks as required status checks on protected branches.
3. Add release-gate summary artifact with:
   - scenario pass rate
   - WCAG/keyboard violations
   - top harmful friction drivers

Dependencies: Q13-1, Q13-2, Q13-3  
Exit criteria:

1. PR merge is blocked when Plan 13 checks fail.
2. Release packet includes Plan 13 evidence.

---

## 6. Acceptance Criteria For Plan 13

A build passes Plan 13 only when all are true:

1. Critical JTBD scenario pass rate is 100%.
2. No S1 or S2 usability defects in critical paths.
3. Contrast and keyboard checks pass for all critical Ted cards.
4. Friction event attribution completeness is >= 99% for required fields.
5. Blocked actions include explainability and next-safe-step text.

---

## 7. Recommendation

1. Keep existing SDD 63 plans intact.
2. Enforce this extension as the new Plan 13 in SDD 64 ordering.
3. Execute Q13-0 through Q13-4 before treating the product as operator-hardened for broad usage.

---

## 8. Primary Sources

1. W3C WCAG contrast minimum and non-text contrast:
   - https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
   - https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast
2. VS Code webview theming guidance:
   - https://code.visualstudio.com/api/extension-guides/webview
3. Playwright best practices and visual comparisons:
   - https://playwright.dev/docs/best-practices
   - https://playwright.dev/docs/test-snapshots
4. OpenAI eval and trace grading guidance:
   - https://platform.openai.com/docs/guides/evals
5. OpenTelemetry GenAI semantic conventions:
   - https://opentelemetry.io/docs/specs/semconv/gen-ai/
6. GitHub required status checks for protected branches:
   - https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
