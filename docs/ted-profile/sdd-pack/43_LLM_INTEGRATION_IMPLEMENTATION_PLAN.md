# SDD-43: LLM Integration Implementation Plan

**Council Record:** Implementation Plan — LLM as Sidecar Capability + Copilot Extension Agent
**Date:** 2026-02-22
**Status:** PLAN — Approved by councilors, pending operator start
**Prerequisites:** Phase 1+2 complete (SDD-37), QA fixes applied (QA_REPORT.md)
**Architecture Reference:** SDD-42 (Copilot Extension Architecture)

---

## 0. Executive Summary

This plan adds **LLM intelligence** to Ted's existing template-based endpoints and architects the **Copilot Extension / MCP Server** path alongside it. The design is phased:

- **Day 1 (immediate):** Direct OpenAI API via Clint's ChatGPT Pro account. LLM enhances draft generation, morning brief, EOD digest, triage classification, and deadline extraction.
- **Day 2 (after configuration):** MCP Server for VS Code / JetBrains integration. Copilot Extension webhook for GitHub.com Copilot Chat (legacy path).
- **Day 3 (after Azure credentials):** Azure OpenAI for Everest HIPAA-cleared operations.

Per-job LLM provider selection allows Clint to choose `openai_direct`, `copilot_extension`, or `disabled` for any task. Entity-based HIPAA routing blocks Everest PHI operations through non-BAA providers.

---

## 1. What Changes in the App

### 1.1 Sidecar (`server.mjs`)

| Change                                    | Location                                | Description                                                |
| ----------------------------------------- | --------------------------------------- | ---------------------------------------------------------- |
| **New: `llmCall()` utility**              | After line ~2954 (after config getters) | Unified LLM call function with timeout, retry, audit       |
| **New: `routeLlmCall()` router**          | After `llmCall()`                       | Provider selection per entity/job; HIPAA enforcement       |
| **New: `selectLlmProvider()`**            | After `routeLlmCall()`                  | Cascade: per-job → entity → default provider               |
| **New: `redactPhiFromMessages()`**        | After provider router                   | PHI scrub for Everest context before any LLM call          |
| **New: `config/llm_provider.json`**       | Config directory                        | Provider configuration (enabled/disabled, endpoints, keys) |
| **Enhanced: `generateDraftsFromInbox()`** | Line ~3598                              | Replace template `draftBody` with LLM-generated draft      |
| **Enhanced: `generateMorningBrief()`**    | Line ~4140                              | Add LLM narrative synthesis of data payload                |
| **Enhanced: `generateEodDigest()`**       | Line ~4212                              | Add LLM summarization of day's activity                    |
| **Enhanced: `ingestTriageItem()`**        | Line ~2748                              | Add LLM semantic classification alongside pattern matching |
| **Enhanced: `extractDeadlines()`**        | Line ~3969                              | Add LLM natural language deadline extraction               |
| **New: `GET /ops/llm-provider`**          | New route                               | Return current LLM provider config (sanitized)             |
| **New: `POST /ops/llm-provider`**         | New route                               | Update provider selection                                  |
| **New: `POST /mcp`**                      | New route                               | MCP Streamable HTTP handler (Phase 2)                      |
| **New: `POST /copilot/webhook`**          | New route                               | Legacy Copilot Extension SSE handler (Phase 2)             |

### 1.2 Extension (`index.ts`)

| Change                          | Location             | Description                    |
| ------------------------------- | -------------------- | ------------------------------ |
| **New: `ted.llm.provider.get`** | Gateway registration | Calls `GET /ops/llm-provider`  |
| **New: `ted.llm.provider.set`** | Gateway registration | Calls `POST /ops/llm-provider` |

### 1.3 UI (`views/ted.ts`, `controllers/ted.ts`, `app-render.ts`, `app-view-state.ts`, `types.ts`)

| Change                               | Layer              | Description                                                            |
| ------------------------------------ | ------------------ | ---------------------------------------------------------------------- |
| **New: LLM Provider card**           | views/ted.ts       | Dropdown for default provider, per-entity status, per-job overrides    |
| **New: `TedLlmProviderConfig` type** | types.ts           | Provider config shape for UI consumption                               |
| **New: state fields**                | controllers/ted.ts | `tedLlmProviderConfig`, `tedLlmProviderLoading`, `tedLlmProviderError` |
| **New: controller functions**        | controllers/ted.ts | `loadTedLlmProvider()`, `updateTedLlmProvider()`                       |
| **New: prop wiring**                 | app-render.ts      | Wire LLM provider state + handlers to view                             |
| **New: view-state fields**           | app-view-state.ts  | Add LLM provider fields to AppViewState                                |

### 1.4 Config Files

| File                           | Change                                                               |
| ------------------------------ | -------------------------------------------------------------------- |
| `config/llm_provider.json`     | **NEW** — Provider registry with Day 1 defaults                      |
| `config/operator_profile.json` | No change — existing entity separation rules feed LLM system prompts |
| `config/hard_bans.json`        | No change — existing rules applied as post-LLM validation            |
| `config/autonomy_ladder.json`  | No change — existing modes applied to LLM-generated actions          |
| `config/draft_style.json`      | No change — feeds LLM system prompt for draft generation             |
| `config/brief_config.json`     | No change — feeds LLM system prompt for briefs                       |

---

## 2. Template-as-Contract Pattern and Governance Integration

### 2.0 Template-as-Contract Pattern

Templates serve a **dual role** in Ted's LLM architecture. Understanding this
relationship is critical — the template is not "the dumb version." It is the
**structural contract** that the LLM must satisfy.

**Role 1: Output Schema Contract (always enforced, even when LLM is running)**

