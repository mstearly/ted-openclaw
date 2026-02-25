# SDD 56 — Builder Lane Implementation Plan (v2 — Council-Reviewed)

**Generated:** 2026-02-24
**Status:** READY FOR REVIEW (v2 — updated with Council Critical Review findings from SDD 57)
**Implements:** SDD 55 (TED Codex Builder Lane — Corrected & Grounded)
**Council review:** SDD 57 — 4 research agents, 80+ sources, 10/10 seats approved with additions
**Scope:** Track 1 only — Ted self-tunes config on Clint's Mac via existing LLM pipeline
**Estimated scope:** ~1,565 lines across the stack (19 sub-tasks, 5 phases)

---

## Council Expertise Validation

Before designing, each council seat confirmed they have the domain knowledge to design their portion. Claims that lack grounding are flagged.

| Seat                   | Domain                                                                                               | Expertise Claim | Grounded?                                                                                                                                                                                                                                                            | Evidence |
| ---------------------- | ---------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **1 — Architecture**   | Pattern detection engine, config snapshot, scheduler integration                                     | YES             | Designed all existing JSONL ledger patterns, scheduler tick, improvement proposal pipeline. This is the same append-only → read → aggregate → act pattern already in server.mjs.                                                                                     |
| **2 — Security**       | Safety boundaries, allowed config list, config-never-modify set, constitution check                  | YES             | Designed execution boundary policy, approval gates, `REQUIRES_OPERATOR_CONFIRMATION` set. Config protection is the same pattern — a static allowlist enforced in code. Constitution check follows same hard_bans validation pattern.                                 |
| **3 — UX**             | Enhanced improvement card, evidence preview, undo button, shadow mode display, improvement dashboard | YES             | Designed all 24 existing operator surface cards in views/ted.ts. Same Lit HTML + controller + prop pattern. Shadow mode display and improvement dashboard are new cards but use existing infrastructure.                                                             |
| **4 — Behavioral**     | Phased thresholds, correction fatigue detection, preference drift, calibration timing                | PARTIAL         | Research validated the 5-phase model against production systems (Grammarly, Gmail, Copilot, Pep 2026). Fatigue detection and drift patterns validated by ACM Computing Surveys (2024) and arXiv (Feb 2025). Thresholds are config-driven — can be tuned post-launch. |
| **5 — Data Privacy**   | Delta storage, correction signal ledger, PII in correction data                                      | YES             | All existing JSONL ledgers follow the same append-only local-storage pattern. Style deltas and correction signals contain the same data already in draft_queue.jsonl. No new privacy surface.                                                                        |
| **6 — Product**        | Correction amplification UX, proposal batching in briefs, cold-start archetypes                      | PARTIAL         | Morning brief integration uses existing scheduler dispatch pattern. Correction amplification borrows from Grammarly's "apply to all" (validated by research). Archetype selection is new UX concept — ship as setup step, iterate.                                   |
| **7 — Testing**        | Shadow mode validation, before/after comparison                                                      | YES             | Shadow mode is functionally identical to our existing reconciliation drift detection (compare two states, present diff). Proof scripts follow established behavioral HTTP test pattern.                                                                              |
| **8 — Ops**            | Scheduler weekly trigger, cost model, storage                                                        | YES             | Scheduler tick already dispatches morning_brief, eod_digest, etc. Adding a weekly pattern detection tick is trivial. Cost model: one LLM call per detected pattern per week — negligible vs daily brief/triage calls.                                                |
| **9 — Healthcare M&A** | Per-entity correction bucketing, deal-specific style rules                                           | YES             | Entity isolation already enforced throughout the stack (HIPAA boundary). Per-entity bucketing follows the same `from_profile` / entity routing pattern.                                                                                                              |
| **10 — Clinical PHI**  | HIPAA-safe correction storage, PHI-adjacent classification changes                                   | YES             | Correction deltas from Everest emails could contain PHI fragments. Same exposure as existing `draft_queue.jsonl` and `ingestion.jsonl`. Shadow mode for Everest triage changes is the right safeguard.                                                               |

**Expertise Gap Summary:** 2 seats (4, 6) have PARTIAL grounding. Mitigation: ship threshold values as config (tunable), ship amplification and archetypes as opt-in. All will be validated in production against Clint's actual usage patterns.

---

## Pre-Existing Infrastructure Inventory

**What already exists (no build needed):**

| Component                                | Location                  | What It Does                                                              |
| ---------------------------------------- | ------------------------- | ------------------------------------------------------------------------- |
| `improvementLedgerPath`                  | server.mjs:~100           | JSONL storage for improvement proposals                                   |
| `createImprovementProposal()`            | server.mjs:9466           | Manual proposal creation                                                  |
| `reviewImprovementProposal()`            | server.mjs:9494           | Approve/reject proposals                                                  |
| `applyImprovementProposal()`             | server.mjs:9520           | Config application (contract_update, config_update)                       |
| `generateImprovementProposal()`          | server.mjs:9589           | LLM-driven generation from trust failures                                 |
| `listImprovementProposals()`             | server.mjs:~9445          | List proposals with status filter                                         |
| `failureAggregation()`                   | server.mjs:~9680          | Aggregate trust failures by intent                                        |
| Improvement Proposals UI card            | views/ted.ts:~649         | List, create, generate, review                                            |
| 7 gateway methods                        | index.ts:5259-5422        | `ted.improvement.proposals.*`, `ted.improvement.failure_aggregation`      |
| 5 agent tools                            | index.ts:8887-9130        | `ted_improvement_proposals`, `_propose`, `_review`, `_apply`, `_generate` |
| `improvement_proposal` output contract   | output_contracts.json:32  | Required sections, golden fixture                                         |
| 6 improvement event types                | event_schema.json:200-207 | Full lifecycle events                                                     |
| Scheduler tick infrastructure            | server.mjs:10926          | `schedulerTick()` with `mcpCallInternal()` dispatch                       |
| `selectLlmProvider()` / `routeLlmCall()` | server.mjs:~3700          | LLM routing with entity/intent selection                                  |
| `readJsonlLines()` / `appendJsonlLine()` | server.mjs:~180           | JSONL read/write helpers                                                  |
| Stale proposal flagging                  | server.mjs:~9460          | `_stale` + `_days_old` on proposals >14 days                              |
| Discovery pipeline (sent email scan)     | server.mjs:~5240          | Scans sentitems folder via Graph API                                      |

