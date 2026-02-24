# Architecture Migration Task Breakdown (Blueprint Alignment)

**Status:** Proposed (Council review)
**Version:** v1
**Created:** 2026-02-22
**Source:** Gap analysis of `42_TED_SYSTEM_BLUEPRINT.md` vs current implementation
**Planes affected:** All 5 boxes + both cross-cutting planes

---

## Council Critical Review

### Summary Verdict: YELLOW (Significant Gaps, Achievable Path)

The Blueprint describes a mature event-sourced architecture with 5 planes, 15 ledgers, 3 closed loops, and formalized state machines. The current implementation has **strong foundations** (JSONL append patterns, LLM contract validation, governance config, 76 routes) but **critical structural gaps** that prevent the loops from functioning as designed.

### What Works Well (Keep)

1. **Governance choke-point** -- All entry paths (MCP, UI, gateway) converge through Sidecar. Design Law 1 is satisfied.
2. **JSONL append pattern** -- `appendJsonlLine()` is the right primitive. Domain ledgers (commitments, triage, meetings, GTD) use it correctly.
3. **LLM contract validation** -- `validateLlmOutputContract()` exists with intent-specific checks. Draft email has full template fallback with hybrid mode.
4. **Deal stage validation** -- `isValidStageTransition()` is a good pattern to generalize.
5. **Filing suggestion state machine** -- PROPOSED -> APPROVED pattern is clean and reusable.
6. **Tool permission tiers** -- Read-only (16) vs write-gated (11) is correctly enforced.
7. **Config-driven governance** -- 15 config files correctly categorized by plane.

### Critical Gaps (Must Fix)

| #   | Gap                                                  | Severity | Blueprint Reference   | Current State                                                              |
| --- | ---------------------------------------------------- | -------- | --------------------- | -------------------------------------------------------------------------- |
| G1  | **No centralized event_log**                         | CRITICAL | Box 5, Loop 1         | Writes go to individual ledgers; no unified append-only log                |
| G2  | **7 of 15 ledgers missing**                          | HIGH     | Plane 5               | mail, calendar, trust, deep_work, policy, ops, graph_sync missing          |
| G3  | **No Draft Queue state machine**                     | HIGH     | Design Law 11, Loop 2 | Drafts created directly in Outlook; no ledger, no approval workflow        |
| G4  | **Audit mixed into triage.jsonl**                    | MEDIUM   | Plane 5               | Audit events written alongside triage items, not separate                  |
| G5  | **No event normalization**                           | MEDIUM   | Box 4, Loop 1         | Raw JSON appended; no typed events (mail.received, deal.stage.changed)     |
| G6  | **Morning brief/EOD returns null on LLM failure**    | MEDIUM   | Design Law 2          | Template-as-Contract violated: should return structured template, not null |
| G7  | **Deals stored as JSON snapshots**                   | MEDIUM   | Plane 5               | Deal files overwritten (not event-sourced); no deal event history          |
| G8  | **No facility alert system**                         | LOW      | Box 2                 | Zero implementation for warning/crisis/resolved lifecycle                  |
| G9  | **Commitment lifecycle too simple**                  | LOW      | Box 2                 | Only active/overdue/completed; no review/approval states                   |
| G10 | **Investor compliance has no transition validation** | LOW      | Box 2                 | oig_status is a bare string, no state machine                              |
| G11 | **Ops state in-memory only**                         | MEDIUM   | Plane 5               | Pause/resume not persisted; lost on restart                                |
| G12 | **9 string-presence proof scripts**                  | MEDIUM   | Plane B               | Banned by Council; must rewrite as behavioral                              |

### Architectural Recommendation

**Do NOT attempt a "big bang" rewrite.** Instead, use an **incremental migration strategy:**

1. **Layer the event_log underneath existing ledgers** -- existing `appendJsonlLine()` calls continue to work, but ALSO emit to event_log
2. **Add missing ledgers one at a time** -- each is a small, independent task
3. **Build Draft Queue as a new domain** -- don't retrofit into existing draft generation; add it alongside
4. **Generalize state machines from deal stages** -- extract the pattern, then apply to commitments, investor compliance, facility alerts

This preserves all existing functionality while incrementally moving toward the Blueprint.

---

## Execution Phases

### Dependency Graph

