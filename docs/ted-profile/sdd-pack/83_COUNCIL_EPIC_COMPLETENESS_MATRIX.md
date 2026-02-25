# SDD 83: Council Epic Completeness Matrix (Roadmap vs Code)

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-25  
**Scope:** Reconcile roadmap claims with verified implementation state across EPIC 0 through EPIC 14.

---

## 1. Council Verdict

The app is not fully built out end-to-end.

1. Core TED sidecar and extension capability are substantial and mostly functional in local/tested mode.
2. Real-world M365 validation remains blocked on operator Azure inputs.
3. Multiple roadmap items are stale versus code reality (features implemented but still marked TODO).
4. A small but real quality gate failure exists in the current OpenClaw test lane.

---

## 2. Evidence Basis

Primary inputs used for this reconciliation:

1. `docs/ted-profile/sdd-pack/10_ROADMAP_JOB_BOARD.md`
2. `docs/ted-profile/sdd-pack/79_COUNCIL_WAVE_A_EXECUTION_LOG.md`
3. `docs/ted-profile/sdd-pack/80_P1_3_RESIDUAL_VULNERABILITY_DECISION_PACKAGE.md`
4. `docs/ted-profile/sdd-pack/81_P0_2_AZURE_RUNBOOK_EXECUTION_LOG.md`
5. `docs/ted-profile/sdd-pack/82_MATRIX_DEPENDENCY_DEEP_STRATEGY.md`
6. Sidecar route contracts and runtime handlers:
   - `sidecars/ted-engine/config/route_contracts.json`
   - `sidecars/ted-engine/server.mjs`
7. Extension gateway/tool surfaces:
   - `extensions/ted-sidecar/index.ts`

Current roadmap status count snapshot:

1. `DONE`: 28
2. `TODO`: 50
3. `IN_PROGRESS`: 1
4. `BLOCKED`: 2
5. `DONE (partial qualifiers)`: 4

---

## 3. Epic Matrix

| Epic                                              | Roadmap Posture | Verified Code/Docs State                                                                                       | Council Status             | Remaining Work                                                                                   |
| ------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| EPIC 0 Baseline Alignment                         | DONE            | Baseline artifacts and merged main posture are in place.                                                       | DONE                       | None.                                                                                            |
| EPIC 1 Mac Installer + Auto-Start                 | TODO            | Darwin closure explicitly blocked outside Linux environment.                                                   | BLOCKED                    | Execute packaging and reboot survivability on macOS.                                             |
| EPIC 2 Security Hardening                         | TODO            | NEW-1 controls implemented (pre-commit guardrail, runtime GUID flow).                                          | PARTIAL                    | Complete keychain-first storage and deny-by-default allowlist closure.                           |
| EPIC 3 Sidecar Tooling                            | TODO            | Ted sidecar gateway integration is implemented with broad method coverage.                                     | PARTIAL with roadmap drift | Align roadmap/job cards with shipped wrapper and chat workflow evidence.                         |
| EPIC 4 M365 Draft Workflows                       | TODO            | Read/write draft-only routes exist; live Graph validation blocked by tenant/app credentials.                   | PARTIAL and BLOCKED        | Complete P0-2/P0-4 live auth and smoke evidence.                                                 |
| EPIC 5 Release + Supportability                   | TODO            | CI baseline exists; release checks exist.                                                                      | PARTIAL                    | Finish Ted-specific doctor/setup parity and release rollback evidence.                           |
| EPIC 6 Operator Value/Friction Governance         | TODO            | Governance metrics and cards exist in system surfaces.                                                         | PARTIAL                    | Close explicit KPI enforcement and fail-closed explainability proof gates.                       |
| EPIC 7 Council Co-Work Assurance                  | Mixed           | OC7.1 done; OC7.2 and OC7.3 remain TODO.                                                                       | PARTIAL                    | Finish boundary contract and fast-repair/evals completion.                                       |
| EPIC 8 Cycle 001 Remediation                      | Mostly DONE     | JC-012 to JC-022 and JC-029 to JC-035 done; JC-017 blocked; JC-023 to JC-028 TODO.                             | PARTIAL                    | Implement governance/ops/triage/profile-manager/approval/KPI consoles and mac closure.           |
| EPIC 9 Operator UX Hardening                      | Mixed           | JC-041 to JC-049 done; JC-036 to JC-040 TODO.                                                                  | PARTIAL                    | Finish policy pages, structured editor, unlock simulator, KPI cockpit, guided intake wizard.     |
| EPIC 10 JTBD Delivery                             | Mixed           | JC-057/060/061/062/063/064 done, JC-056 blocked, JC-059 in progress, others TODO.                              | PARTIAL and BLOCKED        | Complete auth setup, draft pipeline/UI completion, installer/setup/acceptance lanes.             |
| EPIC 11 LLM + MCP + Copilot                       | TODO            | LLM provider routes and MCP endpoint/tooling are implemented. No `/copilot/webhook` route found.               | PARTIAL with roadmap drift | Update roadmap for completed JC-070/073 areas and finish remaining optional webhook/proof gates. |
| EPIC 12 Command Center (Meetings/Commitments/GTD) | TODO            | Meeting, commitment, and GTD routes plus gateway/tool integrations exist.                                      | PARTIAL with roadmap drift | Validate full behavioral proofs and promotion evidence; update roadmap status.                   |
| EPIC 13 Calendar Intelligence + PARA              | TODO            | Timeblock generate, PARA classify/structure, and deep-work metrics routes exist. No apply/protect route found. | PARTIAL with roadmap drift | Add missing apply/protect capabilities and close proof/promotion records.                        |
| EPIC 14 Adoption Engineering                      | TODO            | Notification budget and trust metrics routes exist.                                                            | PARTIAL with roadmap drift | Complete onboarding ramp enforcement and progressive brief delivery acceptance evidence.         |

---

## 4. Cross-Cutting Gaps

1. **Primary blocker unchanged:** real Azure AD tenant/client setup remains required for full live validation.
2. **Roadmap/document drift:** several epics marked TODO despite implemented routes/tools.
3. **Job-card indexing drift:** roadmap references JC-056+ while `docs/ted-profile/job-cards/` currently stops at JC-049.
4. **Quality gate gap:** current full repo test run includes one failing test in the models auth-sync lane.

---

## 5. Immediate Council Actions

1. Keep P0-2/P0-4 as the first external-service closure gate.
2. Repair test gate failure in `models.list.auth-sync` and restore green baseline.
3. Normalize roadmap and job-card artifacts to match actual implementation state.
4. Continue P1 decomposition (scheduler/self-healing extraction) and matrix adapter strategy in parallel.
