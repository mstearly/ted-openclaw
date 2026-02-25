# Builder Lane Task Breakdown — BL-001 through BL-017

**Status:** Ready for execution
**Version:** v1 (Council-reviewed — SDD 57)
**Created:** 2026-02-24
**Source:** `55_TED_CODEX_BUILDER_LANE_PROPOSAL.md`, `56_BUILDER_LANE_IMPLEMENTATION_PLAN.md` (v2), `57_COUNCIL_BUILDER_LANE_CRITICAL_REVIEW.md`
**Planes affected:** Box 2 (Sidecar Kernel), Box 3 (Contract Fabric), Box 5 (State Plane), Plane A (Governance), Plane B (Observability)

---

## Design Constraints for Task Sizing

1. Each sub-task scoped to **1-3 files, ~50-250 lines max**
2. Every sub-task has **testable acceptance criteria**
3. All server.mjs edits in same phase are **sequential** (single agent) to avoid merge conflicts
4. Extension and UI can parallelize with sidecar work

## Current File Sizes (Reference)

| File                                           | Lines                                |
| ---------------------------------------------- | ------------------------------------ |
| `sidecars/ted-engine/server.mjs`               | 12,272                               |
| `extensions/ted-sidecar/index.ts`              | 9,481                                |
| `ui/src/ui/views/ted.ts`                       | 3,803                                |
| `ui/src/ui/controllers/ted.ts`                 | 1,603                                |
| `ui/src/ui/app-render.ts`                      | 1,417                                |
| `ui/src/ui/app-view-state.ts`                  | 600                                  |
| `ui/src/ui/app.ts`                             | 1,074                                |
| `sidecars/ted-engine/config/event_schema.json` | 261 (172 event types, 37 namespaces) |

## Completion Status Key

- `[ ]` Not started
- `[~]` In progress / partial
- `[x]` Complete

---

## Execution Phases

### Dependency Graph

```
Phase 1 (Foundation + Safety)
  BL-001 ──┐
  BL-002 ──┼──→ Phase 2 (Pattern Detection Engine)
  BL-003 ──┤      BL-005 → BL-006 → BL-007
  BL-004 ──┘              │
                           ↓
                    Phase 3 (Extension + UI)
                      BL-008 + BL-009 (parallel)
                      BL-010 + BL-011 + BL-012 (parallel)
                           │
                           ↓
                    Phase 4 (Shadow + Amplification)
                      BL-013 + BL-014 + BL-015 (parallel)
                           │
                           ↓
                    Phase 5 (Cold-Start + Proofs)
                      BL-016 + BL-017 (parallel)
```

---

## Phase 1: Foundation + Safety Fix

**Plane(s) affected:** Box 2 (Sidecar Kernel), Plane A (Governance), Box 5 (State Plane)
**Ledgers written:** `correction_signals.jsonl` (NEW), `style_deltas.jsonl` (NEW)
**Config modified:** `event_schema.json`, `builder_lane_config.json` (NEW), `config_interactions.json` (NEW)

### BL-001: Correction Signal Ledger + Delta Capture Hooks `[ ]`

- **Depends on:** Nothing (foundation task)
- **Files to write/edit:** `sidecars/ted-engine/server.mjs`
- **What:**
  1. Add path constants: `correctionSignalsPath`, `styleDeltasDir`, `styleDeltasPath` + `mkdirSync` calls
  2. Add `editDistance(a, b)` helper — word-level diff, splits on whitespace, counts insertions/deletions, returns 0.0-1.0
  3. Verify `draft_queue.jsonl` captures `original_content` on edit (search for draft edit handler). If missing, add capture.
  4. Verify `triage.jsonl` captures `operator_override` on reclassify. If missing, add capture.
  5. Verify `commitments.jsonl` captures `operator_corrected` on edit. If missing, add capture.
  6. Add signal capture hooks to existing handlers:
     - **Draft edit handler:** append to `correction_signals.jsonl`: `{ signal_type: 'edit', domain: 'draft_email', magnitude: editDistance(original, edited), latency_ms, section_affected, context_bucket: { recipient_type, task_type, thread_context }, timestamp }`
     - **Draft send handler (execute):** if sent without edit → append `{ signal_type: 'accept_verbatim', domain: 'draft_email', magnitude: 0.0, ... }`
     - **Draft archive handler:** append `{ signal_type: 'reject', domain: 'draft_email', magnitude: 1.0, ... }`
     - **Triage reclassify handler:** append `{ signal_type: 'reclassify', domain: 'triage', ... }`
     - **Commitment edit handler:** append `{ signal_type: 'override', domain: 'commitment', ... }`
  7. On draft edit, also append delta to `style_deltas.jsonl`: `{ original, edited, recipient_type, task_type, thread_context, magnitude, timestamp }`