Each endpoint's template defines the OUTPUT SHAPE that the LLM must produce.
The config files are not "optional context" the LLM can choose to use — they
are **requirements** that constrain the LLM's output:

- `brief_config.json` → `daily_briefs.work.must_include` = **8 REQUIRED sections**
  in every morning brief narrative (deadlines, meetings, inbox items, follow-ups,
  risks/anomalies, draft queue, post-call deliverables, deal status snapshot)
- `brief_config.json` → `isaac_nightly_report.required_sections` = **5 REQUIRED
  sections** in every EOD digest narrative (done today, in progress, deal snapshot,
  next steps + ownership, flags for Isaac)
- `draft_style.json` → `signature_conventions` = **REQUIRED elements** in every
  email draft (signature: "— Clint", disclaimer: "(Generated as a draft for
  review; not sent)")
- `draft_style.json` → `words_to_avoid` = **PROHIBITED elements** — LLM output
  must never contain "I hope this finds you well", "Please don't hesitate",
  "As per my previous email", etc.
- `operator_profile.json` → `entity_separation.never_mix_with` = **STRUCTURAL
  BOUNDARY** — LLM output for Olumie must never reference Everest data

The LLM does not decide what sections exist. The config files define the sections.
The LLM fills them with intelligence.

**Role 2: Degraded Fallback (when LLM is unavailable)**

When the LLM provider is down, rate-limited, or disabled, the template produces
a structurally correct but unintelligent version of the same output shape. This
ensures Clint's workflow is never blocked.

**Relationship:** The LLM does not replace the template. The LLM **fills** the
template with intelligence. The template defines the shape; the LLM provides
the substance.

### 2.0.1 Per-Endpoint Contract Summary

| Endpoint              | Structural Contract (from config)                                                                                   | What LLM Adds                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Draft generation      | Must include signature + disclaimer; must avoid banned phrases; must match per-context tone from `draft_style.json` | Reads original email, crafts substantive reply in Clint's voice            |
| Morning brief         | Must contain all 8 `must_include` sections; format: `decision_ready`                                                | Synthesizes raw data into scannable prose with urgency weighting           |
| EOD digest            | Must contain all 5 `required_sections`; tone: "matter-of-fact, confident, organized"                                | Transforms audit log into Isaac-ready narrative with next-step attribution |
| Triage classification | Must return `{ entity, deal_id, confidence }`; must respect `default_classification_rule`                           | Semantic understanding beyond keyword patterns                             |
| Deadline extraction   | Must return `{ date, context, source, confidence }` per candidate                                                   | Implicit deadline detection, relative date resolution                      |

### 2.1 System Prompt Construction (Layered Requirements)

Every LLM call includes a system prompt built from Ted's config files. These
configs are the LLM's **primary operating instructions** — not optional context.
The system prompt is structured in layers:

1. **Identity layer** (`operator_profile.json`): Who Clint is, what entities
   exist, entity separation rules, timezone, privilege lists, classification
   signals
2. **Style layer** (`draft_style.json`): How Clint writes — tone per context
   (business: "Direct, concise, professional"), banned phrases (6 explicit),
   signature conventions
3. **Structure layer** (`brief_config.json`): What sections must appear in each
   output type — 8 morning brief sections, 5 Isaac report sections, delivery
   times, format requirements
4. **Constraint layer** (`hard_bans.json`): What the LLM must NEVER do — 11
   hard ban strings as explicit negative constraints in the system prompt
5. **Autonomy layer** (`autonomy_ladder.json`): What mode this action is in —
   draft_only means LLM must include disclaimer and never imply it has sent
   anything
6. **Priority layer** (`urgency_rules.json`): How to weight and order items —
   deadline within 48h = HIGH, health/safety keywords = CRITICAL, preference:
   "surface more, not less"

### 2.2 Post-LLM Validation Pipeline

All LLM output passes through a 7-step validation pipeline before returning
to the caller:

1. **Entity Boundary Check** — `operator_profile.json` `never_mix_with` rules.
   Verify LLM output does not reference data from a different entity context.
2. **PHI Redaction Check** — if Everest context, scan output for PHI fields
   (resident names, room numbers, medical conditions, DOB, SSN).
3. **Hard Ban Check** — output string must not violate any of the 11
   `hard_ban_strings` from `hard_bans.json`.
4. **Structural Contract Check** — verify LLM output contains all required
   sections/fields defined by the endpoint's template contract:
   - For morning brief: all 8 `must_include` sections present in narrative
   - For EOD digest: all 5 `required_sections` present in narrative
   - For drafts: signature ("— Clint") present, disclaimer present, zero
     matches against `words_to_avoid`
   - For triage: `entity`, `deal_id`, and `confidence` fields present
   - If a required section is missing: inject that section with template-
     generated content (hybrid mode) and log `LLM_CONTRACT_PARTIAL` audit event
   - If output is structurally invalid: reject entirely, fall back to full
     template mode, log `LLM_CONTRACT_VIOLATION` audit event
5. **Approval Mode Check** — `autonomy_ladder.json` determines draft_only vs
   autonomous. If draft_only, verify output includes disclaimer and does not
   imply the action has been executed.
6. **Confidence Threshold Check** — low-confidence results surfaced for Clint
   review. Triage < 80% → daily brief queue. Deadline < 70% → include source
   text snippet.
7. **Audit Trail** — every LLM call logged with: provider, entity, model,
   confidence, governance result (pass/partial/fail), contract violations (if
   any), latency_ms.

### 2.3 Graceful Degradation

If LLM is unavailable (API down, key expired, rate limited):

- Fall back to existing template-based output
- Log `LLM_FALLBACK` audit event with reason
- UI shows "(template-generated)" indicator
- Never block the operator's workflow

