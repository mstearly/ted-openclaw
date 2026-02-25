# SDD 59 — Self-Healing Council Assessment

**Date:** 2026-02-24
**Council Cycle:** 013 (Post-QA)
**Trigger:** Operator question — "Is it possible to make the app self-healing since Codex is embedded?"
**Verdict:** YES — infrastructure is 60% complete. 15 gaps identified across 3 tiers.

---

## 1. Executive Summary

Ted's Builder Lane (Codex) already implements the core self-modification loop:
correction signals → pattern detection → proposal generation → constitution check → operator approval → config application → shadow evaluation → rule promotion.

This places Ted **ahead of most production AI assistant systems** in self-modification safety. The question is not "can we?" but "which gaps do we close first?"

This document inventories all 50 existing capabilities, identifies 15 gaps, and recommends a phased implementation path.

---

## 2. Existing Self-Healing Inventory

### Tier A: Fully Self-Healing (14 capabilities — no operator intervention)

| #   | Capability              | Mechanism                                                            | Location         |
| --- | ----------------------- | -------------------------------------------------------------------- | ---------------- |
| A1  | Token refresh           | `ensureValidToken()` + `refreshAccessToken()` with per-profile mutex | server.mjs:4688  |
| A2  | Graph API retry         | `graphFetchWithRetry()` — 3 retries, exponential backoff, jitter     | server.mjs:4727  |
| A3  | Rate-limit handling     | 429 Retry-After header respected, waits up to 30s                    | server.mjs:4749  |
| A4  | Pagination safety       | `graphFetchAllPages()` — truncation at 10 pages + warning event      | server.mjs:4812  |
| A5  | Startup validation      | 7 golden fixtures validated against output contracts                 | server.mjs:3803  |
| A6  | Delivery recovery       | `pending_delivery.jsonl` replayed on restart                         | server.mjs:13454 |
| A7  | Scheduler protection    | `_tickRunning` reentrancy guard + consecutive failure backoff        | server.mjs:12036 |
| A8  | Ingestion protection    | `_ingestionRunning` mutex + automation pause check                   | server.mjs:5227  |
| A9  | Discovery protection    | `_discoveryRunning` mutex                                            | server.mjs:5313  |
| A10 | State replay            | `replayOpsState()` restores pause/resume across restarts             | server.mjs:178   |
| A11 | Policy baseline         | Config snapshot on every startup to policy ledger                    | server.mjs:204   |
| A12 | Process crash handling  | `unhandledRejection` + `uncaughtException` handlers                  | server.mjs:13487 |
| A13 | Body flooding guard     | 1MB body limit, 413 on oversized, 400 on malformed                   | server.mjs:5455  |
| A14 | Voice extraction safety | `.catch()` on background IIFE + `_voiceExtractRunning` mutex         | server.mjs:10757 |

### Tier B: Semi-Autonomous (16 capabilities — operator approves)

| #   | Capability                | Mechanism                                                                         | Location                 |
| --- | ------------------------- | --------------------------------------------------------------------------------- | ------------------------ |
| B1  | Correction signals        | `appendCorrectionSignal()` — edit distance, latency, section, context             | server.mjs:~9900         |
| B2  | Pattern detection         | `detectCorrectionPatterns()` — groups by domain, time-decay weighting             | server.mjs:9982          |
| B3  | Confidence accumulator    | Logistic curve: `1 / (1 + e^(-0.15 * (accepts - 10)))`                            | server.mjs:10028         |
| B4  | Fatigue monitor           | 3-state: healthy_learning / confirmed_improvement / suspected_fatigue             | server.mjs:10032         |
| B5  | Preference drift          | Detects recent edits contradicting older edits (>14d window, >0.3 magnitude diff) | server.mjs:10049         |
| B6  | Proposal generation       | `generatePatternProposal()` — LLM-based with evidence summary                     | server.mjs:10087         |
| B7  | Constitution check        | `validateProposalAgainstConstitution()` — hard_bans, words_to_avoid enforcement   | server.mjs:9674          |
| B8  | Config snapshots          | Full JSON snapshot before every AI-applied change                                 | server.mjs:9713          |
| B9  | One-click revert          | `/improvement/proposals/{id}/revert` restores snapshot                            | server.mjs:10233         |
| B10 | Shadow evaluation         | 7-day parallel config eval — matchRate ≥85% = PASS                                | server.mjs:10360         |
| B11 | Rule promotion            | `checkRulePromotion()` — confidence ≥0.90, signals ≥10, no fatigue                | server.mjs:10539         |
| B12 | Rubber-stamping detection | Alert when approval_rate >95% AND decision_time <30s for 14+ days                 | builder_lane_config.json |
| B13 | Correction amplification  | `amplifyCorrection()` — multiplier up to 5x for specific domains                  | server.mjs:10500         |
| B14 | Calibration prompts       | Post-draft, post-meeting, EOD calibration (1-5 scale, max 3/day)                  | server.mjs:7355          |
| B15 | Cold-start archetypes     | 3 presets: direct_dealmaker, thorough_analyst, relationship_builder               | server.mjs:10580         |
| B16 | Stale proposal flagging   | `_stale` + `_days_old` on proposals >14 days in "proposed" status                 | server.mjs:9632          |