- **Done when:**
  - `correction_signals.jsonl` captures edits, accepts, rejects, reclassifications, overrides
  - `editDistance("hello world", "hello there world")` returns ~0.33
  - Draft sent without edit records `signal_type: 'accept_verbatim'`
  - Draft archived records `signal_type: 'reject'` with `magnitude: 1.0`
- **Session size:** Medium (~1 file, ~140 lines)
- **Key patterns to follow:** Same as existing `appendJsonlLine()` calls throughout server.mjs. Search for `draftQueueExecute` for the send handler, `draftQueueEdit` for edit handler.

### BL-002: Safety Boundary Fix + Constitution Check + Config Interactions `[ ]`

- **Depends on:** Nothing (foundation task, can parallel with BL-001)
- **Files to write/edit:** `sidecars/ted-engine/server.mjs`, `sidecars/ted-engine/config/config_interactions.json` (NEW)
- **What:**
  1. In `applyImprovementProposal()` (~line 9551): REMOVE `hard_bans` and `autonomy_ladder` from `allowedConfigs`. ADD `draft_style` and `brief_config` with proper paths.
  2. Add `validateProposalAgainstConstitution(proposal)` function:
     - Load `hard_bans.json`
     - Verify no proposed change contradicts any ban
     - `words_to_avoid` entries can only be ADDED, never removed
     - Urgency thresholds cannot drop below minimum floor
     - If validation fails → return `{ valid: false, reason: 'blocked_by_constitution', details }` → proposal logged as `blocked_by_constitution`, never surfaces to operator
  3. Call `validateProposalAgainstConstitution()` in both `createImprovementProposal()` and `generatePatternProposal()` (Phase 2) before storing proposal
  4. Create `config_interactions.json`:
     ```json
     {
       "urgency_rules": ["triage", "morning_brief", "escalation"],
       "draft_style": ["draft_email", "eod_digest", "isaac_nightly_report"],
       "brief_config": ["morning_brief", "eod_digest"],
       "style_guide": ["draft_email", "meeting_prep"],
       "output_contracts": ["all_llm_intents"]
     }
     ```
  5. In `applyImprovementProposal()`: before applying, check for other pending proposals that modify overlapping config dimensions (query improvement ledger). If found, surface warning in response.
  6. On apply, include `affected_routes` from `config_interactions.json` in the response so UI can display downstream impact.
- **Done when:**
  - `POST /improvement/proposals/.../apply` with `config_file: "hard_bans"` returns 400
  - `POST /improvement/proposals/.../apply` with `config_file: "draft_style"` succeeds
  - Constitution check blocks a proposal that tries to remove a `words_to_avoid` entry
  - Response includes `affected_routes: ["triage", "morning_brief", "escalation"]` when urgency_rules modified
- **Session size:** Medium (~2 files, ~60 lines)
- **Key patterns to follow:** Search for `allowedConfigs` in `applyImprovementProposal()` around line 9551.

### BL-003: Event Types + Config Snapshot Infrastructure `[ ]`

- **Depends on:** Nothing (foundation task, can parallel with BL-001/002)
- **Files to write/edit:** `sidecars/ted-engine/config/event_schema.json`, `sidecars/ted-engine/server.mjs`
- **What:**
  1. Add 10 new event types to `event_schema.json` under `improvement` namespace:
     - `improvement.pattern.detected`
     - `improvement.proposal.generated_from_pattern`
     - `improvement.proposal.reverted`
     - `improvement.proposal.blocked_by_constitution`
     - `improvement.config.snapshot`
     - `improvement.shadow.started`
     - `improvement.shadow.completed`
     - `improvement.correction.amplified`
     - `improvement.fatigue.suspected`
     - `improvement.calibration.response`
  2. Add `configSnapshotsDir` path constant + `mkdirSync` in server.mjs
  3. Add `snapshotConfig(configFile, proposalId)` helper — reads config file, writes full contents to `config_snapshots/{configFile}_{proposalId}_{timestamp}.json`, appends event
  4. Add snapshot call inside `applyImprovementProposal()` BEFORE writing config: `await snapshotConfig(changeSpec.config_file, proposalId)`
