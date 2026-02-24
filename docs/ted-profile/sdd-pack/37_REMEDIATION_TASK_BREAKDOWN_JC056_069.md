# Remediation Task Breakdown — JC-056 through JC-069

**Generated:** 2026-02-22
**Purpose:** Break council remediation cards into **session-sized sub-tasks** that each complete cleanly within one AI context window. No sub-task should require reading more than ~2 files or writing more than ~150 lines.
**Source:** `36_COUNCIL_CRITICAL_REVIEW_CYCLE_005.md` (Council Cycle 005 — RED verdict)

---

## Design Constraints for Task Sizing

1. **One context window = one sub-task.** Each sub-task is scoped so a fresh session can pick it up from its description alone.
2. **Max 2 files written per sub-task.** Reading more is fine; writing to 3+ files risks partial completion.
3. **Each sub-task has a verifiable done state.** Either a grep, a compile check, or a behavioral curl test.
4. **Dependencies are explicit.** Sub-tasks within a card are sequential; cards may parallelize where noted.

---

## Current File Sizes (Reference)

| File                                             | Lines | Notes                                       |
| ------------------------------------------------ | ----- | ------------------------------------------- |
| `ui/src/ui/types.ts`                             | 924   | Mail/Brief/Digest types already added       |
| `ui/src/ui/controllers/ted.ts`                   | 571   | Imports updated, state fields NOT yet added |
| `ui/src/ui/views/ted.ts`                         | 1,730 | No JTBD surfaces yet                        |
| `ui/src/ui/app-render.ts`                        | 1,175 | No JTBD prop wiring yet                     |
| `sidecars/ted-engine/server.mjs`                 | 3,806 | All 6 new endpoints implemented             |
| `extensions/ted-sidecar/index.ts`                | 3,387 | All 6 gateway methods implemented           |
| `sidecars/ted-engine/config/graph.profiles.json` | ~20   | Stub — empty tenant_id/client_id            |

---

## Completion Status Key

- `[ ]` = Not started
- `[~]` = Partially done (noted in description)
- `[x]` = Complete

---

## Phase 0: Unblock

### JC-056: Graph Profile Configuration and Auth Completion

**BLOCKED — Requires operator input** (real Azure AD tenant_id and client_id)

#### JC-056a: Config template and setup documentation `[x]`

- **Files to write:** `docs/ted-profile/sdd-pack/38_GRAPH_PROFILE_SETUP_GUIDE.md`
- **What:** Write a step-by-step guide for registering an Azure AD app, getting tenant_id and client_id, configuring delegated scopes (Mail.ReadWrite, Calendars.ReadWrite, User.Read, offline_access), and editing `config/graph.profiles.json`.
- **Done when:** Guide exists and references correct config file path.
- **Session size:** Small (~1 file, ~80 lines)

#### JC-056b: Populate graph.profiles.json with real credentials `[ ]`

- **REQUIRES OPERATOR:** Clint must provide real Azure AD app registration values.
- **Files to edit:** `sidecars/ted-engine/config/graph.profiles.json`
- **What:** Replace empty `tenant_id` and `client_id` with real values for at least one profile.
- **Done when:** `GET /graph/{profile}/status` shows the profile is configured (not "misconfigured").
- **Session size:** Trivial (~5 lines edited)

#### JC-056c: End-to-end device code auth verification `[ ]`

- **Depends on:** JC-056b
- **Files to read:** `sidecars/ted-engine/server.mjs` (device code routes, lines ~2500-2600)
- **What:** Run the device code auth flow: POST `/graph/{profile}/auth/device-code/start`, complete browser auth, POST `/graph/{profile}/auth/device-code/poll` until authenticated.
- **Done when:** `GET /graph/{profile}/status` returns `authenticated: true` with a real access token.
- **Session size:** Manual verification + proof script

---

## Phase 1: Core Loop (Read -> Draft -> Approve)

### JC-057: Inbox Reading Endpoint — `[x]` COMPLETE

- Sidecar: `GET /graph/{profile}/mail/list` implemented in `server.mjs`
- Extension: `ted.mail.list` gateway method implemented in `index.ts`
- Returns: `{ profile_id, folder, messages[], total_count }`

### JC-058: Inbox Scan -> Draft Generation Pipeline

**DESIGN DECISION NEEDED:** Which LLM generates the draft replies? No AI model integration exists in the sidecar today. Options:

- (A) Claude API via Anthropic SDK (requires API key configuration)
- (B) OpenAI API (requires API key configuration)
- (C) Delegate to OpenClaw's existing LLM (route back through extension)
- (D) Defer LLM and implement rule-based draft templates first

**Recommendation:** Start with (D) to unblock JC-059. The operator can still see inbox messages and the draft review surface works. LLM-generated drafts can be added later without changing the UI contract.

#### JC-058a: Draft generation orchestration endpoint `[x]`

- **Depends on:** JC-057 (inbox reading must work), LLM decision above
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Add `POST /graph/{profile}/drafts/generate` endpoint that:
  1. Reads recent unread inbox messages (calls `listGraphMail` internally)
  2. For each candidate, generates a draft reply (template-based or LLM)
  3. Creates drafts via existing `POST /graph/{profile}/mail/draft/create`
  4. Returns summary: `{ drafts_created, candidates_evaluated, skipped[] }`
- **Done when:** Endpoint returns 200 with draft creation summary.
- **Session size:** Medium (~1 file, ~120 lines)
- **Key patterns to follow:** See existing `handleDraftCreate` around line ~2366 in server.mjs

#### JC-058b: Draft generation extension gateway method `[x]`

- **Depends on:** JC-058a
- **Files to edit:** `extensions/ted-sidecar/index.ts`
- **What:** Add `ted.drafts.generate` gateway method that calls `POST /graph/{profile}/drafts/generate`
- **Done when:** Gateway method registered and callable.
- **Session size:** Small (~1 file, ~40 lines)
- **Key patterns to follow:** See `ted.mail.list` at line ~3148

### JC-059: Draft Review and Operator Approval UI

This is the largest UI card. Broken into 6 sub-tasks.

#### JC-059a: Add mail and reporting state fields to controller `[x]`

- **Status:** Imports updated, state fields NOT yet added.
- **Files to edit:** `ui/src/ui/controllers/ted.ts`
- **What:** Add these fields to `TedWorkbenchState` (after line 99, before the closing `}`):
  ```
  tedMailLoading: boolean;
  tedMailMessages: TedMailMessage[];
  tedMailError: string | null;
  tedMailFolder: string;
  tedMorningBriefLoading: boolean;
  tedMorningBrief: TedMorningBriefResponse | null;
  tedMorningBriefError: string | null;
  tedEodDigestLoading: boolean;
  tedEodDigest: TedEodDigestResponse | null;
  tedEodDigestError: string | null;
  ```