**What needs to be BUILT (updated with council findings):**

| Component                          | Why It's New                                                                                                              | Source                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Correction signal ledger**       | Captures ALL operator signals: edit, accept, reject, reclassify, override — with edit distance, latency, section affected | Council GAP 1 (HIGH)                 |
| `detectCorrectionPatterns()`       | Pattern detection from correction ledgers — the flywheel input                                                            | Original plan                        |
| `style_deltas.jsonl`               | Delta capture: original content vs operator-edited content, bucketed by context                                           | Original plan                        |
| Context bucketing                  | Corrections grouped by recipient_type × task_type × thread_context                                                        | Original plan                        |
| **Confidence accumulator**         | Tracks consecutive accepts per dimension — negative evidence (success signals, not just failures)                         | Council GAP 2 (HIGH)                 |
| **Correction fatigue monitor**     | 3-state health monitor: healthy learning / suspected fatigue / confirmed improvement                                      | Council GAP 3 (HIGH)                 |
| **Cold-start archetype selection** | Day 0 draft style archetypes + Day 1 sent-folder voice extraction                                                         | Council GAP 4 (HIGH)                 |
| **Proactive calibration prompts**  | Post-meeting, post-draft-send, EOD digest calibration questions                                                           | Council GAP 5 (MEDIUM-HIGH)          |
| **Improvement dashboard card**     | Correction rate sparkline, draft acceptance rate, monthly summary, progress bar                                           | Council GAP 6 (MEDIUM-HIGH)          |
| **Pre-apply constitution check**   | Validate proposals against `hard_bans.json` before surfacing to operator                                                  | Council GAP 8 (MEDIUM)               |
| **Cross-config consistency check** | Config interaction matrix + conflict detection on apply                                                                   | Council GAP 7 (MEDIUM)               |
| **Rubber-stamping detection**      | Approval velocity monitor for overtrust                                                                                   | Council GAP 9 (MEDIUM)               |
| **Preference drift / time decay**  | Exponential time-decay weighting + contradiction detection                                                                | Council GAP 10 (MEDIUM)              |
| Config snapshots                   | Full config file snapshot before every AI-applied change (for one-click revert)                                           | Original plan                        |
| `revertImprovement()`              | Rollback using snapshots                                                                                                  | Original plan                        |
| Shadow mode                        | Parallel config run for 7 days, compare outcomes via `shadow_eval.jsonl`                                                  | Original plan + Council research     |
| Phased thresholds                  | 5-phase progression logic (silent → observation → proposal → auto-apply → mature)                                         | Original plan                        |
| Correction amplification           | "Apply to N similar items?" + correction-to-rule promotion after 3 identical corrections                                  | Original plan + Grammarly research   |
| Change attribution                 | Link recent actions to config changes that influenced them, with 30-day temporal decay                                    | Original plan + Harvard D^3 research |
| Enhanced UI card                   | Evidence summary, before/after preview, undo button, phase indicator, shadow results                                      | Original plan                        |
| Weekly scheduler trigger           | `schedulerTick()` fires pattern detection weekly                                                                          | Original plan                        |

**What needs to be FIXED (safety-critical):**

| Issue                                            | Current State                              | Required State                                                          |
| ------------------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------- |
| `allowedConfigs` in `applyImprovementProposal()` | Includes `hard_bans` and `autonomy_ladder` | REMOVE — these must NEVER be modifiable by Ted (SDD 55 safety boundary) |
| `allowedConfigs` missing high-value targets      | Only `urgency_rules`, `style_guide`        | ADD `draft_style`, `brief_config`                                       |
| No constitution check on proposals               | Proposals can indirectly weaken governance | Validate against `hard_bans.json` before surfacing                      |

---

## Dependencies

### Hard Dependencies (MUST exist before Builder Lane can work)

| #    | Dependency                               | Status  | Required For                               | Notes                                                                                                                            |
| ---- | ---------------------------------------- | ------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| D-1  | `selectLlmProvider()` + `routeLlmCall()` | EXISTS  | Proposal generation                        | Builder Lane uses existing LLM pipeline                                                                                          |
| D-2  | JSONL read/write helpers                 | EXISTS  | All pattern detection and storage          | `readJsonlLines()`, `appendJsonlLine()`                                                                                          |
| D-3  | `draft_queue.jsonl` with edit data       | PARTIAL | Draft voice correction detection           | Drafts have `status` field but `original_content` field may not be captured on every edit. Need to verify and add delta capture. |
| D-4  | `triage.jsonl` with operator overrides   | PARTIAL | Triage correction detection                | Need to verify `operator_override` field is captured when operator reclassifies.                                                 |
| D-5  | `commitments.jsonl` with operator edits  | PARTIAL | Commitment extraction correction detection | Need to verify `operator_corrected` field is captured.                                                                           |
| D-6  | `improvement_proposals.jsonl`            | EXISTS  | Proposal storage and lifecycle             | Full CRUD already works                                                                                                          |
| D-7  | Scheduler tick infrastructure            | EXISTS  | Weekly pattern detection trigger           | Just add a new job entry                                                                                                         |
| D-8  | Improvement Proposals UI card            | EXISTS  | Operator review surface                    | Enhancement only, not rebuild                                                                                                    |
| D-9  | Config files on disk                     | EXISTS  | Self-tuning targets                        | `draft_style.json`, `urgency_rules.json`, `brief_config.json`, `style_guide.json`                                                |
| D-10 | `appendEvent()`                          | EXISTS  | Event trail for all Builder Lane actions   | Centralized event log                                                                                                            |
| D-11 | Discovery pipeline (sent email scan)     | EXISTS  | Cold-start voice extraction                | `sentitems` folder scan in `runDiscoveryPipeline()`                                                                              |
| D-12 | `hard_bans.json`                         | EXISTS  | Constitution check                         | Immutable governance constraints                                                                                                 |