- **Done when:**
  - `event_schema.json` has 182 event types (172 + 10)
  - Config snapshot file created in `config_snapshots/` dir before any config write
  - `improvement.config.snapshot` event logged on snapshot creation
- **Session size:** Small (~2 files, ~45 lines)
- **Key patterns to follow:** Existing event type blocks in `event_schema.json`. Existing `mkdirSync` calls at top of server.mjs.

### BL-004: Builder Lane Config File `[ ]`

- **Depends on:** Nothing (foundation task)
- **Files to write/edit:** `sidecars/ted-engine/config/builder_lane_config.json` (NEW)
- **What:** Create config file with phased thresholds, fatigue detection params, rubber-stamping params, calibration settings, cold-start archetypes, time-decay config. See SDD 56 v2 Phase 1 BL-004 for full schema.
- **Done when:** File exists, valid JSON, all sections present
- **Session size:** Small (~1 file, ~50 lines)

---

## Phase 2: Pattern Detection Engine

**Plane(s) affected:** Box 2 (Sidecar Kernel), Box 3 (Contract Fabric)
**Ledgers read:** `correction_signals.jsonl`, `style_deltas.jsonl`, `draft_queue.jsonl`, `triage.jsonl`, `commitments.jsonl`, `pending_delivery.jsonl`, `improvement_proposals.jsonl`
**Ledgers written:** `builder_lane_status.jsonl` (NEW), `improvement_proposals.jsonl`

### BL-005: Pattern Detection + Confidence Accumulator + Fatigue Monitor `[ ]`

- **Depends on:** BL-001 (correction signal ledger must exist)
- **Files to write/edit:** `sidecars/ted-engine/server.mjs`
- **What:**
  1. Add `builderLaneStatusPath` constant + `mkdirSync`
  2. Implement `detectCorrectionPatterns()`:
     - Read `correction_signals.jsonl` (primary source — all signal types)
     - Also read `style_deltas.jsonl`, `draft_queue.jsonl`, `triage.jsonl`, `commitments.jsonl`, `pending_delivery.jsonl` for supplementary evidence
     - Group by `(signal_type, domain, context_bucket)`
     - Apply exponential time-decay: `weight = Math.exp(-daysSince / halfLifeDays)` — configurable from `builder_lane_config.json`
     - Detect contradiction: when recent corrections (14d) contradict older ones on same dimension, flag `drift_detected: true`
     - Return `[{ type, signal, evidence[], target_config, context_bucket, correction_count, weighted_count, sessions_count, consistency_rate, phase, drift_detected }]`
     - Apply phased thresholds from config: only return patterns meeting their phase's minimum
  3. Implement confidence accumulator:
     - Per-dimension tracking: `{ dimension, consecutive_accepts, last_correction_at, confidence }`
     - On `accept_verbatim` signal: increment `consecutive_accepts`, raise `confidence` via logistic curve `1 / (1 + Math.exp(-0.1 * (accepts - 20)))` (reaches 0.88 at 40 accepts, 0.95 at 50)
     - On `edit` signal: reset `consecutive_accepts` to 0, drop confidence proportional to magnitude
     - Natural decay: `confidence *= Math.exp(-daysSinceLastSignal / 90)` (90-day half-life without data)
     - When confidence > 0.90: dimension excluded from proposal generation
     - Store in `builder_lane_status.jsonl`
  4. Implement correction fatigue monitor:
     - Compute `correction_rate_7d` per domain from `correction_signals.jsonl`
     - Compute `correction_rate_delta` vs prior 7-day window
     - Three states: `healthy_learning` (rate stable AND trust failures declining), `suspected_fatigue` (rate drops >50% but trust failures constant/rising), `confirmed_improvement` (both rates declining)
     - When `suspected_fatigue` detected: append event `improvement.fatigue.suspected`, flag in status