- **Done when:** TypeScript types compile (no red squiggles on state fields).
- **Session size:** Small (~1 file, ~15 lines added)

#### JC-059b: Add controller functions for mail, brief, digest `[x]`

- **Depends on:** JC-059a
- **Files to edit:** `ui/src/ui/controllers/ted.ts`
- **What:** Add 3 async controller functions following the existing pattern (see `loadTedWorkbench` at line 101):
  1. `loadTedMail(state, profileId?, folder?)` — calls `ted.mail.list`
  2. `loadTedMorningBrief(state)` — calls `ted.reporting.morning_brief`
  3. `loadTedEodDigest(state)` — calls `ted.reporting.eod_digest`
- **Pattern:** Each function: guard on client/connected/loading → set loading true → try/catch → set result/error → finally set loading false
- **Done when:** Functions exported and follow existing patterns.
- **Session size:** Small (~1 file, ~60 lines)

#### JC-059c: Add view props and handler types `[x]`

- **Depends on:** JC-059a
- **Files to edit:** `ui/src/ui/views/ted.ts`
- **What:** Extend `TedViewProps` type (currently ends at line ~112) with:
  ```
  mailLoading: boolean;
  mailMessages: TedMailMessage[];
  mailError: string | null;
  morningBriefLoading: boolean;
  morningBrief: TedMorningBriefResponse | null;
  morningBriefError: string | null;
  eodDigestLoading: boolean;
  eodDigest: TedEodDigestResponse | null;
  eodDigestError: string | null;
  onLoadMail: (profileId?: string) => void;
  onLoadMorningBrief: () => void;
  onLoadEodDigest: () => void;
  ```
- **Also:** Add imports for `TedMailMessage`, `TedMorningBriefResponse`, `TedEodDigestResponse` from `../types.ts`
- **Done when:** Props type compiles with new fields.
- **Session size:** Small (~1 file, ~20 lines)

#### JC-059d: Add inbox message list render section `[x]`

- **Depends on:** JC-059c
- **Files to edit:** `ui/src/ui/views/ted.ts`
- **What:** Add a new card in the `showOperate` section (insert BEFORE the "Operator Workflow (Clint View)" card at line ~465). The card should show:
  - Card title: "Inbox" with a "Refresh" button
  - Loading state
  - Error callout if mailError
  - List of messages: subject, from name, received time, unread indicator, attachment icon
  - Each message shows a preview snippet
  - "Load Inbox" button if no messages loaded yet
- **Key patterns:** Follow the existing `list-item` / `list-main` / `list-meta` pattern used throughout the file.
- **Done when:** Card renders in the operate tab (even with empty data).
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-059e: Add morning brief and EOD digest render sections `[x]`

- **Depends on:** JC-059c
- **Files to edit:** `ui/src/ui/views/ted.ts`
- **What:** Add 2 new cards in the `showOperate` section (insert AFTER the inbox card from JC-059d):
  1. **Morning Brief card:**
     - Title: "Morning Brief" with "Generate" button
     - Shows: triage_open, deals_active, filing_pending, automation status
     - Recommendations list
     - Recent activity (last 5)
  2. **End-of-Day Digest card:**
     - Title: "End-of-Day Digest" with "Generate" button
     - Shows: actions_count, approvals, blocks, triage resolved/open
     - Activity log
     - Unresolved items list
- **Done when:** Both cards render in operate tab.
- **Session size:** Medium (~1 file, ~120 lines)

#### JC-059f: Wire all new props in app-render.ts `[x]`

- **Depends on:** JC-059b, JC-059c, JC-059d, JC-059e (all view and controller work done)
- **Files to edit:** `ui/src/ui/app-render.ts`
- **What:** In the `renderTed({...})` call (starts at line ~238), add prop mappings:
  ```
  mailLoading: state.tedMailLoading,
  mailMessages: state.tedMailMessages,
  mailError: state.tedMailError,
  morningBriefLoading: state.tedMorningBriefLoading,
  morningBrief: state.tedMorningBrief,
  morningBriefError: state.tedMorningBriefError,
  eodDigestLoading: state.tedEodDigestLoading,
  eodDigest: state.tedEodDigest,
  eodDigestError: state.tedEodDigestError,
  onLoadMail: (profileId) => void state.loadTedMail(profileId),
  onLoadMorningBrief: () => void state.loadTedMorningBrief(),
  onLoadEodDigest: () => void state.loadTedEodDigest(),
  ```
- **Also:** Add state field initializations where the initial state object is constructed (search for `tedLoading: false` to find it). Initialize:
  ```
  tedMailLoading: false,
  tedMailMessages: [],
  tedMailError: null,
  tedMailFolder: "inbox",
  tedMorningBriefLoading: false,
  tedMorningBrief: null,
  tedMorningBriefError: null,
  tedEodDigestLoading: false,
  tedEodDigest: null,
  tedEodDigestError: null,
  ```
- **Done when:** App compiles and the ted tab renders with new (empty) cards visible.
- **Session size:** Medium (~1 file, ~30 lines across 2 locations)

### JC-060: Morning Brief Endpoint — `[x]` COMPLETE

- Sidecar: `GET /reporting/morning-brief` implemented in `server.mjs`
- Extension: `ted.reporting.morning_brief` gateway method implemented in `index.ts`

---

## Phase 2: Organize (File -> Extract -> Hold)

### JC-061: Email Filing Execution — `[x]` COMPLETE (Sidecar + Extension)

- Sidecar: `POST /graph/{profile}/mail/{message_id}/move` in `server.mjs`
- Extension: `ted.mail.move` gateway method in `index.ts`
- **Remaining:** UI filing approval surface (see JC-061a below)

#### JC-061a: Filing approval UI controls `[ ]`

- **Depends on:** JC-059f (base operate tab wired)
- **Files to edit:** `ui/src/ui/views/ted.ts`, `ui/src/ui/controllers/ted.ts`
- **What:** Add an "Approve Filing" button to mail message items in the inbox card. When clicked, calls `ted.mail.move` with the message_id and a configured destination folder.
- **This can be deferred** until the basic inbox + brief surfaces are validated.
- **Session size:** Small (~2 files, ~40 lines total)

### JC-062: Deadline Extraction — `[x]` COMPLETE (Sidecar + Extension)

- Sidecar: `POST /extraction/deadlines` in `server.mjs`
- Extension: `ted.extraction.deadlines` gateway method in `index.ts`
- **Remaining:** UI surface for deadline proposals (see JC-062a below)

#### JC-062a: Deadline proposals UI surface `[ ]`

