# SDD 76: Council Project Review — Status Assessment & Prioritized Next Steps

**Status:** Active
**Version:** v1
**Date:** 2026-02-25
**Council Mandate:** Full-scope project review after Sprint 3 completion
**Input:** SDD 42 (Blueprint v3), SDD 72 (6-Layer Evolution), SDD 75 (Dynamic QA), Implementation History, Codebase Audit
**Branch:** `feat/ted-engine-full-implementation` (28 commits, pushed to origin, not merged to main)

---

## 1. Project Status Summary

### Completeness: ~85%

The TED engine has reached Late Alpha maturity. The architecture is implemented, tests pass, documentation is comprehensive, but the system has **never run against real external services**.

### What's Built

| Artifact               | Scale                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| Sidecar (`server.mjs`) | ~20,450 lines, 164 route handlers, 62 MCP tools, 35+ JSONL ledgers |
| Extension (`index.ts`) | ~10,800 lines, 164 gateway methods, 81 agent tools                 |
| UI (`views/ted.ts`)    | ~5,442 lines, 28 operator surface cards                            |
| Config files           | 34 files, all with `_config_version: 1`                            |
| Event schema           | 227 event types across 42 namespaces                               |
| Test suite             | 7 files, 1,434 tests (1,278 pass, 156 skipped), ~670ms             |
| Proof scripts          | 84 behavioral HTTP test scripts                                    |
| SDD documents          | 75 documents across 13 council review cycles                       |

### Implementation History (Complete)

- Phases 1-8: Full Operator Command Center
- Phases 9-15: Architecture Migration (event sourcing, dual-write, centralized event log)
- Phases 16-21: Microsoft Planner + To Do + Mapping Enforcement
- Loop Closure + Codex Builder Lane (BL-001 through BL-017)
- Architecture Closure (JC-110/111) — All 3 loops at 100%
- Must-Fix Cycle 007 (MF-1 through MF-10)
- Council QA Cycles 008-012 (all resolved)
- Self-Healing Implementation (SDD 59/60/61)
- QA Remediation Cycle (SDD 65)
- Council Research Cycle 013 (SDDs 66-74, 100+ external sources)
- Sprint 1: Evolution Foundation (SDD 72) — 12/12 tasks
- Sprint 2: Quality + Evolution (SDD 72) — 14/14 tasks
- Sprint 3: Dynamic QA System (SDD 75) — 18/18 tasks

### M365 Integration Surface

| Service      | Read | Write                                 | Status                                 |
| ------------ | ---- | ------------------------------------- | -------------------------------------- |
| Outlook Mail | Yes  | Draft (approval-gated)                | Built, untested against real Graph API |
| Calendar     | Yes  | Tentative accept                      | Built, untested against real Graph API |
| Planner      | Yes  | Create/update (approval-gated)        | Built, untested against real Graph API |
| To Do        | Yes  | Create/update (approval-gated)        | Built, untested against real Graph API |
| SharePoint   | Yes  | Upload/create folder (approval-gated) | Built, untested against real Graph API |

---

## 2. Strengths

1. **Governance architecture is genuinely unique** — No competitor combines progressive autonomy, Builder Lane, event sourcing, and contract-bound outputs in a single system. The council research (SDD 67) surveyed 16 platforms and found no equivalent.

2. **Test coverage is deep and layered** — L1 unit+property tests (fast-check), L2 contract+integration tests (164 route contracts), L3 LLM evaluation pipeline (20-intent multi-grader), L4 continuous monitoring (synthetic canaries, drift detection, QA dashboard).

3. **Documentation is exceptional** — 75 SDDs provide full traceability from requirements to implementation. Threat model (SDD 73), constitution (ted_constitution.json), style guide, architecture planes, and decision log are all current.

4. **Non-destructive evolution foundation is in place** — Schema versioning on all records/configs, config migration runner with backup+rollback, startup integrity validation, graceful shutdown, API versioning between extension and sidecar.

5. **Security posture is considered** — Lethal trifecta threat model (8 paths mapped), `<untrusted_content>` tags on LLM calls processing external content, per-call tool restriction in `routeLlmCall()`, HIPAA hard gate for Everest entity, PHI redaction pipeline.

---

## 3. Gaps & Risks

### 3.1 CRITICAL — System Has Never Talked to Its Primary Data Source

All M365 Graph API integration uses empty `tenant_id`/`client_id` in `graph.profiles.json`. The auth flow (`/auth/mint`, token refresh, `ensureValidToken`) has never executed against real Azure AD. This means:

- Token acquisition has never been tested
- Graph API pagination (`graphFetchAllPages`) has never processed real `@odata.nextLink` responses
- Rate limiting (`graphFetchWithRetry` with 429 handling) has never been exercised
- Data normalization (email, calendar, planner, todo, sharepoint) has never processed real Graph API response shapes
- Error handling for real Graph API errors (403 Forbidden, 404 Not Found, 5xx) is untested