- **Done when:**
  - `detectCorrectionPatterns()` returns patterns grouped by context bucket with time-decay weighting
  - Confidence accumulator tracks per-dimension: 50 consecutive accepts → confidence ~0.95
  - Fatigue monitor distinguishes "getting better" from "gave up correcting"
  - Patterns below phase threshold are suppressed
- **Session size:** Large (~1 file, ~220 lines)
- **Key patterns to follow:** Existing `readJsonlLines()` aggregation in `failureAggregation()`, `reconcile()`.

### BL-006: Proposal Generation + Validation + Rubber-Stamping Detection `[ ]`

- **Depends on:** BL-005 (needs `detectCorrectionPatterns()`)
- **Files to write/edit:** `sidecars/ted-engine/server.mjs`
- **What:**
  1. Implement `generatePatternProposal(pattern)`:
     - Build context-aware prompt with current config + time-decay-weighted correction evidence + context bucket
     - Call `routeLlmCall()` with `improvement_proposal` intent
     - Parse structured response: `{ description, config_file, changes: [{ path, current_value, proposed_value }], expected_impact, confidence }`
     - Run validation pipeline:
       a. `config_file` in allowed list
       b. JSON paths exist in current config
       c. Type safety
       d. `validateProposalAgainstConstitution()` (from BL-002)
       e. Check `config_interactions.json` for overlapping pending proposals
       f. Confidence >= 0.80 threshold
     - If validation passes: create proposal via existing `createImprovementProposal()` with `source: 'pattern_detection'`
     - If fails: log reason, do not surface
  2. Rubber-stamping detection (modify existing `reviewImprovementProposal()`):
     - Track `time_to_decision` = time between proposal creation and review
     - Maintain rolling stats in `builder_lane_status.jsonl`: `recent_approval_rate`, `avg_decision_time_ms`, `consecutive_fast_approval_days`
     - If `approval_rate > 0.95 AND avg_decision_time < 30000ms AND consecutive_days >= 14` → append `improvement.rubber_stamping.suspected` event, set flag in status
- **Done when:**
  - Pattern-generated proposal passes 6-step validation pipeline
  - Constitution-violating proposal is blocked before reaching operator
  - Rubber-stamping flag triggers after 14 days of >95% fast approvals
- **Session size:** Medium (~1 file, ~160 lines)
- **Key patterns to follow:** Existing `generateImprovementProposal()` at line ~9589 for LLM call pattern. Existing `createImprovementProposal()` for proposal record format.

### BL-007: Route Handlers + Scheduler + Improvement Metrics `[ ]`

- **Depends on:** BL-005, BL-006
- **Files to write/edit:** `sidecars/ted-engine/server.mjs`
- **What:**
  1. New routes:
     - `GET /ops/builder-lane/patterns` — calls `detectCorrectionPatterns()`, returns patterns with phase info
     - `POST /ops/builder-lane/generate` — calls `generatePatternProposal()` for a specific pattern type + context bucket
     - `POST /ops/builder-lane/revert/{proposalId}` — `revertImprovement(proposalId)`: reads snapshot from `config_snapshots/`, writes back to config file, logs event `improvement.proposal.reverted`
     - `GET /ops/builder-lane/status` — returns: correction counts, current phase per dimension, confidence scores, fatigue state, rubber-stamping flag, active proposals, recently applied/reverted
     - `GET /ops/builder-lane/improvement-metrics` — returns:
       - `correction_rate_trend`: weekly buckets for last 30 days
       - `draft_acceptance_rate`: { current_week, last_week, last_month }
       - `proposals_applied_count`: cumulative
       - `monthly_summary`: auto-generated natural-language sentence
       - `config_change_markers`: applied proposal timestamps
       - `progress_by_dimension`: corrections remaining to reach next phase per dimension
     - `POST /ops/builder-lane/calibration-response` — records calibration prompt response in `correction_signals.jsonl` with `signal_type: 'calibration_response'` and 3-5x weight multiplier
  2. Scheduler integration:
     - Load `builder_lane_config.json` on startup
     - Add `builder_lane_scan` job: cron `0 3 * * 0` (Sunday 3 AM)
     - Handler: `detectCorrectionPatterns()` → for each pattern at `proposal` phase or above, call `generatePatternProposal()`. Rate limit: max 3 per scan.
  3. Add all new routes to `executionBoundaryPolicy` and `normalizeRoutePolicyKey`