- **Depends on:** JC-059f
- **Files to edit:** `ui/src/ui/views/ted.ts`, `ui/src/ui/controllers/ted.ts`
- **What:** Add a "Deadlines" card to the operate tab that shows extracted deadline candidates with confidence levels. Operator can approve (creates calendar hold via JC-063) or dismiss.
- **Can be deferred** until inbox + brief surfaces validated.
- **Session size:** Medium (~2 files, ~80 lines)

### JC-063: Calendar Tentative Holds — `[x]` COMPLETE (Sidecar + Extension)

- Sidecar: `POST /graph/{profile}/calendar/event/create` in `server.mjs`
- Extension: `ted.calendar.event.create` gateway method in `index.ts`
- **Remaining:** UI surface is covered by JC-062a (deadline approval creates calendar hold)

### JC-064: End-of-Day Digest — `[x]` COMPLETE (Sidecar + Extension)

- Sidecar: `GET /reporting/eod-digest` in `server.mjs`
- Extension: `ted.reporting.eod_digest` gateway method in `index.ts`
- UI surface: Covered by JC-059e

---

## Phase 3: Deliver (Install -> Run -> Trust)

### JC-065: Mac Installer (arm64 + intel)

#### JC-065a: Research current build system and packaging `[ ]`

- **Files to read:** `package.json`, any existing `Makefile`, `scripts/`, CI config
- **What:** Understand what build tooling exists. Determine if electron-builder, pkg, or custom packaging is in use.
- **Session size:** Research only — no writes

#### JC-065b: Create DMG build script `[ ]`

- **Depends on:** JC-065a
- **Files to write:** `scripts/build-dmg.sh` or equivalent
- **What:** Script that produces arm64 and intel DMGs from the current source.
- **Session size:** Medium (~1 file, ~100 lines)

#### JC-065c: Verify installer opens on macOS `[ ]`

- **Depends on:** JC-065b
- **REQUIRES:** macOS machine for testing
- **Session size:** Manual verification

### JC-066: Auto-Start on Reboot (LaunchAgent)

#### JC-066a: Create LaunchAgent plist and install script `[ ]`

- **Files to write:** `resources/com.openclaw.ted-engine.plist`, `scripts/install-launchagent.sh`
- **What:** LaunchAgent plist that starts the sidecar on login. Install script copies to `~/Library/LaunchAgents/`.
- **Session size:** Small (~2 files, ~40 lines)

#### JC-066b: Verify reboot survival `[ ]`

- **REQUIRES:** macOS machine
- **Session size:** Manual verification

### JC-067: Setup Wizard (Guided First-Run)

#### JC-067a: Add setup state and controller `[ ]`

- **Files to edit:** `ui/src/ui/controllers/ted.ts`, `ui/src/ui/types.ts`
- **What:** Add setup wizard state: `tedSetupStep`, `tedSetupComplete`, step-specific fields.
- **Session size:** Small (~2 files, ~30 lines)

#### JC-067b: Add setup wizard view `[ ]`

- **Depends on:** JC-067a
- **Files to edit:** `ui/src/ui/views/ted.ts`
- **What:** Guided flow: Welcome → Configure Graph Profile → Authenticate → First Morning Brief → Done. Shows only when `tedSetupComplete` is false.
- **Session size:** Medium (~1 file, ~120 lines)

#### JC-067c: Wire setup wizard in app-render `[ ]`

- **Depends on:** JC-067b
- **Files to edit:** `ui/src/ui/app-render.ts`
- **What:** Wire setup state and show wizard on first load.
- **Session size:** Small (~1 file, ~20 lines)

---

## Phase 4: Prove (Operator Trust Recovery)

### JC-068: Behavioral Proof Scripts

All proofs must make **real HTTP calls** to the sidecar. String-presence proofs (`rg` for code patterns) are **banned** per council directive.

**Pattern for all proofs:** Use `lib_auth.sh` for token minting, `curl` for HTTP calls, check status codes and response fields.

#### JC-068a: Proof scripts for Phase 1 endpoints `[x]`

- **Files to write:** 4 scripts
  - `scripts/ted-profile/proof_jc057.sh` — Inbox reading: curl GET `/graph/{profile}/mail/list`, verify 200, check `messages` array in response
  - `scripts/ted-profile/proof_jc058.sh` — Draft generation: curl POST `/graph/{profile}/drafts/generate`, verify response structure
  - `scripts/ted-profile/proof_jc059.sh` — UI surfaces: This one is special — verify that the UI types and props compile (`npx tsc --noEmit` on the UI source)
  - `scripts/ted-profile/proof_jc060.sh` — Morning brief: curl GET `/reporting/morning-brief`, verify 200, check `summary` and `recommendations` fields
- **Session size:** Medium (~4 files, ~40 lines each)

#### JC-068b: Proof scripts for Phase 2 endpoints `[x]`

- **Files to write:** 4 scripts
  - `scripts/ted-profile/proof_jc061.sh` — Email filing: curl POST `/graph/{profile}/mail/{id}/move`, verify response structure
  - `scripts/ted-profile/proof_jc062.sh` — Deadline extraction: curl POST `/extraction/deadlines` with sample text, verify `candidates` array
  - `scripts/ted-profile/proof_jc063.sh` — Calendar creation: curl POST `/graph/{profile}/calendar/event/create`, verify response
  - `scripts/ted-profile/proof_jc064.sh` — EOD digest: curl GET `/reporting/eod-digest`, verify 200, check `summary` fields
- **Session size:** Medium (~4 files, ~40 lines each)

#### JC-068c: Rewrite Category B proof scripts `[x]`

- **What:** These existing proof scripts use `rg` string-presence and must be rewritten as behavioral tests:
  - `proof_jc019.sh` — Must verify gateway methods respond, not just exist in source
  - `proof_jc033.sh` — Must verify UI renders, not just that strings exist
  - `proof_jc046.sh` — Must verify integration health endpoint responds
  - `proof_jc047.sh` — Must verify operator flow endpoint responds
- **Session size:** Medium (~4 files, ~40 lines each)
- **Can be deferred** until Phase 1-2 endpoints are all verified.

### JC-069: Operator Acceptance Test

#### JC-069a: Write acceptance test script `[x]`

- **Depends on:** All Phase 1 and Phase 2 work complete
- **Files to write:** `scripts/ted-profile/proof_jc069.sh`
- **What:** End-to-end test: start sidecar → authenticate → load inbox → generate morning brief → generate EOD digest → verify all responses. This is the "can Clint open Outlook and find useful drafts?" gate.
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-069b: Operator session test `[ ]`

- **REQUIRES OPERATOR:** Clint runs the system for one business day.
- **What:** Structured feedback form: How many drafts were useful? How many required major edits? What was confusing?
- **Session size:** Manual

