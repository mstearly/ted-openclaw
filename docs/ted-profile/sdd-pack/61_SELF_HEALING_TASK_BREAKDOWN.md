# SDD 61 — Self-Healing Task Breakdown (v2 — Council Research-Hardened)

**Date:** 2026-02-24
**Revised:** 2026-02-24 (v2 — incorporates 30+ external research sources)
**Prerequisite:** SDD 59 (Assessment), SDD 60 v2 (Implementation Plan)
**Total sub-tasks:** 30 (Phase A: 14, Phase B: 12, Phase C: 4)

---

## Phase A — Tier 1: Low Risk, High Value

### Wave A1: Config Foundation

- [x] **SH-A01** — Add `self_healing` namespace (24 event types) to `event_schema.json`
  - File: `sidecars/ted-engine/config/event_schema.json`
  - Events: circuit_breaker.tripped, circuit_breaker.recovered, circuit_breaker.slow_call, provider.fallback, provider.recovered, provider.slow, config.drift_detected, config.auto_reloaded, config.validation_failed, config.restored_from_snapshot, ledger.compacted, proposal.auto_expired, proposal.resurrected, correction.classified, engagement.window_computed, engagement.batch_preference_detected, disengagement.level_changed, reengagement.summary_generated, autonomy.promotion_proposed, autonomy.demotion_triggered, autonomy.calibration_challenge, draft.zombie_detected, draft.auto_retried, draft.dead_lettered
  - Acceptance: JSON valid, 208 total event types, 39 namespaces

- [x] **SH-A02** — Add TypeScript types for self-healing responses
  - File: `ui/src/ui/types.ts`
  - Types: `TedSelfHealingStatus`, `TedCircuitBreakerState`, `TedProviderHealth`, `TedConfigDriftStatus`, `TedCompactionResult`, `TedEngagementInsights`, `TedNoiseLevel`, `TedAutonomyStatus`, `TedCorrectionClassification`
  - Acceptance: `npx tsc --noEmit` passes

### Wave A2: Sidecar Core (sequential in server.mjs)

- [x] **SH-A03** — Circuit breaker state + workload-group classification (SH-001)
  - File: `sidecars/ted-engine/server.mjs` (insert near line 4725)
  - Functions: `_circuitBreakerState` Map, `classifyGraphWorkload()` (7 workload groups), `getCircuitState()`, `recordCircuitOutcome()`, `isCircuitOpen()`, `tryHalfOpenProbe()`
  - **REVISED:** Percentage-based threshold (50% failure rate, min 5 calls in 10-min window), slow-call tracking (>10s), per-group `probeInFlight` serialization flag
  - ~50 lines
  - Depends on: nothing

- [x] **SH-A04** — Integrate circuit breaker into `graphFetchWithRetry()` (SH-001)
  - File: `sidecars/ted-engine/server.mjs` (modify line 4727)
  - Check `isCircuitOpen()` before fetch, `tryHalfOpenProbe()` for half-open serialization
  - Record outcome with `recordCircuitOutcome(group, success, latencyMs, retryAfterSec)`
  - **REVISED:** Dynamic cooldown = `max(300_000ms, retryAfterSec * 1000)`. Treat Retry-After:0 as 30s.
  - Emit `self_healing.circuit_breaker.tripped`, `.recovered`, `.slow_call` events
  - ~20 lines
  - Depends on: SH-A03

- [x] **SH-A05** — LLM provider EWMA health tracking (SH-002)
  - File: `sidecars/ted-engine/server.mjs` (insert near line 3858)
  - Functions: `_providerHealth` Map, `recordProviderResult()`, `computeProviderScore()`
  - **REVISED:** EWMA with 60s time bias (not 30-min window). Composite score: `(successRate^4) * (1/normalizedEwmaLatency)`. Per-provider circuit breaker (3 fails in 60s → open, 30s cooldown → half-open probe).
  - ~35 lines
  - Depends on: nothing

- [x] **SH-A06** — LLM 3-layer fallback in `selectLlmProvider()` (SH-002)
  - File: `sidecars/ted-engine/server.mjs` (modify line 3860)
  - **REVISED:** Three-layer flow: (1) check circuit, skip if open; (2) retry same provider 2x on transient; (3) fall back to next provider. Never retry 400/401/403.
  - Add `selectLlmProviderWithFallback(entity, intent)` returning `{ provider, config, isFallback, estimatedCostDelta }`
  - Add `probeProviderHealth()` — minimal prompt to degraded providers (5-min scheduler)
  - Intent-based tiering: tag each LLM call with criticality (high/medium/low) for future cost routing
  - Log `{ provider_used, intent, is_fallback, latency_ms, estimated_cost }` on every call
  - Emit `self_healing.provider.fallback`, `.recovered`, `.slow` events
  - ~55 lines
  - Depends on: SH-A05