```
Phase 9 (Event Foundation)
    |
    +---> Phase 10 (Missing Ledgers) ---> Phase 14 (Event Normalization)
    |
    +---> Phase 11 (Draft Queue)
    |
    +---> Phase 12 (Contract Validation)
    |
    +---> Phase 13 (State Machines) ---> Phase 13d (Facility Alerts)
    |
    +---> Phase 15 (Proof Rewrite - Plane B)
```

Phase 9 must come first. Phases 10-15 can run in any order after Phase 9 is complete, except where noted.

---

## Phase 9: Event Foundation (CRITICAL PATH)

**Plane(s) affected:** Plane 5 (State), Plane A (Governance)
**Ledgers read:** all existing JSONL ledgers
**Ledgers written:** `event_log` (new), `audit_ledger` (new)

### JC-087: Centralized Event Log

#### JC-087a: Event schema definition + appendEvent utility `[x]`

- **Files to write:** `sidecars/ted-engine/config/event_schema.json`
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Define canonical event schema: `{ event_id, event_type, timestamp, source, trace_id, plane, payload }`. Define event_type enum (start with existing kinds: triage_item, commitment_create, deal_create, meeting_prep, audit, etc.). Create `appendEvent(eventType, source, payload, traceId?)` utility that writes to `artifacts/event_log.jsonl`. Every event gets a UUID event_id and ISO timestamp.
- **Done when:** `appendEvent()` function exists and writes structured events to event_log.jsonl. Schema file documents all event types.
- **Session size:** Medium (~2 files, ~80 lines)

#### JC-087b: Separate audit_ledger from triage.jsonl `[x]`

- **Depends on:** JC-087a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Create `artifacts/audit/audit.jsonl` as separate ledger. Refactor `appendAudit()` to write to audit_ledger AND event_log (dual-write). Remove audit entries from being mixed into triage.jsonl. Update `triageStateFromLines()` to ignore `kind: "AUDIT"` entries for backward compat.
- **Done when:** `appendAudit()` writes to audit.jsonl + event_log.jsonl. Triage replay still works.
- **Session size:** Medium (~1 file, ~60 lines)

#### JC-087c: Wire existing domain writes to also emit events `[x]`

- **Depends on:** JC-087a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** At each existing `appendJsonlLine()` call site (commitments, GTD actions, GTD waiting-for, meetings prep, meetings debrief, patterns, filing suggestions, planning), add a parallel `appendEvent()` call. This is a dual-write: domain ledger keeps working as-is, event_log gets a copy. Do NOT change any external behavior.
- **Done when:** Every `appendJsonlLine()` call site also emits to event_log. Grep for `appendJsonlLine` shows a paired `appendEvent` nearby.
- **Session size:** Large (~1 file, ~120 lines of additions across ~15 call sites)

#### JC-087d: Persist ops state to ops_ledger `[x]`

- **Depends on:** JC-087a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Create `artifacts/ops/ops.jsonl`. Replace in-memory `automationPauseState` with JSONL replay. On startup, replay ops.jsonl to restore pause/resume state. `/ops/pause` and `/ops/resume` append events. Also emit to event_log.
- **Done when:** Sidecar restart preserves pause state. `/ops/pause` -> restart -> `/ops/status` still shows paused.
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-087e: Extension + UI wiring for event log health `[x]`

- **Depends on:** JC-087c
- **Files to edit:** `extensions/ted-sidecar/index.ts`, `ui/src/ui/views/ted.ts` (+ types, controller, wiring)
- **What:** Add `GET /events/stats` endpoint returning event_log size, last event timestamp, event type counts. Register gateway method `ted.events.stats`. Add event log health indicator to Monitor tab (event count, last event time).
- **Done when:** Monitor tab shows event log health. Gateway method callable.
- **Session size:** Large (~5 files, ~150 lines total)

#### JC-087f: Proof script for event foundation `[x]`

- **Files to write:** `scripts/ted-profile/proof_jc087.sh`
- **What:** Behavioral: POST /commitments/create, verify event_log.jsonl contains event. POST /ops/pause, restart sidecar, verify pause state persisted. GET /events/stats returns counts.
- **Session size:** Small (~1 file, ~50 lines)

---

## Phase 10: Missing Ledgers

**Plane(s) affected:** Plane 5 (State)
**Depends on:** Phase 9 (JC-087a must be complete)

