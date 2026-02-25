# SDD 77: Council Critical Evaluation — Task Breakdown & Execution Plan

**Status:** Active
**Version:** v1
**Date:** 2026-02-25
**Council Mandate:** Critical evaluation of SDD 76 (Project Review & Next Steps)
**Input:** SDD 76, SDD 72 (Sprint 3 plan), SDD 71 (R-001 through R-025), codebase audit
**Scope:** Validate priorities, identify missing risks, produce executable task breakdown

---

## 1. Council Verdict

**SDD 76 is directionally correct but has two ordering errors and three blind spots.**

The council **agrees** with the ~85% completeness estimate and Late Alpha maturity label. The council **disagrees** on two priority assignments and identifies three items SDD 76 missed entirely.

**Changes from SDD 76:**

| Item                           | SDD 76 Priority | Council Priority | Rationale                                                                                  |
| ------------------------------ | --------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| Merge branch to main           | P0              | P0               | Agreed — 89K insertions on a feature branch is unacceptable risk                           |
| Azure AD setup                 | P0              | P0               | Agreed — THE blocker                                                                       |
| E2E smoke test                 | P0              | P0               | Agreed — first contact with reality                                                        |
| CI/CD pipeline                 | P1              | **P0**           | Elevated — 1,278 tests with no automated runner means regressions slip in NOW              |
| Monolith decomposition         | P1              | P1               | Agreed — important but not blocking                                                        |
| Integration test infra         | P1              | P1               | Agreed                                                                                     |
| **PR description quality**     | Not listed      | **P0**           | NEW — a 523-file, 89K-line PR needs a structured description or reviewers cannot assess it |
| **Dependency audit**           | Not listed      | **P1**           | NEW — Dependabot flagged 7 vulnerabilities (1 critical, 3 high) on push                    |
| **Graph API response mocking** | Not listed      | **P1**           | NEW — real Graph API testing requires a mock layer for CI                                  |

---

## 2. Council Debates & Tensions

### Tension 1: Merge Strategy — Squash vs. Merge Commit vs. Rebase

- **Seat 1 (Systems Integration)** argued for squash merge: "89K insertions across 523 files. A 29-commit history on main adds noise. Squash to a single commit with a comprehensive description."
- **Seat 5 (Workflow)** argued for merge commit: "The 29 commits have meaningful atomic messages (docs, fixes, features). Squashing loses bisect-ability. If a bug is found post-merge, `git bisect` needs those granular commits."
- **Seat 7 (Risk)** broke the tie: "Merge commit preserves history AND keeps main clean via the merge commit itself. If we need to revert, we revert one merge commit. If we need to bisect, the feature branch commits are preserved in the graph."
- **Resolution:** **Merge commit** (not squash). PR description must be comprehensive since it's the single entry point for understanding the body of work.

### Tension 2: Should CI/CD Be P0 or P1?

- **Seat 3 (Output Quality)** argued P0: "We just fixed 18 lint errors that blocked a commit. Without CI, the next contributor (or the next session) could introduce test failures that go undetected until someone manually runs `vitest`."
- **Seat 8 (Adoption)** argued P1: "The operator needs real Graph API access more than CI. CI is infrastructure — important but not user-facing."
- **Seat 4 (Compliance)** sided with Seat 3: "The pre-commit hook only catches lint. It does NOT run the 1,278 Vitest tests. A passing commit can have broken tests. This is a quality gap."
- **Resolution:** **P0.** A minimal GitHub Actions workflow (lint + vitest) is ~30 lines of YAML and takes 15 minutes. The cost is trivial; the risk of operating without it is real.

### Tension 3: Is Monolith Decomposition Truly P1, or Should It Wait?

- **Seat 1 (Systems Integration)** wanted P0: "20K lines in one file. Every edit risks collateral damage."
- **Seat 6 (Scalability)** wanted P2: "The file works. Tests pass. Decomposition is a refactor — it adds zero new capability. Do it AFTER real-world validation proves the architecture works."
- **Seat 5 (Workflow)** mediated: "P1 is correct. It's not blocking anything today, but it will block the next major feature addition. Start planning module boundaries now; execute after the P0 wave."
- **Resolution:** **P1.** Plan module boundaries during P0 wave (zero code changes). Execute extraction in P1 wave after CI is in place to catch regressions.