---

## Roadmap Updates

### ROADMAP-UPDATE: Sync 10_ROADMAP_JOB_BOARD.md `[x]`

- **Files to edit:** `docs/ted-profile/sdd-pack/10_ROADMAP_JOB_BOARD.md`
- **What:** Add JC-056 through JC-069 cards with correct status. Update existing EPIC 1-6 items to reference the new cards. Mark sidecar endpoint cards (JC-057, 060-064) as DONE.
- **Session size:** Medium (~1 file, ~100 lines)

### ROADMAP-UPDATE: Update 00_README.md index `[x]`

- **Files to edit:** `docs/ted-profile/sdd-pack/00_README.md`
- **What:** Add entries for files 37 and 38 (this file + setup guide).
- **Session size:** Trivial (~1 file, ~2 lines)

---

## Phase 5: LLM Integration + Copilot Extension (EPIC 11)

**Source:** `43_LLM_INTEGRATION_IMPLEMENTATION_PLAN.md` + `42_COPILOT_EXTENSION_ARCHITECTURE.md`

### JC-070: LLM Provider Infrastructure

#### JC-070a: Create `config/llm_provider.json` `[x]`

- **Files to write:** `sidecars/ted-engine/config/llm_provider.json`
- **What:** Provider config with `openai_direct` default, `azure_openai` and `copilot_extension` disabled. Entity overrides (Everest → azure_openai required). Schema in SDD-42 §5.1.
- **Done when:** JSON parses cleanly and matches SDD-42 schema.
- **Session size:** Small (~1 file, ~40 lines)

#### JC-070b: Add `llmCall()`, `routeLlmCall()`, `selectLlmProvider()` to sidecar `[x]`

- **Depends on:** JC-070a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** LLM utility functions after config getters (~line 2954): `selectLlmProvider()`, `routeLlmCall()`, `openaiDirectCall()`, `redactPhiFromMessages()`, `buildSystemPrompt()`.
- **Done when:** `routeLlmCall()` returns `blockedExplainability()` when no provider configured.
- **Session size:** Large (~1 file, ~200 lines)

#### JC-070c: Add `/ops/llm-provider` GET/POST routes `[x]`

- **Depends on:** JC-070a, JC-070b
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** `GET /ops/llm-provider` (returns sanitized config), `POST /ops/llm-provider` (updates provider).
- **Done when:** `curl GET /ops/llm-provider` returns config.
- **Session size:** Small (~1 file, ~60 lines)

#### JC-070d: Add extension gateway methods for LLM provider `[x]`

- **Depends on:** JC-070c
- **Files to edit:** `extensions/ted-sidecar/index.ts`
- **What:** `ted.llm.provider.get` and `ted.llm.provider.set` gateway methods.
- **Done when:** Gateway methods registered following existing patterns.
- **Session size:** Small (~1 file, ~40 lines)

#### JC-070e: Implement `validateLlmOutputContract()` `[x]`

- **Depends on:** JC-070b
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Structural validation function that checks LLM output against the template contract. Per-endpoint checks:
  - Morning brief: all 8 `must_include` headings present
  - EOD digest: all 5 `required_sections` present
  - Draft: signature + disclaimer present, zero `words_to_avoid` matches
  - Triage: `entity`, `deal_id`, `confidence` fields present
  - Deadline: `date`, `context`, `confidence` per candidate
- **Returns:** `{ valid, missing_sections, banned_phrases_found }`
- **Modes:** If partial → hybrid (inject template for missing); if invalid → full template fallback
- **Done when:** Function validates all 5 endpoint contract types; deliberate incomplete input returns correct missing sections.
- **Session size:** Medium (~1 file, ~100 lines)

### JC-071: Enhance Existing Endpoints with LLM

#### JC-071a: Enhance draft generation with LLM `[x]`

- **Depends on:** JC-070b, JC-070e
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** In `generateDraftsFromInbox()` (~line 3598): build layered system prompt from `draft_style.json` (tone, banned phrases, signature) + `hard_bans.json` + entity context. Call `routeLlmCall()`, then `validateLlmOutputContract("draft_email")` to enforce signature, disclaimer, and banned phrase contract. Hybrid fallback for partial; full template fallback if LLM down.
- **Done when:** Endpoint generates LLM drafts that always satisfy the structural contract (signature, disclaimer, no banned phrases).
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-071b: Enhance morning brief with LLM narrative `[x]`

- **Depends on:** JC-070b, JC-070e
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** In `generateMorningBrief()` (~line 4140): system prompt includes 8 `must_include` sections from `brief_config.json` as REQUIRED headings. LLM fills sections with narrative. `validateLlmOutputContract("morning_brief")` verifies all 8 present. Missing sections injected from template (hybrid mode). Returns `{ ...existing_fields, narrative, source: "llm"|"hybrid"|"template" }`.
- **Done when:** Morning brief narrative always contains all 8 required sections.
- **Session size:** Medium (~1 file, ~60 lines)

#### JC-071c: Enhance EOD digest with LLM summarization `[x]`

- **Depends on:** JC-070b, JC-070e
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** In `generateEodDigest()` (~line 4212): system prompt includes 5 `required_sections` from `brief_config.json` Isaac report config + tone rules. `validateLlmOutputContract("eod_digest")` verifies all 5 present. Returns `{ ...existing_fields, narrative, next_day_priorities, source }`.
- **Done when:** EOD digest narrative covers all 5 Isaac report sections.
- **Session size:** Medium (~1 file, ~60 lines)

#### JC-071d: Enhance triage classification with LLM `[x]`

- **Depends on:** JC-070b
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Add LLM classification in `ingestTriageItem()` (~line 2748) when pattern confidence < 80%.
- **Done when:** Triage items get LLM-enhanced classification with confidence scores.
- **Session size:** Medium (~1 file, ~70 lines)

#### JC-071e: Enhance deadline extraction with LLM `[x]`

- **Depends on:** JC-070b
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Add LLM semantic deadline discovery in `extractDeadlines()` (~line 3969). Merge with regex results.
- **Done when:** Extraction returns both regex and LLM-discovered deadlines.
- **Session size:** Medium (~1 file, ~70 lines)

### JC-072: UI LLM Provider Selection

#### JC-072a: Add LLM provider types `[x]`

- **Files to edit:** `ui/src/ui/types.ts`
- **What:** Add `LlmProviderName` type and `TedLlmProviderConfig` interface.
- **Done when:** Types compile.
- **Session size:** Small (~1 file, ~15 lines)

#### JC-072b: Add LLM provider state and controller functions `[x]`