- [x] **SH-A07** — Config drift reconciliation with schema validation (SH-003 + SH-004)
  - File: `sidecars/ted-engine/server.mjs` (insert near line 210)
  - Functions: `_configHashes` Map, `hashConfigFile()`, `initConfigHashes()`, `validateConfigSchema()`, `checkConfigDrift()`, `setupConfigWatcher()`, `restoreConfigFromSnapshot()`
  - **REVISED:** inotify primary (`fs.watch()` with 500ms debounce) + 5-min poll fallback. Schema validation BEFORE reload — invalid config rejected, NOT loaded, operator alerted.
  - **REVISED:** Atomic restore: write-temp → fsyncSync → renameSync → fsync parent dir (per LWN.net)
  - Monitor 8 config files, SHA-256 hash comparison
  - Emit `self_healing.config.drift_detected`, `.auto_reloaded`, `.validation_failed`, `.restored_from_snapshot` events
  - ~110 lines
  - Depends on: nothing

- [x] **SH-A08** — HIPAA-compliant ledger compaction (SH-005)
  - File: `sidecars/ted-engine/server.mjs` (insert after SH-A07)
  - Functions: `_compactionRunning` mutex, `compactLedger()`, `runLedgerCompaction()`, `verifyArchiveIntegrity()`
  - **REVISED:** Tiered retention: hot (90d active) → warm (compressed `.jsonl.gz` in `data/archive/`) → cold (6 years, integrity-verified). Archives NEVER deleted within 6 years.
  - SHA-256 hash of each archive written to `data/archive/manifest.jsonl`
  - Stagger: 3 ledgers per minute to avoid I/O spike
  - Atomic replacement for active file (write-temp → fsync → rename)
  - `mkdir -p data/archive` on startup
  - Covers all 34 ledger paths
  - Emit `self_healing.ledger.compacted` event
  - ~80 lines
  - Depends on: nothing

- [x] **SH-A09** — Proposal auto-expiry with notification + resurrection (SH-006)
  - File: `sidecars/ted-engine/server.mjs` (insert near line 9632)
  - Functions: `expireStaleProposals()`, `resurrectProposal()`
  - **REVISED:** Transition to "expired" status (NOT delete — HIPAA retention). Emit operator notification. Add resurrection path: re-open within 14-day grace period.
  - Route: POST `/ops/builder-lane/proposals/{id}/resurrect`
  - Emit `self_healing.proposal.auto_expired`, `.resurrected` events
  - ~35 lines
  - Depends on: nothing

- [x] **SH-A10** — Self-healing routes + normalizeRoutePolicyKey + executionBoundaryPolicy
  - File: `sidecars/ted-engine/server.mjs`
  - 5 routes: GET `/ops/self-healing/status`, POST `/ops/self-healing/config-check`, POST `/ops/self-healing/compact-ledgers`, POST `/ops/self-healing/expire-proposals`, POST `/ops/builder-lane/proposals/{id}/resurrect`
  - Handler: `getSelfHealingStatus()` — returns circuit breaker (per-workload-group), provider health (EWMA scores), config hashes, last compaction, archive manifest, proposal expiry stats
  - Add 5 `normalizeRoutePolicyKey` entries, 5 `executionBoundaryPolicy` entries
  - ~55 lines
  - Depends on: SH-A03, SH-A05, SH-A07, SH-A08, SH-A09

- [x] **SH-A11** — MCP tools for self-healing (Phase A)
  - File: `sidecars/ted-engine/server.mjs` (near MCP tools section)
  - 4 tools: `ted_self_healing_status`, `ted_compact_ledgers`, `ted_expire_proposals`, `ted_resurrect_proposal`
  - ~40 lines
  - Depends on: SH-A10

- [x] **SH-A12** — Scheduler integration for drift check + compaction + expiry + provider probe
  - File: `sidecars/ted-engine/server.mjs` (modify `schedulerTick()` at line 12036)
  - Add 4 jobs: config_drift_check (_/5 _ \* \* _), ledger_compaction (0 3 _ _ 0), proposal_expiry (0 4 _ \* _), provider_health_probe (_/5 \* \* \* \*)
  - Dispatch via `mcpCallInternal()` loopback
  - ~25 lines
  - Depends on: SH-A10

### Wave A3: Verification