### Tension 4: What Does the Operator Actually Need?

- **Seat 8 (Adoption)** raised: "SDD 76 is engineer-centric. It talks about CI, decomposition, test infrastructure. But the operator (Clint) needs to SEE Ted working. The fastest path to value is: Azure AD → auth flow → read his actual inbox → show a real morning brief."
- **Seat 2 (Deal Intelligence)** agreed: "The deal pipeline, commitment extraction, Planner sync — none of it matters until it's processing real data."
- **Resolution:** P0 execution order must be: (1) Merge PR, (2) Azure AD setup, (3) CI pipeline, (4) First real smoke test. The smoke test IS the operator's first real interaction with Ted.

---

## 3. Revised Priority Matrix

### P0: Do Now (This Sprint)

| ID   | Item                                         | Effort  | Dependencies                  |
| ---- | -------------------------------------------- | ------- | ----------------------------- |
| P0-1 | Create PR and merge branch to main           | 30 min  | None                          |
| P0-2 | Set up Azure AD app registration             | 1-2 hrs | Operator action required      |
| P0-3 | CI/CD pipeline (GitHub Actions)              | 30 min  | P0-1 (needs main branch)      |
| P0-4 | End-to-end smoke test against live Graph API | 1-2 hrs | P0-2 (needs real credentials) |

### P1: Next Sprint

| ID   | Item                                         | Effort  | Dependencies                           |
| ---- | -------------------------------------------- | ------- | -------------------------------------- |
| P1-1 | Monolith decomposition — Tier 1 extraction   | 4-6 hrs | P0-3 (CI must catch regressions)       |
| P1-2 | Integration test infrastructure              | 2-3 hrs | P0-3                                   |
| P1-3 | Dependency audit — resolve Dependabot alerts | 1-2 hrs | P0-1                                   |
| P1-4 | Graph API response mocking for CI            | 2-3 hrs | P0-4 (need real response shapes first) |

### P2: Backlog (unchanged from SDD 76)

| ID   | Item                                              |
| ---- | ------------------------------------------------- |
| P2-1 | Version-aware state machines (SDD 72 Sprint 3B)   |
| P2-2 | Human-as-a-tool pattern (SDD 72 Sprint 3D)        |
| P2-3 | Operator engagement mechanisms (SDD 72 Sprint 3C) |
| P2-4 | Ledger snapshots (SDD 72 Sprint 4A)               |
| P2-5 | Deferred UI surfaces (JC-061a, JC-062a)           |
| P2-6 | Mac installer + LaunchAgent (JC-065/066)          |

---

## 4. Detailed Task Breakdown

### P0-1: Create PR and Merge Branch to Main

**Context:** 29 commits, 523 files changed, 89,539 insertions, 1,296 deletions. Branch diverged from main at `ed72fa5cb` ("Improve telegram media-group error logging").

#### P0-1-001: Verify no merge conflicts with main

- **Command:** `git merge-base main feat/ted-engine-full-implementation` then `git diff main...HEAD --stat`
- **Files affected:** None (read-only check)
- **Acceptance criteria:** Merge base identified, conflict count is zero or enumerated
- **Dependencies:** None
- **Owner:** Seat 1

#### P0-1-002: Create PR with structured description

- **Command:** `gh pr create` with comprehensive body
- **Body structure:**
  - Summary: what TED is, what this PR adds
  - Phase inventory: list all phases (1-21), QA cycles, sprints
  - Key metrics: 20K sidecar, 10K extension, 5K UI, 1,434 tests, 34 configs, 227 events
  - Architecture: link to SDD 42 (Blueprint), Future-State-Framing, Planes-Artifacts-Owners
  - Test results: vitest output summary
  - Known blockers: Azure AD credentials empty, 156 skipped integration tests
  - Screenshots: none (CLI/sidecar, no visual UI to screenshot)
- **Acceptance criteria:** PR created, description covers all phases, reviewable
- **Dependencies:** P0-1-001
- **Owner:** Seat 1, Seat 8

#### P0-1-003: Merge PR to main