- **Done when:**
  - All 6 routes return expected shapes
  - `revertImprovement()` restores config from snapshot file
  - `improvement-metrics` returns correction rate trend with weekly buckets
  - Scheduler fires `builder_lane_scan` on Sunday 3 AM cron
  - All routes in execution boundary policy
- **Session size:** Large (~1 file, ~240 lines)
- **Key patterns to follow:** Existing route registration pattern (search for `parsedUrl.pathname ===`). Existing scheduler job registration in `_schedulerTickInner()`. Existing `normalizeRoutePolicyKey` entries.

---

## Phase 3: Extension + UI

**Plane(s) affected:** Box 1 (Experience), Box 2 (Sidecar), Box 5 (State)
**Ledgers read:** Via gateway methods → sidecar routes

### BL-008: Extension Gateway Methods `[ ]`

- **Depends on:** BL-007 (sidecar routes must exist)
- **Files to write/edit:** `extensions/ted-sidecar/index.ts`
- **What:** Register 6 gateway methods:
  1. `ted.builder_lane.patterns` — `GET /ops/builder-lane/patterns`
  2. `ted.builder_lane.generate` — `POST /ops/builder-lane/generate` with `{ pattern_type, context_bucket }`
  3. `ted.builder_lane.revert` — `POST /ops/builder-lane/revert/{proposalId}`
  4. `ted.builder_lane.status` — `GET /ops/builder-lane/status`
  5. `ted.builder_lane.improvement_metrics` — `GET /ops/builder-lane/improvement-metrics`
  6. `ted.builder_lane.calibration_response` — `POST /ops/builder-lane/calibration-response`
- **Done when:** All 6 gateway methods registered, follow `callAuthenticatedTedRoute` / `callAuthenticatedTedGetRoute` pattern
- **Session size:** Medium (~1 file, ~130 lines)
- **Key patterns to follow:** Existing gateway methods — search for `api.registerGatewayMethod(` in index.ts. Use `{ params, respond }` destructuring.

### BL-009: Extension Agent Tools `[ ]`

- **Depends on:** BL-007 (sidecar routes must exist)
- **Files to write/edit:** `extensions/ted-sidecar/index.ts`, `sidecars/ted-engine/config/ted_agent.json`
- **What:**
  1. Register 3 agent tools:
     - `ted_builder_lane_status` — read tool, calls `ted.builder_lane.status` gateway
     - `ted_builder_lane_metrics` — read tool, calls `ted.builder_lane.improvement_metrics` gateway
     - `ted_builder_lane_revert` — write tool, calls `ted.builder_lane.revert` gateway
  2. Add `ted_builder_lane_revert` to `TED_WRITE_TOOLS_SET` and `REQUIRES_OPERATOR_CONFIRMATION`
  3. Update `ted_agent.json` alsoAllow: add all 3 tools
- **Done when:** 3 tools registered, revert requires operator confirmation, alsoAllow updated
- **Session size:** Medium (~2 files, ~100 lines)
- **Key patterns to follow:** Existing tool registration — search for `api.registerTool(` in index.ts. Match `ted_improvement_proposals` tool pattern.

### BL-010: UI State + Controllers `[ ]`

- **Depends on:** BL-008 (gateway methods must exist)
- **Files to write/edit:** `ui/src/ui/controllers/ted.ts`, `ui/src/ui/app-view-state.ts`, `ui/src/ui/app.ts`
- **What:**
  1. Add to `TedWorkbenchState` type: `builderLanePatterns`, `builderLanePatternsLoading`, `builderLanePatternsError`, `builderLaneStatus`, `builderLaneStatusLoading`, `builderLaneRevertBusy`, `builderLaneRevertResult`, `builderLaneRevertError`, `builderLaneGenerateBusy`, `builderLaneMetrics`, `builderLaneMetricsLoading`, `builderLaneCalibrationBusy`
  2. Add `@state()` decorators in `app.ts` for all new fields
  3. Add to `TedAppViewState` interface in `app-view-state.ts`
  4. Add 6 controller functions in `controllers/ted.ts`:
     - `loadBuilderLanePatterns(app)` — guard → loading → gateway call → result/error → finally
     - `loadBuilderLaneStatus(app)` — same pattern
     - `loadBuilderLaneMetrics(app)` — same pattern
     - `generateFromPattern(app, patternType, contextBucket)` — POST → result/error
     - `revertAppliedProposal(app, proposalId)` — POST → result/error
     - `submitCalibrationResponse(app, promptId, response)` — POST → result/error