- [x] **SH-A13** — Proof script: `proof_self_healing_a.sh`
  - File: `scripts/ted-profile/proof_self_healing_a.sh`
  - 10 tests: status 200 + ok field, config-check 200, compact-ledgers 200, expire-proposals 200, resurrect 404 (nonexistent), status has circuit_breakers field, status has provider_health field, status has config_hashes field, status has compaction field, status has archive_manifest field
  - Acceptance: `bash -n` passes, all tests behavioral (real HTTP)

- [x] **SH-A14** — Verify: `node --check server.mjs` + `npx tsc --noEmit`
  - All Phase A code compiles clean
  - Acceptance: zero errors

---

## Phase B — Tier 2: Medium Risk, High Value

### Wave B1: Sidecar Core (sequential in server.mjs)

- [x] **SH-B01** — Correction taxonomy classifier with 12 sub-categories (SH-007)
  - File: `sidecars/ted-engine/server.mjs` (insert after line 5118)
  - Functions: `classifyCorrection()` (span-level diff + heuristic + LLM fallback), `routeCorrectionToConfig()`
  - **REVISED:** 12 sub-categories (3 per top-level): tone.formality/cliche/verbosity, content.missing/redundant/emphasis, structure.sentence/document/density, factual.data/outdated/attribution
  - Integrate into `appendCorrectionSignal()` — add `_classification` and `_final_version` to signal
  - Add `correction_classify` golden fixture to output contracts
  - Emit `self_healing.correction.classified` event
  - ~130 lines
  - Depends on: nothing

- [x] **SH-B02** — Engagement tracking with read/action distinction (SH-008)
  - File: `sidecars/ted-engine/server.mjs`
  - New ledger: `data/engagement.jsonl`, new path constant
  - Functions: `recordEngagement()`, `computeEngagementWindow()`
  - **REVISED:** Track both read_latency and action_latency separately. Engagement types: read_only, read_and_acted, dismissed, not_opened. Detect batch preference.
  - Routes: POST `/ops/engagement/read-receipt`, POST `/ops/engagement/action-receipt`
  - ~60 lines
  - Depends on: nothing

- [x] **SH-B03** — Schedule optimization proposer (SH-008)
  - File: `sidecars/ted-engine/server.mjs`
  - Functions: `proposeScheduleChange()`, `getEngagementInsights()`
  - Route: GET `/ops/self-healing/engagement-insights`
  - Generates Builder Lane proposal when optimal window differs from current cron by >1hr
  - Emit `self_healing.engagement.window_computed`, `.batch_preference_detected` events
  - ~35 lines
  - Depends on: SH-B02

- [x] **SH-B04** — Graduated noise reduction with recovery (SH-009)
  - File: `sidecars/ted-engine/server.mjs`
  - Functions: `assessDisengagementLevel()`, `applyNoiseReductionPolicy()`, `generateReengagementSummary()`, `isActionable()`, `_noiseReductionLevel` state
  - **REVISED:** 5 levels (0-4) with recovery mechanism at each level. Actionability filter (only push actionable items). Re-engagement summary on return from Level 3-4. Gradual ramp-up (Level 4→2→1→0 over 3 days).
  - Integrate into `schedulerTick()` — check level before dispatching + actionability filter
  - Route: GET `/ops/self-healing/noise-level`
  - Emit `self_healing.disengagement.level_changed`, `.reengagement.summary_generated` events
  - ~140 lines
  - Depends on: SH-B02 (reads engagement data for Level 1)

- [x] **SH-B05** — Dynamic autonomy with dual-signal safety (SH-010)
  - File: `sidecars/ted-engine/server.mjs`
  - Functions: `evaluateAutonomyEligibility()`, `proposeAutonomyIncrease()`, `checkAutonomyDemotion()`, `runPeriodicCalibrationChallenge()`
  - **REVISED:** Dual-signal gate: low corrections (<5%) AND high engagement (>70%). Per-task-type promotion (not global). Mandatory 7-day shadow post-promotion. Explicit demotion triggers (factual error → immediate, 3+ corrections in 7 days → revert). Periodic calibration challenges.
  - Route: GET `/ops/self-healing/autonomy-status`
  - Emit `self_healing.autonomy.promotion_proposed`, `.demotion_triggered`, `.calibration_challenge` events
  - ~120 lines
  - Depends on: SH-B02 (reads engagement data for dual-signal gate)