- **Depends on:** JC-072a
- **Files to edit:** `ui/src/ui/controllers/ted.ts`
- **What:** State fields (`tedLlmProviderConfig`, loading, error) + `loadTedLlmProvider()`, `updateTedLlmProvider()`.
- **Done when:** Functions follow existing controller guard pattern.
- **Session size:** Small (~1 file, ~50 lines)

#### JC-072c: Add LLM Provider card to Ted view `[x]`

- **Depends on:** JC-072a, JC-072b
- **Files to edit:** `ui/src/ui/views/ted.ts`
- **What:** "LLM Provider" card in Operate tab: default dropdown, per-entity status, per-job overrides, Copilot status.
- **Done when:** Card renders with current provider config.
- **Session size:** Medium (~1 file, ~100 lines)

#### JC-072d: Wire LLM provider props in app-render.ts `[x]`

- **Depends on:** JC-072b, JC-072c
- **Files to edit:** `ui/src/ui/app-render.ts`, `ui/src/ui/app-view-state.ts`
- **What:** Wire state → props for LLM provider card. Add view-state fields and initializations.
- **Done when:** App compiles and LLM Provider card renders.
- **Session size:** Small (~2 files, ~30 lines total)

### JC-073: MCP Server

#### JC-073a: Add MCP handler scaffold `[x]`

- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Manual JSON-RPC 2.0 handler at `POST /mcp`. Routes `tools/list`, `tools/call`, `resources/list`, `resources/read`. Full error code coverage (-32700, -32600, -32601, -32602, -32603). Audit logging for all MCP requests.
- **Done when:** `POST /mcp` with `tools/list` returns tool list.
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-073b: Register read-only MCP tools `[x]`

- **Depends on:** JC-073a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** MCP tools: `ted_status`, `ted_morning_brief`, `ted_eod_digest`, `ted_deals_list`, `ted_deal_detail`, `ted_mail_list`, `ted_triage_list`. Uses `mcpCallInternal()` for Graph-dependent tools and direct function calls for local data.
- **Done when:** `tools/list` returns all 7 read-only tools; `tools/call` returns data.
- **Session size:** Medium (~1 file, ~120 lines)

#### JC-073c: Register MCP resources `[x]`

- **Depends on:** JC-073a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** MCP resources: operator_profile, hard_bans, autonomy_ladder, brief_config, draft_style, recent audit (last 50 AUDIT entries from triage.jsonl).
- **Done when:** `resources/list` returns 6 resources; `resources/read` works for all URIs.
- **Session size:** Small (~1 file, ~60 lines)

#### JC-073d: Register draft-capable MCP tools `[x]`

- **Depends on:** JC-073b, JC-070b
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Governance-gated MCP tools: `ted_draft_email`, `ted_draft_generate`, `ted_calendar_event_create`, `ted_extraction_deadlines`. All use `mcpCallInternal()` to invoke existing sidecar endpoints, inheriting all governance controls.
- **Done when:** Tools execute with governance enforcement via existing route handlers.
- **Session size:** Medium (~1 file, ~100 lines)

### JC-074: Legacy Copilot Extension Webhook (Optional)

#### JC-074a: Add Copilot webhook handler `[ ]`

- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** `POST /copilot/webhook` with `@copilot-extensions/preview-sdk`, signature verification, intent classification, SSE response.
- **Done when:** Webhook streams SSE response for known intents.
- **Session size:** Large (~1 file, ~180 lines)

#### JC-074b: Add `copilotLlmCall()` and GitHub user verification `[ ]`

- **Depends on:** JC-074a, JC-070b
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** `copilotLlmCall()` to `api.githubcopilot.com/chat/completions`, GitHub user verification via `api.github.com/user`.
- **Done when:** Copilot webhook can call back to Copilot LLM API.
- **Session size:** Small (~1 file, ~60 lines)

### JC-075: LLM/MCP Proof Scripts

#### JC-075a: Proof script for LLM provider infrastructure `[x]`

- **Files to write:** `scripts/ted-profile/proof_jc070.sh`
- **What:** Behavioral: GET/POST `/ops/llm-provider`, verify config read/write.
- **Session size:** Small (~1 file, ~40 lines)

#### JC-075b: Proof script for MCP server `[x]`

- **Files to write:** `scripts/ted-profile/proof_mcp_tools.sh`
- **What:** Behavioral: `tools/list`, `tools/call` for `ted_status`, `resources/list`.
- **Session size:** Small (~1 file, ~50 lines)

### JC-076: Agent Tool Registration + Ted Agent (iMessage Value Flow)

**Context:** Ted's gateway methods serve the UI only. OpenClaw's agent system powers
iMessage and all channels. To make Ted's value flow through iMessage, Ted must
register its capabilities as agent tools via `api.registerTool()`. Reference pattern:
`extensions/voice-call/index.ts`.

#### JC-076a: Register read-only Ted agent tools `[x]`

- **Depends on:** JC-070d (extension gateway methods exist)
- **Files to edit:** `extensions/ted-sidecar/index.ts`
- **What:** Call `api.registerTool()` for 8 read-only tools: `ted_status`,
  `ted_morning_brief`, `ted_eod_digest`, `ted_mail_list`, `ted_draft_generate`,
  `ted_deadlines`, `ted_deal_list`, `ted_deal_get`. Each tool's `execute` calls the
  same `callAuthenticatedTedRoute()` functions the gateway methods use.
- **Done when:** All 8 tools appear in agent tool list.
- **Session size:** Large (~1 file, ~200 lines)

#### JC-076b: Register write-operation Ted agent tools with confirmation gate `[x]`

- **Depends on:** JC-076a
- **Files to edit:** `extensions/ted-sidecar/index.ts`
- **What:** Register 5 write tools with built-in confirmation pattern (`confirmed`
  param). Tools: `ted_mail_move`, `ted_calendar_create`, `ted_deal_create`,
  `ted_deal_update`, `ted_deal_manage`. First call returns preview; second call
  with `confirmed: true` executes.
- **Done when:** Write tools require confirmation flow.
- **Session size:** Large (~1 file, ~200 lines)

#### JC-076c: Register `before_tool_call` governance hook `[x]`

- **Depends on:** JC-076a, JC-076b
- **Files to edit:** `extensions/ted-sidecar/index.ts`
- **What:** Register `api.registerHook("before_tool_call", ...)` that enforces:
  entity boundary check, hard ban enforcement, autonomy ladder check, write
  confirmation gate. Returns `{ blocked: true, blockReason }` or `{ blocked: false }`.
- **Done when:** Hook fires for all `ted_*` tool calls. Non-Ted tools pass through.
- **Session size:** Medium (~1 file, ~100 lines)

#### JC-076d: Create Ted Agent configuration template `[x]`