### Soft Dependencies (nice to have, not blocking)

| #   | Dependency                | Status         | Required For                 | Notes                                                                                                                                                                       |
| --- | ------------------------- | -------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-1 | Learning Mode (SDD 54)    | AWAITING CLINT | Deep onboarding scan         | Builder Lane works without Learning Mode. Cold-start acceleration (Phase 5) provides a minimal alternative. If Learning Mode ships, it subsumes Phase 5's voice extraction. |
| S-2 | Real Azure AD credentials | BLOCKED        | Draft edits from real emails | Builder Lane can work against test/mock data for development. Production learning requires real email flow.                                                                 |
| S-3 | Voice training samples    | AUTOMATED      | Draft style refinement       | Previously "awaiting_samples." Now automated via sentitems scan. Config updated to reflect.                                                                                 |

### Feasibility Assessment

| Risk                                                | Severity | Mitigation                                                                                                                                                                             |
| --------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Draft edit route may not capture `original_content` | MEDIUM   | Verify in Phase 1. If missing, add delta capture hook (~20 lines) to the draft edit handler.                                                                                           |
| Triage override field may not exist                 | MEDIUM   | Verify in Phase 1. If missing, add `operator_override` capture to triage reclassify handler (~15 lines).                                                                               |
| LLM proposal quality for config changes             | LOW      | Already validated by golden fixture. `improvement_proposal` intent has existing output contract. Research validated 0.80 confidence threshold. Fallback: template proposals from data. |
| Shadow mode adds complexity to action handlers      | MEDIUM   | Implement as Phase 4 (last core phase). Can ship Phases 1-3 without shadow mode.                                                                                                       |
| Correction amplification UX is confusing            | LOW      | Ship as suggestion, not mandatory. If unused, no harm. Validated by Grammarly's "grouped suggestions" pattern (5M+ devices).                                                           |
| Fatigue detection false positives                   | LOW      | 3-state model distinguishes fatigue from improvement. Prompt is gentle and infrequent.                                                                                                 |
| Cold-start archetypes don't match Clint             | LOW      | Archetypes are a starting point, not a commitment. First correction overrides any archetype default.                                                                                   |
| Rubber-stamping detection annoys operator           | LOW      | Only fires after 14+ days of >95% approval rate with <30s decision time. Very conservative trigger.                                                                                    |

**OVERALL FEASIBILITY: HIGH** — 80%+ of the infrastructure already exists. The Builder Lane adds ~1,565 lines on top of existing patterns. No new dependencies, no new external services, no new auth flows.

---

## Task Breakdown

### Phase 1: Foundation + Safety (4 sub-tasks)

**BL-001** — Correction signal ledger + delta capture hooks

- File: `sidecars/ted-engine/server.mjs`
- **NEW (Council GAP 1):** Create `correction_signals.jsonl` path constant + `mkdirSync`
- Verify: `draft_queue.jsonl` captures `original_content` on edit
- Verify: `triage.jsonl` captures `operator_override` on reclassify
- Verify: `commitments.jsonl` captures `operator_corrected` on edit
- If missing: add delta capture hooks to the respective edit handlers
- Add `style_deltas.jsonl` path constant + `mkdirSync`
- **Signal capture hooks (GAP 1):** On every operator interaction with a Ted output, append to `correction_signals.jsonl`:
  - `signal_type`: `edit` | `accept_verbatim` | `reject` | `reclassify` | `override`
  - `domain`: `draft_email` | `triage` | `commitment` | `brief` | `meeting_prep`
  - `magnitude`: 0.0 (no change) to 1.0 (total rewrite) — computed via simple word-level edit distance
  - `latency_ms`: time from Ted output creation to operator action
  - `section_affected`: `greeting` | `body` | `closing` | `subject` | `urgency` | `assignee` (for structured outputs)
  - `context_bucket`: `{ recipient_type, task_type, thread_context }` from the draft/triage metadata
- **Key hooks:**
  - Draft edit handler: record `{ signal_type: 'edit', magnitude: editDistance(original, edited), section_affected }`
  - Draft send handler: if sent without edit → `{ signal_type: 'accept_verbatim', magnitude: 0 }` (strongest positive signal)
  - Draft archive handler: `{ signal_type: 'reject', magnitude: 1.0 }`
  - Triage reclassify handler: `{ signal_type: 'reclassify' }`
  - Commitment edit handler: `{ signal_type: 'override' }`
- Add simple `editDistance(a, b)` helper — word-level diff, returns 0.0-1.0
- ~140 lines

**BL-002** — Safety boundary fix + constitution check + config interaction matrix

- File: `sidecars/ted-engine/server.mjs` (line ~9551)
- REMOVE `hard_bans` and `autonomy_ladder` from `allowedConfigs`
- ADD `draft_style` and `brief_config` to `allowedConfigs`
- **NEW (Council GAP 8):** Add `validateProposalAgainstConstitution(proposal)` — before any proposal reaches the operator:
  - Load `hard_bans.json`, verify proposed changes don't contradict any ban
  - `words_to_avoid` entries can only be ADDED, never removed
  - Urgency thresholds cannot drop below configurable minimum floor
  - If validation fails → proposal logged as `blocked_by_constitution`, never surfaces