- [x] **SH-B06** — Zombie draft detection with safe retry + dead letter (SH-011)
  - File: `sidecars/ted-engine/server.mjs`
  - Functions: `detectZombieDrafts()`, `retryZombieDraft()`
  - **REVISED:** Draft-existence check (GET graph_message_id) BEFORE every retry. Error classification: transient (429/5xx → retry with 5min/20min/60min backoff) vs non-transient (400/403 → immediate dead-letter). Never retry 202. Staleness window: >24hr → dead-letter. New states: `retry_pending`, `dead_lettered` in DRAFT_TRANSITIONS.
  - Integrate into `schedulerTick()` — check after regular jobs
  - Emit `self_healing.draft.zombie_detected`, `.auto_retried`, `.dead_lettered` events
  - ~80 lines
  - Depends on: nothing

- [x] **SH-B07** — Phase B routes + normalizeRoutePolicyKey + executionBoundaryPolicy + MCP tools
  - File: `sidecars/ted-engine/server.mjs`
  - 5 routes: POST `/ops/engagement/read-receipt`, POST `/ops/engagement/action-receipt`, GET `/ops/self-healing/engagement-insights`, GET `/ops/self-healing/noise-level`, GET `/ops/self-healing/autonomy-status`
  - 3 MCP tools: `ted_engagement_insights`, `ted_noise_level`, `ted_autonomy_status`
  - 5 normalizeRoutePolicyKey + 5 executionBoundaryPolicy entries
  - ~65 lines
  - Depends on: SH-B01 through SH-B06

### Wave B2: Extension + UI (parallel)

- [x] **SH-B08** — Extension gateway methods + agent tools
  - File: `extensions/ted-sidecar/index.ts`
  - 6 gateway methods: `ted.self_healing.status`, `ted.engagement.read_receipt`, `ted.engagement.action_receipt`, `ted.self_healing.engagement_insights`, `ted.self_healing.noise_level`, `ted.self_healing.autonomy_status`
  - 4 agent tools: `ted_self_healing_status`, `ted_engagement_insights`, `ted_noise_level`, `ted_autonomy_status`
  - Update `ted_agent.json` alsoAllow list
  - ~150 lines
  - Depends on: SH-B07

- [x] **SH-B09** — UI state + controllers
  - Files: `controllers/ted.ts` (+65), `app-view-state.ts` (+20), `app.ts` (+15)
  - State: selfHealingStatus, engagementInsights, noiseLevel, autonomyStatus, correctionTaxonomy + loading/error for each
  - Controllers: `fetchTedSelfHealingStatus()`, `fetchTedEngagementInsights()`, `fetchTedNoiseLevel()`, `fetchTedAutonomyStatus()`
  - ~100 lines
  - Depends on: SH-B08

- [x] **SH-B10** — UI prop wiring + views
  - Files: `app-render.ts` (+25), `views/ted.ts` (+130)
  - Cards: Self-Healing Status card (circuit breakers per workload group, provider EWMA health, config hashes, compaction, archive manifest), Engagement Insights section (read vs action latency, batch preference), Noise Reduction badge (Level 0-4 with trigger), Autonomy Eligibility table (per-task-type, dual-signal status, shadow period), Correction Taxonomy breakdown (12 sub-category tag counts), Dead Letter indicator on draft queue
  - Wire ~15 props
  - ~155 lines
  - Depends on: SH-B09

### Wave B3: Verification

- [x] **SH-B11** — Proof script: `proof_self_healing_b.sh`
  - File: `scripts/ted-profile/proof_self_healing_b.sh`
  - 12 tests: engagement read-receipt 200, engagement action-receipt 200, engagement-insights 200, noise-level 200, autonomy-status 200, noise-level has level+trigger fields, autonomy-status has tasks+dual_signal fields, engagement read vs action distinction, correction taxonomy in signal response, self-healing status has workload-group circuit breakers, self-healing status has EWMA provider health, zombie detection field in status
  - Acceptance: `bash -n` passes, all tests behavioral

- [x] **SH-B12** — Verify: `node --check server.mjs` + `npx tsc --noEmit`
  - All Phase B code compiles clean
  - Acceptance: zero errors

---

## Phase C — Tier 3: Research Phase (prototype when ready)

- [ ] **SH-C01** — LLM output quality monitoring prototype (SH-012)
  - Scope: LLM-as-Judge (G-Eval) scoring on relevance/completeness/format/tone/safety
  - Sampling: 100% high-stakes (email sends, deal briefs), 20% low-stakes (triage, extraction)
  - Ledger: `data/llm_quality.jsonl`
  - Alert on rolling 7-day average < 0.6 on any dimension
  - Feed low scores into Builder Lane correction signal pipeline