- **Depends on:** JC-076a, JC-076b
- **Files to write:** `sidecars/ted-engine/config/ted_agent.json`
- **What:** Agent config template: id "ted", model claude-sonnet, minimal tool
  profile + Ted tools + message + cron, deny exec/write/browser/nodes. Includes
  system prompt optimized for mobile/iMessage. Includes cron job templates for
  morning brief (7am MT) and EOD digest (5pm MT) delivery to iMessage.
- **Done when:** Config file exists with complete agent definition.
- **Session size:** Small (~1 file, ~60 lines)

#### JC-076e: Proof script for agent tool registration `[x]`

- **Depends on:** JC-076c
- **Files to write:** `scripts/ted-profile/proof_jc076.sh`
- **What:** Behavioral: verify tools appear in agent tool list, `ted_status` callable,
  `ted_mail_move` returns preview without `confirmed: true`, `before_tool_call`
  blocks cross-entity call.
- **Done when:** All 5 checks pass.
- **Session size:** Small (~1 file, ~60 lines)

---

## Phase 6: Operator Command Center (EPIC 12)

**Source:** `44_OPERATOR_COMMAND_CENTER_ARCHITECTURE.md`

### JC-077: Meeting Lifecycle

#### JC-077a: Meeting data models + prep endpoint `[x]`

- **Depends on:** JC-063 (calendar create exists)
- **Files to write:** `sidecars/ted-engine/server.mjs`
- **What:** Add `artifacts/meetings/` directory, `prep.jsonl` + `debrief.jsonl` ledgers. Add `GET /meeting/upcoming?hours=24` (reads calendar, enriches with attendee context, related deals, related emails). Add `POST /meeting/prep/{event_id}` (generates prep packet from calendar + email + deal context + open commitments).
- **Done when:** `GET /meeting/upcoming` returns enriched meeting list; `POST /meeting/prep/{event_id}` returns prep packet.
- **Session size:** Large (~1 file, ~200 lines)

#### JC-077b: Meeting debrief endpoint `[x]`

- **Depends on:** JC-077a, JC-070b (LLM for extraction)
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Add `POST /meeting/debrief` that accepts transcript or summary text. Uses LLM to extract deliverables (ted_owned vs clint_owned) and commitments. Stores in `debrief.jsonl`. Creates commitment entries (JC-078).
- **Done when:** Debrief endpoint returns structured deliverables from text input.
- **Session size:** Medium (~1 file, ~120 lines)

#### JC-077c: Extension gateway methods for meeting lifecycle `[x]`

- **Depends on:** JC-077a, JC-077b
- **Files to edit:** `extensions/ted-sidecar/index.ts`
- **What:** Register 4 gateway methods: `ted.meeting.upcoming`, `ted.meeting.prep`, `ted.meeting.prep.packet`, `ted.meeting.debrief`.
- **Done when:** All 4 methods registered following existing patterns.
- **Session size:** Small (~1 file, ~60 lines)

#### JC-077d: Meeting prep UI surface `[x]`

- **Depends on:** JC-077c
- **Files to edit:** `ui/src/ui/types.ts`, `ui/src/ui/controllers/ted.ts`, `ui/src/ui/views/ted.ts`, `ui/src/ui/app-render.ts`
- **What:** Add "Meetings" card in Operate tab: upcoming meetings list with prep status, "Generate Prep" button, expandable prep packet view.
- **Done when:** Card renders with meeting data.
- **Session size:** Large (~4 files, ~150 lines total)

#### JC-077e: Agent tools for meeting lifecycle `[x]`

- **Depends on:** JC-077c, JC-076a (tool registration pattern)
- **Files to edit:** `extensions/ted-sidecar/index.ts`
- **What:** Register `ted_meeting_upcoming` (read-only), `ted_meeting_prep` (read-only), `ted_meeting_debrief` (write, confirmation gate) via `api.registerTool()`.
- **Done when:** Tools appear in agent tool list and are callable via iMessage.
- **Session size:** Medium (~1 file, ~80 lines)

### JC-078: Commitment Tracking

#### JC-078a: Commitment data model + sidecar endpoints `[x]`

- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Add `artifacts/commitments/` directory, `commitments.jsonl` ledger. Add endpoints: `GET /commitments/list`, `POST /commitments/create`, `POST /commitments/{id}/complete`, `POST /commitments/{id}/follow-up` (generates follow-up draft email).
- **Done when:** CRUD endpoints work; follow-up generates draft.
- **Session size:** Large (~1 file, ~180 lines)

#### JC-078b: Commitment extraction from text `[x]`

- **Depends on:** JC-078a, JC-070b (LLM)
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Add `POST /commitments/extract` that uses LLM to identify promises/deadlines from email or meeting text. Returns structured commitments with confidence scores.
- **Done when:** Endpoint extracts "Isaac said he'd send the PSA by Friday" into structured commitment.
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-078c: Extension gateway + agent tools for commitments `[x]`

- **Depends on:** JC-078a, JC-078b
- **Files to edit:** `extensions/ted-sidecar/index.ts`
- **What:** Register 5 gateway methods (`ted.commitments.*`) + 4 agent tools (`ted_commitments_list`, `ted_commitment_create`, `ted_commitment_follow_up`, `ted_commitment_complete`).
- **Done when:** Gateway methods and agent tools registered.
- **Session size:** Medium (~1 file, ~100 lines)

### JC-079: GTD Action Management

#### JC-079a: GTD data models + sidecar endpoints `[x]`

- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Add `artifacts/gtd/` directory, `actions.jsonl` + `waiting_for.jsonl` ledgers. Add endpoints: `GET /gtd/actions/list`, `POST /gtd/actions/create`, `POST /gtd/actions/{id}/complete`, `POST /gtd/actions/{id}/delegate`, `GET /gtd/waiting-for/list`, `POST /gtd/waiting-for/create`, `POST /gtd/waiting-for/{id}/follow-up`.
- **Done when:** All 7 endpoints return correct responses.
- **Session size:** Large (~1 file, ~220 lines)

#### JC-079b: GTD bridge to existing systems `[x]`

- **Depends on:** JC-079a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Wire triage ingest → action creation (when actionable). Wire deal team_tasks → GTD actions (bidirectional). Wire commitment resolution → action/waiting-for creation.
- **Done when:** Creating a triage item with `actionable: true` also creates a GTD action.
- **Session size:** Medium (~1 file, ~100 lines)

#### JC-079c: Extension gateway + agent tools for GTD `[x]`

- **Depends on:** JC-079a
- **Files to edit:** `extensions/ted-sidecar/index.ts`
- **What:** Register 7 gateway methods (`ted.gtd.actions.*`, `ted.gtd.waiting_for.*`) + 5 agent tools.
- **Done when:** Gateway methods and agent tools registered.
- **Session size:** Medium (~1 file, ~100 lines)