- **Done when:** All state fields typed, all controllers follow standard guard pattern, `requestTedWithTimeout` used for all gateway calls
- **Session size:** Medium (~3 files, ~135 lines)
- **Key patterns to follow:** Existing controller functions in `controllers/ted.ts` — all follow the guard on `client/connected/loading` pattern.

### BL-011: UI Card Enhancement + Improvement Dashboard `[ ]`

- **Depends on:** BL-010 (state + controllers must exist)
- **Files to write/edit:** `ui/src/ui/views/ted.ts`, `ui/src/ui/app-render.ts`, `ui/src/ui/types.ts`
- **What:**
  1. Add TypeScript types in `types.ts`: `TedBuilderLanePattern`, `TedBuilderLaneStatus`, `TedBuilderLaneMetrics`, `TedCalibrationPrompt`
  2. Add ~18 new props to `TedViewProps` in `views/ted.ts`
  3. Wire all new props in `app-render.ts` → `renderTed()` call
  4. Enhance existing Improvement Proposals card:
     - Phase indicator: "Builder Lane: Observation phase (12 corrections, need 25 for proposals)"
     - Evidence summary per proposal: "Based on 8 draft corrections over 30 days..."
     - Before/After preview for config changes
     - Undo button on applied proposals
     - Category tags: Voice, Triage, Extraction, Scheduling, Brief
     - Downstream impact notice: "This change will affect: triage, morning brief"
     - Fatigue indicator (when suspected_fatigue): banner message
     - Rubber-stamping notice (when triggered): banner message
     - Drift confirmation prompt: "Your recent corrections suggest a preference change. [Yes, I changed] [No, one-off]"
  5. NEW: "Improvement Dashboard" card:
     - Correction rate trend (text-based: "▁▂▃▅▇▆▃▂▁" or simple table)
     - Draft acceptance rate: "81% this month (up from 62%)"
     - Config changes applied: count + list
     - Monthly summary: natural-language sentence
     - Progress by dimension: "Draft voice: 18/25 corrections to Proposal phase"
     - Config change markers: "P-042 applied Feb 12 → corrections dropped 8/day → 3/day"
- **Done when:**
  - Enhancement card shows phase indicator, evidence, before/after, undo, category tags
  - Improvement Dashboard card shows trend, acceptance rate, progress
  - Fatigue/rubber-stamping/drift banners render when flagged
  - All props wired in app-render.ts
- **Session size:** Large (~3 files, ~310 lines: ~260 views + ~50 app-render)
- **Key patterns to follow:** Existing card pattern in views/ted.ts — search for `renderTedXxxCard`. Use `html\`\`` template literals with conditional rendering.

### BL-012: Proactive Calibration Integration `[ ]`

- **Depends on:** BL-001 (correction signals ledger), BL-007 (calibration-response route)
- **Files to write/edit:** `sidecars/ted-engine/server.mjs`
- **What:**
  1. Post-meeting debrief: In `meetingDebrief` handler, after storing commitments, add `calibration_prompt` to response: `{ prompt_id, question: "I identified N commitments. Did I get them right?", type: "post_meeting" }`
  2. Post-draft send (with edits): In `draftQueueExecute` handler, if operator edited before sending, add `calibration_prompt`: `{ prompt_id, question: "You changed the tone for [recipient]. Remember this for future drafts?", type: "post_draft_send" }`
  3. EOD digest: In `eodDigest` handler, add `calibration_section` with 3 key outputs for thumbs-up/down
  4. Load `builder_lane_config.json` calibration settings (max_prompts_per_day, enabled_moments)
  5. Track daily prompt count, respect limit. Respect quiet hours.
  6. Calibration responses (via existing BL-007 route) recorded with `signal_type: 'calibration_response'` and 3x weight multiplier
- **Done when:**
  - Meeting debrief response includes calibration prompt
  - Draft execute response includes calibration prompt (only when edited)
  - EOD digest includes calibration section
  - Max 3 prompts per day enforced
  - Calibration responses stored with 3x weight
- **Session size:** Small-Medium (~1 file, ~60 lines)
- **Key patterns to follow:** Search for `meetingDebrief` handler, `draftQueueExecute` handler, `eodDigest` handler.