---

## 3. HIPAA Compliance

### 3.1 Provider-Entity Matrix

```
Entity      openai_direct    copilot_extension    azure_openai
--------    -------------    -----------------    ------------
Olumie      ALLOWED          ALLOWED              ALLOWED
Everest     BLOCKED (PHI)    BLOCKED (no BAA)     REQUIRED
Prestige    ALLOWED          ALLOWED              ALLOWED
```

### 3.2 Enforcement Point

`routeLlmCall()` enforces this matrix before any LLM call executes. Blocked calls return `blockedExplainability()` with clear next steps.

---

## 4. Implementation Sub-Tasks

These are session-sized tasks following the conventions in SDD-37. Each sub-task writes ≤2 files, has a verifiable done state, and fits one context window.

### Phase A: LLM Provider Infrastructure (Day 1)

#### JC-070a: Create `config/llm_provider.json` with OpenAI Direct default

- **Files to write:** `sidecars/ted-engine/config/llm_provider.json`
- **What:** Create provider config with `openai_direct` as default, `azure_openai` and `copilot_extension` disabled. Include entity overrides (Everest → azure_openai required). See SDD-42 §5.1 for schema.
- **Done when:** JSON file parses cleanly and matches schema from SDD-42.
- **Session size:** Small (~1 file, ~40 lines)

#### JC-070b: Add `llmCall()`, `routeLlmCall()`, `selectLlmProvider()` to sidecar

- **Depends on:** JC-070a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Add the LLM utility functions after the config getter section (~line 2954):
  1. `selectLlmProvider(entityContext, jobId)` — cascade: per-job → entity → default
  2. `routeLlmCall(messages, entityContext, jobId, copilotToken)` — dispatches to correct provider
  3. `openaiDirectCall(messages, config)` — calls `api.openai.com/v1/chat/completions`
  4. `redactPhiFromMessages(messages, entityContext)` — PHI scrub for Everest
  5. `buildSystemPrompt(intent, entityContext)` — constructs **layered** system prompt:
     - Loads `operator_profile.json` as **identity layer** (entity context, timezone,
       privilege lists, classification signals)
     - Loads intent-specific config as **style/structure layer**:
       - Drafts → `draft_style.json` (tone per context, words_to_avoid, signature)
       - Briefs → `brief_config.json` (must_include sections as REQUIRED headings)
       - Triage → `operator_profile.json` classification rules
     - Loads `hard_bans.json` as **constraint layer** (NEVER-DO list in system prompt)
     - Loads `autonomy_ladder.json` as **autonomy layer** (tells LLM if this is
       draft_only — must include disclaimer, must not imply action was taken)
     - Loads `urgency_rules.json` as **priority layer** (weighting signals)
     - Includes the **structural contract**: required sections/fields the LLM
       output MUST contain (from brief_config, draft_style, etc.)
     - Returns messages array with system prompt as first message
- **Done when:** Functions exist and `routeLlmCall()` returns `blockedExplainability()` when no provider is configured (safe default).
- **Session size:** Large (~1 file, ~250 lines)

#### JC-070c: Add `/ops/llm-provider` GET and POST routes

- **Depends on:** JC-070a, JC-070b
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Add two new routes:
  - `GET /ops/llm-provider` — returns config with API keys redacted
  - `POST /ops/llm-provider` — updates `default_provider` or `per_job_overrides`
  - Both require auth (not in EXEMPT_AUTH_ROUTES)
  - POST validates provider exists and is enabled before writing
- **Done when:** Both routes respond correctly. Proof: `curl GET /ops/llm-provider` returns config.
- **Session size:** Small (~1 file, ~60 lines)

#### JC-070d: Add extension gateway methods for LLM provider

- **Depends on:** JC-070c
- **Files to edit:** `extensions/ted-sidecar/index.ts`
- **What:** Register two gateway methods:
  - `ted.llm.provider.get` → `callAuthenticatedTedGetRoute("/ops/llm-provider")`
  - `ted.llm.provider.set` → `callAuthenticatedTedRoute("/ops/llm-provider", body)`
- **Done when:** Gateway methods registered following existing patterns.
- **Session size:** Small (~1 file, ~40 lines)

#### JC-070e: Implement `validateLlmOutputContract()`

- **Depends on:** JC-070b
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Add a structural validation function that checks LLM output against
  the template contract BEFORE returning it to the caller:
  1. `validateLlmOutputContract(intent, llmOutput, entityContext)` — checks:
     - For `morning_brief`: all 8 `must_include` headings from `brief_config.json`
       are present in the narrative text
     - For `eod_digest`: all 5 `required_sections` from `brief_config.json`
       are present in the narrative text
     - For `draft_email`: signature ("— Clint") present, disclaimer present,
       zero matches against `words_to_avoid` from `draft_style.json`
     - For `triage_classify`: `entity`, `deal_id`, `confidence` fields in response
     - For `deadline_extract`: each candidate has `date`, `context`, `confidence`
  2. Returns `{ valid: true }` or `{ valid: false, missing_sections: [...],
banned_phrases_found: [...] }`
  3. If partially valid (some sections missing): caller injects template content
     for missing sections (hybrid mode), logs `LLM_CONTRACT_PARTIAL`
  4. If invalid (structurally broken): caller falls back to full template, logs
     `LLM_CONTRACT_VIOLATION`
- **Done when:** Function validates all 5 endpoint contract types. Proof: calling
  with a deliberately incomplete LLM output returns the correct missing sections.
- **Session size:** Medium (~1 file, ~100 lines)

### Phase B: Enhance Existing Endpoints with LLM (Day 1)