**Risk:** The entire M365 integration layer could fail on first contact with reality. Response shape mismatches, auth flow bugs, or permission gaps would cascade through the system.

### 3.2 HIGH — 28-Commit Feature Branch Not Merged

All work sits on `feat/ted-engine-full-implementation`. This represents months of engineering on a feature branch:

- Branch divergence from `main` increases with every commit to main
- A failed merge could lose context or introduce conflicts
- Other developers (if any) cannot see or build on this work
- No PR review has ever been performed on this code

**Risk:** The longer the branch lives unmerged, the harder the eventual merge becomes.

### 3.3 HIGH — No CI/CD Pipeline

- No GitHub Actions workflow
- No automated test runs on PR
- Lint runs via pre-commit hook only (local)
- The 1,278 passing tests should run automatically on every push
- No deployment pipeline exists

**Risk:** Regressions can be introduced without detection. The pre-commit hook only catches lint errors, not test failures.

### 3.4 MEDIUM — server.mjs Monolith at 20K+ Lines

SDD 72 Sprint 3 designed the decomposition plan (Strangler Fig pattern) but it hasn't started. The file contains:

- Auth + session management
- Policy enforcement (hard bans, autonomy ladder, urgency rules, notification budget)
- Scheduler system
- Draft state machine
- Reconciliation engine
- All M365 Graph API handlers (Mail, Calendar, Planner, To Do, SharePoint)
- LLM routing + evaluation pipeline
- Self-healing system (circuit breakers, provider health, noise reduction)
- Builder Lane
- 62 MCP tool definitions
- 35+ JSONL ledger management functions

**Risk:** Maintainability degrades with every addition. New bugs become harder to isolate. Test targeting becomes imprecise.

### 3.5 MEDIUM — 156 Skipped Tests

These are integration tests requiring a running sidecar instance. They cannot run in the current test configuration (Vitest runs against pure functions and config files, not a live HTTP server).

**Risk:** Integration-level regressions go undetected. The skipped tests represent the L2 layer of the QA pyramid.

### 3.6 LOW — Deferred UI Surfaces

- JC-061a: Filing approval UI controls
- JC-062a: Deadline proposals UI surface
- These were deferred during QA remediation and are not blocking any other work.

---

## 4. Blocked Items

| ID         | Item                          | Blocker                                                   | Owner    | Priority |
| ---------- | ----------------------------- | --------------------------------------------------------- | -------- | -------- |
| JC-056b/c  | Real Azure AD credentials     | Need tenant_id, client_id, redirect_uri from Azure portal | Operator | P0       |
| JC-069b    | Operator acceptance test      | Requires real operator usage with live Graph API          | Operator | P1       |
| JC-065/066 | Mac installer + LaunchAgent   | Requires macOS build environment                          | Deferred | P2       |
| JC-074a-b  | Copilot Extension webhook     | Optional integration, low priority                        | Deferred | P2       |
| JC-061a    | Filing approval UI controls   | Deferred from QA remediation                              | Backlog  | P2       |
| JC-062a    | Deadline proposals UI surface | Deferred from QA remediation                              | Backlog  | P2       |

---

## 5. Recommended Next Steps — Prioritized

### P0: Do Now (This Sprint)

#### P0-1: Create PR and Merge Branch to Main

**Rationale:** 28 commits of foundational work sitting on a feature branch is a risk. Merging makes the work visible, enables other tools to build on it, and reduces merge conflict risk.

**Scope:**

- Create PR from `feat/ted-engine-full-implementation` to `main`
- PR description summarizing all phases, SDDs, and test results
- Merge strategy: merge commit (preserve history) or squash (clean main)
- Post-merge: verify tests pass on main

#### P0-2: Set Up Azure AD App Registration

**Rationale:** This is THE blocker for any real-world validation. Without real credentials, TED is a 20K-line program that has never communicated with its primary data source.

**Scope:**

- Register app in Azure AD portal (portal.azure.com)
- Configure required Graph API permissions (Mail.Read, Mail.ReadWrite, Calendars.Read, Calendars.ReadWrite, Tasks.ReadWrite, Sites.Read.All, Group.Read.All, User.Read)
- Admin consent for delegated permissions
- Configure redirect URI for auth code flow
- Populate `graph.profiles.json` with real tenant_id, client_id, profile UPN mapping
- Test auth flow: `/auth/mint` → token acquisition → token refresh

#### P0-3: End-to-End Smoke Test Against Live Graph API

**Rationale:** First contact with reality. Validates that the entire M365 integration layer works as designed.

**Scope:**

- Start sidecar with real credentials
- Run read-only proof scripts first (mail list, calendar events, planner plans, to do lists)
- Validate response normalization (does real Graph API data match expected shapes?)
- Test auth token refresh cycle
- Test error handling (invalid profile, expired token, missing permissions)
- Document any response shape mismatches that need fixing

### P1: Next Sprint

#### P1-1: CI/CD Pipeline (GitHub Actions)