- **NEW (Council GAP 7):** Add static `config_interactions.json`:
  ```json
  {
    "urgency_rules": ["triage", "morning_brief", "escalation"],
    "draft_style": ["draft_email", "eod_digest", "isaac_nightly_report"],
    "brief_config": ["morning_brief", "eod_digest"],
    "style_guide": ["draft_email", "meeting_prep"]
  }
  ```
  On apply, surface affected downstream behaviors to operator: "This change will affect: triage, morning brief"
- Check for pending proposals that modify overlapping config dimensions before apply
- ~60 lines (safety fix + constitution check + interaction matrix)

**BL-003** — Event types + config snapshot infrastructure

- File: `sidecars/ted-engine/config/event_schema.json`
  - Add 10 new event types:
    - `improvement.pattern.detected` — correction pattern identified by detection engine
    - `improvement.proposal.generated_from_pattern` — proposal created from correction pattern
    - `improvement.proposal.reverted` — applied proposal reverted via snapshot
    - `improvement.proposal.blocked_by_constitution` — proposal failed constitution check
    - `improvement.config.snapshot` — config snapshot created before apply
    - `improvement.shadow.started` — shadow run started for proposal
    - `improvement.shadow.completed` — shadow run completed with impact summary
    - `improvement.correction.amplified` — correction applied to multiple similar items
    - `improvement.fatigue.suspected` — correction fatigue detected
    - `improvement.calibration.response` — operator responded to calibration prompt
- File: `sidecars/ted-engine/server.mjs`
  - Add `configSnapshotsDir` path constant + `mkdirSync`
  - Add `snapshotConfig(configFile, proposalId)` helper — reads config, writes snapshot to `config_snapshots/{configFile}_{proposalId}_{timestamp}.json`
  - Add snapshot call inside `applyImprovementProposal()` BEFORE writing config
  - ~45 lines

**BL-004** — Builder Lane config file

- File: `sidecars/ted-engine/config/builder_lane_config.json` (NEW)
  ```json
  {
    "phases": {
      "silent": { "min_corrections": 0, "max_corrections": 5, "action": "log_only" },
      "observation": { "min_corrections": 5, "max_corrections": 10, "action": "surface_in_digest" },
      "proposal": { "min_corrections": 10, "max_corrections": 25, "action": "create_proposal" },
      "auto_apply": {
        "min_corrections": 25,
        "max_corrections": 50,
        "action": "auto_apply_low_risk"
      },
      "mature": { "min_corrections": 50, "action": "maintenance" }
    },
    "confidence_threshold": 0.8,
    "max_proposals_per_digest": 3,
    "max_proposals_per_scan": 3,
    "proposal_expiry_days": 14,
    "rejection_cooldown_days": 30,
    "fatigue_detection": {
      "correction_rate_drop_threshold": 0.5,
      "fatigue_window_days": 7,
      "prompt_cooldown_days": 14
    },
    "rubber_stamping": {
      "approval_rate_threshold": 0.95,
      "max_decision_time_ms": 30000,
      "consecutive_days_threshold": 14
    },
    "calibration": {
      "max_prompts_per_day": 3,
      "enabled_moments": ["post_meeting_debrief", "post_draft_send_with_edit", "eod_digest"]
    },
    "cold_start": {
      "archetypes": {
        "direct_dealmaker": {
          "tone": "Direct, concise, action-first",
          "structure": "bullets",
          "formality": 0.7
        },
        "thorough_analyst": {
          "tone": "Detailed, evidence-backed, comprehensive",
          "structure": "narrative",
          "formality": 0.85
        },
        "relationship_builder": {
          "tone": "Warm, context-rich, personal",
          "structure": "prose",
          "formality": 0.6
        }
      },
      "voice_extraction_email_count": 30
    },
    "time_decay": {
      "half_life_days": 30,
      "conflict_window_days": 14
    }
  }
  ```
- ~50 lines

### Phase 2: Pattern Detection Engine (3 sub-tasks)

**BL-005** — `detectCorrectionPatterns()` + confidence accumulator + fatigue monitor

- File: `sidecars/ted-engine/server.mjs`
- **Core pattern detection:** Reads `correction_signals.jsonl`, `style_deltas.jsonl`, `draft_queue.jsonl`, `triage.jsonl`, `commitments.jsonl`, `pending_delivery.jsonl`
- Groups corrections by type (draft_rejection, draft_edit_delta, draft_accept_verbatim, triage_reclassification, commitment_correction, brief_disengagement)
- Context bucketing: groups by `(recipient_type, task_type, thread_context)` within each correction type
- **NEW (Council GAP 10):** Exponential time-decay weighting — recent corrections weighted higher:
  - `weight = Math.exp(-daysSinceCorrection / halfLifeDays)`
  - When recent corrections contradict older ones on same dimension, flag for explicit drift confirmation
- Returns array of `{ type, signal, evidence[], target_config, context_bucket, correction_count, weighted_count, sessions_count, consistency_rate, phase }`
- Applies phased thresholds: only returns patterns that meet their phase's correction_count minimum
- **NEW (Council GAP 2):** Confidence accumulator per config dimension:
  - Track `consecutive_accepts` (send-without-edit count), `last_correction_at`, `confidence` (logistic curve)
  - Each accept: confidence rises with diminishing returns
  - Each edit: resets `consecutive_accepts` to 0, drops confidence proportional to edit magnitude
  - When confidence > 0.90: dimension EXCLUDED from proposal generation (don't fix what's working)
  - Store in `builder_lane_status.jsonl`
- **NEW (Council GAP 3):** Correction fatigue monitor:
  - `correction_rate_7d` per domain (rolling 7-day correction rate)
  - `correction_rate_delta` vs prior 7 days
  - Three states: `healthy_learning` (rate stable/declining + failures declining), `suspected_fatigue` (rate drops >50% but failures constant), `confirmed_improvement` (both declining)
  - When `suspected_fatigue`: flag in status response, surface in next brief