#### JC-071a: Enhance draft generation with LLM

- **Depends on:** JC-070b, JC-070e
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** In `generateDraftsFromInbox()` (~line 3598):
  - Build system prompt via `buildSystemPrompt("draft_email", entityContext)` which
    loads `draft_style.json` tone rules, `hard_bans.json` constraints, and the
    structural contract (signature, disclaimer, banned phrases)
  - Call `routeLlmCall()` with the original email content + system prompt
  - Run `validateLlmOutputContract("draft_email", llmOutput)` to verify
    structural contract (signature present, disclaimer present, no banned phrases)
  - If contract passes: use LLM output as draft body
  - If contract partial: patch missing elements from template
  - If LLM unavailable: fall back to template entirely
  - Audit trail: `DRAFT_GENERATED_LLM`, `DRAFT_GENERATED_HYBRID`, or
    `DRAFT_GENERATED_TEMPLATE`
- **Done when:** Endpoint generates LLM-enhanced drafts that always include
  required structural elements regardless of what the LLM returns.
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-071b: Enhance morning brief with LLM narrative

- **Depends on:** JC-070b, JC-070e
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** In `generateMorningBrief()` (~line 4140):
  - After gathering all data (triage, deals, filings, audit), build system prompt
    with `brief_config.json` `must_include` sections as REQUIRED headings
  - Pass structured data to LLM for narrative synthesis
  - Run `validateLlmOutputContract("morning_brief", narrative)` to verify
    all 8 required sections are present in the narrative
  - If sections missing: inject template-generated content for missing sections
  - Response shape: `{ ...existing_fields, narrative: "...", source: "llm"|"hybrid"|"template" }`
  - Template fallback: return existing structured-only response with
    `source: "template"`
- **Done when:** Morning brief includes `narrative` field that always contains
  all 8 required sections.
- **Session size:** Medium (~1 file, ~60 lines)

#### JC-071c: Enhance EOD digest with LLM summarization

- **Depends on:** JC-070b, JC-070e
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** In `generateEodDigest()` (~line 4212):
  - Build system prompt with `brief_config.json` `isaac_nightly_report` tone
    and `required_sections` as REQUIRED headings
  - Pass day's metrics to LLM for narrative synthesis
  - Run `validateLlmOutputContract("eod_digest", narrative)` to verify all 5
    required sections present
  - Response shape: `{ ...existing_fields, narrative: "...", next_day_priorities: [...], source: "llm"|"hybrid"|"template" }`
  - Template fallback preserves structured data
- **Done when:** EOD digest includes narrative covering all 5 Isaac report sections.
- **Session size:** Medium (~1 file, ~60 lines)

#### JC-071d: Enhance triage classification with LLM

- **Depends on:** JC-070b
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** In `ingestTriageItem()` (~line 2748):
  - After pattern-based classification, if confidence < 80%, attempt LLM classification
  - LLM receives: source_type, source_ref, summary + `operator_profile.json` entity rules
  - LLM returns: suggested entity, deal_id, confidence score
  - If LLM confidence > pattern confidence, use LLM result
  - If neither is > 80%, surface in daily brief triage queue
- **Done when:** Triage items get LLM-enhanced classification with confidence scores.
- **Session size:** Medium (~1 file, ~70 lines)

#### JC-071e: Enhance deadline extraction with LLM

- **Depends on:** JC-070b
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** In `extractDeadlines()` (~line 3969):
  - After regex extraction, pass full text to LLM for semantic deadline discovery
  - LLM identifies: implicit deadlines, multi-line contexts, relative dates
  - Merge LLM results with regex results (deduplicate by date + context)
  - Each candidate has `source: "regex" | "llm" | "both"` and confidence
- **Done when:** Extraction returns both regex and LLM-discovered deadlines.
- **Session size:** Medium (~1 file, ~70 lines)

### Phase C: UI Provider Selection (Day 1)

#### JC-072a: Add LLM provider types

- **Files to edit:** `ui/src/ui/types.ts`
- **What:** Add types:
  ```typescript
  export type LlmProviderName = "openai_direct" | "azure_openai" | "copilot_extension" | "disabled";
  export interface TedLlmProviderConfig {
    default_provider: LlmProviderName;
    providers: Record<string, { enabled: boolean; hipaa_cleared: boolean; notes: string }>;
    entity_overrides: Record<
      string,
      { provider: LlmProviderName | null; required_hipaa_cleared?: boolean }
    >;
    per_job_overrides: Record<string, { provider: LlmProviderName }>;
  }
  ```
- **Done when:** Types compile.
- **Session size:** Small (~1 file, ~15 lines)

#### JC-072b: Add LLM provider state and controller functions

- **Depends on:** JC-072a
- **Files to edit:** `ui/src/ui/controllers/ted.ts`
- **What:** Add to `TedWorkbenchState`:
  ```
  tedLlmProviderConfig: TedLlmProviderConfig | null;
  tedLlmProviderLoading: boolean;
  tedLlmProviderError: string | null;
  ```
  Add controller functions:
  - `loadTedLlmProvider(state)` — calls `ted.llm.provider.get`
  - `updateTedLlmProvider(state, update)` — calls `ted.llm.provider.set`, then reloads
- **Done when:** Functions follow existing controller guard pattern.
- **Session size:** Small (~1 file, ~50 lines)

#### JC-072c: Add LLM Provider card to Ted view

- **Depends on:** JC-072a, JC-072b
- **Files to edit:** `ui/src/ui/views/ted.ts`
- **What:** Add "LLM Provider" card in the Operate tab showing:
  - Default provider dropdown (OpenAI Direct / Copilot Extension / Disabled)
  - Per-entity status (Olumie: uses default, Everest: requires Azure OpenAI)
  - Per-job override list (if any configured)
  - Copilot Extension status (enabled/disabled with config instructions)
  - Loading/error states
