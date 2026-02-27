# SDD 149: Council Full-Suite QA Run Plan

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-27  
**Parents:** SDD 63, SDD 64, SDD 146, SDD 148  
**Mandate:** Execute a formal full-suite QA run wave-by-wave with evidence logging and explicit blocker reporting.

---

## 1. Council Objective

Run the comprehensive QA program in controlled waves, producing auditable evidence for:

1. Automated release gates.
2. Regression matrix confidence.
3. Workflow fidelity and usability integrity.
4. Security and dependency posture.
5. Explicitly blocked/manual items that require operator or external services.

---

## 2. Wave Structure

## Wave FQ-0: Preflight and Baseline

Purpose: establish deterministic baseline before test execution.

Tasks:

1. Verify clean branch state and branch sync.
2. Verify toolchain availability (`pnpm`, node, vitest).
3. Record current CI status for latest commits.
4. Confirm required QA artifacts exist (SDD 63/64/146/148, test configs, replay scripts).

Exit criteria:

1. Environment is ready for automated commands.
2. No unknown local mutations contaminate evidence.

---

## Wave FQ-1: Tier 1 CI-Equivalent Gates

Purpose: run fail-fast merge gates locally.

Tasks:

1. `pnpm check`
2. `pnpm build`
3. `pnpm test` (core suite)

Exit criteria:

1. All Tier 1 commands pass, or failures are captured with command output and triage note.

---

## Wave FQ-2: Regression Matrix and Plan 13 Enforcement

Purpose: run council-mandated technical regression matrix and Ted workflow QA gates.

Tasks:

1. `node scripts/ted-profile/validate-roadmap-master.mjs`
2. `pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/roadmap-governance.test.mjs sidecars/ted-engine/tests/config-schemas.test.mjs sidecars/ted-engine/tests/contracts.test.mjs`
3. `pnpm vitest run src/gateway/openresponses-transport-config.test.ts src/gateway/openresponses-transport-runtime.test.ts src/gateway/openresponses-transport.test.ts src/gateway/openresponses-http.context-semantics.test.ts src/gateway/server-runtime-config.test.ts`
4. `pnpm vitest run --config vitest.e2e.config.ts src/gateway/openresponses-http.e2e.test.ts src/gateway/openresponses-parity.e2e.test.ts`
5. `pnpm test:ui:browser:local`
6. `pnpm --dir ui exec vitest run --config vitest.node.config.ts src/ui/views/ted.workflow.node.test.ts`

Exit criteria:

1. Regression matrix passes, or failures are logged with affected domain and blocking severity.
2. Plan 13 local browser/node gates pass.

---

## Wave FQ-3: Extended QA and Security Posture

Purpose: execute additional automated/semi-automated quality signals.

Tasks:

1. `pnpm audit --prod --json`
2. `./scripts/ted-profile/run_all_proofs.sh` (if executable in host context)
3. `node scripts/ted-profile/ci-replay-rollout-gate.mjs --output /tmp/fq-qa-replay-gate-summary.json`

Exit criteria:

1. No unresolved high/critical vulnerabilities.
2. Proof and replay outputs captured, or blockers documented.

---

## Wave FQ-4: Manual/Operator-Dependent QA Gates

Purpose: close remaining plans requiring manual execution or external credentials.

Tasks:

1. Accessibility manual sweep (SDD 63 Plan 11 and SDD 62).
2. UI/UX checklist execution (SDD 62 full checklist).
3. Operational readiness review package update.
4. UAT gate review with operator inputs and live external credentials.

Exit criteria:

1. All manual gates either executed with evidence or marked blocked with owner/date.

---

## 3. Evidence Logging Rules

1. Every wave records:
   - command,
   - result (`pass`, `fail`, `blocked`, `skipped`),
   - timestamp,
   - artifact path or failure reason.
2. Failure evidence is not overwritten; reruns are appended with attempt number.
3. Blockers must include owner and unblock condition.

---

## 4. Acceptance Criteria

A formal full-suite run is considered complete when:

1. Waves FQ-0 through FQ-3 are executed with evidence.
2. Wave FQ-4 manual items are either completed or explicitly blocked with owner accountability.
3. Final council summary includes GO/NO-GO recommendation with risk register.

---

## 5. Deliverables

1. This plan artifact (SDD 149).
2. Execution log artifact (SDD 150) with wave-by-wave evidence.
3. Final council recommendation statement.