### Tier C: Detection Only (20 capabilities — logs/alerts, no corrective action)

| #   | Capability                          | What It Detects                                             |
| --- | ----------------------------------- | ----------------------------------------------------------- |
| C1  | Graph auth error taxonomy           | 6 error categories with next_actions guidance               |
| C2  | Graph last-error tracking           | Per-profile in-memory map, surfaced in /status              |
| C3  | LLM output contract validation      | Missing sections, banned phrases, invalid JSON              |
| C4  | Never-dark fallback                 | commitment_extract returns empty list on failure            |
| C5  | Execution boundary policy           | WORKFLOW_ONLY / APPROVAL_FIRST / ADAPTIVE_ALLOWED per route |
| C6  | Operator approval header validation | 403 if x-ted-approval-source missing on gated routes        |
| C7  | Draft state machine                 | Illegal transitions return 409                              |
| C8  | Policy audit trail                  | Every config change logged with changed_by, proposal_id     |
| C9  | Config interaction map              | Documents which routes affected by each config file         |
| C10 | JSONL corruption detection          | Skips malformed lines during replay                         |
| C11 | Missing config fallback             | Returns null, callers use defaults                          |
| C12 | Ingestion error isolation           | Per-email error capture, partial ingestion continues        |
| C13 | Discovery partial failure           | Per-phase try/catch, partial results returned               |
| C14 | Notification budget tracking        | Daily push limit enforced by scheduler                      |
| C15 | Quiet hours enforcement             | Jobs skipped outside operator hours                         |
| C16 | Commitment status field             | ok / none_found / extraction_failed                         |
| C17 | Stale deal detection                | last_touched_by/at on all deal mutations                    |
| C18 | Graph profile completeness          | 400 on missing tenant_id/client_id                          |
| C19 | Proposal confidence gate            | Blocks proposals below threshold (0.80)                     |
| C20 | Scheduler job failure backoff       | Skips job after N consecutive failures                      |

---

## 3. Gap Analysis: 15 Self-Healing Opportunities

### Tier 1 — Low Risk, High Value (implement now)

| ID     | Gap                                  | Description                                                                                                                                                       | Est. Lines |
| ------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| SH-001 | Circuit breaker per Graph endpoint   | Track failure rates per endpoint path. After 5 failures in 10 min, serve cached/degraded data for 5 min. Prevents cascading failures during Graph outages.        | ~80        |
| SH-002 | LLM provider auto-fallback           | If primary provider fails, try next enabled provider before erroring. Add health score per provider (latency p95, error rate). Periodic probe to detect recovery. | ~60        |
| SH-003 | Config drift reconciliation          | Hash all config files every 5 min. If disk differs from in-memory state (e.g., manual edit or hot-reload failure), auto-reload + log drift event.                 | ~50        |
| SH-004 | Stale config recovery from snapshots | If a config file (e.g., draft_style.json) is missing/corrupted, auto-restore from latest config/snapshots/ directory.                                             | ~30        |
| SH-005 | Automatic ledger compaction          | Archive JSONL entries >90 days to `*.archived.jsonl`. Run on scheduler tick (weekly). Prevents unbounded disk growth across 23 ledger files.                      | ~60        |
| SH-006 | Proposal auto-expiry                 | Auto-withdraw proposals >30 days in "proposed" status. Log improvement.proposal.expired event. Prevents stale proposal accumulation.                              | ~25        |

**Tier 1 total: ~305 lines, all in server.mjs**

### Tier 2 — Medium Risk, High Value (implement with shadow evaluation)