### JC-080: Enhanced Briefs with Command Center Data

#### JC-080a: Add meeting/commitment/action data to morning brief `[x]`

- **Depends on:** JC-077a, JC-078a, JC-079a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** In `generateMorningBrief()`: add `meetings_today` array, `commitments_snapshot` object, `actions_snapshot` object. Read from meeting prep, commitments, and GTD action ledgers.
- **Done when:** Morning brief response includes all three new sections.
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-080b: Add meeting/commitment/action data to EOD digest `[x]`

- **Depends on:** JC-077a, JC-078a, JC-079a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** In `generateEodDigest()`: add `commitments_completed_today`, `actions_completed_today`, `meetings_debriefed`, `meetings_not_debriefed` counts.
- **Done when:** EOD digest response includes all new fields.
- **Session size:** Small (~1 file, ~50 lines)

#### JC-080c: Proof script for Phase 6 `[x]`

- **Files to write:** `scripts/ted-profile/proof_jc077_080.sh`
- **What:** Behavioral: create meeting prep, create commitment, create action, verify morning brief includes all new sections.
- **Session size:** Small (~1 file, ~60 lines)

---

## Phase 7: Calendar Intelligence + PARA Filing (EPIC 13)

**Source:** `44_OPERATOR_COMMAND_CENTER_ARCHITECTURE.md`

### JC-081: Time-Block Planning

#### JC-081a: Planning config + generate endpoint `[x]`

- **Depends on:** JC-063 (calendar), JC-079a (GTD actions)
- **Files to write:** `sidecars/ted-engine/config/planning_preferences.json`
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Create config file with deep work targets, work hours, block durations. Add `POST /planning/timeblock/generate` that reads calendar + actions + commitments + deadlines, classifies tasks as deep/shallow, generates proposed plan.
- **Done when:** Endpoint returns structured time-block plan JSON.
- **Session size:** Large (~2 files, ~200 lines)

#### JC-081b: Time-block apply + deep work protect endpoints `[x]`

- **Depends on:** JC-081a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Add `POST /planning/timeblock/{plan_id}/apply` (syncs to calendar), `POST /planning/deep-work/protect` (sets busy status + optional auto-response draft), `GET /planning/timeblock/history`.
- **Done when:** Apply creates calendar events; protect sets busy status.
- **Session size:** Medium (~1 file, ~120 lines)

#### JC-081c: Extension gateway + agent tools + UI surface `[x]`

- **Depends on:** JC-081a, JC-081b
- **Files to edit:** `extensions/ted-sidecar/index.ts`, `ui/src/ui/views/ted.ts` (+ types, controller, wiring)
- **What:** Register 4 gateway methods + 3 agent tools. Add "Daily Plan" card in Operate tab with approve/replan controls.
- **Done when:** Plan visible in UI and accessible via iMessage.
- **Session size:** Large (~5 files, ~200 lines total)

### JC-082: PARA Filing Classification

#### JC-082a: PARA config + classify endpoint `[x]`

- **Files to write:** `sidecars/ted-engine/config/para_rules.json`
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Create PARA classification rules config. Add `POST /filing/para/classify` (classifies items into Project/Area/Resource/Archive with rationale). Add `GET /filing/para/structure` (returns current PARA folder structure derived from deals + entities).
- **Done when:** Classification returns PARA category with confidence.
- **Session size:** Medium (~2 files, ~120 lines)

#### JC-082b: Integration with filing suggestions + extension gateway `[x]`

- **Depends on:** JC-082a
- **Files to edit:** `sidecars/ted-engine/server.mjs`, `extensions/ted-sidecar/index.ts`
- **What:** Wire PARA classification into `proposeFilingSuggestion()` — add `para_category` and `para_path` fields to filing suggestion events. Register 2 gateway methods.
- **Done when:** Filing suggestions include PARA classification.
- **Session size:** Small (~2 files, ~60 lines)

### JC-083: Deep Work Metrics

#### JC-083a: Metrics endpoint + brief integration `[x]`

- **Depends on:** JC-081a (planning data)
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Add `GET /reporting/deep-work-metrics?period=week` returning weekly deep work hours, plan adherence rate, actual vs target. Inject into morning brief ("Deep work this week: 14.5 / 20 hrs") and EOD digest ("Deep work today: 3.5 hrs").
- **Done when:** Metrics endpoint returns data; briefs include deep work line.
- **Session size:** Small (~1 file, ~60 lines)

#### JC-083b: Proof script for Phase 7 `[x]`

- **Files to write:** `scripts/ted-profile/proof_jc081_083.sh`
- **What:** Behavioral: generate plan, apply to calendar, verify deep work metrics.
- **Session size:** Small (~1 file, ~50 lines)

---

## Phase 8: Adoption Engineering (EPIC 14)

**Source:** `44_OPERATOR_COMMAND_CENTER_ARCHITECTURE.md`

### JC-084: Notification Budget + Onboarding Ramp

#### JC-084a: Config files + enforcement logic `[x]`

- **Files to write:** `sidecars/ted-engine/config/notification_budget.json`, `sidecars/ted-engine/config/onboarding_ramp.json`
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Create both config files per SDD-44 specs. Add `getNotificationBudget()` and `getOnboardingPhase()` config getters. Add enforcement: check budget before any push notification; check onboarding phase before exposing features in briefs.
- **Done when:** Config files exist; notification count enforced; onboarding phase gates features.
- **Session size:** Medium (~3 files, ~100 lines)

### JC-085: Trust Dashboard

#### JC-085a: Metrics endpoint + UI surface `[x]`

- **Depends on:** Triage ledger exists (already built)
- **Files to edit:** `sidecars/ted-engine/server.mjs`, `extensions/ted-sidecar/index.ts`
- **Files to edit:** `ui/src/ui/views/ted.ts` (+ types, controller, wiring)
- **What:** Add `GET /reporting/trust-metrics?period=week` returning approval rate, edit rate, time saved estimate, queue clearance speed, autonomy promotion eligibility. Register gateway method. Add "Trust & Performance" card in Operate tab.
- **Done when:** Metrics endpoint returns data; UI card renders.
- **Session size:** Large (~5 files, ~200 lines total)

### JC-086: Progressive Disclosure in Briefs

#### JC-086a: Headline + summary fields in brief/digest responses `[x]`

- **Depends on:** Existing morning brief + EOD digest endpoints
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Add `headline` (5-second summary) and `summary` (60-second decision-ready) fields to morning brief and EOD digest responses. iMessage delivery uses headline; UI renders progressive disclosure with collapsible sections.
- **Done when:** Brief responses include `headline` and `summary` fields.
- **Session size:** Small (~1 file, ~50 lines)