- ~220 lines

**BL-006** — `generatePatternProposal(pattern)` + validation + rubber-stamping detection

- File: `sidecars/ted-engine/server.mjs`
- New function that takes a detected pattern and generates an improvement proposal via `routeLlmCall()`
- Builds context-aware prompt: includes current config + correction evidence + context bucket + time-decay weighted evidence
- **Proposal validation pipeline:**
  1. Check `config_file` in allowed list (draft_style, urgency_rules, brief_config, style_guide, output_contracts)
  2. Check JSON paths exist in current config
  3. Check type safety (string→string, array→array)
  4. **NEW (Council GAP 8):** Run `validateProposalAgainstConstitution()` against `hard_bans.json`
  5. **NEW (Council GAP 7):** Check `config_interactions.json` for overlapping pending proposals
  6. Check confidence >= 0.80 threshold
- **NEW (Council GAP 9):** Rubber-stamping detection in `reviewImprovementProposal()`:
  - Track `time_to_decision` on each proposal review
  - If approval_rate > 95% AND avg time_to_decision < 30s for 14+ days → suspected rubber-stamping
  - Surface in brief: "You've approved 18 of 19 proposals in under 30 seconds. Consider reviewing recent changes more carefully."
- ~160 lines

**BL-007** — Route handlers + scheduler integration

- File: `sidecars/ted-engine/server.mjs`
- New routes:
  - `GET /ops/builder-lane/patterns` — runs `detectCorrectionPatterns()`, returns detected patterns with phase info
  - `POST /ops/builder-lane/generate` — runs `generatePatternProposal()` for a specific pattern, creates proposal
  - `POST /ops/builder-lane/revert/{proposalId}` — `revertImprovement()` restores from config snapshot
  - `GET /ops/builder-lane/status` — returns: correction counts per type, current phase per type, active proposals, confidence scores, fatigue state, recently applied, recently reverted
  - **NEW (Council GAP 6):** `GET /ops/builder-lane/improvement-metrics` — returns:
    - `correction_rate_trend`: corrections per 100 items processed, last 30 days (weekly buckets)
    - `draft_acceptance_rate`: % of drafts sent without edits (current week, last week, last month)
    - `proposals_applied_count`: cumulative proposals applied
    - `monthly_summary`: "47 emails drafted, 38 sent without edits (81%, up from 62% last month)"
    - `config_change_markers`: timestamps of applied config changes for sparkline overlay
    - `progress_by_dimension`: corrections remaining per dimension to reach next phase
- **NEW (Council GAP 5):** `POST /ops/builder-lane/calibration-response` — records operator response to calibration prompt
- Scheduler integration: add `builder_lane_scan` job to scheduler config
  - Cron: `0 3 * * 0` (weekly, Sunday 3 AM — low-activity time)
  - Handler: calls `detectCorrectionPatterns()`, for each pattern meeting proposal threshold, calls `generatePatternProposal()`
  - Rate limit: max 3 proposals generated per scan
- Execution boundary policy entries for all new routes
- `normalizeRoutePolicyKey` entries for all new routes
- ~240 lines

### Phase 3: Extension + UI (5 sub-tasks)

**BL-008** — Extension gateway methods

- File: `extensions/ted-sidecar/index.ts`
- New gateway methods:
  - `ted.builder_lane.patterns` — GET patterns
  - `ted.builder_lane.generate` — POST generate proposal from pattern
  - `ted.builder_lane.revert` — POST revert applied proposal
  - `ted.builder_lane.status` — GET builder lane status
  - **NEW:** `ted.builder_lane.improvement_metrics` — GET improvement metrics for dashboard
  - **NEW:** `ted.builder_lane.calibration_response` — POST calibration response
- ~130 lines

**BL-009** — Extension agent tools

- File: `extensions/ted-sidecar/index.ts`
- New tools:
  - `ted_builder_lane_status` — read tool, returns current phase per correction type + active proposals + fatigue state
  - `ted_builder_lane_revert` — write tool (REQUIRES_OPERATOR_CONFIRMATION), reverts an applied proposal
  - **NEW:** `ted_builder_lane_metrics` — read tool, returns improvement metrics for agent reasoning
- Add `ted_builder_lane_revert` to `TED_WRITE_TOOLS_SET` and `REQUIRES_OPERATOR_CONFIRMATION`
- Update `ted_agent.json` alsoAllow list
- ~100 lines

**BL-010** — UI state + controllers

- Files: `controllers/ted.ts` (+100), `app-view-state.ts` (+20), `app.ts` (+15)
- New state fields:
  - `builderLanePatterns`, `builderLanePatternsLoading`, `builderLanePatternsError`
  - `builderLaneStatus`, `builderLaneStatusLoading`
  - `builderLaneRevertBusy`, `builderLaneRevertResult`, `builderLaneRevertError`
  - `builderLaneGenerateBusy`
  - **NEW:** `builderLaneMetrics`, `builderLaneMetricsLoading` (improvement dashboard)
  - **NEW:** `builderLaneCalibrationBusy` (calibration response)
- New controller functions:
  - `loadBuilderLanePatterns()` — fetches patterns via gateway
  - `loadBuilderLaneStatus()` — fetches status via gateway
  - `generateFromPattern(patternType, contextBucket)` — triggers proposal generation
  - `revertAppliedProposal(proposalId)` — reverts via gateway
  - **NEW:** `loadBuilderLaneMetrics()` — fetches improvement metrics
  - **NEW:** `submitCalibrationResponse(promptId, response)` — records calibration response
- Standard guard pattern: client/connected/loading → set loading → try/catch → result/error → finally loading=false
- ~135 lines total