### JC-088: Domain Ledger Buildout

#### JC-088a: Trust ledger `[x]`

- **Depends on:** JC-087a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Create `artifacts/trust/trust.jsonl`. Emit `trust.validation_pass`, `trust.validation_fail`, `trust.override` events when `validateLlmOutputContract()` runs. Wire into `/reporting/trust-metrics` to read from trust_ledger instead of computing on-the-fly.
- **Done when:** Trust ledger receives events on every LLM validation. Trust metrics endpoint reads from it.
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-088b: Policy ledger (materialized from configs) `[x]`

- **Depends on:** JC-087a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Create `artifacts/policy/policy.jsonl`. On startup, snapshot current policy state (hard_bans hash, autonomy_ladder hash, enabled providers). On config reload, emit `policy.config_changed` event with diff. Wire governance routes to check policy_ledger for "effective policy at time T."
- **Done when:** Policy ledger snapshots config state. Config changes emit events.
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-088c: Deep work + planning ledger activation `[x]`

- **Depends on:** JC-087a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Planning ledger (plans.jsonl) already exists but is empty. Wire `POST /planning/timeblock/generate` and `/planning/timeblock/{id}/apply` to actually append events. Create `artifacts/deep_work/deep_work.jsonl`. Wire `/reporting/deep-work-metrics` to read/write from deep_work_ledger.
- **Done when:** Generating a plan writes to planning.jsonl. Deep work metrics endpoint reads from deep_work.jsonl.
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-088d: Graph sync ledger `[x]`

- **Depends on:** JC-087a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Create `artifacts/graph/sync.jsonl`. Emit `graph.sync.started`, `graph.sync.completed`, `graph.sync.failed` events from Graph API calls. Emit `graph.auth.success`, `graph.auth.failed` from auth flows. Wire `/graph/status` and `/graph/diagnostics` to read sync health from ledger.
- **Done when:** Graph operations emit sync events. Status/diagnostics read from ledger.
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-088e: Mail + calendar ledger stubs `[x]`

- **Depends on:** JC-087a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Create `artifacts/mail/mail.jsonl` and `artifacts/calendar/calendar.jsonl`. When `/graph/mail/list` fetches mail, emit `mail.fetched` summary event. When `/graph/calendar/list` fetches events, emit `calendar.fetched` summary event. These are stubs -- full ingestion normalization comes in Phase 14.
- **Done when:** Mail and calendar fetches emit ledger events.
- **Session size:** Small (~1 file, ~60 lines)

#### JC-088f: PARA index as separate ledger `[x]`

- **Depends on:** JC-087a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Create `artifacts/filing/para_index.jsonl` separate from suggestions.jsonl. When `/filing/para/classify` runs, emit event to para_index. When `/filing/para/structure` reads, build from para_index.jsonl.
- **Done when:** PARA classification writes to separate para_index.jsonl.
- **Session size:** Small (~1 file, ~50 lines)

#### JC-088g: Proof script for ledger buildout `[x]`

- **Files to write:** `scripts/ted-profile/proof_jc088.sh`
- **What:** Behavioral: trigger actions that write to each new ledger, verify JSONL files contain events.
- **Session size:** Small (~1 file, ~60 lines)

---

## Phase 11: Draft Queue State Machine

**Plane(s) affected:** Plane 2 (Sidecar), Plane 5 (State), Plane 1 (UI)
**Ledgers read:** `mail_ledger`, `deals_ledger`, `commitments_ledger`
**Ledgers written:** `draft_queue_ledger`, `event_log`, `audit_ledger`
**Depends on:** Phase 9 (JC-087a)

### JC-089: Draft Queue

#### JC-089a: Draft queue data model + state machine `[x]`

- **Depends on:** JC-087a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Create `artifacts/drafts/draft_queue.jsonl`. Define draft states: `drafted`, `pending_review`, `edited`, `approved`, `executed`, `archived`. Create `isValidDraftTransition(from, to)` (reuse deal stage pattern). Create helper `buildDraftQueueState()` that replays ledger (same pattern as `buildFilingSuggestionState()`). Each draft record: `{ draft_id, kind, state, content, subject, to, from_profile, related_deal_id, related_meeting_id, created_at, updated_at }`.
- **Done when:** Draft queue state machine helpers exist. Ledger file created.
- **Session size:** Medium (~1 file, ~100 lines)