- **Done when:** Card renders with current provider config.
- **Session size:** Medium (~1 file, ~100 lines)

#### JC-072d: Wire LLM provider props in app-render.ts

- **Depends on:** JC-072b, JC-072c
- **Files to edit:** `ui/src/ui/app-render.ts`, `ui/src/ui/app-view-state.ts`
- **What:** Wire state → props:
  ```
  llmProviderConfig: state.tedLlmProviderConfig,
  llmProviderLoading: state.tedLlmProviderLoading,
  llmProviderError: state.tedLlmProviderError,
  onLoadLlmProvider: () => void state.loadTedLlmProvider(),
  onUpdateLlmProvider: (update) => void state.updateTedLlmProvider(update),
  ```
  Add view-state fields and state initializations.
- **Done when:** App compiles and LLM Provider card renders.
- **Session size:** Small (~2 files, ~30 lines total)

### Phase D: MCP Server (Day 2)

#### JC-073a: Add MCP dependencies and handler scaffold

- **Files to edit:** `sidecars/ted-engine/server.mjs`, `sidecars/ted-engine/package.json` (if exists)
- **What:**
  - Add `@modelcontextprotocol/sdk` import
  - Create `McpServer` instance with name "ted-engine"
  - Add `/mcp` route that creates `StreamableHTTPServerTransport` and handles requests
  - Register auth middleware (same Bearer token as other routes)
- **Done when:** `POST /mcp` with `tools/list` returns empty tool list.
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-073b: Register read-only MCP tools

- **Depends on:** JC-073a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Register MCP tools that delegate to existing sidecar functions:
  - `ted_status` → `buildPayload()`
  - `ted_morning_brief` → `generateMorningBrief()`
  - `ted_eod_digest` → `generateEodDigest()`
  - `ted_deals_list` → `listDeals()`
  - `ted_deal_detail` → `getDeal(dealId)`
  - `ted_mail_list` → `listGraphMail(profileId)`
  - `ted_triage_list` → `listOpenTriageItems()`
- **Done when:** `tools/list` returns all registered tools; `tools/call` for each returns data.
- **Session size:** Medium (~1 file, ~120 lines)

#### JC-073c: Register MCP resources

- **Depends on:** JC-073a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Register MCP resources:
  - `ted://config/operator_profile` → `operator_profile.json`
  - `ted://config/hard_bans` → `hard_bans.json`
  - `ted://config/autonomy_ladder` → `autonomy_ladder.json`
  - `ted://config/brief_config` → `brief_config.json`
  - `ted://config/draft_style` → `draft_style.json`
  - `ted://governance/audit/recent` → last 50 audit entries
- **Done when:** `resources/list` and `resources/read` work for all resources.
- **Session size:** Small (~1 file, ~60 lines)

#### JC-073d: Register draft-capable MCP tools (governance-gated)

- **Depends on:** JC-073b, JC-070b
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Register tools that require governance checks:
  - `ted_draft_email` — requires profile_id, runs autonomy_ladder check (draft_only)
  - `ted_draft_generate` — batch draft generation, draft_only
  - `ted_calendar_event_create` — requires profile_id, governance gated
  - `ted_extraction_deadlines` — extract deadlines from text
    Each tool: validate entity boundary → check autonomy ladder → execute → audit
- **Done when:** Tools execute with governance enforcement and return appropriate blocked messages.
- **Session size:** Medium (~1 file, ~100 lines)

### Phase E: Legacy Copilot Webhook (Day 2, Optional)

#### JC-074a: Add Copilot webhook handler

- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Add `POST /copilot/webhook` route with:
  - `@copilot-extensions/preview-sdk` for signature verification and SSE events
  - Request parsing: extract `X-GitHub-Token`, verify signature, parse messages
  - Intent classification: `classifyCopilotIntent()` with pattern matching
  - SSE response: ack → text → references → done
  - Entity boundary enforcement and governance pipeline
- **Done when:** Webhook accepts POST, streams SSE response for known intents.
- **Session size:** Large (~1 file, ~180 lines)

#### JC-074b: Add `copilotLlmCall()` and GitHub user verification

- **Depends on:** JC-074a, JC-070b
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:**
  - `copilotLlmCall(messages, token)` — POST to `api.githubcopilot.com/chat/completions`
  - GitHub user verification: GET `api.github.com/user` with X-GitHub-Token
  - Audit: log GitHub login alongside intent execution
- **Done when:** Copilot webhook can call back to Copilot LLM API for reasoning tasks.
- **Session size:** Small (~1 file, ~60 lines)

### Phase F: Proof Scripts

#### JC-075a: Proof script for LLM provider infrastructure

- **Files to write:** `scripts/ted-profile/proof_jc070.sh`
- **What:** Behavioral proof:
  1. `GET /ops/llm-provider` → 200, verify `default_provider` field
  2. `POST /ops/llm-provider` with `{"default_provider":"disabled"}` → 200
  3. `GET /ops/llm-provider` → verify updated
  4. Restore original default
- **Session size:** Small (~1 file, ~40 lines)

#### JC-075b: Proof script for MCP server

- **Files to write:** `scripts/ted-profile/proof_mcp_tools.sh`
- **What:** Behavioral proof:
  1. `POST /mcp` with `tools/list` → verify tool names in response
  2. `POST /mcp` with `tools/call` for `ted_status` → verify health data
  3. `POST /mcp` with `resources/list` → verify resource URIs
- **Session size:** Small (~1 file, ~50 lines)