#### JC-086b: Proof script for Phase 8 `[x]`

- **Files to write:** `scripts/ted-profile/proof_jc084_086.sh`
- **What:** Behavioral: verify notification budget config loads, verify onboarding phase gates, verify brief has headline field, verify trust metrics endpoint responds.
- **Session size:** Small (~1 file, ~50 lines)

---

## Recommended Execution Order (Session Plan)

Each numbered item below is one context-window session. Sessions within the same step can run in parallel.

| Session | Sub-tasks                   | Est. Size          | Depends On                  |
| ------- | --------------------------- | ------------------ | --------------------------- |
| 1       | JC-059a + JC-059b           | Small+Small        | Nothing — start here        |
| 2       | JC-059c + JC-059d           | Small+Medium       | Session 1                   |
| 3       | JC-059e                     | Medium             | Session 2                   |
| 4       | JC-059f                     | Medium             | Session 3                   |
| 5       | JC-056a                     | Small              | Nothing — parallel with 1-4 |
| 6       | JC-058a                     | Medium             | JC-057 done + LLM decision  |
| 7       | JC-058b                     | Small              | Session 6                   |
| 8       | JC-068a + JC-068b           | Medium             | Sessions 4 + 6              |
| 9       | JC-068c                     | Medium             | Session 8                   |
| 10      | ROADMAP-UPDATE (both)       | Medium             | Any time                    |
| 11      | JC-061a + JC-062a           | Small+Medium       | Session 4                   |
| 12      | JC-067a + JC-067b + JC-067c | Small+Medium+Small | Session 4                   |
| 13      | JC-065a + JC-065b           | Research+Medium    | Nothing — parallel          |
| 14      | JC-066a                     | Small              | Session 13                  |
| 15      | JC-069a                     | Medium             | Sessions 8 + 11             |

### LLM / Copilot / Agent Tool Sessions (Phase 5)

| Session | Sub-tasks                   | Est. Size          | Depends On                         |
| ------- | --------------------------- | ------------------ | ---------------------------------- |
| 16      | JC-070a + JC-070b           | Small+Large        | Nothing — start here               |
| 17      | JC-070c + JC-070d + JC-070e | Small+Small+Medium | Session 16                         |
| 18      | JC-071a + JC-071b           | Medium+Medium      | Session 17 (needs 070e)            |
| 19      | JC-071c + JC-071d + JC-071e | Medium×3           | Session 17 (needs 070e)            |
| 20      | JC-072a + JC-072b           | Small+Small        | Session 17                         |
| 21      | JC-072c + JC-072d           | Medium+Small       | Session 20                         |
| 22      | JC-073a + JC-073b           | Medium+Medium      | Session 16                         |
| 23      | JC-073c + JC-073d           | Small+Medium       | Session 22                         |
| 24      | JC-074a + JC-074b           | Large+Small        | Session 16 (optional)              |
| 25      | JC-075a + JC-075b           | Small+Small        | Sessions 17 + 22                   |
| 26      | JC-076a                     | Large              | Session 17 (needs gateway methods) |
| 27      | JC-076b + JC-076c           | Large+Medium       | Session 26                         |
| 28      | JC-076d + JC-076e           | Small+Small        | Session 27                         |

**Phase 5 Critical path (iMessage value):** Sessions 16 → 17 → 26 → 27 → 28 (Ted agent usable via iMessage)
**Phase 5 Critical path (UI toggle):** Sessions 16 → 17 → 20 → 21
**Parallel tracks:** Sessions 18-19 (endpoint LLM), 22-23 (MCP), 24 (Copilot webhook)

### Operator Command Center Sessions (Phase 6)

| Session | Sub-tasks                                                              | Est. Size          | Depends On                 |
| ------- | ---------------------------------------------------------------------- | ------------------ | -------------------------- |
| 29      | JC-077a (meeting prep data model + endpoint)                           | Large              | JC-063 (calendar)          |
| 30      | JC-077b (meeting debrief) + JC-078a (commitment endpoints)             | Large+Large        | Session 29 + JC-070b (LLM) |
| 31      | JC-078b (commitment extraction) + JC-079a (GTD actions)                | Medium+Large       | Session 30                 |
| 32      | JC-079b (GTD bridge) + JC-077c + JC-078c + JC-079c (extension methods) | Medium+Small×3     | Session 31                 |
| 33      | JC-077d (meeting UI) + JC-080a + JC-080b (enhanced briefs)             | Large+Medium+Small | Session 32                 |
| 34      | JC-077e (agent tools) + JC-080c (proof script)                         | Medium+Small       | Session 32                 |

### Calendar Intelligence + PARA Sessions (Phase 7)

| Session | Sub-tasks                                                                  | Est. Size         | Depends On        |
| ------- | -------------------------------------------------------------------------- | ----------------- | ----------------- |
| 35      | JC-081a (planning config + generate) + JC-082a (PARA config + classify)    | Large+Medium      | JC-079a (actions) |
| 36      | JC-081b (apply + protect) + JC-082b (filing integration)                   | Medium+Small      | Session 35        |
| 37      | JC-081c (UI + agent tools) + JC-083a (deep work metrics) + JC-083b (proof) | Large+Small+Small | Session 36        |

### Adoption Engineering Sessions (Phase 8)

| Session | Sub-tasks                                          | Est. Size   | Depends On                |
| ------- | -------------------------------------------------- | ----------- | ------------------------- |
| 38      | JC-084a (notification budget + onboarding ramp)    | Medium      | Nothing — can start early |
| 39      | JC-085a (trust dashboard)                          | Large       | Triage ledger exists      |
| 40      | JC-086a (progressive disclosure) + JC-086b (proof) | Small+Small | Existing briefs           |

**Phase 6 Critical path (meeting value):** Sessions 29 → 30 → 31 → 32 → 33
**Phase 7 Critical path (calendar protection):** Sessions 35 → 36 → 37
**Phase 8 can start in parallel:** Session 38 has no dependencies

**Total estimated sessions:** 40 (some parallelizable, realistic: ~26 sequential)

---

## Session Pickup Instructions

When starting a new session to work on a sub-task:

1. **Read this file first** (`37_REMEDIATION_TASK_BREAKDOWN_JC056_069.md`)
2. **Find your sub-task** by ID (e.g., JC-059d)
3. **Read ONLY the files listed** in that sub-task's description
4. **Follow the pattern references** cited in the sub-task
5. **Mark the sub-task `[x]`** in this file when complete
6. **Do not expand scope** — if you discover additional work, add a new sub-task entry

This prevents context bloat and ensures each session delivers a clean, verifiable increment.
