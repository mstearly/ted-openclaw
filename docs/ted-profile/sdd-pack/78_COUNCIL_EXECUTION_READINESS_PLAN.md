# SDD 78: Council Execution Readiness Plan

**Status:** Active
**Version:** v1
**Date:** 2026-02-25
**Council Mandate:** Validate execution readiness of SDD 76 and SDD 77 and produce an actionable plan with task-level gates
**Input:** SDD 76, SDD 77, current repository state on `main`
**Scope:** P0 and P1 execution readiness, blocked inputs, and task sequencing
**Execution Update (2026-02-25):** Wave A actions are now in progress/completed. See SDD 79.

---

## 1. Council Verdict

The plan is executable now, but not all tasks are ready at the same time.

1. Core P0 hygiene is already in place (branch merge posture, backup tags, CI baseline).
2. The main blocker remains unchanged: real Azure AD tenant/app credentials are missing.
3. P1 execution can proceed in parallel where it does not require live Microsoft Graph access.
4. Security work is materially improved (critical and high alerts resolved), with three residual advisories that need explicit disposition.

---

## 2. Verified Current State

This section records what the council can verify directly from the workspace.

### 2.1 Completed or materially advanced

| Item                                        | Evidence                                                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Backup tags exist (NEW-2)                   | `git tag --list` includes `pre-ted-merge` and `ted-v0.1-alpha`                                           |
| CI workflow is present                      | `.github/workflows/ci.yml` exists with test and check jobs                                               |
| Sidecar integration contract lane unblocked | `sidecars/ted-engine/tests/helpers/test-server.mjs` exists and `contracts.test.mjs` uses lifecycle setup |
| Sidecar test suite currently passing        | `npx vitest run --config vitest.sidecar.config.ts` reports 1434 passed, 0 skipped                        |
| Dependabot risk reduced                     | `pnpm audit --json` summary: `critical: 0`, `high: 0`, `moderate: 2`, `low: 1`                           |

### 2.2 Still blocked

| Item                                       | Evidence                                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Azure AD tenant and app IDs not configured | `sidecars/ted-engine/config/graph.profiles.json` still has empty `tenant_id` and `client_id` |
| Live Graph smoke tests cannot start        | P0-4 depends on authenticated profile from P0-2                                              |
| Morning brief real-data demo cannot run    | NEW-3 depends on successful P0-4                                                             |

### 2.3 Secret management model confirmation (NEW-1)

Current sidecar auth path is device code public client flow (not confidential client secret flow):

1. Device auth routes exist: `/graph/{profile_id}/auth/device/start` and `/graph/{profile_id}/auth/device/poll`.
2. `server.mjs` has no `client_secret`, `MSAL`, or `acquireToken` references.
3. Current risk is config hygiene and credential handling, not missing secret injection code.

---

## 3. Task Readiness Matrix

| ID    | Task                                  | Status                 | Ready Now            | Missing Info                                              | Owner              |
| ----- | ------------------------------------- | ---------------------- | -------------------- | --------------------------------------------------------- | ------------------ |
| P0-1  | Merge branch to main                  | Complete               | N/A                  | None                                                      | Council            |
| P0-2  | Azure AD app setup and profile config | Blocked                | No                   | Real `tenant_id` and `client_id`, operator portal actions | Operator           |
| P0-3  | CI pipeline baseline                  | Complete               | N/A                  | None                                                      | Council            |
| P0-4  | Live Graph smoke tests                | Blocked by P0-2        | No                   | Authenticated Graph profile                               | Operator + Council |
| NEW-1 | Secret management hardening           | In progress            | Yes                  | Finalized operator hygiene checklist                      | Council            |
| NEW-2 | Backup tags                           | Complete               | N/A                  | None                                                      | Council            |
| NEW-3 | Real morning brief demo               | Pending                | No (depends on P0-4) | Successful live smoke tests                               | Operator + Council |
| P1-1  | Monolith decomposition Tier 1         | Ready                  | Yes                  | Final extraction order and module acceptance gates        | Council            |
| P1-2  | Integration test infrastructure       | Substantially complete | Yes                  | Extend beyond contracts lane if needed                    | Council            |
| P1-3  | Dependency vulnerability remediation  | Partially complete     | Yes                  | Disposition of residual 3 advisories                      | Council + Operator |
| P1-4  | Graph response mocking for CI         | Partially blocked      | Partial              | Real fixture capture from P0-4                            | Council            |

---

## 4. Missing Inputs Required From Operator

These inputs are mandatory before remaining P0 work can complete.

### 4.1 Azure AD identity and consent