#### JC-089b: Draft queue CRUD endpoints `[x]`

- **Depends on:** JC-089a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Add 5 endpoints: `GET /drafts/queue` (list pending/filtered), `GET /drafts/{draft_id}` (detail), `POST /drafts/{draft_id}/edit` (update content, state -> edited), `POST /drafts/{draft_id}/approve` (state -> approved), `POST /drafts/{draft_id}/archive` (state -> archived). All emit to event_log + draft_queue_ledger.
- **Done when:** All 5 endpoints respond correctly. State transitions enforced.
- **Session size:** Large (~1 file, ~180 lines)

#### JC-089c: Wire draft generation into queue `[x]`

- **Depends on:** JC-089b
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Modify `generateDraftsFromInbox()` to append drafts to draft_queue_ledger (state: `drafted`) INSTEAD of creating them directly in Outlook. Add `POST /drafts/{draft_id}/execute` endpoint that, when state is `approved`, creates the actual Outlook draft via Graph API. This implements Design Law 11.
- **Done when:** Draft generation writes to queue. Execute endpoint creates Outlook draft only when approved.
- **Session size:** Large (~1 file, ~150 lines)

#### JC-089d: Meeting debrief + commitment follow-up -> draft queue `[x]`

- **Depends on:** JC-089b
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** When `/meeting/debrief` generates follow-up items, create draft queue entries (state: `drafted`). When `/commitments/{id}/follow-up` generates a follow-up email, create draft queue entry instead of returning inline.
- **Done when:** Debrief and follow-up actions create draft queue entries.
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-089e: Extension gateway + agent tools for draft queue `[x]`

- **Depends on:** JC-089b
- **Files to edit:** `extensions/ted-sidecar/index.ts`
- **What:** Register 5 gateway methods: `ted.drafts.queue`, `ted.drafts.get`, `ted.drafts.edit`, `ted.drafts.approve`, `ted.drafts.execute`. Register 4 agent tools: `ted_draft_queue_list` (read), `ted_draft_approve` (write, confirmation), `ted_draft_edit` (write, confirmation), `ted_draft_execute` (write, confirmation).
- **Done when:** Gateway methods and agent tools registered.
- **Session size:** Large (~1 file, ~150 lines)

#### JC-089f: Draft Queue UI surface `[x]`

- **Depends on:** JC-089e
- **Files to edit:** `ui/src/ui/types.ts`, `ui/src/ui/controllers/ted.ts`, `ui/src/ui/views/ted.ts`, `ui/src/ui/app-render.ts`, `ui/src/ui/app.ts`, `ui/src/ui/app-view-state.ts`
- **What:** Add "Draft Queue" card in Operate tab. Shows pending drafts with: subject, to, related context (deal/meeting), state badge, created time. Actions: "Review" (expand), "Edit" (inline), "Approve" (confirm), "Execute" (send to Outlook). Filters: by state, by profile.
- **Done when:** Draft Queue card renders with data and actions work.
- **Session size:** Large (~6 files, ~200 lines total)

#### JC-089g: MCP tools for draft queue `[x]`

- **Depends on:** JC-089b
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Add 4 MCP tools: `ted_draft_queue_list`, `ted_draft_approve`, `ted_draft_edit`, `ted_draft_execute`. Follow existing MCP tool pattern with `mcpCallInternal()`.
- **Done when:** MCP tools callable via POST /mcp.
- **Session size:** Small (~1 file, ~60 lines)

#### JC-089h: Proof script for draft queue `[x]`

- **Files to write:** `scripts/ted-profile/proof_jc089.sh`
- **What:** Behavioral: generate drafts -> verify in queue (state: drafted) -> edit -> approve -> execute -> verify Outlook draft created (or mock). Full lifecycle proof.
- **Session size:** Small (~1 file, ~60 lines)

---

## Phase 12: Contract Validation Hardening

**Plane(s) affected:** Plane 3 (Contract & Intelligence Fabric)
**Ledgers read:** `policy_ledger`, `trust_ledger`
**Ledgers written:** `trust_ledger`, `event_log`
**Depends on:** JC-088a (trust ledger)

### JC-090: Template-as-Contract Enforcement

#### JC-090a: Full template fallbacks for morning brief + EOD digest `[x]`

- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** In `generateMorningBrief()`: when LLM fails or validation fails completely, generate a structured template narrative (not null) with section stubs for each `must_include` section. Same for `generateEodDigest()`. Both must return `source: "template"` with a valid, structured response -- never null narrative.
- **Done when:** Kill LLM provider config -> GET /reporting/morning-brief returns structured narrative (not null). Same for EOD.
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-090b: Configurable output schemas per route `[x]`

- **Files to write:** `sidecars/ted-engine/config/output_contracts.json`
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Create config file defining per-intent output contracts: required_fields, required_sections, max_length, forbidden_patterns. Refactor `validateLlmOutputContract()` to read from config instead of hardcoded checks. Keep existing behavior as defaults.
- **Done when:** Config file drives validation. Adding a new required section to config causes validation to enforce it.
- **Session size:** Medium (~2 files, ~100 lines)

#### JC-090c: Banned phrases for all intents `[x]`

- **Depends on:** JC-090b
- **Files to edit:** `sidecars/ted-engine/server.mjs`, `sidecars/ted-engine/config/output_contracts.json`
- **What:** Extend banned phrase checking from draft_email-only to all intents (morning_brief, eod_digest, triage_classify, deadline_extract). Read banned phrases from output_contracts.json per intent.
- **Done when:** Banned phrase in morning brief LLM output triggers validation failure + fallback.
- **Session size:** Small (~2 files, ~40 lines)

#### JC-090d: Proof script for contract validation `[x]`

- **Files to write:** `scripts/ted-profile/proof_jc090.sh`
- **What:** Behavioral: disable LLM -> verify morning brief returns template (not null). Verify banned phrase causes fallback. Verify trust_ledger records validation events.
- **Session size:** Small (~1 file, ~50 lines)

---

## Phase 13: State Machine Formalization

**Plane(s) affected:** Plane 2 (Sidecar), Plane 5 (State)
**Ledgers read:** domain ledgers
**Ledgers written:** domain ledgers, `event_log`
**Depends on:** Phase 9 (JC-087a)

### JC-091: Generic State Machine + Domain Lifecycles

#### JC-091a: Generic state machine validator utility `[x]`

- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Extract `isValidStageTransition()` pattern into generic `validateStateTransition(currentState, newState, allowedTransitions)`. `allowedTransitions` is a map: `{ "active": ["completed", "overdue"], "drafted": ["pending_review", "archived"] }`. Returns `{ ok, warning?, reason? }`. Keep existing `isValidDealStageTransition()` as a wrapper.
- **Done when:** Generic validator exists. Deal stages still work via wrapper.
- **Session size:** Small (~1 file, ~40 lines)

#### JC-091b: Commitment lifecycle enrichment `[x]`

- **Depends on:** JC-091a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Add `pending_review` and `escalated` states to commitments. Define allowed transitions: `active -> [completed, overdue, pending_review, escalated]`, `pending_review -> [active, completed]`, `escalated -> [active, completed]`. Use generic validator. Add `POST /commitments/{id}/escalate` endpoint.
- **Done when:** Commitment state transitions enforced. Escalate endpoint works.
- **Session size:** Small (~1 file, ~60 lines)

#### JC-091c: Investor compliance state machine `[x]`

- **Depends on:** JC-091a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Define investor OIG states: `pending`, `checking`, `verified`, `flagged`, `escalated`, `cleared`. Define transitions with validation. Wire into `POST /deals/{deal_id}/investors/add` and new `POST /deals/{deal_id}/investors/{name}/oig-update`. Emit events to event_log.
- **Done when:** Investor OIG status changes validated. Invalid transitions rejected.
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-091d: Facility alert system (new domain) `[x]`

- **Depends on:** JC-091a, JC-087a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** Create `artifacts/facility/alerts.jsonl`. Define states: `monitoring`, `warning`, `crisis`, `resolved`, `archived`. Add endpoints: `POST /facility/alert/create`, `GET /facility/alerts/list`, `POST /facility/alert/{id}/escalate`, `POST /facility/alert/{id}/resolve`. Emit events. Wire into morning brief (if active alerts, include in brief).
- **Done when:** Full alert CRUD with state machine. Active alerts appear in morning brief.
- **Session size:** Large (~1 file, ~180 lines)

#### JC-091e: Extension gateway + agent tools for new state machines `[x]`