### Phase G: Agent Tool Registration + Ted Agent (iMessage Value Flow)

**Context:** Ted's 37 gateway methods serve the UI only. OpenClaw's agent system
powers iMessage, WhatsApp, Telegram, and all other channels. When Clint texts via
iMessage, the LLM agent gets tools from `api.registerTool()` — but Ted registers
zero tools. This phase bridges that gap so Ted's full value flows through every
channel Clint uses.

**Reference pattern:** `extensions/voice-call/index.ts` registers BOTH gateway
methods (for UI) AND a tool (for agents). Ted follows the same pattern.

**Governance model:**

- Read-only tools: auto-approve (no side effects)
- Write tools: require operator confirmation via tool description + `confirmed` parameter
- Policy/governance tools: HARD BAN — never exposed as agent tools

#### JC-076a: Register read-only Ted agent tools

- **Depends on:** JC-070d (extension gateway methods exist)
- **Files to edit:** `extensions/ted-sidecar/index.ts`
- **What:** Call `api.registerTool()` for each read-only Ted capability. Each tool's
  `execute` function calls the same `callAuthenticatedTedRoute()` /
  `callAuthenticatedTedGetRoute()` that the gateway methods already use. Register:
  1. `ted_status` — returns sidecar health + workbench summary
  2. `ted_morning_brief` — generates morning brief (read-only, no side effects)
  3. `ted_eod_digest` — generates end-of-day digest
  4. `ted_mail_list` — lists inbox messages (supports profile_id, folder, top, filter)
  5. `ted_draft_generate` — generates draft replies (creates drafts, not sends)
  6. `ted_deadlines` — extracts deadlines from text or returns known deadlines
  7. `ted_deal_list` — lists all deals with stage/status
  8. `ted_deal_get` — gets full deal detail by deal_id
