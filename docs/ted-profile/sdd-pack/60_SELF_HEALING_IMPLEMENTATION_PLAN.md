# SDD 60 — Self-Healing Implementation Plan (v2 — Council Research-Hardened)

**Date:** 2026-02-24
**Revised:** 2026-02-24 (v2 — incorporates council external research from 30+ trusted sources)
**Prerequisite:** SDD 59 (Council Assessment — 10/10 YES)
**Scope:** 15 self-healing capabilities across 3 tiers
**Estimated additions:** ~1,720 lines (Tier 1+2), ~600 lines (Tier 3)

---

## 0. Council Research Findings Summary

v2 incorporates findings from 5 parallel research streams covering 30+ external sources:

| Research Area            | Key Sources                                                   | Critical Finding                                                                          |
| ------------------------ | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Circuit breaker          | Netflix Hystrix, Resilience4j, Microsoft Polly, Martin Fowler | Use percentage-based threshold (50%) with min volume gate, not absolute count             |
| LLM fallback             | LiteLLM, OpenRouter, Portkey, Bifrost, Cloudflare EWMA        | EWMA health scoring with latency + error rate composite; intent-based tiering             |
| Config/ledger management | HIPAA 45 CFR §164.312(b), OSSEC, Tripwire, Chokidar           | **HIPAA requires 6-year audit log retention** — 90-day delete is a compliance violation   |
| Correction taxonomy      | LAMP corpus (CHI 2025), Wikipedia Edit Taxonomy, Shortwave    | 4 top-level categories correct, but need 12 sub-categories for proper routing             |
| Draft retry              | Microsoft Graph API docs, DLQ patterns, Graph SDK bug reports | Graph `sendMail` has NO idempotency key — draft-existence check is mandatory before retry |

### Changes from v1

- SH-001: Percentage-based threshold + workload-group keying + slow-call tracking + Retry-After awareness
- SH-002: EWMA health scoring + intent-based LLM tiering + prompt variant awareness + 3-layer retry/fallback/circuit
- SH-003: Schema validation before reload + inotify primary with poll fallback + atomic file writes
- SH-004: Full atomic replacement sequence (write-temp → fsync → rename → fsync-dir)
- SH-005: **HIPAA-compliant tiered retention** — hot (90d) → warm (1y compressed) → cold (6y integrity-verified). Archives NEVER deleted within 6 years.
- SH-006: Transition to "expired" status (not delete) + operator notification + resurrection path
- SH-007: 12 sub-categories (3 per top-level) + span-level classification + store final accepted version
- SH-008: Read vs. action engagement distinction + batch preference detection
- SH-009: Recovery/re-engagement mechanism at Level 3-4 + actionability filter
- SH-010: Dual-signal requirement (low corrections AND high engagement) + per-task-type promotion + explicit demotion triggers + mandatory shadow post-promotion
- SH-011: Draft-existence check before retry + error classification (transient vs non-transient) + staleness window (>24hr → dead-letter) + `dead_lettered` state in draft machine
- SH-012: Sampling strategy (100% high-stakes, 20% low-stakes) + LLM-as-judge pattern
- SH-013: Rule-based anomaly detection (not ML) + 6 specific pattern rules
- SH-014: Weekly micro-summaries → monthly roll-up + operator review gate + confidence decay

---

## 1. Implementation Strategy

### Phased Approach

- **Phase A** (Tier 1 — SH-001 through SH-006): Low risk, high value. All in server.mjs. No extension/UI changes. Ship immediately.
- **Phase B** (Tier 2 — SH-007 through SH-011): Medium risk. Requires shadow evaluation period. Some extension gateway + UI additions.
- **Phase C** (Tier 3 — SH-012 through SH-015): Research prototypes. External dependencies possible. Deferred until Phase A+B proven.

### Architecture Principle: Three-Layer Separation

All self-healing follows the same pattern:

```
OBSERVATION (append-only) → ANALYSIS (periodic, non-destructive) → ACTION (gated)
```

### Key Constraint

Self-healing MUST NOT modify `hard_bans.json` or `autonomy_ladder.json` (blocked by constitution check at server.mjs:9676). All auto-healing actions are either infrastructure-level (circuit breaker, retry) or go through the existing Builder Lane proposal→approval→apply pipeline.

---

## 2. Phase A — Tier 1 Tasks (6 tasks, ~505 lines)

### SH-001: Circuit Breaker per Graph Workload Group

**File:** `sidecars/ted-engine/server.mjs`
**Insert after:** Line 4725 (before `graphFetchWithRetry`)
**Lines:** ~100

**Design (revised per Hystrix/Resilience4j/Polly research):**

```
In-memory Map: _circuitBreakerState = new Map()
Key: workload group (NOT endpoint path — see group table below)
Value: {
  state: "closed"|"open"|"half-open",
  window: [{ timestamp, success, latencyMs }],  // 10-min sliding window
  openedAt: Date|null,
  cooldownMs: number,
  probeInFlight: boolean
}
```

**Workload groups (7):**
| Group Key | Covers |
|---|---|
| `outlook_mail` | `/users/*/messages`, `/me/messages`, `/users/*/mailFolders/*` |
| `outlook_calendar` | `/users/*/calendar/*`, `/users/*/events/*` |
| `planner` | `/planner/*`, `/groups/*/planner/*` |
| `todo` | `/me/todo/*` |
| `teams` | `/teams/*`, `/chats/*` |
| `sharepoint` | `/sites/*`, `/drives/*` |
| `users` | `/users/*` (resolution, profile) |

**Functions:**

- `classifyGraphWorkload(url)` — maps Graph URL to workload group key
- `getCircuitState(workloadGroup)` — returns current state
- `recordCircuitOutcome(workloadGroup, success, latencyMs, retryAfterSec)` — update sliding window
- `isCircuitOpen(workloadGroup)` — check before fetch; if open past cooldown, transition to half-open
- `tryHalfOpenProbe(workloadGroup)` — returns true if probe slot available (serialized via `probeInFlight` flag)

**Thresholds (revised — percentage-based with minimum volume):**

- **Failure rate threshold:** 50% (industry standard: Hystrix 50%, Polly 20%)
- **Minimum volume gate:** 5 calls in 10-minute window (prevents false positives on low traffic)
- **Slow-call threshold:** Calls >10s counted as slow; 80% slow-call rate also trips breaker
- **Cooldown:** `max(300_000ms, retryAfterSec * 1000)` — dynamic, respects Graph 429 Retry-After
- **Half-open:** 1 probe, serialized via `_probeInFlight` flag per group
- **Retry-After: 0 handling:** Treat as 30s minimum (per Microsoft guidance)

**Integration point:** Wrap inside `graphFetchWithRetry()` (line 4727):