---

## Phase 4: Shadow Mode + Amplification + Attribution

**Plane(s) affected:** Box 2 (Sidecar Kernel), Plane B (Observability)
**Ledgers written:** `shadow_eval.jsonl` (NEW)

### BL-013: Shadow Mode Engine `[ ]`

- **Depends on:** BL-007 (routes infrastructure)
- **Files to write/edit:** `sidecars/ted-engine/server.mjs`
- **What:**
  1. Add `shadowEvalPath` constant + `mkdirSync`
  2. `startShadowRun(proposalId, req, res, route)`:
     - Read proposal's `change_spec`
     - Create shadow config copy in memory (don't write to production config file)
     - Mark proposal as `status: 'shadowing'` in improvement ledger
     - Set shadow expiry: 7 days from start
     - Append event `improvement.shadow.started`
  3. Shadow evaluation hooks — in relevant action handlers (triage, draft gen):
     - Check if any shadow run is active for the relevant config
     - If yes: run action logic with BOTH production config and shadow config
     - Log shadow result to `shadow_eval.jsonl`: `{ proposal_id, action_type, production_output, shadow_output, delta, timestamp }`
     - NEVER serve shadow output to operator — production only
  4. `completeShadowRun(proposalId)`:
     - Read `shadow_eval.jsonl` entries for this proposal
     - Generate impact summary: items differed, items matched corrections, items diverged
     - Append event `improvement.shadow.completed`
  5. Routes:
     - `POST /ops/builder-lane/shadow/{proposalId}` → `startShadowRun()`
     - `GET /ops/builder-lane/shadow/{proposalId}` → returns shadow results with layered summary
  6. Shadow kill switch: if `_shadowPaused` flag is set, skip shadow hooks
- **Done when:**
  - Shadow run starts, records both configs' outputs for 7 days
  - Shadow outputs NEVER served to operator
  - Impact summary shows items changed, improvement rate
  - Kill switch pauses shadow without affecting production
- **Session size:** Medium-Large (~1 file, ~180 lines)

### BL-014: Correction Amplification + Rule Promotion `[ ]`

- **Depends on:** BL-001 (correction signals)
- **Files to write/edit:** `sidecars/ted-engine/server.mjs`
- **What:**
  1. On correction signal capture (BL-001 hooks), check for N similar items in same context bucket:
     - Query relevant ledger (draft_queue, triage, etc.) for items with matching `context_bucket`
     - If found, return `amplification_candidates` in the handler response
  2. New route: `POST /ops/builder-lane/amplify` — applies same correction to multiple items by ID
     - Validates all items exist and are in correctable state
     - Applies correction, appends events `improvement.correction.amplified`
  3. Correction-to-rule promotion:
     - In `detectCorrectionPatterns()` (BL-005): when same correction type repeated 3+ times in same context bucket, include `rule_promotion_available: true` in pattern
     - Promotion creates a permanent style rule in `draft_style.json` or `style_guide.json` via existing config update pathway
- **Done when:**
  - Draft correction returns `amplification_candidates` when similar items exist
  - `/amplify` applies correction to multiple items in one call
  - 3+ identical corrections → rule promotion offered
- **Session size:** Small-Medium (~1 file, ~90 lines)

### BL-015: Change Attribution Tags `[ ]`

- **Depends on:** BL-007 (builder lane status)
- **Files to write/edit:** `sidecars/ted-engine/server.mjs`
- **What:**
  1. In action handlers influenced by config (draft generation, triage classification):
     - Check if any config change was applied in last 30 days that affects this action's config
     - If yes, include `attribution` in response: `{ proposal_id, basis, confidence, applied_at }`
  2. Contradiction detection: if operator corrects an action that has attribution, automatically flag the config change for review
     - Append to correction signal with `attributed_proposal_id` field
     - In `detectCorrectionPatterns()`: attributted corrections get 2x weight (direct signal of config regression)
  3. Temporal decay: attribution only included if config change is <30 days old
- **Done when:**
  - Draft generation includes attribution when influenced by recent config change
  - Correction of attributed action flags the config change
  - Attribution tags expire after 30 days
- **Session size:** Small (~1 file, ~50 lines)

---

## Phase 5: Cold-Start Acceleration + Proofs

**Plane(s) affected:** Box 2 (Sidecar), Box 4 (Connector — Graph API for sent emails)
**Config modified:** `draft_style.json` (voice_training patterns), `output_contracts.json` (voice_extract intent)

### BL-016: Archetype Selection + Voice Extraction `[ ]`

- **Depends on:** BL-004 (builder_lane_config.json with archetypes)
- **Files to write/edit:** `sidecars/ted-engine/server.mjs`, `sidecars/ted-engine/config/output_contracts.json`
- **What:**
  1. New route: `POST /ops/onboarding/archetype-select`
     - Accepts `{ archetype: "direct_dealmaker" | "thorough_analyst" | "relationship_builder" }`
     - Reads archetype config from `builder_lane_config.json`
     - Updates `draft_style.json`: sets `preferred_tone`, `style_rules.business` from archetype values
     - Appends event `improvement.archetype.selected`
     - Returns updated draft style
  2. New route: `POST /ops/onboarding/voice-extract`
     - Reads 30-50 sent emails from `sentitems` via Graph API (reuse `fetchUnreadMailInternal` pattern but for sent folder)
     - Groups by recipient domain / audience category
     - Calls LLM with `voice_extract` intent: analyze sent emails, extract per-audience patterns
     - Extracts: greeting_style, closing_style, sentence_length_avg, formality_gradient, paragraph_structure, action_item_format per audience
     - Writes extracted patterns to `draft_style.json` → `voice_training.extracted_patterns`
     - Appends event `improvement.voice.extracted`
  3. New route: `GET /ops/onboarding/voice-extract-status` — returns extraction progress + discovered patterns
  4. Add `voice_extract` output contract to `output_contracts.json`
  5. Add new routes to execution boundary policy and normalizeRoutePolicyKey
- **Done when:**
  - Archetype selection updates draft_style.json immediately
  - Voice extraction reads sentitems, runs LLM, populates voice_training.extracted_patterns
  - Status route shows extraction progress
- **Session size:** Medium (~2 files, ~100 lines)
- **Key patterns to follow:** Existing `runDiscoveryPipeline()` for Graph API sent email scanning pattern.

### BL-017: Proof Scripts `[ ]`

- **Depends on:** All previous tasks
- **Files to write/edit:** `scripts/ted-profile/proof_builder_lane.sh` (NEW)
- **What:** 12 behavioral HTTP tests:
  1. `GET /ops/builder-lane/status` → 200, has `phases`, `confidence_scores`, `fatigue_state`
  2. `GET /ops/builder-lane/patterns` → 200, has `patterns` array
  3. `POST /ops/builder-lane/generate` → creates proposal from pattern
  4. `POST /ops/builder-lane/revert/{id}` → reverts applied proposal, config restored
  5. Verify config snapshot file created in `config_snapshots/` before apply
  6. Verify `hard_bans` and `autonomy_ladder` REJECTED from allowedConfigs (400 response)
  7. Verify phased thresholds suppress patterns below minimum correction count
  8. `GET /ops/builder-lane/shadow/{id}` → returns shadow results
  9. `GET /ops/builder-lane/improvement-metrics` → 200, has `correction_rate_trend`, `draft_acceptance_rate`
  10. Verify constitution check blocks proposal contradicting hard_bans
  11. `POST /ops/onboarding/archetype-select` → updates draft_style.json
  12. `POST /ops/builder-lane/calibration-response` → records signal in correction_signals.jsonl
- **Done when:** All 12 tests pass, `bash -n` validates script syntax
- **Session size:** Medium (~1 file, ~200 lines)
- **Key patterns to follow:** Existing proof scripts — search for `proof_jc` in `scripts/ted-profile/`. Use `curl -s`, `jq`, pass/fail counters.

---

## Verification Checklist (Post-Execution)

```bash
# Syntax checks
node --check sidecars/ted-engine/server.mjs
bash -n scripts/ted-profile/proof_builder_lane.sh

# Count verification
# server.mjs: ~12,272 + ~1,110 = ~13,382
# index.ts: ~9,481 + ~230 = ~9,711
# views/ted.ts: ~3,803 + ~260 = ~4,063
# event_schema.json: 172 + 10 = 182 event types
```

---

_17 sub-tasks across 5 phases. Execution-ready. All dependencies verified. All acceptance criteria testable._