1. Confirm tenant model: one tenant or separate tenants for `olumie` and `everest`.
2. For each active profile, provide:
   - `tenant_id`
   - `client_id`
3. Confirm admin consent was granted for delegated scopes in `graph.profiles.json`.
4. Confirm public client flow is enabled for device code auth.

### 4.2 Workload config values needed for smoke tests

1. Planner:
   - `planner.group_id`
   - `planner.plan_ids`
2. To Do:
   - confirm list discovery is acceptable, or provide `todo.list_id`
3. SharePoint:
   - `sharepoint.site_id`
   - `sharepoint.drive_id`
   - `sharepoint.root_folder` (if required by workflow)

### 4.3 Operator acceptance and demo target

1. Identify which profile should be used for the first real morning brief demo.
2. Confirm acceptable read/write boundaries for first live run (read-only first recommended).

---

## 5. Execution Plan From Current State

### Wave A: Close open council lanes that are ready now (no operator dependency)

### A1. NEW-1 closeout: secret management controls

1. Document local-only credential handling for `graph.profiles.json`.
2. Add a pre-push checklist to avoid committing real tenant/app identifiers.
3. Record the device code auth assumptions as an explicit invariant.

### A2. P1-3 closeout: residual advisories

1. Document residual advisories and transitive ownership:
   - `request` and `ajv` via `extensions/matrix` -> `@vector-im/matrix-bot-sdk`
   - `hono` via `@buape/carbon`
2. Decide disposition:
   - upgrade path if available and policy-compliant
   - otherwise temporary risk acceptance with owner and revisit date

### A3. P1-1 start: decomposition preparation

1. Lock module extraction order:
   - SharePoint
   - Scheduler
   - Self-healing
2. Define regression gate per extraction:
   - route contract tests pass
   - sidecar test suite pass
   - behavior parity on moved endpoints

### Wave B: Operator-driven P0 unblock

### B1. Execute P0-2 Azure setup

1. Register app(s), set delegated permissions, grant consent.
2. Enable public client flow.
3. Populate `graph.profiles.json` locally with real IDs.
4. Run device flow:
   - `POST /graph/{profile_id}/auth/device/start`
   - `POST /graph/{profile_id}/auth/device/poll`
5. Verify `GET /graph/{profile_id}/status` authenticated state.

### Wave C: Live validation and evidence capture

### C1. Execute P0-4 smoke tests in strict order

1. Mail read endpoints.
2. Calendar list endpoints.
3. Planner read endpoints.
4. To Do read endpoints.
5. SharePoint read endpoints.
6. Token refresh validation.
7. Error-path validation (invalid profile, revoked token, missing permissions).

### C2. Capture artifacts for P1-4

1. Save real Graph responses as sanitized fixtures.
2. Document response-shape mismatches and normalizer fixes.

### Wave D: Parallel P1 continuation

### D1. P1-1 implementation

1. Extract SharePoint module and validate.
2. Extract Scheduler module and validate.
3. Extract Self-healing module and validate.

### D2. P1-4 implementation

1. Stand up mock Graph helper.
2. Wire fixture-driven integration tests into CI-safe lane.

---

## 6. Task Breakdown By Element

This maps each major element from the project review to executable tasks.

| Element                          | Required Tasks    | Done    | Remaining                                                 |
| -------------------------------- | ----------------- | ------- | --------------------------------------------------------- |
| Branch and integration risk      | P0-1, NEW-2, P0-3 | Yes     | Branch protection verification only (if not enforced yet) |
| Real Graph validation gap        | P0-2, P0-4, NEW-3 | No      | Full operator input and live smoke run                    |
| Monolith maintainability         | P1-1              | Partial | Tier 1 extraction execution                               |
| Test completeness and automation | P1-2, P0-3        | Mostly  | Expand non-contract integration coverage as needed        |
| Dependency security posture      | P1-3              | Partial | Resolve or accept 3 residual advisories                   |
| Future architecture evolution    | P2 backlog items  | No      | Defer until P0 and P1 complete                            |

---

## 7. Council Go and No-Go Gates

### Go now

1. NEW-1 closeout actions.
2. P1-1 decomposition planning and first extraction.
3. P1-3 residual vulnerability disposition.

### No-go until operator input arrives

1. P0-2 live auth onboarding.
2. P0-4 live Graph smoke tests.
3. NEW-3 real morning brief demo.

---

## 8. Immediate Next Actions

1. Council executes Wave A now (NEW-1 closeout, P1-3 disposition, P1-1 extraction order lock).
2. Operator provides Azure AD inputs listed in Section 4.
3. Council executes Wave B and Wave C in one working session once credentials are ready.
4. Council enters Wave D with fixture-backed CI coverage and decomposition work in parallel.