```javascript
const workloadGroup = classifyGraphWorkload(url);
if (isCircuitOpen(workloadGroup)) {
  if (!tryHalfOpenProbe(workloadGroup)) {
    appendEvent("self_healing.circuit_breaker.tripped", "graph", { workload_group: workloadGroup });
    throw new Error(`Circuit open for ${workloadGroup} — serving degraded`);
  }
}
// After response:
recordCircuitOutcome(workloadGroup, response.ok, latencyMs, retryAfterSec);
```

**Events:** `self_healing.circuit_breaker.tripped`, `self_healing.circuit_breaker.recovered`, `self_healing.circuit_breaker.slow_call`

**Acceptance:** Circuit trips when >50% of calls fail in 10-min window (min 5 calls). After Retry-After-aware cooldown, allows one serialized probe. On probe success, circuit closes.

---

### SH-002: LLM Provider Auto-Fallback with EWMA Health Scoring

**File:** `sidecars/ted-engine/server.mjs`
**Modify:** `selectLlmProvider()` at line 3860
**Lines:** ~90

**Design (revised per LiteLLM/Portkey/Cloudflare EWMA research):**

```
In-memory Map: _providerHealth = new Map()
Key: provider name (e.g., "azure_openai", "anthropic", "openai")
Value: {
  calls: [{ timestamp, success, latencyMs }],  // 5-min sliding window
  ewmaLatency: number,      // EWMA with 60s time bias
  ewmaSuccessRate: number,  // EWMA with 60s time bias
  compositeScore: number,   // (successRate^4) * (1 / normalizedLatency)
  circuitState: "closed"|"open"|"half-open",
  openedAt: Date|null
}
```

**Three-layer request flow (revised — industry standard):**

1. **Check circuit breaker** for primary provider → if OPEN, skip to fallback immediately (no retry delay)
2. **If CLOSED:** Send to primary. On transient error (429/5xx): retry up to 2x with jitter backoff (200ms, 400ms). On permanent error (400/401/403): fall back immediately, no retry.
3. **If primary exhausted:** Fall back to next enabled provider. Apply same retry logic.
4. **If all providers exhausted:** Return error with explainability.
5. **Circuit breaker trips** after 3 failures in 60s per provider. Probe after 30s cooldown.

**Functions:**

- `recordProviderResult(provider, success, latencyMs)` — update EWMA + sliding window
- `computeProviderScore(provider)` — `(ewmaSuccessRate^4) * (1 / normalizedEwmaLatency)`. The ^4 exponent heavily penalizes errors over latency (industry standard from Cloudflare/Linkerd).
- `selectLlmProviderWithFallback(entity, intent)` — wraps existing `selectLlmProvider()`:
  1. Get primary from existing entity-based selection
  2. If primary compositeScore < 0.5 OR circuit open, select next enabled provider
  3. Return `{ provider, config, isFallback, estimatedCostDelta }`
- `probeProviderHealth()` — called every 5 minutes from scheduler; sends minimal prompt to degraded providers

**Intent-based tiering (new — 30-50% cost savings on simple tasks):**
| Intent Criticality | Examples | Model Tier |
|---|---|---|
| High | `morning_brief`, `deal_brief`, `improvement_proposal` | Frontier (GPT-4o / Claude Sonnet) |
| Medium | `meeting_prep`, `eod_digest`, `commitment_extract` | Mid-tier (GPT-4o-mini / Claude Haiku) |
| Low | `triage_classify`, `correction_classify` | Cheapest available |

**Prompt variant awareness:** Log `{ provider_used, intent, is_fallback }` on every LLM call. Emit warning event when falling back between provider families (e.g., Azure→Anthropic) since prompts may behave differently.

**Events:** `self_healing.provider.fallback`, `self_healing.provider.recovered`, `self_healing.provider.slow`

**Acceptance:** When primary LLM provider returns 5xx, circuit opens and next request immediately routes to fallback (no retry delay). When primary recovers (probe succeeds), traffic returns.

---

### SH-003: Config Drift Reconciliation with Schema Validation

**File:** `sidecars/ted-engine/server.mjs`
**Insert after:** Line 210 (after `snapshotPolicyState()`)
**Lines:** ~70

**Design (revised per OSSEC/Chokidar/K8s research):**

```
In-memory Map: _configHashes = new Map()
Key: config file path
Value: { hash: string, lastChecked: Date, lastValid: string }  // lastValid = last known-good contents
```

**Two-layer detection (new — inotify primary, poll fallback):**

- **Primary:** `fs.watch()` on `config/` directory for instant detection (sub-second, near-zero CPU)
- **Fallback:** Hash-based sweep every 5 minutes via scheduler (catches missed inotify events on NFS, overlayfs, etc.)

**Functions:**

- `hashConfigFile(filePath)` — compute SHA-256 of file contents
- `initConfigHashes()` — hash all 8 config files at startup, store in `_configHashes`
- `validateConfigSchema(filePath, contents)` — **NEW (critical safety)**: parse JSON, check required fields per config type. Returns `{ valid, errors }`. NEVER reload invalid config.
- `checkConfigDrift()` — called by inotify handler AND scheduler:
  1. Re-hash each config file
  2. Compare to stored hash
  3. If different:
     a. Read new file contents
     b. **Validate schema** — if invalid: log `self_healing.config.drift_detected` with `{ valid: false }`, do NOT reload, alert operator
     c. If valid: reload config, update hash, log `self_healing.config.auto_reloaded`
  4. If file missing: trigger SH-004 restore
- `setupConfigWatcher()` — `fs.watch('config/', ...)` with debounce (500ms, handles partial writes)

**Config files to monitor (8):**

- `hard_bans.json`, `brief_config.json`, `style_guide.json`, `draft_style.json`
- `autonomy_ladder.json`, `urgency_rules.json`, `operator_profile.json`, `builder_lane_config.json`

**Events:** `self_healing.config.drift_detected`, `self_healing.config.auto_reloaded`, `self_healing.config.validation_failed`

**Acceptance:** Manually edit a config file on disk → instant detection via inotify. Edit with invalid JSON → detected but NOT loaded, operator alerted.

---

### SH-004: Stale Config Recovery from Snapshots (Atomic Replacement)

**File:** `sidecars/ted-engine/server.mjs`
**Insert after:** SH-003 functions
**Lines:** ~40

**Design (revised per LWN.net atomic write research):**

**Functions:**

- `restoreConfigFromSnapshot(configPath)`:
  1. List files in `config/snapshots/` matching config filename
  2. Sort by timestamp (newest first)
  3. **Verify snapshot integrity:** hash and validate JSON before restore
  4. **Atomic replacement** (full 8-step sequence per LWN.net):
     a. Write snapshot contents to temp file in same directory
     b. `fs.fsyncSync(tempFd)` — ensure data on disk
     c. `fs.renameSync(tempPath, configPath)` — atomic on same filesystem
     d. Open parent directory with O_DIRECTORY, `fs.fsyncSync(dirFd)`, close — ensure directory entry durable
  5. Log `self_healing.config.restored_from_snapshot`
  6. Return true/false