- [ ] **SH-C02** — Predictive failure avoidance prototype (SH-013)
  - Scope: Rule-based anomaly detection (NOT ML) — 6 specific patterns
  - Rules: Graph failure spike, scheduler silence, draft failure streak, ingestion stall, token refresh failure, quality degradation
  - Run `predictiveCheck()` on each `schedulerTick()`
  - Config: `predictive_rules.json` (operator-tunable thresholds)

- [ ] **SH-C03** — Cross-session memory synthesis (SH-014)
  - Scope: Mem0-inspired layered memory with incremental synthesis
  - Weekly micro-summaries → monthly roll-up → operator review via Builder Lane proposal
  - Confidence decay: 0 reinforcing signals in 3 months → `confidence *= 0.5`
  - Output: `preference_summary.json` (structured) + `preference_synthesis.jsonl` (audit trail)
  - UI: Learned preferences card with edit/delete controls

- [ ] **SH-C04** — DSPy-style prompt optimization (SH-015)
  - Scope: Weekly prompt optimization from correction pairs
  - External dependency: DSPy or equivalent
  - Deferred until Phase A+B proven and 30+ days of correction data accumulated
  - Layer on top of Builder Lane (not replace it)

---

## Execution Summary

| Wave | Tasks          | Files                        | Est. Lines | Parallel?       |
| ---- | -------------- | ---------------------------- | ---------- | --------------- |
| A1   | SH-A01, SH-A02 | event_schema.json, types.ts  | ~60        | Yes (2 agents)  |
| A2   | SH-A03–SH-A12  | server.mjs                   | ~505       | No (sequential) |
| A3   | SH-A13, SH-A14 | proof script + verify        | ~60        | Yes             |
| B1   | SH-B01–SH-B07  | server.mjs                   | ~630       | No (sequential) |
| B2   | SH-B08–SH-B10  | index.ts, controllers, views | ~405       | Yes (2 agents)  |
| B3   | SH-B11, SH-B12 | proof script + verify        | ~70        | Yes             |
| C    | SH-C01–SH-C04  | TBD                          | ~600+      | Deferred        |

**Phase A total:** ~625 lines across 2 files + 1 proof script
**Phase B total:** ~1,095 lines across 6 files + 1 proof script
**Phase C total:** ~600+ lines (deferred)

---

## Key v2 Changes Summary

| Task       | v1 Design                                            | v2 Research-Hardened Design                                                                             |
| ---------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| SH-A03/A04 | 5 failures in 10 min, per-endpoint-path              | 50% failure rate + min 5 calls, per-workload-group (7), slow-call, Retry-After-aware cooldown           |
| SH-A05/A06 | successCount/totalCount, 30-min decay, threshold 0.3 | EWMA (60s bias), composite (successRate^4 \* 1/latency), 3-layer retry/fallback/circuit, intent tiering |
| SH-A07     | Hash + auto-reload                                   | inotify primary + poll fallback, schema validation before reload, atomic restore (8-step)               |
| SH-A08     | 90-day archive (implied delete)                      | HIPAA 6-year tiered retention, compressed archives, SHA-256 manifest, staggered compaction              |
| SH-A09     | Auto-expire to "expired"                             | + Operator notification + 14-day resurrection grace period                                              |
| SH-B01     | 4 categories                                         | 12 sub-categories (3 per top-level), span-level, store final version                                    |
| SH-B02     | Single timestamp                                     | Read vs. action latency, 4 engagement types, batch preference                                           |
| SH-B04     | 5 levels                                             | + Recovery mechanism, actionability filter, re-engagement summary, gradual ramp-up                      |
| SH-B05     | Correction rate only                                 | Dual-signal (corrections + engagement), per-task-type, shadow post-promotion, demotion triggers         |
| SH-B06     | Simple retry, max 3                                  | Draft-existence check, error classification, staleness window, dead_lettered state, 5/20/60min backoff  |

---

## Dependencies Graph

```
SH-A01 ──┐
SH-A02 ──┤
          ├→ Wave A2 start
SH-A03 → SH-A04 ─┐
SH-A05 → SH-A06 ─┤
SH-A07 ───────────┤
SH-A08 ───────────┼→ SH-A10 → SH-A11 → SH-A12 → SH-A13/A14
SH-A09 ───────────┘

SH-B01 ───────────┐
SH-B02 → SH-B03 ─┤
SH-B02 → SH-B04 ─┤
SH-B02 → SH-B05 ─┤
SH-B06 ───────────┼→ SH-B07 → SH-B08 ──→ SH-B09 → SH-B10 → SH-B11/B12
```