- **Depends on:** JC-091b, JC-091c, JC-091d
- **Files to edit:** `extensions/ted-sidecar/index.ts`
- **What:** Register gateway methods for: commitment escalate, investor OIG update, facility alerts (create/list/escalate/resolve). Register agent tools for facility alerts.
- **Done when:** All new endpoints accessible via gateway and agent tools.
- **Session size:** Medium (~1 file, ~100 lines)

#### JC-091f: Proof script for state machines `[x]`

- **Files to write:** `scripts/ted-profile/proof_jc091.sh`
- **What:** Behavioral: create commitment -> try invalid transition -> verify rejected. Create facility alert -> escalate -> resolve -> verify ledger. Update investor OIG -> verify transition enforced.
- **Session size:** Small (~1 file, ~60 lines)

---

## Phase 14: Event Normalization

**Plane(s) affected:** Plane 4 (Connector), Plane 5 (State)
**Ledgers read:** raw signal sources
**Ledgers written:** `event_log`, domain ledgers
**Depends on:** Phase 9 (JC-087a), Phase 10 (JC-088e mail/calendar stubs)

### JC-092: Event Normalization Layer

#### JC-092a: Event type taxonomy + normalizer functions `[x]`

- **Depends on:** JC-087a
- **Files to edit:** `sidecars/ted-engine/server.mjs`, `sidecars/ted-engine/config/event_schema.json`
- **What:** Define formal event type taxonomy in event_schema.json: `mail.received`, `mail.thread.updated`, `calendar.event.created`, `calendar.meeting.ending`, `deal.stage.changed`, `deal.created`, `commitment.created`, `commitment.completed`, `triage.ingested`, `triage.classified`, `draft.created`, `draft.approved`, `draft.executed`, `facility.alert.issued`, `facility.alert.resolved`, `governance.policy.changed`, `ops.paused`, `ops.resumed`. Create normalizer functions: `normalizeMailEvent(rawGraphMail)`, `normalizeCalendarEvent(rawGraphEvent)`, `normalizeDealEvent(dealAction, deal)`.
- **Done when:** Normalizer functions exist. Event schema documents all types with payload schemas.
- **Session size:** Medium (~2 files, ~120 lines)

#### JC-092b: Wire /triage/ingest through normalizer `[x]`

- **Depends on:** JC-092a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** When `/triage/ingest` receives data, normalize into `triage.ingested` event before appending. When classification runs, emit `triage.classified` event. Both go to event_log with proper event_type.
- **Done when:** Triage ingest emits normalized events to event_log.
- **Session size:** Small (~1 file, ~40 lines)

#### JC-092c: Wire deal mutations through normalizer `[x]`

- **Depends on:** JC-092a
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** When `/deals/create` runs, emit `deal.created` normalized event. When `/deals/{id}/update` changes stage, emit `deal.stage.changed`. When deal status changes, emit `deal.status.changed`. Refactor deal writes from JSON snapshots to also append deal events to a `deals_events.jsonl` ledger (keep JSON files for backward compat).
- **Done when:** Deal mutations emit normalized events. Deal event history queryable.
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-092d: Wire Graph mail/calendar through normalizer `[x]`

- **Depends on:** JC-092a, JC-088e
- **Files to edit:** `sidecars/ted-engine/server.mjs`
- **What:** When `/graph/mail/list` fetches mail, emit `mail.fetched` batch event (summary). When draft generation processes a message, emit `mail.processed` event per message. When `/graph/calendar/list` fetches events, emit `calendar.fetched` event. Normalize raw Graph API responses into canonical event payloads.
- **Done when:** Graph operations emit normalized events to mail/calendar ledgers + event_log.
- **Session size:** Medium (~1 file, ~80 lines)

#### JC-092e: Proof script for event normalization `[x]`

- **Files to write:** `scripts/ted-profile/proof_jc092.sh`
- **What:** Behavioral: POST /triage/ingest -> verify event_log has `triage.ingested` event with proper schema. POST /deals/create -> verify `deal.created` event. Verify event_type field present on all new events.
- **Session size:** Small (~1 file, ~50 lines)

---

## Phase 15: Proof Rewrite (Plane B)

**Plane(s) affected:** Plane B (Proof, Observability, and Evals)
**Depends on:** Independent (can start anytime)

### JC-093: Behavioral Proof Migration