**Events:** `self_healing.config.restored_from_snapshot`

**Acceptance:** Delete `draft_style.json` while server is running. SH-003 detects missing file, SH-004 restores from snapshot using atomic replacement, server continues operating.

---

### SH-005: HIPAA-Compliant Ledger Compaction with Tiered Retention

**File:** `sidecars/ted-engine/server.mjs`
**Insert after:** SH-004 functions
**Lines:** ~80

**Design (revised — CRITICAL compliance fix per HIPAA 45 CFR §164.312(b)):**

**HIPAA requires 6-year retention for audit logs in healthcare M&A applications.** The original plan implied deletion after 90 days. This is reframed as tiered archival:

**Tiered retention policy:**
| Tier | Duration | Storage | Format |
|---|---|---|---|
| **Hot (active)** | 0-90 days | Active JSONL files | Uncompressed |
| **Warm (archived)** | 90 days - 1 year | `data/archive/{ledger}_{YYYY-MM}.jsonl.gz` | Gzip compressed |
| **Cold (compliance)** | 1 - 6 years | Same directory, integrity-verified | Gzip + SHA-256 manifest |
| **Deletion** | After 6 years | Secure deletion with documentation | Per retention schedule |

**Functions:**

- `compactLedger(ledgerPath, maxAgeDays = 90)`:
  1. Read all lines from ledger
  2. Parse each, check `_ts` or `timestamp` field
  3. Lines older than `maxAgeDays` → compress and append to `data/archive/{ledger_name}_{YYYY-MM}.jsonl.gz`
  4. Lines newer → write to temp file, `fsync`, then atomic rename over original
  5. **Generate SHA-256 hash of archive file** → write to `data/archive/manifest.jsonl` for integrity verification
  6. Return `{ archived: number, retained: number, archive_path, archive_hash }`
- `runLedgerCompaction()`:
  1. Guard: `_compactionRunning` mutex (same pattern as `_ingestionRunning`)
  2. For each of 34 ledger paths: call `compactLedger()`
  3. **Stagger:** Process 3 ledgers per minute to avoid I/O spike (research: rotation causes 5-15% CPU spike)
  4. Log `self_healing.ledger.compacted` with summary stats
- `verifyArchiveIntegrity(archivePath)` — compare file hash against manifest entry

**Scheduler integration:** Add `ledger_compaction` job:

```json
{ "route": "/ops/self-healing/compact-ledgers", "cron": "0 3 * * 0", "label": "ledger_compaction" }
```

(Runs at 3 AM every Sunday)

**Safety:** Compaction is append-to-compressed-archive then atomic-replace active file. Archives are NEVER deleted within 6 years. Integrity manifest enables auditor verification.

**Events:** `self_healing.ledger.compacted`

**Acceptance:** Create ledger with entries >90 days old. Run compaction. Verify: old entries in compressed archive, recent entries retained in active file, manifest has hash entry, archive file passes integrity check.

---

### SH-006: Proposal Auto-Expiry with Notification + Resurrection

**File:** `sidecars/ted-engine/server.mjs`
**Insert after:** SH-005 functions (or near existing proposal logic at line 9632)
**Lines:** ~35

**Design (revised per Jira/ServiceNow workflow patterns):**

**Functions:**

- `expireStaleProposals()`:
  1. Read `proposals.jsonl` (line 127)
  2. For each with `status === "proposed"` and `_ts` older than 30 days:
     - Set `status = "expired"` (NOT "rejected" — different semantic)
     - Add `_expired_at`, `_expired_reason: "auto_expiry_30d"`
     - **Preserve full record** in ledger for audit trail (HIPAA retention applies)
  3. Rewrite ledger (atomic pattern from SH-005)
  4. Log `self_healing.proposal.auto_expired` for each
  5. **Emit notification event** for operator dashboard
- `resurrectProposal(proposalId)` — **NEW**: re-opens an expired proposal within 14-day grace period
  1. Check status === "expired" and `_expired_at` within last 14 days
  2. Set status back to "proposed", add `_resurrected_at`
  3. Log resurrection event

**Routes:** Add `POST /ops/builder-lane/proposals/{id}/resurrect`

**Events:** `self_healing.proposal.auto_expired`, `self_healing.proposal.resurrected`

**Acceptance:** Create a proposal with `_ts` >30 days ago. Run expiry. Verify: status changed to "expired", event logged, operator notified. Resurrect within 14 days → status back to "proposed".

---

## 3. Phase B — Tier 2 Tasks (5 tasks, ~630 lines)

### SH-007: Correction Taxonomy Classifier with 12 Sub-Categories

**File:** `sidecars/ted-engine/server.mjs`
**Insert after:** `appendCorrectionSignal()` at line 5118
**Lines:** ~130

**Design (revised per LAMP corpus CHI 2025, Wikipedia Edit Taxonomy):**

**12 sub-categories (3 per top-level):**
| Top-Level | Sub-Category | Description | Config Target |
|---|---|---|---|
| **Tone** | `tone.formality` | Formality mismatch (Hi→Dear, casual→formal) | `draft_style.json` voice |
| **Tone** | `tone.cliche` | Stock phrases, AI-isms removed | `draft_style.json` words_to_avoid |
| **Tone** | `tone.verbosity` | Purple prose, redundant qualifiers trimmed | `draft_style.json` length |
| **Content** | `content.missing` | Information added that wasn't generated | `brief_config.json` sections |
| **Content** | `content.redundant` | Unnecessary exposition removed | `brief_config.json` length |
| **Content** | `content.emphasis` | Priority/ordering changed | `brief_config.json` ordering |
| **Structure** | `structure.sentence` | Run-ons fixed, transitions added | `draft_style.json` format |
| **Structure** | `structure.document` | Sections reordered, headings changed | `draft_style.json` format |
| **Structure** | `structure.density` | Paragraph splits, whitespace, list formatting | `draft_style.json` format |
| **Factual** | `factual.data` | Numbers, dates, amounts corrected | No config (data error) |
| **Factual** | `factual.outdated` | Stale information updated | No config (data error) |
| **Factual** | `factual.attribution` | Name/source misattribution fixed | No config (data error) |

**Functions:**

- `classifyCorrection(originalText, editedText, context)`:
  1. **Span-level diff** (not document-level) — identify changed spans
  2. Heuristic classification per span:
     - Synonym swap with same POS → `tone.formality`
     - Common AI phrases removed ("I hope this finds you well") → `tone.cliche`
     - Words removed, meaning preserved → `tone.verbosity`
     - Sentences/paragraphs added → `content.missing`
     - Sentences removed → `content.redundant`
     - Same words, different order → `structure.document`
     - Numbers/dates/proper nouns changed → `factual.data`
  3. If heuristic confidence < 0.7, use LLM call with `"correction_classify"` intent
  4. Return `{ category, subcategory, confidence, evidence, spans }`