**BL-011** — UI card enhancement + prop wiring

- File: `ui/src/ui/views/ted.ts`
  - Enhance existing Improvement Proposals card with:
    - **Phase indicator**: "Builder Lane: Early Signal phase (12 corrections, need 25 for proposals)"
    - **Evidence summary per proposal**: "Based on 8 draft corrections in 30 days where you changed formal closings to '— Clint'"
    - **Before/After preview**: Side-by-side showing current config value vs proposed change
    - **Undo button** on applied proposals (calls revertAppliedProposal)
    - **Pattern detection results**: "Detected: 3 correction patterns (2 in Proposal phase, 1 in Observation phase)"
    - **Category tags**: Voice, Triage, Extraction, Scheduling, Brief
    - **NEW (Council GAP 7):** Downstream impact notice: "This change will affect: triage, morning brief, escalation"
    - **NEW (Council GAP 3):** Fatigue indicator: when suspected fatigue, show "Ted hasn't received corrections in 2 weeks. Is he getting it right, or have you stopped checking?"
    - **NEW (Council GAP 9):** Rubber-stamping notice (when triggered): "You've been approving proposals very quickly. Consider reviewing recent changes."
    - **NEW (Council GAP 10):** Drift confirmation prompt: "Your recent corrections suggest a preference change. Confirm? [Yes, I changed my mind] [No, one-off correction]"
  - New sub-section: "Builder Lane Status" — correction counts by type, current phase per dimension, fatigue state, confidence scores
  - **NEW (Council GAP 6):** "Improvement Dashboard" card:
    - Correction rate trend (text-based sparkline — "▂▃▅▇▆▄▂▁" or simple numeric trend)
    - Draft acceptance rate: "81% this month (up from 62%)"
    - Config changes applied: "3 this month"
    - Monthly summary: natural-language sentence
    - Progress by dimension: "Draft voice: 18/25 corrections to reach Proposal phase"
    - Config change markers: "P-042 applied Feb 12 → triage corrections dropped from 8/day to 3/day"
- File: `ui/src/ui/app-render.ts`
  - Wire ~18 new props to `renderTed()` call
- ~260 lines total (views) + ~50 lines (app-render)

**BL-012** — Proactive calibration integration

- File: `sidecars/ted-engine/server.mjs`
- **NEW (Council GAP 5):** Integrate calibration prompts into existing route handlers:
  - **Post-meeting debrief:** After `meetingDebrief` stores commitments, include `calibration_prompt` in response: "I identified 3 commitments from that meeting. Did I get them right?"
  - **Post-draft send (with edits):** After draft execution where operator edited before sending, include `calibration_prompt`: "You changed the tone for [recipient]. Remember this for future drafts?"
  - **EOD digest:** Add "How was Ted today?" section with 3 key outputs for thumbs-up/down
- Calibration responses recorded in `correction_signals.jsonl` with `signal_type: 'calibration_response'`
- Each calibration response = 3-5x weight of a passive correction signal (high-signal, low-friction)
- Respect `max_prompts_per_day` from config (default: 3)
- Respect quiet hours — never prompt during deep work
- ~60 lines

### Phase 4: Shadow Mode + Amplification (3 sub-tasks)

**BL-013** — Shadow mode engine

- File: `sidecars/ted-engine/server.mjs`
- `startShadowRun(proposalId)` — creates shadow config copy, marks proposal as "shadowing"
- Shadow evaluation: during the shadow period (7 days), when the relevant action fires (e.g., draft generation, triage classification), run BOTH current config and shadow config, log both results to `shadow_eval.jsonl` (separate from production ledgers — never contaminates production state)
- `completeShadowRun(proposalId)` — compares shadow results vs actual results, generates impact summary:
  - "12 of 847 actions would have differed. 9 matched your corrections. 3 would have diverged."
  - Per-item diff: before/after with color-coded deltas
  - Aggregate impact: "Would have reduced misclassifications by ~40%"
- New routes:
  - `POST /ops/builder-lane/shadow/{proposalId}` — starts shadow run
  - `GET /ops/builder-lane/shadow/{proposalId}` — gets shadow results (layered counterfactual UX)
- Shadow kill switch: if shadow evaluation doubles LLM costs, operator can pause shadow without affecting production
- ~180 lines

**BL-014** — Correction amplification + correction-to-rule promotion

- File: `sidecars/ted-engine/server.mjs`
- When operator corrects a draft/triage/commitment, check for N similar items in the same context bucket
- If found, return `amplification_candidates: [{ id, title, current_value, proposed_value }]` in the response
- New route: `POST /ops/builder-lane/amplify` — applies the same correction to multiple items
- **NEW (Grammarly research):** Correction-to-rule promotion: after the operator makes the SAME type of correction 3 times, offer to create a permanent config rule: "You've changed 'per our conversation' to 'as we discussed' three times. Make this a permanent rule?"
- ~90 lines

**BL-015** — Change attribution tags

- File: `sidecars/ted-engine/server.mjs`
- When an action is influenced by a recently-applied config change (within 30 days), include attribution in the action's metadata:
  - `attribution: { proposal_id: "P-047", basis: "12 corrections over 14 days", confidence: "high", applied_at: "..." }`
- Tags clickable in UI: one click shows proposal summary, two clicks shows corrections that drove it
- **NEW (Council research):** Contradiction detection: if operator corrects an attributed action, automatically flag as signal that config change may need revision
- Temporal decay: attribution tags fade after 30 days (still available in audit trail but not shown in UI)
- ~50 lines

### Phase 5: Cold-Start Acceleration (2 sub-tasks)

**BL-016** — Archetype selection + voice extraction