#### JC-093a: Identify and rewrite 9 string-presence scripts `[x]`

- **Files to edit:** 9 proof scripts (identified in prior audit)
- **What:** For each banned string-presence script, rewrite to use real HTTP calls (curl POST/GET to sidecar endpoints). Verify response status codes AND response body structure. Remove all `grep -q` string presence checks on source files.
- **Done when:** All 9 scripts use real HTTP calls. Zero `grep` on source code files.
- **Session size:** Large (~9 files, ~300 lines total -- can split across 2-3 sessions)

#### JC-093b: Golden fixtures for briefs/digests `[x]`

- **Files to write:** `sidecars/ted-engine/fixtures/golden_morning_brief.json`, `sidecars/ted-engine/fixtures/golden_eod_digest.json`
- **What:** Create golden fixture files with expected response shapes for morning brief and EOD digest (template mode, no LLM). Create validation script that starts sidecar, hits endpoints, compares response structure against golden fixtures.
- **Done when:** Golden fixtures exist. Validation script passes.
- **Session size:** Medium (~3 files, ~100 lines)

#### JC-093c: Policy simulation tests `[x]`

- **Files to write:** `scripts/ted-profile/proof_policy_simulation.sh`
- **What:** Behavioral tests: (1) Set hard ban -> verify banned action rejected. (2) Set autonomy ladder level -> verify gated action blocked. (3) Set notification budget to 0 -> verify no push notifications.
- **Done when:** All 3 policy simulations pass against running sidecar.
- **Session size:** Small (~1 file, ~60 lines)

---

## Recommended Execution Order (Session Plan)

```
Session 1:  JC-087a (event schema + appendEvent)
Session 2:  JC-087b (separate audit_ledger)
Session 3:  JC-087c (wire existing writes to event_log)
Session 4:  JC-087d (persist ops state)
Session 5:  JC-087e (extension + UI for event log health)
Session 6:  JC-087f (proof script)
            --- Phase 9 COMPLETE ---
Session 7:  JC-088a + JC-088b (trust + policy ledgers)
Session 8:  JC-088c + JC-088d (deep_work + graph_sync ledgers)
Session 9:  JC-088e + JC-088f (mail/calendar stubs + para_index)
Session 10: JC-088g (proof script)
            --- Phase 10 COMPLETE ---
Session 11: JC-089a (draft queue data model)
Session 12: JC-089b (draft queue CRUD)
Session 13: JC-089c (wire draft generation into queue)
Session 14: JC-089d (debrief + follow-up -> queue)
Session 15: JC-089e (extension gateway + agent tools)
Session 16: JC-089f (Draft Queue UI)
Session 17: JC-089g + JC-089h (MCP tools + proof)
            --- Phase 11 COMPLETE ---
Session 18: JC-090a + JC-090b (template fallbacks + output schemas)
Session 19: JC-090c + JC-090d (banned phrases all intents + proof)
            --- Phase 12 COMPLETE ---
Session 20: JC-091a + JC-091b (generic state machine + commitment lifecycle)
Session 21: JC-091c (investor compliance)
Session 22: JC-091d (facility alerts)
Session 23: JC-091e + JC-091f (extension/tools + proof)
            --- Phase 13 COMPLETE ---
Session 24: JC-092a (event taxonomy + normalizers)
Session 25: JC-092b + JC-092c (triage + deal normalization)
Session 26: JC-092d + JC-092e (Graph normalization + proof)
            --- Phase 14 COMPLETE ---
Session 27: JC-093a (rewrite 9 string-presence scripts)
Session 28: JC-093b + JC-093c (golden fixtures + policy simulation)
            --- Phase 15 COMPLETE ---
```

**Total: ~28 sessions, each fitting within context window**
**Total new sub-tasks: 33**
**JC range: JC-087 through JC-093**

---

## Session Protocol (same as file 37)

1. **Read this file first** (`43_ARCHITECTURE_MIGRATION_TASK_BREAKDOWN.md`)
2. **Find your sub-task** by ID (e.g., JC-087a)
3. **Read ONLY the files listed** in that sub-task's description
4. **Follow the pattern references** cited in the sub-task
5. **Mark the sub-task `[x]`** in this file when complete
6. **Do not expand scope** -- if you discover additional work, add a new sub-task entry

This prevents context bloat and ensures each session delivers a clean, verifiable increment.