- `routeCorrectionToConfig(subcategory)` — maps subcategory to target config file

**Integration point:** Called from `appendCorrectionSignal()` after signal is recorded:

```javascript
const classification = classifyCorrection(original, edited, context);
signal._classification = classification;
signal._final_version = edited; // Store both diff AND final accepted version (per Shortwave pattern)
```

**Events:** `self_healing.correction.classified`

**Output contract:** Add `correction_classify` golden fixture to startup validation.

**Extension:** Add `ted.builder_lane.correction_taxonomy` gateway method (read-only).
**UI:** Add classification breakdown to Builder Lane Dashboard card (tag counts per subcategory).

**Acceptance:** Edit "Hi there!" to "Dear Mr. Phillips," → classified as `tone.formality`. Remove "I hope this email finds you well" → classified as `tone.cliche`. Add a paragraph about deal status → classified as `content.missing`.

---

### SH-008: Engagement-Based Schedule Optimization with Read/Action Distinction

**File:** `sidecars/ted-engine/server.mjs`
**New ledger:** `data/engagement.jsonl`
**Lines:** ~90

**Design (revised per Slack/Superhuman engagement research):**

**Functions:**

- `recordEngagement(contentType, deliveredAt, readAt, actionAt, interactionDurationMs)`:
  1. Append to `engagement.jsonl`:

  ```json
  {
    "content_type": "morning_brief",
    "delivered_at": "...",
    "read_at": "...",
    "read_latency_ms": 120000,
    "action_at": "...",
    "action_latency_ms": 300000,
    "duration_ms": 45000,
    "day_of_week": 2,
    "hour": 7,
    "engagement_type": "read_and_acted"
  }
  ```

  2. Content types: `morning_brief`, `eod_digest`, `meeting_prep`, `triage_alert`
  3. **Engagement types (new):** `read_only`, `read_and_acted`, `dismissed`, `not_opened`

- `computeEngagementWindow(contentType, lookbackDays = 14)`:
  1. Read `engagement.jsonl` for content type
  2. **Separate read latency from action latency** (new — research: a brief read but not acted on is a failed delivery)
  3. Group by `day_of_week` + `hour`
  4. Compute median action_latency per slot (lower = better time)
  5. Detect batch preference: if operator consistently reads 3+ items within 5 min → prefers digest mode
  6. Return `{ optimal_hour, optimal_day_range, confidence, sample_size, batch_preference }`
- `proposeScheduleChange()`:
  1. For each content type, compute optimal window
  2. Compare to current cron in `scheduler_config.json`
  3. If delta > 1 hour and confidence > 0.8 and sample_size >= 14: generate Builder Lane proposal
  4. Proposal type: `schedule_optimization`, target: `scheduler_config.json`

**Integration points:**

- Morning brief/EOD digest handlers: record `delivered_at` when sent
- `POST /ops/engagement/read-receipt` endpoint: UI calls when operator views content
- `POST /ops/engagement/action-receipt` endpoint: UI calls when operator takes action on a recommendation

**Events:** `self_healing.engagement.window_computed`, `self_healing.engagement.batch_preference_detected`

**Acceptance:** After 14+ days of engagement data with both read and action timestamps, system proposes schedule change and correctly identifies batch vs. drip preference.

---

### SH-009: Graduated Noise Reduction with Recovery Mechanism

**File:** `sidecars/ted-engine/server.mjs`
**Lines:** ~140

**Design (revised per healthcare alert fatigue research + Slack notification patterns):**

**Levels (revised — added recovery mechanism, actionability filter):**
| Level | Trigger | Action | Recovery |
|-------|---------|--------|----------|
| 0 — Engaged | `healthy_learning` + <5min read latency | All notifications at configured frequency | N/A |
| 1 — Consolidate | `healthy_learning` + read latency >2hrs | Batch non-urgent into daily digest. **Actionability filter:** only push items operator can act on now. | Auto-recover when read latency drops <30min for 3 consecutive days |
| 2 — Threshold | `suspected_fatigue` for <7 days | Raise urgency threshold 5→7, reduce calibration to 1/day. Suppress non-actionable items entirely. | Auto-recover after 3 days of active engagement (read + action on 2+ items/day) |
| 3 — Passive | `suspected_fatigue` for 7-14 days | Stop proactive notifications. Only respond to explicit requests. Log what _would_ have been sent. | **Re-engagement prompt:** "Here's what happened while you were away" summary when operator returns |
| 4 — Health Ping | `suspected_fatigue` for >14 days | Weekly single-line "Ted is here when you need me" ping. Accumulate backlog summary. | **Gradual ramp-up:** on re-engagement, deliver backlog summary first, then ramp notifications over 3 days (Level 4→2→1→0) |

**Functions:**

- `assessDisengagementLevel()`:
  1. Read fatigue monitor state from Builder Lane (line 10032)
  2. Read engagement.jsonl median read_latency + action_latency (from SH-008)
  3. Check behavioral signals: dismissed without reading > partial engagement > delayed response
  4. Compute days in current fatigue state
  5. Return `{ level: 0-4, days_in_state, trigger_signals }`
- `applyNoiseReductionPolicy(level)`:
  1. Update in-memory `_noiseReductionLevel`
  2. Adjust scheduler behavior: `schedulerTick()` checks level before dispatching
  3. Log `self_healing.disengagement.level_changed` on transitions
- `generateReengagementSummary()` — **NEW**: when operator returns after Level 3-4, produce "here's what happened" briefing covering missed items
- `isActionable(item, operator_context)` — **NEW**: filter notifications to only items operator can act on right now (per healthcare alert fatigue research: non-actionable alerts are the primary driver of fatigue)
- Integration with `schedulerTick()` (line 12036):
  ```javascript
  const nrLevel = assessDisengagementLevel();
  if (nrLevel >= 3 && !job.isExplicitRequest) continue;
  if (nrLevel >= 2 && job.urgency < 7) continue;
  if (nrLevel >= 1 && !isActionable(job)) continue;  // NEW: actionability filter
  if (nrLevel >= 1 && job.batchable) { batchQueue.push(job); continue; }
  ```

**Events:** `self_healing.disengagement.level_changed`, `self_healing.reengagement.summary_generated`

**Acceptance:** When fatigue monitor enters `suspected_fatigue` for 7+ days → Level 3 activates, proactive notifications stop. When operator returns and reads 2+ items → Level drops, re-engagement summary delivered, gradual ramp-up begins.

---

### SH-010: Dynamic Autonomy Ladder with Dual-Signal Safety

**File:** `sidecars/ted-engine/server.mjs`
**Lines:** ~120