| ID     | Gap                                    | Description                                                                                                                                                             | Est. Lines |
| ------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| SH-007 | Correction taxonomy classifier         | Classify edits as tone/content/structure/factual. Route each class to correct config domain. Makes Builder Lane 2-3x more effective by targeting the right config file. | ~100       |
| SH-008 | Engagement-based schedule optimization | Log operator interaction timestamps with briefs/digests. After 14d, compute optimal delivery window. Propose schedule change via Builder Lane.                          | ~80        |
| SH-009 | Graduated noise reduction              | 4-level disengagement response: batch consolidation → threshold raising → passive mode → health ping. Driven by existing fatigue monitor state.                         | ~120       |
| SH-010 | Dynamic autonomy ladder                | Auto-increase autonomy per task type as correction rate decreases. After 20 uncorrected executions, propose autonomy increase. Always reversible.                       | ~100       |
| SH-011 | Zombie draft detection + retry         | Find drafts stuck in "approved" >1hr with no send confirmation. Auto-retry Graph send on next scheduler tick. Max 3 retries before alerting.                            | ~50        |

**Tier 2 total: ~450 lines**

### Tier 3 — Research Phase (prototype first)

| ID     | Gap                            | Description                                                                                                                 | Est. Lines   |
| ------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------ |
| SH-012 | LLM output quality monitoring  | Score every LLM output on 3 dimensions (relevance, completeness, format). Alert when quality degrades below baseline.       | ~150         |
| SH-013 | Predictive failure avoidance   | Analyze event_log patterns that precede failures. Proactively take preventive action when precursor patterns detected.      | ~200         |
| SH-014 | Cross-session memory synthesis | After 30d of corrections, generate "learned preferences" doc for operator review. Makes learning transparent and auditable. | ~150         |
| SH-015 | DSPy-style prompt optimization | Weekly background job: optimize system prompts using correction pairs. Evaluate in shadow mode for 48h before proposing.    | External dep |

**Tier 3 total: ~500+ lines**

---

## 4. Safety Architecture

Ted already implements the 5 critical safety mechanisms that production self-healing systems require:

### 4.1 Constitution Check

`validateProposalAgainstConstitution()` blocks changes that violate hard_bans.json. Cannot remove words_to_avoid entries. Cannot lower minimum_urgency_score below governance floor. If hard_bans.json can't be read → fail-safe: ALL proposals blocked.

### 4.2 Config Snapshots + Revert

Every AI-applied change is preceded by a full JSON snapshot. One-click revert via `/improvement/proposals/{id}/revert`. Revert is idempotent.

### 4.3 Shadow Evaluation

7-day parallel config evaluation. Production config and proposed config run side-by-side. matchRate ≥85% = PASS, 50-85% = MARGINAL, <50% = FAIL. Shadow results inform but don't auto-apply.

### 4.4 Fatigue Monitor

3-state detection prevents learning from disengaged operators:

- **healthy_learning**: Corrections continuing at normal rate
- **confirmed_improvement**: Corrections dropping AND rejects dropping (Ted is learning)
- **suspected_fatigue**: Corrections dropping BUT rejects NOT dropping (operator disengaged)

### 4.5 Rubber-Stamping Detection

Fires when approval_rate >95% AND avg decision_time <30s for 14+ consecutive days. Alerts operator. Reduces proposal frequency.

### 4.6 Never-Go-Dark Principle

The system must never autonomously decide to stop functioning. Even in degraded mode:

- Accept operator input
- Display last known good state
- Log all events
- Surface "degraded mode" status

---

## 5. External Benchmarking

### Industry Comparison

| System                  | Self-Healing                 | Learning                                                      | Safety                                         |
| ----------------------- | ---------------------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| GitHub Copilot          | Retry + fallback model       | Telemetry-driven server-side                                  | No operator control                            |
| Cursor                  | Retry + multi-model routing  | In-session diff learning                                      | Session-scoped only                            |
| SaneBox                 | N/A                          | Non-action as signal, threshold drift                         | Implicit only                                  |
| Shortwave               | N/A                          | Draft diff → style prompt update                              | 10+ corrections gate                           |
| **Ted (current)**       | 14 self-healing capabilities | Full correction→proposal→apply loop                           | Constitution + shadow + fatigue + rubber-stamp |
| **Ted (with Tier 1)**   | 20 self-healing capabilities | Same + circuit breaker + provider fallback                    | Same + auto-recovery                           |
| **Ted (with Tier 1+2)** | 25 self-healing capabilities | + taxonomy classifier + engagement learning + noise reduction | + dynamic autonomy                             |

### Key External Patterns Applicable to Ted

