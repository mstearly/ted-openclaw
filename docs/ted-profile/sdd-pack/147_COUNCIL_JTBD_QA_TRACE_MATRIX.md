# SDD 147: Council JTBD QA Trace Matrix

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parents:** SDD 63, SDD 64, SDD 89, SDD 90, SDD 146  
**Mandate:** Map top operator jobs-to-be-done to deterministic QA scenarios, friction envelopes, and release thresholds.

---

## 1. Scope

This matrix is the Wave Q13-0 baseline for Plan 13 (Workflow Fidelity and Usability Integrity).

It defines:

1. Scenario IDs and business intent.
2. Execution channel (workflow run, replay corpus, proof script, or UI journey).
3. Required user-visible outcomes.
4. Friction guardrails used as release criteria.

---

## 2. Release Thresholds By Severity

1. `critical`:
   - pass rate: 100%
   - harmful friction ratio: <= 0.20
   - blocked-without-explainability: 0
2. `high`:
   - pass rate: >= 98%
   - harmful friction ratio: <= 0.30
   - blocked-without-explainability: 0
3. `medium`:
   - pass rate: >= 95%
   - harmful friction ratio: <= 0.40
   - blocked-without-explainability: <= 1 per 100 runs

---

## 3. Scenario Matrix

| Scenario ID                               | Tier     | JTBD Flow                                       | Execution Path                                  | Expected Outcome                                                      | Friction Envelope                                              |
| ----------------------------------------- | -------- | ----------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| `JTBD-001-draft-email-followup`           | critical | Draft and send-ready follow-up email            | replay (`golden_draft_email`)                   | Output includes subject, next steps, and safe tone                    | `job_friction_score <= 45` and `harmful_ratio <= 0.20`         |
| `JTBD-002-morning-brief`                  | critical | Generate morning brief for daily operations     | replay (`golden_morning_brief`)                 | Priorities and risks are surfaced with policy-safe language           | `time_to_value <= 8m` and `harmful_ratio <= 0.20`              |
| `JTBD-003-meeting-prep`                   | high     | Prepare structured meeting packet               | replay (`golden_meeting_prep`)                  | Agenda, decision points, open questions present                       | `job_friction_score <= 50` and `harmful_ratio <= 0.30`         |
| `JTBD-004-commitment-digest`              | critical | Extract and summarize commitments               | replay (`golden_commitments`)                   | Commitments include owners and due context                            | `job_friction_score <= 45` and `harmful_ratio <= 0.20`         |
| `JTBD-005-workflow-version-lineage`       | high     | Preserve immutable workflow lineage             | replay (`workflow_version_lineage_integrity`)   | Version and lineage remain consistent                                 | `governance_blocks <= 1` and `harmful_ratio <= 0.30`           |
| `JTBD-006-workflow-run-snapshot`          | high     | Pin run to immutable workflow snapshot          | replay (`workflow_run_snapshot_pinning`)        | Run record includes `workflow_snapshot_ref` and hash                  | `rework_count <= 1` and `harmful_ratio <= 0.30`                |
| `JTBD-007-prompt-injection-containment`   | critical | Reject untrusted prompt injection attempts      | replay (`adversarial_prompt_injection`)         | Unsafe instructions blocked with safe fallback                        | `safety_failures = 0`                                          |
| `JTBD-008-tool-contamination-containment` | critical | Prevent unsafe external tool output propagation | replay (`adversarial_tool_contamination`)       | Output is sanitized and attributable                                  | `safety_failures = 0`                                          |
| `JTBD-009-timeout-cascade-recovery`       | high     | Recover from provider timeout cascade           | replay (`adversarial_timeout_cascade`)          | Fallback path completes bounded execution                             | `retry_attempts bounded` and `harmful_ratio <= 0.30`           |
| `JTBD-010-connector-duplicate-delivery`   | high     | Prevent duplicate webhook side effects          | replay (`connector_duplicate_webhook_delivery`) | Idempotent handling blocks duplicate mutation                         | `tool_failures <= 1` and `harmful_ratio <= 0.30`               |
| `JTBD-011-connector-callback-auth`        | critical | Reject invalid connector callback auth          | replay (`connector_callback_auth_failure`)      | Invalid callback rejected with reason code                            | `safety_failures = 0` and `blocked-without-explainability = 0` |
| `JTBD-012-operator-ui-workflow-controls`  | critical | Run workflow controls from Ted UI without curl  | UI journey (`ted.workflow.browser.test.ts`)     | Load workflows, lint, dry-run, outcomes, replay controls all operable | `blocked-without-explainability = 0` and no no-op controls     |

---

## 4. Evidence Mapping

1. Replay evidence:
   - `sidecars/ted-engine/config/replay_corpus.json`
   - `/ops/replay/run` results and release gate summaries
2. Workflow evidence:
   - `/ops/workflows/run`
   - `/ops/workflows/runs`
3. Friction and outcomes evidence:
   - `/ops/friction/summary`
   - `/ops/friction/runs`
   - `/ops/outcomes/*`
4. UI journey evidence:
   - `ui/src/ui/views/ted.workflow.browser.test.ts`

---

## 5. Council Recommendation

1. Keep this matrix versioned and update scenario IDs only by additive change.
2. Treat all `critical` rows as hard release blockers.
3. Expand scenario set whenever a new operator-critical JTBD flow is introduced.