**Design (revised per Parasuraman-Sheridan-Wickens model, correction fatigue research):**

**CRITICAL SAFETY CHANGE: Dual-signal requirement.**
Research on "learned helplessness" and "automation complacency" shows that low correction rates can mean the operator stopped correcting because they gave up, not because the system improved. Promotion now requires:

1. Low correction rate (<5%) — system is producing good output
2. **High engagement rate** — operator is actively reading AND acting on output (not ignoring it)

**Functions:**

- `evaluateAutonomyEligibility(taskType)`:
  1. Read correction_signals.jsonl for task type (last 30 days)
  2. Read engagement.jsonl for task type (last 30 days)
  3. Compute correction_rate AND engagement_rate
  4. **Dual-signal gate:**
     - correction_rate < 5% AND executions >= 20 AND no fatigue
     - **AND** engagement_rate > 70% (operator read+acted on >70% of outputs for this task type)
     - **AND** no factual corrections in last 30 days (factual errors = never auto-promote)
  5. If eligible: generate proposal to increase autonomy **for this specific task type**
  6. Return `{ eligible, correction_rate, engagement_rate, executions, current_level, proposed_level, blocking_reasons }`
- `proposeAutonomyIncrease(taskType, currentLevel, proposedLevel, evidence)`:
  1. Create Builder Lane proposal (type: `autonomy_promotion`)
  2. Include evidence: correction count, engagement rate, execution count, time window
  3. Constitution check: cannot exceed max autonomy level defined in hard_bans
  4. **Mandatory post-promotion shadow period** (7 days): system logs what it _would_ have done autonomously, operator can audit before change takes full effect
  5. Proposal goes through standard approval pipeline (operator must approve)
- `checkAutonomyDemotion(taskType)` — **NEW**: explicit demotion triggers
  1. Any factual correction → immediate demotion by 1 level
  2. Operator explicit override → immediate demotion by 1 level
  3. 3+ corrections in 7 days after promotion → revert to pre-promotion level
  4. Log `self_healing.autonomy.demotion_triggered`
- `runPeriodicCalibrationChallenge()` — **NEW**: even at high autonomy, periodically present a task for operator review. Detects silent disengagement.

**Per-task-type autonomy (new — per Parasuraman-Sheridan-Wickens):**
Autonomy levels are tracked per task type, not globally:

```json
{
  "draft_tone": { "level": 2, "promoted_at": "...", "shadow_until": "..." },
  "triage_classify": { "level": 3, "promoted_at": "..." },
  "meeting_prep": { "level": 1, "promoted_at": null }
}
```

**Autonomy levels** (from existing autonomy_ladder.json):

- Level 1: Draft + always confirm
- Level 2: Draft + confirm on high-value only
- Level 3: Execute + notify
- Level 4: Execute silently (never auto-promoted — hard_ban ceiling)

**Safety:** Level 4 is constitutionally blocked. Max auto-promotion is Level 2 → Level 3. Mandatory 7-day shadow post-promotion. Immediate demotion on factual error.

**Events:** `self_healing.autonomy.promotion_proposed`, `self_healing.autonomy.demotion_triggered`, `self_healing.autonomy.calibration_challenge`

**Acceptance:** After 20 uncorrected, high-engagement draft executions, system proposes promotion. After promotion, 7-day shadow period runs. If a factual correction occurs during shadow, demotion fires automatically.

---

### SH-011: Zombie Draft Detection with Safe Retry + Dead Letter

**File:** `sidecars/ted-engine/server.mjs`
**Lines:** ~80

**Design (revised per Graph API duplicate-send research + DLQ patterns):**

**CRITICAL SAFETY: Microsoft Graph `sendMail` has NO idempotency key.** Duplicate sends are a documented production issue. The non-negotiable safety gate: verify draft still exists in Drafts folder before EVERY retry.

**New draft states:**
Add `retry_pending` and `dead_lettered` to `DRAFT_TRANSITIONS`:

- `approved` → `retry_pending` (detected as zombie, retry scheduled)
- `retry_pending` → `executed` (retry succeeded)
- `retry_pending` → `dead_lettered` (max retries exceeded or non-transient error)
- `approved` → `dead_lettered` (staleness window exceeded)

**Error classification (new):**
| Error Type | Status Codes | Action |
|---|---|---|
| Transient | 429, 500, 502, 503, 504, timeout | Retry with backoff |
| Non-transient | 400, 401, 403, 404 | Immediately dead-letter |
| Ambiguous success | 202 Accepted | **NEVER retry** — Graph accepted the send |

**Functions:**

- `detectZombieDrafts()`:
  1. Read `draft_queue.jsonl` (line 109)
  2. Filter: `status === "approved"` AND `_ts` > 1 hour ago AND no corresponding `graph_message_id`
  3. **Staleness check (new):** If `_ts` > 24 hours ago, skip to dead-letter (context is stale — an email about a 3pm meeting retried at 5pm is worse than no email)
  4. Return list of zombie drafts
- `retryZombieDraft(draft)`:
  1. Call `ensureValidToken(profileId)` — token may have expired during stuck period
  2. **Draft-existence check (CRITICAL):** `GET /me/messages/{graph_message_id}`
     - If 404: draft was already sent → mark `executed`, do NOT retry
     - If 200 and NOT in Drafts folder → already sent → mark `executed`
     - If 200 and in Drafts folder → safe to retry
  3. Check retry count (`_retry_count`, max 3)
  4. Call `messages/{id}/send` via `graphFetchWithRetry()`
  5. **If 202:** Mark `executed` — do NOT retry a 202 (Graph accepted delivery)
  6. On transient error: increment `_retry_count`, set backoff (5min, 20min, 60min — not seconds, this is email)
  7. On non-transient error: immediately `dead_lettered` with error classification
  8. After 3 transient failures: `dead_lettered` with full error history
  9. Store `{ _retry_count, _retry_errors: [], _last_retry_at }` on draft

**Integration:** Add to `schedulerTick()`:

```javascript
const zombies = detectZombieDrafts();
for (const z of zombies) await retryZombieDraft(z);
```

**Events:** `self_healing.draft.zombie_detected`, `self_healing.draft.auto_retried`, `self_healing.draft.dead_lettered`

**UI:** Show `dead_lettered` status in draft queue card with error details + retry history. Offer manual "Retry" button for dead-lettered drafts.

**Acceptance:** Create a draft in "approved" state >1hr ago. Verify: draft-existence check fires before retry. On retry success: marked executed. On 3 transient failures: dead-lettered. On 400: immediately dead-lettered. On draft already sent (404): marked executed without retry.

---

## 4. Phase C — Tier 3 Tasks (4 tasks, ~600+ lines)

> **Note:** Tier 3 tasks are research-phase. v2 adds specific design decisions from research.

### SH-012: LLM Output Quality Monitoring (~180 lines)