- **Strategy:** Merge commit (preserves bisect-ability, single revert point)
- **Command:** `gh pr merge --merge`
- **Post-merge:** `git checkout main && git pull && node --check sidecars/ted-engine/server.mjs && npx tsc --noEmit`
- **Acceptance criteria:** main branch has all 29 commits, syntax check passes, TypeScript compiles
- **Dependencies:** P0-1-002
- **Owner:** Seat 1

---

### P0-2: Set Up Azure AD App Registration

**Context:** `graph.profiles.json` has two profiles (olumie, everest) with empty `tenant_id` and `client_id`. All M365 integration is blocked.

#### P0-2-001: Register Azure AD application for Olumie tenant

- **Action:** Azure portal → Azure Active Directory → App registrations → New registration
- **App name:** "TED Co-Work Engine (Olumie)"
- **Supported account types:** Single tenant (Olumie org only)
- **Redirect URI:** `http://localhost:3001/auth/callback` (sidecar auth callback route)
- **Record:** Application (client) ID, Directory (tenant) ID
- **Acceptance criteria:** App registered, client_id and tenant_id obtained
- **Dependencies:** None (operator action)
- **Owner:** Operator

#### P0-2-002: Configure API permissions for Olumie app

- **Action:** Azure portal → App registration → API permissions → Add permission → Microsoft Graph
- **Delegated permissions required:**
  - `User.Read` — sign-in and read user profile
  - `Mail.ReadWrite` — read/write mailbox
  - `Mail.Send` — send mail
  - `Calendars.ReadWrite` — read/write calendar
  - `Tasks.ReadWrite` — Planner and To Do access
  - `Group.Read.All` — read group membership (for Planner plan discovery)
  - `Sites.ReadWrite.All` — SharePoint access
  - `Files.ReadWrite.All` — OneDrive/SharePoint file access
  - `offline_access` — refresh token support
- **Action:** Grant admin consent (requires tenant admin)
- **Acceptance criteria:** All permissions granted, admin consent status shows "Granted"
- **Dependencies:** P0-2-001
- **Owner:** Operator

#### P0-2-003: Configure client secret or certificate

- **Action:** Azure portal → App registration → Certificates & secrets → New client secret
- **Expiry:** 12 months (set calendar reminder for renewal)
- **Record:** Client secret value (only shown once!)
- **Acceptance criteria:** Secret created and securely stored
- **Dependencies:** P0-2-001
- **Owner:** Operator

#### P0-2-004: Populate graph.profiles.json with Olumie credentials