- File: `sidecars/ted-engine/server.mjs`
- **NEW (Council GAP 4):**
  - **Day 0 — Archetype selection:** New route `POST /ops/onboarding/archetype-select`
    - Operator picks from 3 archetypes (direct_dealmaker, thorough_analyst, relationship_builder)
    - Pre-loads corresponding style values into `draft_style.json` (tone, structure, formality)
    - Ted has a reasonable voice from the first draft instead of guessing
  - **Day 1 — Voice extraction:** New route `POST /ops/onboarding/voice-extract`
    - Reads 30-50 sent emails from `sentitems` via Graph API (reuses discovery pipeline infrastructure)
    - Runs LLM with `"voice_extract"` intent: analyze sent emails, extract patterns per audience category
    - Extracts: greeting_style, closing_style, sentence_length_avg, formality_gradient, paragraph_structure, action_item_format, question_phrasing — all per `(audience_type)`
    - Writes extracted patterns to `draft_style.json` voice_training.extracted_patterns
    - Event: `improvement.voice.extracted`
  - New route: `GET /ops/onboarding/voice-extract-status` — returns extraction status + discovered patterns
- Add `voice_extract` to output_contracts.json (expected format for extracted patterns)
- ~100 lines

**BL-017** — Proof scripts

- `scripts/ted-profile/proof_builder_lane.sh` (behavioral HTTP tests)
  - Test 1: GET /ops/builder-lane/status returns 200 with phase info + confidence scores + fatigue state
  - Test 2: GET /ops/builder-lane/patterns returns 200 with detected patterns
  - Test 3: POST /ops/builder-lane/generate creates proposal from pattern
  - Test 4: POST /ops/builder-lane/revert reverts applied proposal (config restored from snapshot)
  - Test 5: Verify config snapshot created before apply
  - Test 6: Verify `hard_bans` and `autonomy_ladder` REJECTED from allowedConfigs
  - Test 7: Verify phased thresholds suppress low-correction patterns
  - Test 8: GET /ops/builder-lane/shadow returns shadow results
  - Test 9: GET /ops/builder-lane/improvement-metrics returns correction rate trend + acceptance rate
  - Test 10: Verify constitution check blocks proposal that contradicts hard_bans
  - Test 11: POST /ops/onboarding/archetype-select updates draft_style.json
  - Test 12: POST /ops/builder-lane/calibration-response records signal
- ~200 lines

---

## Execution Plan (5 waves)

### Wave 1 — Foundation (parallel, ~12 min)

```
Agent A: BL-001 (correction signal ledger + delta capture hooks — ~140 lines)
Agent B: BL-002 (safety fix + constitution check + config interactions — ~60 lines)
         + BL-003 (event types + snapshots — ~45 lines)
         + BL-004 (builder_lane_config.json — ~50 lines)
```

Agent A operates on edit/send/archive handlers (~lines 8000-8500). Agent B operates on improvement apply (~line 9551), config infrastructure (~lines 80-200), and creates new config file.

### Wave 2 — Pattern Detection Engine (sequential, single agent, ~18 min)

```
Agent C: BL-005 → BL-006 → BL-007
  (detectCorrectionPatterns + confidence accumulator + fatigue monitor,
   generatePatternProposal + validation + rubber-stamping,
   routes + scheduler + improvement metrics)
  All in server.mjs, sequential to avoid conflicts. ~620 lines.
```

### Wave 3 — Extension + UI State (parallel, ~12 min)

```
Agent D: BL-008 + BL-009 (index.ts: gateway methods + agent tools — ~230 lines)
Agent E: BL-010 (controllers/ted.ts + app-view-state.ts + app.ts — ~135 lines)
```

### Wave 4 — UI Cards + Calibration + Shadow Mode (parallel, ~15 min)

```
Agent F: BL-011 + BL-012 (views/ted.ts + app-render.ts — UI enhancement + calibration — ~370 lines)
Agent G: BL-013 + BL-014 + BL-015 (server.mjs: shadow mode + amplification + attribution — ~320 lines)
```

### Wave 5 — Cold-Start + Proofs (parallel, ~8 min)

```
Agent H: BL-016 (server.mjs: archetype selection + voice extraction — ~100 lines)
Agent I: BL-017 (proof script — ~200 lines)
```

### Post-Wave Verification

```
node --check sidecars/ted-engine/server.mjs
npx tsc --noEmit (if TypeScript configured)
bash -n scripts/ted-profile/proof_builder_lane.sh
```

---

## Estimated File Impact

| File                             | Before (approx) | Added      | After     |
| -------------------------------- | --------------- | ---------- | --------- |
| `server.mjs`                     | ~12,270         | +1,110     | ~13,380   |
| `index.ts`                       | ~9,480          | +230       | ~9,710    |
| `views/ted.ts`                   | ~3,800          | +260       | ~4,060    |
| `controllers/ted.ts`             | ~1,600          | +100       | ~1,700    |
| `app-view-state.ts`              | varies          | +20        | —         |
| `app-render.ts`                  | varies          | +50        | —         |
| `app.ts`                         | varies          | +15        | —         |
| `event_schema.json`              | 172 types       | +10 types  | 182 types |
| `builder_lane_config.json` (NEW) | 0               | +50        | ~50       |
| `config_interactions.json` (NEW) | 0               | +10        | ~10       |
| `proof_builder_lane.sh` (NEW)    | 0               | +200       | ~200      |
| **Total**                        |                 | **~1,565** |           |

---

## What Ships When