**Pattern:** LLM-as-Judge (G-Eval) with sampling strategy.

**Scoring dimensions (revised — 5 dimensions):**
| Dimension | Method | Score |
|---|---|---|
| Relevance | LLM judge (prompt + output) | 0-1 |
| Completeness | Structural check (expected headers) + LLM judge | 0-1 |
| Format | Rule-based (length, greeting, sign-off, banned phrases) | 0-1 |
| Tone accuracy | LLM judge comparing against style_guide patterns | 0-1 |
| Safety | Existing `redactPhiFromMessages` + hard_bans check | Pass/Fail |

**Sampling strategy (new — cost-conscious):**
| Output Type | Sample Rate | Rationale |
|---|---|---|
| Email sends (draft execute) | 100% | High-stakes, operator-visible |
| Deal briefs | 100% | High-stakes, decision-informing |
| Morning brief / EOD digest | 50% | Medium-stakes |
| Triage classification | 20% | Low-stakes, high volume |
| Commitment extraction | 20% | Low-stakes |

**Alerting:** Rolling 7-day average < 0.6 on any dimension → event + operator dashboard alert.
**Feedback loop:** Low scores feed into Builder Lane correction signal pipeline.

Store in `data/llm_quality.jsonl`.

### SH-013: Predictive Failure Avoidance (~200 lines)

**Approach: Rule-based anomaly detection (NOT ML).** Research confirms ML requires weeks of baseline data and a training pipeline out of scope for a sidecar.

**6 specific detection rules:**
| Pattern | Detection Logic | Action |
|---|---|---|
| Graph failure spike | >5 `*.error` events with `graph` source in 1hr | Alert + suggest token check |
| Scheduler silence | Expected cron event not seen within 2x interval | Alert: "morning_brief has not fired today" |
| Draft execution streak | 3+ consecutive `draft.execute_failed` for same profile | Pause auto-retry, alert |
| Ingestion stall | No `ingestion.*` events in 6hr during business hours | Alert: "Inbox ingestion appears stalled" |
| Token refresh failure | `auth.token_refresh_failed` event | Preemptive alert before cascade |
| Quality degradation | Rolling average quality score < threshold (from SH-012) | Alert: "Draft quality declining" |

**Implementation:** Run `predictiveCheck()` on each `schedulerTick()`. Scan last 24hr of `event_log.jsonl`. Keep rules in `predictive_rules.json` (operator-tunable thresholds).

### SH-014: Cross-Session Memory Synthesis (~180 lines)

**Architecture: Mem0-inspired layered memory with incremental synthesis.**

**Key design decisions (revised):**

1. **Weekly micro-summaries** → monthly roll-up (not one giant monthly batch)
2. **Operator review gate:** Monthly synthesis is PROPOSED via Builder Lane (not auto-applied)
3. **Confidence decay:** Preferences with 0 reinforcing signals in 3 months → `confidence *= 0.5`
4. **Anti-drift safeguard:** Compare synthesis against constitution/operator intake config
5. **Cold-start:** Use existing voice extraction + archetype as baseline that synthesis refines

**Output:** `preference_summary.json` (structured, human-auditable) + `preference_synthesis.jsonl` (audit trail)
**Consumption:** Inject top-N preferences (confidence > 0.7) into LLM system prompts for drafting/briefing/triage.
**UI:** Dashboard card showing learned preferences with edit/delete controls.

### SH-015: DSPy-Style Prompt Optimization (External dep)

**Assessment:** DSPy is production-ready but Ted's Builder Lane pipeline is more transparent and auditable. DSPy should be layered on later to optimize prompt templates that Builder Lane generates, not replace the correction taxonomy and human-approval workflow.

**Deferred** until Phase A+B proven and Builder Lane has 30+ days of correction data.

---

## 5. Event Schema Additions

Add to `event_schema.json` under new `self_healing` namespace:

```json
"self_healing": {
  "self_healing.circuit_breaker.tripped": "Graph workload group circuit breaker tripped after failure rate exceeded threshold",
  "self_healing.circuit_breaker.recovered": "Graph workload group circuit breaker recovered (half-open probe succeeded)",
  "self_healing.circuit_breaker.slow_call": "Graph API call exceeded slow-call threshold (>10s)",
  "self_healing.provider.fallback": "LLM request routed to fallback provider after primary failure or circuit open",
  "self_healing.provider.recovered": "Primary LLM provider health restored (probe succeeded)",
  "self_healing.provider.slow": "LLM provider response exceeded latency threshold",
  "self_healing.config.drift_detected": "Config file on disk differs from last known hash",
  "self_healing.config.auto_reloaded": "Config file validated and auto-reloaded after drift detection",
  "self_healing.config.validation_failed": "Config file drift detected but reload blocked due to invalid schema",
  "self_healing.config.restored_from_snapshot": "Missing/corrupted config restored from snapshot directory via atomic replacement",
  "self_healing.ledger.compacted": "JSONL ledger entries older than retention period archived to compressed storage",
  "self_healing.proposal.auto_expired": "Improvement proposal auto-expired after 30 days in proposed status",
  "self_healing.proposal.resurrected": "Expired proposal re-opened within 14-day grace period",
  "self_healing.correction.classified": "Correction signal classified by 12-category taxonomy",
  "self_healing.engagement.window_computed": "Optimal delivery window computed from engagement data",
  "self_healing.engagement.batch_preference_detected": "Operator batch vs drip notification preference detected",
  "self_healing.disengagement.level_changed": "Noise reduction level changed based on fatigue monitor and engagement signals",
  "self_healing.reengagement.summary_generated": "Re-engagement summary generated for returning operator after fatigue period",
  "self_healing.autonomy.promotion_proposed": "Autonomy level increase proposed based on dual-signal (low corrections + high engagement)",
  "self_healing.autonomy.demotion_triggered": "Autonomy level decreased after factual error, override, or correction spike",
  "self_healing.autonomy.calibration_challenge": "Periodic calibration challenge presented to verify operator engagement at high autonomy",
  "self_healing.draft.zombie_detected": "Draft stuck in approved state >1hr detected by scheduler",
  "self_healing.draft.auto_retried": "Zombie draft retry attempted after draft-existence verification",
  "self_healing.draft.dead_lettered": "Draft moved to dead letter after max retries or non-transient error"
}
```

**Total after:** 184 + 24 = 208 event types across 39 namespaces.

---

## 6. New Routes

### Phase A (Tier 1) — 5 new routes:

| Method | Route                                        | Handler                  | Policy         |
| ------ | -------------------------------------------- | ------------------------ | -------------- |
| GET    | `/ops/self-healing/status`                   | `getSelfHealingStatus()` | WORKFLOW_ONLY  |
| POST   | `/ops/self-healing/config-check`             | `checkConfigDrift()`     | WORKFLOW_ONLY  |
| POST   | `/ops/self-healing/compact-ledgers`          | `runLedgerCompaction()`  | WORKFLOW_ONLY  |
| POST   | `/ops/self-healing/expire-proposals`         | `expireStaleProposals()` | WORKFLOW_ONLY  |
| POST   | `/ops/builder-lane/proposals/{id}/resurrect` | `resurrectProposal()`    | APPROVAL_FIRST |

### Phase B (Tier 2) — 5 new routes:

| Method | Route                                   | Handler                    | Policy           |
| ------ | --------------------------------------- | -------------------------- | ---------------- |
| POST   | `/ops/engagement/read-receipt`          | `recordEngagement()`       | ADAPTIVE_ALLOWED |
| POST   | `/ops/engagement/action-receipt`        | `recordEngagement()`       | ADAPTIVE_ALLOWED |
| GET    | `/ops/self-healing/engagement-insights` | `getEngagementInsights()`  | WORKFLOW_ONLY    |
| GET    | `/ops/self-healing/noise-level`         | `getNoiseReductionLevel()` | WORKFLOW_ONLY    |
| GET    | `/ops/self-healing/autonomy-status`     | `getAutonomyStatus()`      | WORKFLOW_ONLY    |

### MCP Tools — Phase A: 4 new tools

- `ted_self_healing_status` — read circuit breaker + provider health + config hashes
- `ted_compact_ledgers` — trigger ledger compaction
- `ted_expire_proposals` — trigger proposal expiry
- `ted_resurrect_proposal` — re-open expired proposal

### MCP Tools — Phase B: 3 new tools

- `ted_engagement_insights` — read engagement window analysis
- `ted_noise_level` — read current noise reduction level
- `ted_autonomy_status` — read autonomy eligibility per task type

---

## 7. New Ledgers

| Ledger                        | Phase      | Purpose                               | Retention       |
| ----------------------------- | ---------- | ------------------------------------- | --------------- |
| `data/engagement.jsonl`       | B (SH-008) | Operator interaction timestamps       | 6 years (HIPAA) |
| `data/llm_quality.jsonl`      | C (SH-012) | LLM output quality scores             | 6 years (HIPAA) |
| `data/archive/manifest.jsonl` | A (SH-005) | SHA-256 hashes of compressed archives | 6 years (HIPAA) |
| `data/archive/*.jsonl.gz`     | A (SH-005) | Compressed ledger archives            | 6 years (HIPAA) |

---

## 8. Extension Changes

### Phase A — 0 extension changes

All Tier 1 self-healing is infrastructure-level, internal to sidecar.

### Phase B — ~150 lines in `index.ts`

- 6 gateway methods: `ted.self_healing.status`, `ted.engagement.read_receipt`, `ted.engagement.action_receipt`, `ted.self_healing.engagement_insights`, `ted.self_healing.noise_level`, `ted.self_healing.autonomy_status`
- 4 agent tools: `ted_self_healing_status`, `ted_engagement_insights`, `ted_noise_level`, `ted_autonomy_status`

---

## 9. UI Changes

### Phase A — 0 UI changes

All Tier 1 self-healing is backend-only. The Self-Healing Status card is built in Phase B when the full extension wiring is done.

### Phase B — ~130 lines in views/ted.ts

- **Engagement Insights** section: Optimal windows per content type, read vs. action latency, batch preference, sample sizes.
- **Noise Reduction Badge**: Level 0-4 indicator with color coding + trigger description.
- **Autonomy Eligibility** table: Per-task-type autonomy levels, correction rate, engagement rate, blocking reasons, shadow status.
- **Correction Taxonomy** breakdown: Tag counts per 12 sub-categories, top patterns per domain.
- **Dead Letter** indicator on draft queue card: retry history + manual retry button.

---

## 10. Execution Waves

### Wave 1 — Config Foundation (~15 min)

```
Agent A: Add self_healing namespace to event_schema.json (24 events)
Agent B: Add TypeScript types for self-healing responses in types.ts
```

### Wave 2 — Sidecar Phase A (1 sequential agent, ~40 min)

```
Agent C: SH-001 → SH-002 → SH-003 → SH-004 → SH-005 → SH-006
  All in server.mjs. Sequential to avoid edit conflicts.
  + 5 new routes + 4 MCP tools + normalizeRoutePolicyKey + executionBoundaryPolicy entries
  ~505 lines added.
```

### Wave 3 — Phase A Verification (~5 min)

```
node --check server.mjs
npx tsc --noEmit
Proof script: proof_self_healing_a.sh (10 behavioral tests)
```

### Wave 4 — Sidecar Phase B (1 sequential agent, ~35 min)

```
Agent D: SH-007 → SH-008 → SH-009 → SH-010 → SH-011
  All in server.mjs. + 5 new routes + 3 MCP tools
  ~630 lines added.
```

### Wave 5 — Extension + UI for Phase B (2 parallel agents, ~15 min)

```
Agent E: Extension gateway methods + agent tools (index.ts, ~150 lines)
Agent F: UI state + controllers + views (4 files, ~255 lines)
```

### Wave 6 — Phase B Verification + Proof Scripts (~5 min)

```
node --check server.mjs
npx tsc --noEmit
Proof scripts: proof_self_healing_b.sh (12 behavioral tests)
```

---

## 11. Estimated File Sizes After Implementation

| File                 | Before    | Phase A | Phase B | After     |
| -------------------- | --------- | ------- | ------- | --------- |
| `server.mjs`         | ~13,497   | +505    | +630    | ~14,632   |
| `index.ts`           | ~9,550    | +0      | +150    | ~9,700    |
| `views/ted.ts`       | ~4,000    | +0      | +130    | ~4,130    |
| `controllers/ted.ts` | ~1,700    | +0      | +65     | ~1,765    |
| `types.ts`           | varies    | +35     | +45     | +80       |
| `event_schema.json`  | 184 types | +24     | +0      | 208 types |

---

## 12. Verification Matrix