**Rationale:** 1,278 tests should run automatically. Pre-commit lint is not sufficient.

**Scope:**

- GitHub Actions workflow: lint + vitest on every PR and push to main
- Node.js matrix (current LTS version)
- Cache pnpm/bun dependencies
- Report test results in PR checks
- Optional: add `node --check server.mjs` as a syntax verification step

#### P1-2: Monolith Decomposition — Tier 1 (SDD 72, Sprint 3A)

**Rationale:** server.mjs at 20K+ lines is approaching maintainability limits. The Strangler Fig extraction plan is already designed.

**Scope:** (from SDD 72 Sprint 3A)

- Create `sidecars/ted-engine/modules/` directory
- Extract SharePoint module (~400 lines)
- Extract Scheduler module (~300 lines)
- Extract Self-Healing module (~500 lines)
- Each module: exports `registerXRoutes(routeMap, helpers)`, receives shared dependencies via parameter
- Verify all routes respond identically before and after extraction

#### P1-3: Integration Test Infrastructure

**Rationale:** 156 skipped tests need a path to execution. The L2 layer of the QA pyramid has a gap.

**Scope:**

- Create test helper that starts sidecar in test mode (ephemeral port, test data directory)
- Un-skip integration tests that can run against local sidecar (no Graph API needed)
- Add integration test target to CI pipeline (separate from unit tests, can be slower)
- Document which tests require live Graph API (remain skipped in CI, run manually)

### P2: Backlog

#### P2-1: Version-Aware State Machines (SDD 72 Sprint 3B)

Add `_code_version` to draft, deal, and delivery lifecycles for safe behavior evolution.

#### P2-2: Human-as-a-Tool Pattern (SDD 72 Sprint 3D)

Operator question queue for ambiguity resolution. Unblocks Ted when it encounters unclear situations.

#### P2-3: Operator Engagement Mechanisms (SDD 72 Sprint 3C)

Rubber-stamping detection, varied approval granularity, re-engagement challenges.

#### P2-4: Ledger Snapshots (SDD 72 Sprint 4A)

Performance optimization for growing JSONL files. Periodic snapshots with delta replay on startup.

#### P2-5: Deferred UI Surfaces

Filing approval controls (JC-061a), deadline proposals (JC-062a).

#### P2-6: Mac Installer + LaunchAgent (JC-065/066)

Requires macOS build environment. Creates native macOS daemon for sidecar auto-start.

---

## 6. Council Evaluation Requested

This document requires critical council evaluation to:

1. **Validate priorities** — Are P0/P1/P2 assignments correct? Are there items that should move up or down?
2. **Identify missing risks** — Has the council missed any gaps or threats?
3. **Develop detailed task breakdowns** — Each P0 and P1 item needs sub-tasks with file paths, line estimates, and acceptance criteria.
4. **Estimate effort** — What can be done in a single session vs. multi-session work?
5. **Sequence dependencies** — Which items block others? What's the optimal execution order?
6. **Challenge assumptions** — Is the ~85% completeness estimate accurate? Is "Late Alpha" the right maturity label?

---

## Appendix: Key File Paths

| File                                                 | Purpose                                      | Lines         |
| ---------------------------------------------------- | -------------------------------------------- | ------------- |
| `sidecars/ted-engine/server.mjs`                     | Sidecar co-work kernel                       | ~20,450       |
| `extensions/ted-sidecar/index.ts`                    | Extension bridge (OpenClaw <-> sidecar)      | ~10,800       |
| `ui/src/ui/views/ted.ts`                             | Operator surface cards                       | ~5,442        |
| `ui/src/ui/controllers/ted.ts`                       | UI state management                          | ~1,100        |
| `ui/src/ui/app-render.ts`                            | UI prop wiring                               | ~1,300        |
| `ui/src/ui/app.ts`                                   | UI root component                            | ~900          |
| `ui/src/ui/app-view-state.ts`                        | UI state type                                | ~500          |
| `sidecars/ted-engine/config/`                        | 34 config files                              | Varies        |
| `sidecars/ted-engine/tests/`                         | 7 Vitest test files                          | ~2,500 total  |
| `sidecars/ted-engine/server-utils.mjs`               | Pure function exports for testing            | ~350          |
| `scripts/ted-profile/`                               | 84 proof scripts                             | ~4,200 total  |
| `docs/ted-profile/sdd-pack/`                         | 75 SDD documents                             | ~25,000 total |
| `sidecars/ted-engine/config/graph.profiles.json`     | M365 Graph API credentials (EMPTY — BLOCKED) | ~50           |
| `sidecars/ted-engine/config/route_contracts.json`    | 164 route contracts for testing              | ~800          |
| `sidecars/ted-engine/config/evaluation_graders.json` | 20-intent multi-grader config                | ~120          |
| `sidecars/ted-engine/config/synthetic_canaries.json` | 10 synthetic canary definitions              | ~120          |
| `vitest.sidecar.config.ts`                           | Vitest configuration                         | ~25           |