| Phase       | What Operator Sees                                                                                                                                                                                                                                                       | When          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| **Phase 1** | Nothing visible — safety fix + data capture begins silently                                                                                                                                                                                                              | Immediate     |
| **Phase 2** | Builder Lane Status: "Collecting corrections — need X more for first proposal." Fatigue detection active. Confidence scores tracked.                                                                                                                                     | After Phase 2 |
| **Phase 3** | Enhanced Improvement Proposals card with evidence, before/after, undo. **Improvement Dashboard** showing correction rate trend, acceptance rate, monthly summary, progress by dimension. Calibration prompts after meetings and draft sends. Drift confirmation prompts. | After Phase 3 |
| **Phase 4** | Shadow mode ("here's what would have changed this week"). "Apply to similar?" amplification. Correction-to-rule promotion. Change attribution tags.                                                                                                                      | After Phase 4 |
| **Phase 5** | Cold-start: archetype selection during setup, automated voice extraction from sent emails.                                                                                                                                                                               | After Phase 5 |

**Phasing strategy:**

- **Phases 1-3 are the MVP.** They deliver the full correction-to-proposal flywheel, improvement dashboard, fatigue detection, confidence tracking, calibration prompts, and all safety hardening. Clint sees value.
- **Phase 4 is a refinement.** Shadow mode, amplification, and attribution increase trust and accelerate the flywheel.
- **Phase 5 collapses the cold start.** Can ship independently or wait for Learning Mode (SDD 54).

---

## Risk Register

| #    | Risk                                                                   | Impact | Likelihood | Mitigation                                                                                                                                                  |
| ---- | ---------------------------------------------------------------------- | ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1  | Existing JSONL ledgers don't capture correction deltas (D-3, D-4, D-5) | MEDIUM | MEDIUM     | Phase 1 verifies and adds hooks if missing. Worst case: ~60 extra lines.                                                                                    |
| R-2  | LLM proposal quality for config changes is poor                        | LOW    | LOW        | `improvement_proposal` intent already has output contract + golden fixture. Fallback: template proposals from data.                                         |
| R-3  | Shadow mode adds complexity to action handlers                         | MEDIUM | LOW        | Phase 4 (separate from MVP). Shadow results in dedicated `shadow_eval.jsonl` — never contaminates production. Kill switch available.                        |
| R-4  | Correction amplification UX is confusing                               | LOW    | MEDIUM     | Ship as suggestion, not mandatory. Validated by Grammarly grouped suggestions (5M+ devices).                                                                |
| R-5  | Phased thresholds are too conservative/aggressive                      | LOW    | MEDIUM     | Thresholds live in `builder_lane_config.json` — tunable. Research-backed defaults.                                                                          |
| R-6  | `allowedConfigs` safety fix breaks existing applied proposals          | LOW    | LOW        | Fix only affects FUTURE proposals. Already-applied changes remain.                                                                                          |
| R-7  | Fatigue detection false positives                                      | LOW    | LOW        | 3-state model distinguishes fatigue from improvement. Prompt is gentle, fires max once per 14 days.                                                         |
| R-8  | Rubber-stamping detection annoys operator                              | LOW    | LOW        | Very conservative trigger: >95% approval + <30s decision time + 14 consecutive days.                                                                        |
| R-9  | Cold-start archetypes don't match Clint's style                        | LOW    | LOW        | Archetypes are a starting point. First 5 corrections override any archetype default. Voice extraction on Day 1 provides real data.                          |
| R-10 | Preference drift detection overreacts to one-off corrections           | LOW    | MEDIUM     | Explicit drift confirmation prompt — operator decides: "Yes, I changed my mind" vs. "No, one-off correction." System doesn't auto-update on contradictions. |

---

## Success Criteria

1. **Safety boundary enforced**: `hard_bans.json` and `autonomy_ladder.json` CANNOT be modified by any improvement proposal pathway
2. **Constitution check active**: Proposals that contradict hard_bans are blocked before reaching operator
3. **All correction signals captured**: Edits, accepts, rejects, reclassifications, overrides — with edit distance, latency, section affected
4. **Draft corrections detected**: After 10+ draft edits, `detectCorrectionPatterns()` identifies voice patterns with context bucketing
5. **Confidence accumulator tracks success**: 50+ consecutive accepts → confidence > 0.90 → dimension excluded from proposals
6. **Fatigue detection works**: Sustained correction drop with constant failure rate → "suspected fatigue" state flagged
7. **Proposals generated**: LLM produces actionable config change proposals with evidence summaries and downstream impact notice
8. **Config snapshots created**: Every `applyImprovement` call creates a snapshot before modifying config
9. **One-click revert works**: `revertImprovement()` restores config from snapshot
10. **Phased progression visible**: UI shows current phase per correction type
11. **Improvement dashboard active**: Correction rate trend, acceptance rate, monthly summary, progress by dimension — all visible in operator card
12. **Calibration prompts fire at right moments**: Post-meeting, post-draft-send, EOD digest — max 3/day, respects quiet hours
13. **Scheduler fires weekly**: `builder_lane_scan` runs on schedule, generates proposals when threshold met
14. **Proof script passes**: All 12 behavioral HTTP tests pass

---

## What the Council Rejected (Over-Engineering)

The following patterns were researched and explicitly excluded:

1. **N-of-1 switchback experiments** — Alternating configs on a schedule is statistically rigorous but operationally disruptive for a single operator. The 7-day shadow mode is sufficient.
2. **Embedding-based semantic contradiction detection** — Overkill for <10 config files with simple string values. Static `config_interactions.json` is enough.
3. **Contextual bandits / dual-variant drafts** — Presenting 2 draft variants for uncertain dimensions is disruptive for an executive. Clint wants one good draft, not a choice.
4. **Autonomy certificates / formal audit export** — Useful for multi-operator enterprise deployments. Overkill for single operator. Event log + policy ledger serve this purpose.
5. **Deliberately wrong outputs for calibration** — Would destroy trust. Never do this.

---

_This plan implements SDD 55 Track 1, updated with Council Critical Review findings (SDD 57). Uses ONLY components on Clint's Mac: sidecar, extension, UI, JSONL ledgers, LLM pipeline, local config files. No coding agents. No git. No external tools. Validated against 80+ sources from 2024-2026._