| SH ID  | Proof Test                                              | Method                                                                      |
| ------ | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| SH-001 | Circuit breaker trips at 50% failure rate (min 5 calls) | Simulate Graph 5xx on 3/5 calls, verify trip                                |
| SH-001 | Retry-After-aware cooldown                              | Return 429 with Retry-After:120, verify cooldown ≥120s                      |
| SH-002 | Provider fallback on primary circuit open               | Primary circuit open, verify immediate fallback (no retry delay)            |
| SH-002 | EWMA score reflects latency + error rate                | Record slow call, verify composite score drops                              |
| SH-003 | Config drift detected after manual edit                 | Edit config file, verify instant detection via inotify                      |
| SH-003 | Invalid config NOT loaded                               | Write invalid JSON to config, verify rejection + alert                      |
| SH-004 | Config restored via atomic replacement                  | Delete config file, verify restore + fsync sequence                         |
| SH-005 | Ledger compaction with HIPAA-compliant archival         | Create old entries, compact, verify compressed archive + manifest hash      |
| SH-006 | Proposal expired + resurrection works                   | Expire proposal, resurrect within 14 days, verify status changes            |
| SH-007 | Correction classified to sub-category                   | Submit "Hi"→"Dear" edit, verify `tone.formality` classification             |
| SH-008 | Read vs. action engagement tracked separately           | Submit read receipt then action receipt, verify both recorded               |
| SH-009 | Noise level transitions with recovery                   | Set fatigue state 7+ days, verify Level 3 + re-engagement summary on return |
| SH-010 | Dual-signal blocks promotion on low engagement          | Low corrections but low engagement → verify promotion blocked               |
| SH-010 | Factual correction triggers demotion                    | Submit factual correction post-promotion → verify immediate demotion        |
| SH-011 | Draft-existence check prevents duplicate send           | Mark draft as already sent, verify no retry attempted                       |
| SH-011 | Stale draft dead-lettered                               | Create draft >24hr old, verify dead-lettered (not retried)                  |
| SH-011 | Non-transient error immediately dead-lettered           | Return 403, verify immediate dead-letter (no retry)                         |

---

## 13. Dependencies Between Tasks

```
SH-001 ← (standalone, no deps)
SH-002 ← (standalone, no deps)
SH-003 ← (standalone, no deps)
SH-004 ← SH-003 (called from drift check)
SH-005 ← (standalone, no deps)
SH-006 ← (standalone, no deps)
SH-007 ← (standalone, extends appendCorrectionSignal)
SH-008 ← (standalone, new ledger)
SH-009 ← SH-008 (reads engagement data for Level 1 threshold)
SH-010 ← SH-008 (reads engagement data for dual-signal gate)
SH-011 ← (standalone, reads draft_queue)
SH-012 ← (standalone, research)
SH-013 ← (standalone, research)
SH-014 ← SH-007 (uses classification data)
SH-015 ← (external dependency)
```

---

## 14. Safety Checklist (v2 — expanded)

- [ ] No self-healing capability modifies hard_bans.json directly
- [ ] No self-healing capability bypasses constitution check
- [ ] All autonomy promotions go through Builder Lane proposal pipeline
- [ ] **Autonomy promotion requires dual-signal: low corrections AND high engagement**
- [ ] **Factual corrections trigger immediate autonomy demotion**
- [ ] Circuit breaker serves degraded (not fabricated) data
- [ ] **Circuit breaker uses percentage-based threshold with minimum volume gate**
- [ ] LLM fallback logs which provider was used (audit trail)
- [ ] **LLM fallback emits cost delta event for financial tracking**
- [ ] Config restore only uses snapshots created by Ted's own backup mechanism
- [ ] **Config reload validates schema BEFORE applying — invalid config never loaded**
- [ ] **Config restore uses full atomic replacement (write-temp → fsync → rename → fsync-dir)**
- [ ] Ledger compaction is atomic (rename, not in-place rewrite)
- [ ] **Ledger archives retained for 6 years per HIPAA (never deleted within retention window)**
- [ ] **Archive integrity verified via SHA-256 manifest**
- [ ] Noise reduction Level 4 still accepts explicit operator requests
- [ ] **Noise reduction includes re-engagement mechanism (backlog summary + gradual ramp-up)**
- [ ] All self-healing events logged to event_log.jsonl
- [ ] **Zombie draft retry includes draft-existence check BEFORE every send attempt**
- [ ] **Never retry a 202 Accepted response from Graph sendMail**
- [ ] **Stale drafts (>24hr) dead-lettered, not retried**
- [ ] **Non-transient errors (400/401/403) immediately dead-lettered, not retried**
- [ ] Zombie draft retry has hard max (3 attempts with 5min/20min/60min backoff)

---

## 15. Council Review

This plan requires council vote before execution. Expected review focus:

- Seat 1 (Architecture): Workload-group circuit breaker + EWMA health scoring
- Seat 4 (Config): Drift reconciliation + schema validation + atomic restore
- Seat 5 (Safety): Dual-signal autonomy promotion + demotion triggers
- Seat 6 (Healthcare M&A): HIPAA 6-year retention compliance
- Seat 7 (Governance): Proposal auto-expiry + resurrection + noise reduction governance
- Seat 8 (Operations): Ledger compaction reliability + zombie draft DLQ
- Seat 10 (Clinical PHI): Archive integrity verification + retention manifest

---

## 16. References

### Internal

- SDD 59: Self-Healing Council Assessment (gap analysis, 10/10 YES vote)
- SDD 55-58: Builder Lane design, implementation, and review
- Council Cycles 009-012: Progressive hardening establishing self-healing foundation

### External — Circuit Breaker

- Netflix Hystrix — How it Works (GitHub Wiki)
- Resilience4j CircuitBreaker Documentation
- Microsoft Polly Circuit Breaker Strategy
- Martin Fowler — Circuit Breaker pattern
- Azure Architecture Center — Circuit Breaker Pattern
- Azure Architecture Center — Retry Storm Antipattern

### External — LLM Routing

- LiteLLM: Routing, Load Balancing & Fallbacks
- OpenRouter: Provider Routing + Model Fallbacks
- Portkey: Retries, Fallbacks, Circuit Breakers in LLM Apps
- Cloudflare: Dynamic Steering with EWMA
- Linkerd: Beyond Round Robin — Load Balancing for Latency
- Google Cloud: Building Bulletproof LLM Applications (SRE Best Practices)

### External — Config/Compliance

- HIPAA 45 CFR §164.312(b) — Audit log retention (6 years)
- NIST SP 800-66 Section 4.22 — HIPAA audit controls
- OSSEC/Wazuh — File Integrity Monitoring
- LWN.net — Atomic Writes on Linux
- Chokidar v5 — Node.js file watcher

### External — Correction Taxonomy

- LAMP Corpus (CHI 2025) — Can AI Writing Be Salvaged? (7 edit categories)
- Wikipedia Edit Intentions Taxonomy (Yang et al., EMNLP 2017)
- Shortwave Ghostwriter Architecture
- Superhuman Auto Drafts

### External — Alert Fatigue + Autonomy

- Healthcare Alert Fatigue Scoping Review 2025 (PMC)
- Parasuraman-Sheridan-Wickens — Levels of Automation (2000)
- SAE J3016 — Levels of Driving Automation
- Knight First Amendment Institute — Levels of Autonomy for AI Agents (2024)
- Mem0 — AI Memory Types and Architecture

### External — Draft Retry

- Microsoft Graph — sendMail 202 + Retry-After duplicate issue
- Microsoft Graph — Throttling Guidance
- AWS SQS — Dead Letter Queues
- Azure Event Grid — Retry and DLQ patterns