1. **Circuit breaker** (from distributed systems): Already proven at Netflix, AWS. Direct application to Graph API endpoints.
2. **Non-action as signal** (from SaneBox): Emails/briefs not read = negative priority signal. Maps to engagement-based schedule optimization.
3. **Correction taxonomy** (from Shortwave/Cursor): Classify diffs by type → route to correct config domain. 2-3x improvement in Builder Lane targeting.
4. **Bounded modification spaces** (from Constitutional AI): Define min/max/step for every tunable parameter. Prevents runaway self-modification.
5. **Graduated disengagement** (novel for EA domain): 4-level noise reduction driven by fatigue monitor. No production EA system implements this yet.

---

## 6. Architecture for Self-Healing

### Three-Layer Separation

```
┌─────────────────────────────────────────────┐
│  OBSERVATION LAYER (append-only)             │
│  correction_signals.jsonl                     │
│  style_deltas.jsonl                           │
│  event_log.jsonl                              │
│  engagement_log.jsonl (NEW - SH-008)          │
│  circuit_breaker_state (in-memory - SH-001)   │
│  provider_health_scores (in-memory - SH-002)  │
└────────────────┬────────────────────────────┘
                 │ batch analysis
┌────────────────▼────────────────────────────┐
│  ANALYSIS LAYER (periodic, non-destructive)  │
│  detectCorrectionPatterns()                   │
│  classifyCorrection() (NEW - SH-007)         │
│  computeEngagementWindow() (NEW - SH-008)    │
│  assessDisengagementLevel() (NEW - SH-009)   │
│  evaluateAutonomyEligibility() (NEW - SH-010)│
└────────────────┬────────────────────────────┘
                 │ proposals
┌────────────────▼────────────────────────────┐
│  ACTION LAYER (gated by approval/shadow)     │
│  applyImprovementProposal() [with snapshot]  │
│  circuitBreakerTrip() [auto] (NEW - SH-001)  │
│  providerFallback() [auto] (NEW - SH-002)    │
│  configReload() [auto] (NEW - SH-003)        │
│  configRestore() [auto] (NEW - SH-004)       │
│  ledgerCompact() [auto] (NEW - SH-005)       │
│  proposalExpire() [auto] (NEW - SH-006)      │
└─────────────────────────────────────────────┘
```

### Event Types Required (additions to event_schema.json)

```
self_healing.circuit_breaker.tripped
self_healing.circuit_breaker.recovered
self_healing.provider.fallback
self_healing.provider.recovered
self_healing.config.drift_detected
self_healing.config.auto_reloaded
self_healing.config.restored_from_snapshot
self_healing.ledger.compacted
self_healing.proposal.auto_expired
self_healing.correction.classified
self_healing.engagement.window_computed
self_healing.disengagement.level_changed
self_healing.autonomy.promotion_proposed
self_healing.draft.zombie_detected
self_healing.draft.auto_retried
```

---

## 7. Council Vote

| Seat               | Vote | Notes                                                                                      |
| ------------------ | ---- | ------------------------------------------------------------------------------------------ |
| 1 — Architecture   | YES  | Three-layer separation is sound. Circuit breaker is overdue.                               |
| 2 — Extension      | YES  | No extension changes needed for Tier 1. Tier 2 may need 2-3 new gateway methods.           |
| 3 — UI             | YES  | Tier 1 is backend-only. Tier 2 SH-009 will need a noise reduction status card.             |
| 4 — Config         | YES  | Config drift reconciliation fills a real gap. Ledger compaction is critical for longevity. |
| 5 — Safety         | YES  | Constitution check + shadow eval + fatigue monitor provide sufficient guardrails.          |
| 6 — Healthcare M&A | YES  | Provider fallback is critical for HIPAA-entity Everest operations.                         |
| 7 — Governance     | YES  | Proposal auto-expiry reduces governance debt. Correction taxonomy improves signal quality. |
| 8 — Operations     | YES  | Zombie draft detection prevents operator-invisible failures.                               |
| 9 — Healthcare Ops | YES  | Provider fallback ensures continuity during Azure OpenAI outages.                          |
| 10 — Clinical PHI  | YES  | No PHI exposure risk in any proposed self-healing capability.                              |

**Result: 10/10 YES — Approved for implementation planning.**

---

## 8. References

- SDD 55: Builder Lane Proposal (correction signals, pattern detection, proposals)
- SDD 56: Builder Lane Implementation Plan (17 sub-tasks, all complete)
- SDD 57: Builder Lane Critical Review (10 gaps, all resolved)
- SDD 58: Builder Lane Task Breakdown (execution-ready, all complete)
- Council Cycle 009-012: Progressive hardening of all self-healing foundations
- External: GitHub Copilot telemetry patterns, SaneBox non-action signals, Shortwave draft learning, DSPy prompt optimization, Constitutional AI guardrails