- **File:** `sidecars/ted-engine/config/graph.profiles.json`
- **Changes:** Fill `tenant_id`, `client_id` for olumie profile
- **Note:** Client secret should go in `.env` or environment variable, NOT in the JSON config (it's gitignored)
- **Lines changed:** ~5
- **Acceptance criteria:** `tenant_id` and `client_id` are non-empty UUIDs
- **Dependencies:** P0-2-001, P0-2-003
- **Owner:** Operator + Seat 4 (review)

#### P0-2-005: Verify auth flow — `/auth/mint`

- **Action:** Start sidecar, call `POST /auth/mint` with olumie profile
- **Expected:** Sidecar returns auth URL for browser-based OAuth consent
- **Verify:** Browser redirect → Microsoft login → consent → redirect back to localhost → token stored
- **Acceptance criteria:** Token acquired, `/status` shows authenticated profile, token refresh works
- **Dependencies:** P0-2-004
- **Owner:** Operator + Seat 1

#### P0-2-006: Repeat for Everest tenant (if separate tenant)

- **Same steps as P0-2-001 through P0-2-005** for `everest` profile
- **Note:** If Olumie and Everest are in the same Azure AD tenant, a single app registration with multi-profile support may suffice. The operator must clarify this.
- **Decision needed:** Same tenant or different tenants?
- **Dependencies:** P0-2-005 (validate flow works with one tenant first)
- **Owner:** Operator

---

### P0-3: CI/CD Pipeline (GitHub Actions)

**Context:** 1,278 passing tests with no automated runner. Pre-commit hook only catches ESLint.

#### P0-3-001: Create GitHub Actions workflow file

- **File:** `.github/workflows/ci.yml`
- **Triggers:** push to `main`, pull_request to `main`
- **Jobs:**
  1. **lint** — `npx eslint` on sidecar + extension + UI
  2. **syntax** — `node --check sidecars/ted-engine/server.mjs`
  3. **typecheck** — `npx tsc --noEmit`
  4. **test** — `npx vitest run --config vitest.sidecar.config.ts`
- **Node version:** 20.x (current LTS)
- **Package manager:** detect from lockfile (pnpm or bun)
- **Estimated lines:** ~60 YAML
- **Acceptance criteria:** Workflow runs on push, all 4 jobs pass, status check visible on PRs
- **Dependencies:** P0-1-003 (main branch must exist with the code)
- **Owner:** Seat 1, Seat 3

#### P0-3-002: Add CI status badge to README or CLAUDE.md

- **File:** Top-level README.md or relevant doc
- **Content:** `![CI](https://github.com/mstearly/ted-openclaw/actions/workflows/ci.yml/badge.svg)`
- **Lines changed:** 1
- **Acceptance criteria:** Badge shows passing status
- **Dependencies:** P0-3-001
- **Owner:** Seat 8

#### P0-3-003: Configure branch protection on main

- **Action:** GitHub → Settings → Branches → Branch protection rules
- **Rule:** Require status checks to pass before merging (ci/lint, ci/test, ci/typecheck)
- **Acceptance criteria:** PRs to main cannot merge with failing checks
- **Dependencies:** P0-3-001
- **Owner:** Operator + Seat 7

---

### P0-4: End-to-End Smoke Test Against Live Graph API

**Context:** First real contact between TED and Microsoft 365. Every assumption about response shapes, auth flows, and error handling gets validated or invalidated here.

#### P0-4-001: Read-only mail smoke test

- **Script:** Run `proof_jc001.sh` or equivalent against real sidecar with real credentials
- **Endpoints tested:**
  - `GET /graph/olumie/mail/unread` — list unread emails
  - `GET /graph/olumie/mail/{id}` — read single email
- **Validate:**
  - Auth token is sent correctly
  - Response shape matches normalization expectations
  - Email fields (subject, from, body, receivedDateTime) are populated
  - Pagination works if >10 emails
- **Acceptance criteria:** Real emails returned, no 401/403 errors, normalized output matches `TedMailMessage` type
- **Dependencies:** P0-2-005
- **Owner:** Seat 1, Seat 2

#### P0-4-002: Read-only calendar smoke test

- **Endpoints tested:**
  - `GET /graph/olumie/calendar/events` — list upcoming events
- **Validate:**
  - Calendar events returned with correct fields
  - Date parsing works with real timezone data
  - Attendee lists populated
- **Acceptance criteria:** Real calendar events returned, fields match expected types
- **Dependencies:** P0-2-005
- **Owner:** Seat 1

#### P0-4-003: Read-only Planner smoke test

- **Prerequisites:** Planner `group_id` and `plan_ids` must be populated in `graph.profiles.json`
- **Endpoints tested:**
  - `GET /graph/olumie/planner/plans` — list plans
  - `GET /graph/olumie/planner/tasks?plan_id=X` — list tasks
- **Validate:**
  - Plans returned with correct structure
  - Tasks have bucketId, assignments, dueDateTime
- **Acceptance criteria:** Real Planner data returned, no permission errors
- **Dependencies:** P0-2-005, Planner config populated
- **Owner:** Seat 2

#### P0-4-004: Read-only To Do smoke test

- **Prerequisites:** "TED Actions" list must exist in Clint's To Do, or `discoverOrCreateTodoList` must work
- **Endpoints tested:**
  - `GET /graph/olumie/todo/lists` — list To Do lists
  - `GET /graph/olumie/todo/tasks?list_id=X` — list tasks
- **Validate:**
  - To Do lists returned
  - List discovery by name works
- **Acceptance criteria:** Real To Do data returned
- **Dependencies:** P0-2-005
- **Owner:** Seat 5

#### P0-4-005: Read-only SharePoint smoke test

- **Prerequisites:** SharePoint `site_id` and `drive_id` must be populated
- **Endpoints tested:**
  - `GET /graph/olumie/sharepoint/sites` — list sites
  - `GET /graph/olumie/sharepoint/drives?site_id=X` — list drives
- **Validate:**
  - Sites returned with correct structure
  - Drive browsing works
- **Acceptance criteria:** Real SharePoint data returned
- **Dependencies:** P0-2-005, SharePoint config populated
- **Owner:** Seat 2

#### P0-4-006: Token refresh validation

- **Action:** Acquire token (P0-2-005), wait for expiry (or manually invalidate), trigger a Graph API call
- **Validate:**
  - `ensureValidToken()` detects expired token
  - Refresh token flow acquires new access token
  - Graph API call succeeds with refreshed token
- **Acceptance criteria:** Token refresh works without re-authentication
- **Dependencies:** P0-2-005
- **Owner:** Seat 1, Seat 7

#### P0-4-007: Error handling validation

- **Tests:**
  - Call with invalid profile ID → expect 400
  - Call with revoked token → expect 401 → expect auto-refresh attempt
  - Call to endpoint without permission → expect 403 with explainability message
- **Acceptance criteria:** All error paths produce meaningful responses, no crashes
- **Dependencies:** P0-4-001 through P0-4-005
- **Owner:** Seat 7

#### P0-4-008: Document response shape mismatches

- **Action:** If ANY smoke test reveals that real Graph API responses differ from expected shapes, document each mismatch
- **File:** `docs/ted-profile/sdd-pack/78_GRAPH_API_REALITY_CHECK.md` (create if needed)
- **Content:** For each mismatch: expected field, actual field, affected normalizer, fix required
- **Acceptance criteria:** All mismatches documented with remediation plan
- **Dependencies:** P0-4-001 through P0-4-007
- **Owner:** Seat 1, Seat 3

---

### P1-1: Monolith Decomposition — Tier 1 Extraction

**Context:** server.mjs at ~20,450 lines. SDD 72 Sprint 3A designed the Strangler Fig extraction plan.

#### P1-1-001: Create modules directory

- **Command:** `mkdir -p sidecars/ted-engine/modules`
- **Acceptance criteria:** Directory exists
- **Dependencies:** P0-3 (CI in place to catch regressions)
- **Owner:** Seat 1

#### P1-1-002: Extract SharePoint module

- **File created:** `sidecars/ted-engine/modules/sharepoint.mjs`
- **Move from server.mjs:**
  - 7 SharePoint route handlers
  - 7 MCP tool definitions
  - SharePoint-specific normalizers
- **Export:** `registerSharepointRoutes(routeMap, helpers)`
- **helpers parameter:** `{ sendJson, appendAudit, appendEvent, readJsonlLines, appendJsonlLine, getGraphProfileConfig, ensureValidToken, graphFetchWithRetry, readJsonBodyGuarded, blockedExplainability }`
- **Lines moved:** ~400 out of server.mjs
- **Acceptance criteria:** All 7 SharePoint routes respond identically before and after. All existing tests pass. Proof scripts pass.
- **Dependencies:** P1-1-001
- **Owner:** Seat 1, Seat 2

#### P1-1-003: Extract Scheduler module

- **File created:** `sidecars/ted-engine/modules/scheduler.mjs`
- **Move from server.mjs:**
  - `cronMatchesNow()`, `cronFieldMatches()` — cron parsing
  - `schedulerTick()` — main scheduler loop
  - Scheduler route handlers (start, stop, status, pending deliveries)
  - Pending delivery management
- **Export:** `registerSchedulerRoutes(routeMap, helpers)`, `startScheduler(helpers)`, `stopScheduler()`
- **Lines moved:** ~300
- **Acceptance criteria:** Scheduler behavior identical. Cron jobs fire correctly. Pending deliveries process.
- **Dependencies:** P1-1-001
- **Owner:** Seat 1, Seat 5

#### P1-1-004: Extract Self-Healing module

- **File created:** `sidecars/ted-engine/modules/self_healing.mjs`
- **Move from server.mjs:**
  - Circuit breaker logic
  - Provider health scoring (EWMA, fallback selection)
  - Config drift reconciliation
  - Zombie draft detection
  - Graduated noise reduction
  - Dynamic autonomy ladder
  - Engagement tracking
  - 12 self-healing route handlers
- **Export:** `registerSelfHealingRoutes(routeMap, helpers)`, `getSelfHealingState()`, `runSelfHealingMaintenance(helpers)`
- **Lines moved:** ~500
- **Acceptance criteria:** All self-healing routes respond identically. Circuit breaker state is preserved. Health scoring works.
- **Dependencies:** P1-1-001
- **Owner:** Seat 1, Seat 7

#### P1-1-005: Update test imports and verify full suite

- **Files affected:** Any test files that import from server.mjs paths that moved
- **Action:** Update imports if needed, run full vitest suite, run proof scripts
- **Acceptance criteria:** 1,278+ tests pass, 84 proof scripts syntax-valid, no regressions
- **Dependencies:** P1-1-002, P1-1-003, P1-1-004
- **Owner:** Seat 3

---

### P1-2: Integration Test Infrastructure

**Context:** 156 skipped tests need a path to execution.

#### P1-2-001: Create test helper for sidecar lifecycle

- **File:** `sidecars/ted-engine/tests/helpers/test-server.mjs`
- **Content:**
  - `startTestSidecar()` — starts server.mjs on ephemeral port with test data directory
  - `stopTestSidecar()` — graceful shutdown
  - `getTestBaseUrl()` — returns `http://localhost:{port}`
  - Uses temp directory for all JSONL files (clean state per test suite)
- **Lines:** ~60
- **Acceptance criteria:** Helper starts and stops sidecar reliably in <2s
- **Dependencies:** P0-3 (CI must be in place)
- **Owner:** Seat 1, Seat 3

#### P1-2-002: Un-skip non-Graph integration tests

- **Files affected:** Test files in `sidecars/ted-engine/tests/`
- **Action:** Identify tests that are skipped but DON'T require real Graph API (e.g., local route tests, JSONL operations, scheduler, self-healing status)
- **Convert:** `.skip` → use test-server helper
- **Target:** Un-skip at least 50 of the 156 skipped tests
- **Acceptance criteria:** Skipped count drops to <110, un-skipped tests pass reliably
- **Dependencies:** P1-2-001
- **Owner:** Seat 3

#### P1-2-003: Add integration test job to CI

- **File:** `.github/workflows/ci.yml`
- **Add job:** `integration` — runs after `test` job, starts test sidecar, runs integration tests
- **Timeout:** 60s (integration tests are slower)
- **Acceptance criteria:** Integration job runs in CI, results visible in PR checks
- **Dependencies:** P1-2-002, P0-3-001
- **Owner:** Seat 1

---

### P1-3: Dependency Audit

**Context:** GitHub push showed 7 vulnerabilities (1 critical, 3 high, 2 moderate, 1 low).

#### P1-3-001: Review Dependabot alerts

- **Command:** `gh api repos/mstearly/ted-openclaw/dependabot/alerts --jq '.[] | {package: .dependency.package.name, severity: .security_advisory.severity, summary: .security_advisory.summary}'`
- **Action:** Enumerate all 7 alerts with package name, severity, and fix availability
- **Acceptance criteria:** All 7 alerts documented with resolution plan
- **Dependencies:** P0-1 (alerts are on default branch)
- **Owner:** Seat 4, Seat 7

#### P1-3-002: Resolve critical and high alerts

- **Action:** Update affected dependencies to patched versions
- **Test:** Run full test suite after updates to catch breaking changes
- **Acceptance criteria:** Critical alert resolved, high alerts resolved or documented as accepted risk
- **Dependencies:** P1-3-001
- **Owner:** Seat 4

---

### P1-4: Graph API Response Mocking for CI

**Context:** Real Graph API cannot be called in CI (no credentials). Need mock layer for reliable integration testing.

#### P1-4-001: Capture real Graph API response fixtures

- **Action:** During P0-4 smoke tests, save real response bodies as JSON fixtures
- **Directory:** `sidecars/ted-engine/tests/fixtures/graph-responses/`
- **Files:**
  - `mail_unread.json` — real unread mail response
  - `calendar_events.json` — real calendar events
  - `planner_plans.json` — real planner plans
  - `todo_lists.json` — real to do lists
  - `sharepoint_sites.json` — real sharepoint sites
- **Acceptance criteria:** At least 5 real response fixtures captured
- **Dependencies:** P0-4 (need real responses first)
- **Owner:** Seat 1, Seat 3

#### P1-4-002: Create Graph API mock server for tests

- **File:** `sidecars/ted-engine/tests/helpers/mock-graph.mjs`
- **Content:** Simple HTTP server that serves fixture files based on URL pattern matching
- **Lines:** ~80
- **Acceptance criteria:** Mock responds to the same URL patterns as real Graph API with fixture data
- **Dependencies:** P1-4-001
- **Owner:** Seat 1

#### P1-4-003: Wire mock into integration tests

- **Action:** Configure test sidecar to use mock Graph API URL instead of `https://graph.microsoft.com`
- **Mechanism:** Environment variable `GRAPH_BASE_URL` override (if supported) or test profile with mock endpoint
- **Acceptance criteria:** Integration tests run against mock Graph API in CI, no real API calls
- **Dependencies:** P1-4-002
- **Owner:** Seat 1, Seat 3

---

## 5. Execution Waves

### Wave 0: Pre-flight (5 minutes)

```
P0-1-001: Verify no merge conflicts
```

### Wave 1: PR + CI (30 minutes, parallelizable)

```
P0-1-002: Create PR with structured description
P0-3-001: Create GitHub Actions workflow (can draft while PR is open)
```

### Wave 2: Merge + CI activation (15 minutes)

```
P0-1-003: Merge PR to main
P0-3-002: Add CI badge
P0-3-003: Configure branch protection
```

### Wave 3: Azure AD Setup (1-2 hours, operator-driven)

```
P0-2-001: Register Azure AD app (Olumie)
P0-2-002: Configure API permissions
P0-2-003: Configure client secret
P0-2-004: Populate graph.profiles.json
P0-2-005: Verify auth flow
P0-2-006: Repeat for Everest (if separate tenant)
```

### Wave 4: Smoke Tests (1-2 hours, sequential)

```
P0-4-001: Mail smoke test
P0-4-002: Calendar smoke test
P0-4-003: Planner smoke test
P0-4-004: To Do smoke test
P0-4-005: SharePoint smoke test
P0-4-006: Token refresh validation
P0-4-007: Error handling validation
P0-4-008: Document mismatches
```

### Wave 5: P1 Execution (parallel tracks, next sprint)

**Track A: Decomposition**

```
P1-1-001: Create modules directory
P1-1-002: Extract SharePoint (~400 lines)
P1-1-003: Extract Scheduler (~300 lines)
P1-1-004: Extract Self-Healing (~500 lines)
P1-1-005: Verify full test suite
```

**Track B: Test Infrastructure**

```
P1-2-001: Test server helper
P1-2-002: Un-skip integration tests
P1-2-003: Add integration CI job
```

**Track C: Security + Mocking**

```
P1-3-001: Review Dependabot alerts
P1-3-002: Resolve critical/high alerts
P1-4-001: Capture Graph API fixtures (during Wave 4)
P1-4-002: Create mock Graph server
P1-4-003: Wire mock into tests
```

---

## 6. Risk Register

| #   | Risk                                                                                                                                                                 | Likelihood | Impact | Mitigation                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | **Graph API response shapes don't match normalizers** — Real Microsoft Graph responses have fields/nesting that differ from what the normalizers expect              | HIGH       | HIGH   | P0-4-008 documents mismatches. Fix normalizers immediately. Capture real responses as test fixtures (P1-4-001).                                              |
| R2  | **Azure AD permission gaps** — Some Graph API calls require permissions not in the requested set, or admin consent is denied                                         | MEDIUM     | HIGH   | P0-2-002 lists all required permissions explicitly. Test each endpoint individually (P0-4-001 through P0-4-005). Add missing permissions incrementally.      |
| R3  | **Merge conflicts with main** — 29 commits over 523 files could conflict with recent main changes                                                                    | LOW        | MEDIUM | P0-1-001 checks merge base. Main has had minimal activity (last commit: telegram logging fix). Conflicts unlikely but must be verified.                      |
| R4  | **CI/CD flakiness** — Vitest tests may have timing-sensitive or order-dependent failures in CI environment                                                           | MEDIUM     | MEDIUM | Start with `vitest run` (sequential). If stable, consider `--reporter=verbose` for debugging. Add retry for flaky tests as last resort.                      |
| R5  | **Monolith extraction breaks shared state** — server.mjs modules share closures, mutable state, and initialization order. Extraction could break subtle dependencies | MEDIUM     | HIGH   | P1-1-005 requires FULL test suite pass after each extraction. Extract one module at a time. CI catches regressions. Never extract two modules in one commit. |

---

## 7. Items the Council Adds (Not in SDD 76)

### NEW-1: Secret Management Strategy (P0 prerequisite for P0-2)

**Finding (Seat 4):** SDD 76 says "populate graph.profiles.json with real credentials" but the client_secret MUST NOT go in a tracked file. The current `.gitignore` excludes `.env` but there's no `.env` file or environment variable loading in `server.mjs`.

**Recommendation:**

- Verify `server.mjs` reads secrets from environment variables (not config files)
- If not, add `process.env.OLUMIE_CLIENT_SECRET` / `process.env.EVEREST_CLIENT_SECRET` support
- Create `.env.example` documenting required variables
- Ensure `.env` is gitignored (already is)

**Task:** P0-2-003 must address this — secret goes in `.env`, not `graph.profiles.json`

### NEW-2: Backup Before Merge (P0 prerequisite for P0-1)

**Finding (Seat 7):** Before merging 89K insertions to main, create a tagged backup point.

**Recommendation:**

- `git tag pre-ted-merge` on main before merge
- `git tag ted-v0.1-alpha` on feature branch before merge
- If merge goes wrong, `git reset --hard pre-ted-merge` restores main instantly

### NEW-3: Post-Smoke-Test Morning Brief (P0 stretch goal)

**Finding (Seat 8):** After smoke tests pass, the highest-value demonstration is generating a REAL morning brief from Clint's actual inbox and calendar. This is the "it works" moment.

**Recommendation:**

- After P0-4 completes: trigger `POST /ops/morning-brief` (or equivalent) with real Graph data
- Show Clint a real morning brief generated from his actual emails, calendar, and priorities
- This is not a task — it's the reward for completing P0

---

## 8. Council Sign-Off

| Seat | Name                | Verdict                | Notes                                                                                              |
| ---- | ------------------- | ---------------------- | -------------------------------------------------------------------------------------------------- |
| 1    | Systems Integration | APPROVE                | Merge strategy correct. CI is right call for P0.                                                   |
| 2    | Deal Intelligence   | APPROVE                | Smoke tests must validate deal-related endpoints (Planner, commitments).                           |
| 3    | Output Quality      | APPROVE                | QA system is solid. Evaluation pipeline + canaries will catch regressions post-merge.              |
| 4    | Compliance          | APPROVE WITH CONDITION | Secret management (NEW-1) must be resolved before any real credentials enter the codebase.         |
| 5    | Workflow            | APPROVE                | Monolith decomposition at P1 is correct — plan now, execute after CI.                              |
| 6    | Scalability         | APPROVE                | Ledger snapshots can wait. Real data volumes won't be a problem in alpha.                          |
| 7    | Risk                | APPROVE                | Backup tags (NEW-2) are non-negotiable before merge. Risk register covers the top concerns.        |
| 8    | Adoption            | APPROVE                | The morning brief moment (NEW-3) is critical for operator buy-in. Prioritize getting to that demo. |

**Unanimous: APPROVED with 3 additions (NEW-1, NEW-2, NEW-3)**

---

## Appendix: Dependency Graph

```
P0-1-001 (verify conflicts)
  └→ P0-1-002 (create PR)
       └→ P0-1-003 (merge PR)
            ├→ P0-3-001 (CI workflow)
            │    ├→ P0-3-002 (CI badge)
            │    └→ P0-3-003 (branch protection)
            └→ P1-3-001 (Dependabot review)
                 └→ P1-3-002 (resolve alerts)

P0-2-001 (register Azure AD)
  └→ P0-2-002 (API permissions)
       └→ P0-2-003 (client secret + .env)
            └→ P0-2-004 (populate config)
                 └→ P0-2-005 (verify auth)
                      ├→ P0-2-006 (Everest tenant)
                      └→ P0-4-001..007 (smoke tests)
                           └→ P0-4-008 (document mismatches)
                                └→ P1-4-001 (capture fixtures)
                                     └→ P1-4-002 (mock server)
                                          └→ P1-4-003 (wire mock)

P0-3-001 (CI workflow) ──→ P1-1-001..005 (decomposition)
P0-3-001 (CI workflow) ──→ P1-2-001..003 (test infra)
```