- **Tool interface:** Each tool needs `name`, `label`, `description`, `parameters`
  (TypeBox schema), and `async execute()` returning `{ content: [{ type: "text",
text: JSON.stringify(result) }] }`.
- **Import required:** `import { Type } from "@sinclair/typebox"` (or equivalent
  from OpenClaw's plugin SDK)
- **Done when:** All 8 tools appear in agent tool list. Verify: configure a test
  agent with `alsoAllow: ["ted_morning_brief"]`, send a message, agent can call
  the tool.
- **Session size:** Large (~1 file, ~200 lines)

#### JC-076b: Register write-operation Ted agent tools with confirmation gate

- **Depends on:** JC-076a
- **Files to edit:** `extensions/ted-sidecar/index.ts`
- **What:** Register tools that modify state, with a built-in confirmation pattern.
  Each write tool accepts an optional `confirmed: boolean` parameter. On first call
  without confirmation, it returns a preview/proposal. The agent shows the preview
  and asks the operator. On second call with `confirmed: true`, it executes.
  Register:
  1. `ted_mail_move` — move email to folder. Preview: "Move [subject] from [sender]
     to [folder]?" Execute: calls `POST /graph/{profile}/mail/{id}/move`
  2. `ted_calendar_create` — create calendar event. Preview: "Create event [subject]
     at [time] on [date]?" Execute: calls `POST /graph/{profile}/calendar/event/create`
  3. `ted_deal_create` — create new deal. Preview: "Create deal [name] type [type]?"
     Execute: calls `POST /deals`
  4. `ted_deal_update` — update deal. Preview: shows proposed changes. Execute:
     calls `PATCH /deals/{id}`
  5. `ted_deal_manage` — add tasks/notes/investors/counsel to deals. Preview:
     shows what will be added. Execute: calls the appropriate sub-route.
- **Tool descriptions must include:** "ALWAYS show the operator a preview and ask
  for confirmation before calling with confirmed=true."
- **Done when:** Write tools require confirmation flow. Agent cannot execute without
  `confirmed: true`.
- **Session size:** Large (~1 file, ~200 lines)

#### JC-076c: Register `before_tool_call` governance hook

- **Depends on:** JC-076a, JC-076b
- **Files to edit:** `extensions/ted-sidecar/index.ts`
- **What:** Register a `before_tool_call` lifecycle hook via `api.registerHook("before_tool_call", ...)`
  that enforces Ted's governance rules on all Ted tools:
  1. **Entity boundary check:** If tool params include `profile_id`, verify entity
     context matches the active session. Block cross-entity calls.
  2. **Hard ban enforcement:** For write tools, verify the operation doesn't violate
     any `hard_bans.json` rule (e.g., never send external email, never contact
     disputed invoices).
  3. **Autonomy ladder check:** Verify the operation's autonomy mode allows agent
     execution (e.g., `draft_only` operations can generate but never imply execution).
  4. **Write confirmation gate:** For `ted_mail_move`, `ted_calendar_create`,
     `ted_deal_create`, `ted_deal_update`, `ted_deal_manage` — if `confirmed` param
     is not `true`, allow the call (it returns preview). If `confirmed: true`, verify
     the previous turn contained the preview (defense against hallucinated confirmations).
- **Returns:** `{ blocked: false }` to allow, or `{ blocked: true, blockReason: "..." }`
  with explainability for the agent to relay to the operator.
- **Done when:** Hook fires for all `ted_*` tool calls. Blocked calls return clear
  reasons. Non-Ted tools pass through unaffected.
- **Session size:** Medium (~1 file, ~100 lines)

#### JC-076d: Create Ted Agent configuration template

- **Depends on:** JC-076a, JC-076b
- **Files to write:** `sidecars/ted-engine/config/ted_agent.json`
- **What:** A configuration template for the dedicated "Ted" agent that the operator
  adds to their OpenClaw gateway config. Includes:
  ```json
  {
    "_sdd": {
      "source": "docs/ted-profile/sdd-pack/43_LLM_INTEGRATION_IMPLEMENTATION_PLAN.md",
      "section": "Phase G: Agent Tool Registration"
    },
    "agent_config": {
      "id": "ted",
      "name": "Ted",
      "model": "anthropic/claude-sonnet",
      "tools": {
        "profile": "minimal",
        "alsoAllow": [
          "ted_status",
          "ted_morning_brief",
          "ted_eod_digest",
          "ted_mail_list",
          "ted_draft_generate",
          "ted_deadlines",
          "ted_deal_list",
          "ted_deal_get",
          "ted_mail_move",
          "ted_calendar_create",
          "ted_deal_create",
          "ted_deal_update",
          "ted_deal_manage",
          "message",
          "cron"
        ],
        "deny": ["exec", "write", "edit", "read", "browser", "nodes", "process"]
      },
      "systemPrompt": "You are Ted, Clint's legal operations assistant for Olumie Private Equity and Everest Healthcare. You manage his inbox, calendar, deals, daily briefs, and deadlines. Rules: (1) Be concise — Clint is often on mobile via iMessage. (2) For write operations (mail moves, calendar creates, deal changes), ALWAYS show a preview and ask for confirmation before executing. (3) Never mix entity data — Olumie and Everest are separate. (4) Never imply you have sent an email or meeting invite — all actions are draft-only until Clint approves. (5) Surface urgency: deadlines within 48h and health/safety items first."
    },
    "cron_jobs": {
      "morning_brief": {
        "schedule": "0 7 * * 1-5",
        "timezone": "America/Denver",
        "message": "Generate and deliver my morning brief.",
        "delivery_channel": "imessage"
      },
      "eod_digest": {
        "schedule": "0 17 * * 1-5",
        "timezone": "America/Denver",
        "message": "Generate and deliver my end-of-day digest for Isaac.",
        "delivery_channel": "imessage"
      }
    },
    "hard_ban_tools": [
      "ted.policy.update",
      "ted.policy.preview_update",
      "ted.gates.set",
      "ted.jobcards.update",
      "ted.recommendations.decide",
      "ted.jobcards.proof.run"
    ]
  }
  ```
- **Also:** Add documentation comments explaining how to import this into gateway config.
- **Done when:** Config file exists with complete agent definition, cron templates,
  and hard ban list.
- **Session size:** Small (~1 file, ~60 lines)

#### JC-076e: Proof script for agent tool registration

- **Files to write:** `scripts/ted-profile/proof_jc076.sh`
- **What:** Behavioral proof:
  1. Start sidecar + extension
  2. Query agent tool list via gateway debug method, verify `ted_morning_brief`,
     `ted_mail_list`, `ted_deal_list` appear in the resolved tool set
  3. Simulate a tool call to `ted_status` via the agent system, verify response
  4. Simulate a write tool call to `ted_mail_move` without `confirmed: true`,
     verify it returns preview (not execution)
  5. Verify `before_tool_call` hook blocks a cross-entity call
- **Done when:** All 5 checks pass.
- **Session size:** Small (~1 file, ~60 lines)

---

## 5. Execution Order

| Session | Sub-tasks                   | Size                   | Depends On                        |
| ------- | --------------------------- | ---------------------- | --------------------------------- |
| 1       | JC-070a + JC-070b           | Small + Large          | Nothing — start here              |
| 2       | JC-070c + JC-070d + JC-070e | Small + Small + Medium | Session 1                         |
| 3       | JC-071a + JC-071b           | Medium + Medium        | Session 2 (needs 070e)            |
| 4       | JC-071c + JC-071d + JC-071e | Medium × 3             | Session 2 (needs 070e)            |
| 5       | JC-072a + JC-072b           | Small + Small          | Session 2                         |
| 6       | JC-072c + JC-072d           | Medium + Small         | Session 5                         |
| 7       | JC-073a + JC-073b           | Medium + Medium        | Session 1                         |
| 8       | JC-073c + JC-073d           | Small + Medium         | Session 7                         |
| 9       | JC-074a + JC-074b           | Large + Small          | Session 1 (optional)              |
| 10      | JC-075a + JC-075b           | Small + Small          | Sessions 2 + 7                    |
| 11      | JC-076a                     | Large                  | Session 2 (needs gateway methods) |
| 12      | JC-076b + JC-076c           | Large + Medium         | Session 11                        |
| 13      | JC-076d + JC-076e           | Small + Small          | Session 12                        |

**Critical path (iMessage value):** Sessions 1 → 2 → 11 → 12 → 13 (Ted agent usable via iMessage)
**Critical path (UI toggle):** Sessions 1 → 2 → 5 → 6
**Parallel track:** Sessions 3, 4 (endpoint enhancements), 7-8 (MCP), 9 (Copilot)

**Estimated:** 13 sessions, ~8 sequential (some parallelizable)

---

## 6. Environment Variables Required

| Variable                | Purpose                                   | Day 1 Required?                |
| ----------------------- | ----------------------------------------- | ------------------------------ |
| `OPENAI_API_KEY`        | OpenAI direct API calls                   | YES — from Clint's ChatGPT Pro |
| `AZURE_OPENAI_API_KEY`  | Azure OpenAI (Everest HIPAA)              | NO — blocked until provisioned |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI instance URL                 | NO — blocked until provisioned |
| `TED_LLM_MODEL`         | Override default model (default: gpt-4.1) | NO — optional                  |
| `TED_LLM_TIMEOUT_MS`    | LLM call timeout (default: 12000)         | NO — optional                  |

---

## 7. Risk Register

| Risk                               | Mitigation                                                         | Severity |
| ---------------------------------- | ------------------------------------------------------------------ | -------- |
| OpenAI API key compromised         | Env var only, never in config JSON; operator-key auth on sidecar   | HIGH     |
| LLM generates PHI in output        | Post-LLM PHI redaction check; Everest blocked on non-BAA providers | CRITICAL |
| LLM generates entity-mixed content | Post-LLM entity boundary check against `operator_profile.json`     | HIGH     |
| LLM unavailable / rate limited     | Template fallback; never block operator workflow                   | MEDIUM   |
| Copilot API deprecation continues  | MCP Server as primary path; webhook is P2                          | LOW      |
| LLM latency exceeds 12s timeout    | Fallback to template; async generation for non-blocking use cases  | MEDIUM   |

---

## 8. Success Criteria

From `autonomy_ladder.json` success_criteria, this LLM integration must enable:

**First 2 weeks:**

- Email draft queue has drafts waiting with LLM-enhanced content
- Morning brief reads as decision-ready narrative (not raw metrics)
- Zero governance violations from LLM-generated content

**First 8 weeks:**

- Email draft approval rate at 90%+ (LLM drafts match Clint's voice)
- Isaac nightly report generated by LLM, approved by Clint daily
- Triage classification confidence > 80% for 90%+ of items

---

## 9. Alignment with Existing SDD Artifacts

| SDD Document                         | Alignment                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| SDD-37 (Task Breakdown)              | New sub-tasks JC-070 through JC-076 added                                                               |
| SDD-42 (Copilot Architecture)        | Implementation follows architecture exactly                                                             |
| SDD-35 (Council Seats)               | Security councilor reviews HIPAA enforcement                                                            |
| SDD-36 (Cycle 005 Review)            | All proofs are behavioral (no string-presence)                                                          |
| QA_REPORT.md                         | LLM integration addresses JC-058 design decision                                                        |
| operator_profile.json                | Entity rules feed LLM system prompts AND agent tool governance hook                                     |
| hard_bans.json                       | Post-LLM validation enforces all bans; `before_tool_call` hook enforces for agent tools                 |
| autonomy_ladder.json                 | LLM actions respect approval modes; agent write tools enforce draft_only                                |
| draft_style.json                     | LLM drafts follow Clint's tone rules                                                                    |
| brief_config.json                    | LLM briefs include all must_include sections                                                            |
| OpenClaw Plugin SDK (`registerTool`) | Phase G uses `api.registerTool()` to expose Ted capabilities to all channels (iMessage, WhatsApp, etc.) |
| OpenClaw Agent System                | Dedicated Ted agent config with minimal tool profile + Ted tools only                                   |
| OpenClaw Cron System                 | Scheduled morning brief + EOD digest delivery to iMessage                                               |
| `extensions/voice-call/index.ts`     | Reference pattern for registering both gateway methods AND agent tools                                  |

---

## 10. Decision Log

| Decision                                                       | Rationale                                                                                                                                                                                           | Date       |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| OpenAI Direct as Day 1 default                                 | Clint's ChatGPT Pro provides immediate API access                                                                                                                                                   | 2026-02-22 |
| Template-as-Contract pattern                                   | Templates define structural contract LLM must satisfy; configs are requirements not suggestions                                                                                                     | 2026-02-22 |
| Post-LLM structural validation                                 | `validateLlmOutputContract()` ensures all required sections present before returning                                                                                                                | 2026-02-22 |
| Hybrid mode for partial compliance                             | Missing sections injected from template; never return incomplete output to operator                                                                                                                 | 2026-02-22 |
| Template fallback for all LLM endpoints                        | Never block operator workflow                                                                                                                                                                       | 2026-02-22 |
| PHI redaction before AND after LLM call                        | Defense-in-depth for HIPAA                                                                                                                                                                          | 2026-02-22 |
| Per-job provider override                                      | Clint can test providers on individual tasks                                                                                                                                                        | 2026-02-22 |
| MCP Server as primary integration                              | Copilot Extensions deprecated; MCP is GA                                                                                                                                                            | 2026-02-22 |
| Single entity routing (not dual registration)                  | Simpler config, same security via profile_id                                                                                                                                                        | 2026-02-22 |
| Env vars only for API keys                                     | Never store secrets in JSON config files                                                                                                                                                            | 2026-02-22 |
| Agent tools via `api.registerTool()`                           | Ted's value must flow through iMessage and all channels, not just UI tab. Plugin SDK already supports this; voice-call extension is the reference pattern.                                          | 2026-02-22 |
| Dedicated Ted agent (not default agent)                        | Minimal tool profile with only Ted tools + message + cron. Denies exec/write/browser/nodes to reduce attack surface. Clint can assign it to the iMessage channel.                                   | 2026-02-22 |
| Read-only tools auto-approve; write tools require confirmation | Governance classification: morning brief, mail list, deal list = safe. Mail move, calendar create, deal create = preview + confirm. Policy/gate/jobcard updates = HARD BAN, never exposed as tools. | 2026-02-22 |
| `before_tool_call` hook for governance                         | Enforces entity boundary, hard bans, autonomy ladder, and write confirmation at the agent tool level — same governance that applies in the UI applies in iMessage.                                  | 2026-02-22 |
| Cron-driven scheduled briefs to iMessage                       | Morning brief at 7am, EOD digest at 5pm MT, delivered via Ted agent + cron system to iMessage channel. Zero new infrastructure needed.                                                              | 2026-02-22 |
| Skills/Nodes NOT used for Ted                                  | Skills are file/binary packages (ffmpeg, yt-dlp). Nodes are paired physical devices. Ted is a semantic service — tools are the correct abstraction.                                                 | 2026-02-22 |
