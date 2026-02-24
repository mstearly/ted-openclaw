# OpenClaw Ted Profile — Spec-Driven Development Pack

**Generated:** 2026-02-17  
**Purpose:** Provide a _project-ingestable_ spec pack to build a Mac-first OpenClaw fork ("Ted Profile") with a draft-only, auditable Microsoft Graph workflow and governed add-ons.

---

## How to Use This Pack

1. **Read `01_CONTEXT_PRIMER.md` first**  
   It captures the stable job-to-be-done, non‑negotiables, and day‑1 definition of done.

2. **Treat everything else as implementation guidance**  
   Many technical details in the source emails/docs are _user narrative_ and can evolve. This pack intentionally focuses on the _job_ and the _safety boundaries_.

3. **Implement as Epics + Job Cards**
   - Use `10_ROADMAP_JOB_BOARD.md` as the backlog spine.
   - Every job card includes _Proof_ steps (deterministic commands/tests) and a _Definition of Done_.

---

## What This Pack Produces

- A **clear baseline decision**: OpenClaw is the platform baseline; Ted Engine is a localhost sidecar.
- A **Mac installer specification** (auto-start, upgrades, rollback).
- A **security/governance spec** (Keychain-first, deny-by-default, approvals, audit).
- A **Graph draft-only spec** (two tenant profiles, least privilege).
- A **tooling spec** for OpenClaw → Ted Engine calls over loopback.

---

## File Index

| File                                                        | What it is                                                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `01_CONTEXT_PRIMER.md`                                      | One-page stable scope + non-negotiables                                              |
| `02_PRODUCT_BRIEF.md`                                       | JTBD, user journeys, success metrics                                                 |
| `03_SCOPE_BOUNDARIES.md`                                    | In-scope / out-of-scope / assumptions                                                |
| `04_ARCHITECTURE.md`                                        | Sidecar architecture + component contracts                                           |
| `05_SECURITY_GOVERNANCE.md`                                 | Threat model + controls + approval gates                                             |
| `06_MAC_INSTALLER_SPEC.md`                                  | Mac packaging, auto-start, upgrade, uninstall                                        |
| `07_M365_GRAPH_SPEC.md`                                     | Identity profiles + scopes + draft-only workflows                                    |
| `08_OPENCLAW_SIDECAR_TOOLING_SPEC.md`                       | Tool allowlist + endpoints + streaming                                               |
| `09_TEST_AND_RELEASE_GATES.md`                              | QA gates + release checklist + proofs                                                |
| `10_ROADMAP_JOB_BOARD.md`                                   | Backlog epics + job cards (proof-based)                                              |
| `11_DECISION_LOG.md`                                        | Record of key decisions and why                                                      |
| `12_RISK_REGISTER.md`                                       | Risks + mitigations + monitoring                                                     |
| `13_OPEN_QUESTIONS.md`                                      | Resolved build defaults + override policy                                            |
| `14_DAY1_PROMOTION_POLICY.md`                               | Promotion states and recursive SDD loop                                              |
| `15_VALUE_AND_FRICTION_GATES.md`                            | Operator-loop value and friction KPI gates                                           |
| `16_COUNCIL_EXPANSION_AND_COWORK_REVIEW.md`                 | Expanded council seats + mandatory interrogation pass                                |
| `17_COUNCIL_INTERROGATION_CYCLE_001.md`                     | Cycle-001 interrogation findings + remediation queue                                 |
| `18_WORKFLOW_AGENT_BOUNDARY_CONTRACT.md`                    | Deterministic vs adaptive execution boundary contract                                |
| `19_JC017_DARWIN_RUNBOOK.md`                                | Exact Darwin runbook + checklist for JC-017 closeout                                 |
| `20_CONSOLE_AUTH_AND_DISCOVERABILITY_RUNBOOK.md`            | Ted console auth/discoverability runbook                                             |
| `21_COUNCIL_UI_INTERROGATION_CYCLE_002.md`                  | UI interrogation cycle findings                                                      |
| `22_TED_UI_SURFACE_INVENTORY.md`                            | Ted UI surface inventory                                                             |
| `23_TED_UI_TASK_AUDIT.md`                                   | Ted UI task audit                                                                    |
| `24_TED_UI_GOVERNANCE_AUDIT.md`                             | Ted UI governance audit                                                              |
| `25_TED_UI_STRATEGY.md`                                     | Ted UI strategy                                                                      |
| `26_TED_UI_GOVERNED_EXECUTION_PLAN.md`                      | Ted UI governed execution plan                                                       |
| `27_COUNCIL_CONTROL_CRAWL_CYCLE_003.md`                     | Council control crawl cycle 003                                                      |
| `28_TED_OPERATOR_EXPERIENCE_REMEDIATION_PLAN.md`            | Operator experience remediation plan                                                 |
| `29_LEARNING_LOOP_GAP_AUDIT.md`                             | Learning-loop gap audit                                                              |
| `30_RECOMMENDATION_ATTRIBUTION_AND_PROMOTION_CONFIDENCE.md` | Attribution/confidence decision record                                               |
| `31_COUNCIL_END_TO_END_INTERROGATION_CYCLE_004.md`          | End-to-end interrogation cycle 004                                                   |
| `32_OPENCLAW_TED_END_TO_END_TRACE_MATRIX.md`                | End-to-end trace matrix                                                              |
| `33_CLINT_CONTROL_PLANES_AND_APPROVAL_PATHS.md`             | Clint control planes and approval paths                                              |
| `34_REMEDIATION_PROGRAM_JC046_055.md`                       | Production remediation program JC-046..055                                           |
| `35_COUNCIL_SEAT_PROFILES_ENHANCED.md`                      | Enhanced 8-seat council profiles with SDD obligation                                 |
| `36_COUNCIL_CRITICAL_REVIEW_CYCLE_005.md`                   | **RED** — Full JTBD audit, stop-the-line, remediation                                |
| `37_REMEDIATION_TASK_BREAKDOWN_JC056_069.md`                | Session-sized sub-task breakdown for all remaining work                              |
| `38_GRAPH_PROFILE_SETUP_GUIDE.md`                           | Step-by-step Azure AD + Graph API setup for operators                                |
| `39_COUNCIL_CODE_REVIEW_CYCLE_006.md`                       | **AMBER** — Full code review, runtime fixes, UX queue                                |
| `40_INTAKE_CONFIG_TRACEABILITY.md`                          | Intake-to-config traceability matrix (Clint 2026-02-20)                              |
| `41_STYLE_GUIDE.md`                                         | Style guide: Grounded Sophistication design system                                   |
| `42_COPILOT_EXTENSION_ARCHITECTURE.md`                      | Copilot Extension + MCP Server architecture design                                   |
| `43_LLM_INTEGRATION_IMPLEMENTATION_PLAN.md`                 | LLM sidecar capability + implementation sub-tasks                                    |
| `44_OPERATOR_COMMAND_CENTER_ARCHITECTURE.md`                | Meeting lifecycle + commitments + GTD + calendar intel + PARA + adoption engineering |
| `APPENDIX_SOURCES.md`                                       | Source docs list (for traceability)                                                  |
| `spec_index.json`                                           | Machine-readable index of specs                                                      |

---

## Design Principles (Non-negotiable)

- **Draft-only by default**: never send emails or meeting invites without explicit human action.
- **Single-operator**: only the configured operator can use the system.
- **Keychain-first secrets**: no secrets or refresh tokens in plaintext files.
- **Fail-closed**: if auth/audit/policy/secret resolution fails, stop execution.
- **Full auditability**: log what happened and why (redacted).
