import fs from "node:fs";

/**
 * Self-Healing module — extracted from server.mjs (P1-1-004).
 *
 * Exports:
 *   createSelfHealingCore(deps) — business logic and module state
 *   createSelfHealingHandlers(core) — route handler surface
 *   dispatchSelfHealingRoute(ctx, handlers) — route dispatch, returns true if handled
 */

const CORRECTION_SUBCATEGORIES = {
  tone: ["tone.formality", "tone.cliche", "tone.verbosity"],
  content: ["content.missing", "content.redundant", "content.emphasis"],
  structure: ["structure.sentence", "structure.document", "structure.density"],
  factual: ["factual.data", "factual.outdated", "factual.attribution"],
};

const AI_CLICHE_PHRASES = [
  "i hope this finds you well",
  "i wanted to reach out",
  "please don't hesitate",
  "at the end of the day",
  "moving forward",
  "circle back",
  "touch base",
  "per our conversation",
  "as discussed",
  "just checking in",
  "loop in",
  "low-hanging fruit",
  "synergy",
  "paradigm shift",
  "leverage",
];

const ZOMBIE_DRAFT_STALE_HOURS = 24;

export function createSelfHealingCore(deps) {
  const {
    appendEvent,
    appendJsonlLine,
    readJsonlLines,
    correctionSignalsPath,
    builderLaneStatusPath,
    eventLogPath,
    gtdActionsPath,
    commitmentLedgerPath,
    engagementLedgerPath,
    autonomyPerTaskPath,
    buildDraftQueueState,
    draftQueueLedgerPath,
    logLine,
  } = deps;

  let _noiseReductionLevel = 0;
  let _noiseReductionDaysInState = 0;

  function _classifyCorrection(originalText, editedText, _context = {}) {
    if (!originalText || !editedText || originalText === editedText) {
      return {
        category: "content",
        subcategory: "content.missing",
        confidence: 0,
        evidence: "no_diff",
        spans: [],
      };
    }

    const origWords = originalText.split(/\s+/);
    const editWords = editedText.split(/\s+/);
    const origLower = originalText.toLowerCase();
    const editLower = editedText.toLowerCase();
    const spans = [];
    const lenRatio = editWords.length / Math.max(origWords.length, 1);

    for (const cliche of AI_CLICHE_PHRASES) {
      if (origLower.includes(cliche) && !editLower.includes(cliche)) {
        spans.push({ original: cliche, edited: "(removed)", reason: "cliche_removal" });
      }
    }
    if (spans.length > 0) {
      return {
        category: "tone",
        subcategory: "tone.cliche",
        confidence: 0.9,
        evidence: `Removed ${spans.length} stock phrase(s)`,
        spans,
      };
    }

    const formalityPatterns = [
      { from: /\b(hi|hey|hiya)\b/i, to: /\b(dear|mr\.|ms\.|dr\.)\b/i },
      { from: /\b(thanks|thx)\b/i, to: /\b(thank you|sincerely|regards)\b/i },
    ];
    for (const fp of formalityPatterns) {
      if (fp.from.test(origLower) && fp.to.test(editLower)) {
        return {
          category: "tone",
          subcategory: "tone.formality",
          confidence: 0.85,
          evidence: "Salutation/closing formality changed",
          spans: [
            {
              original: origLower.match(fp.from)?.[0] || "",
              edited: editLower.match(fp.to)?.[0] || "",
              reason: "formality_upgrade",
            },
          ],
        };
      }
    }

    if (lenRatio < 0.8 && editWords.length > 5) {
      return {
        category: "tone",
        subcategory: "tone.verbosity",
        confidence: 0.75,
        evidence: `Word count reduced ${origWords.length}→${editWords.length} (${Math.round((1 - lenRatio) * 100)}% reduction)`,
        spans: [],
      };
    }

    if (lenRatio > 1.3) {
      return {
        category: "content",
        subcategory: "content.missing",
        confidence: 0.75,
        evidence: `Content added: ${editWords.length - origWords.length} words`,
        spans: [],
      };
    }

    if (lenRatio < 0.6) {
      return {
        category: "content",
        subcategory: "content.redundant",
        confidence: 0.7,
        evidence: `Content removed: ${origWords.length - editWords.length} words`,
        spans: [],
      };
    }

    const numberPattern = /\b\d[\d,.]+\b/g;
    const origNumbers = (origLower.match(numberPattern) || []).toSorted();
    const editNumbers = (editLower.match(numberPattern) || []).toSorted();
    if (origNumbers.length > 0 && JSON.stringify(origNumbers) !== JSON.stringify(editNumbers)) {
      return {
        category: "factual",
        subcategory: "factual.data",
        confidence: 0.85,
        evidence: `Numbers changed: [${origNumbers.join(",")}] → [${editNumbers.join(",")}]`,
        spans: origNumbers.map((n, i) => ({
          original: n,
          edited: editNumbers[i] || "(removed)",
          reason: "number_change",
        })),
      };
    }

    const origParas = originalText
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    const editParas = editedText
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (origParas.length > 1 && editParas.length > 1 && origParas.length === editParas.length) {
      let reordered = false;
      for (let i = 0; i < origParas.length; i++) {
        if (origParas[i] !== editParas[i] && editParas.includes(origParas[i])) {
          reordered = true;
          break;
        }
      }
      if (reordered) {
        return {
          category: "structure",
          subcategory: "structure.document",
          confidence: 0.8,
          evidence: "Paragraphs reordered",
          spans: [],
        };
      }
    }

    return {
      category: "content",
      subcategory: "content.emphasis",
      confidence: 0.5,
      evidence: "General content edit — emphasis/priority change inferred",
      spans: [],
    };
  }

  function getCorrectionTaxonomyBreakdown() {
    const signals = readJsonlLines(correctionSignalsPath);
    const breakdown = {};
    for (const cat of Object.keys(CORRECTION_SUBCATEGORIES)) {
      breakdown[cat] = { total: 0, subcategories: {} };
      for (const sub of CORRECTION_SUBCATEGORIES[cat]) {
        breakdown[cat].subcategories[sub] = 0;
      }
    }
    for (const s of signals) {
      const cls = s._classification;
      if (cls && cls.category && breakdown[cls.category]) {
        breakdown[cls.category].total++;
        if (
          cls.subcategory &&
          breakdown[cls.category].subcategories[cls.subcategory] !== undefined
        ) {
          breakdown[cls.category].subcategories[cls.subcategory]++;
        }
      }
    }
    return breakdown;
  }

  function recordEngagement(contentType, deliveredAt, readAt, actionAt, interactionDurationMs) {
    const now = new Date();
    const delivered = new Date(deliveredAt);
    const record = {
      _ts: now.toISOString(),
      content_type: contentType,
      delivered_at: delivered.toISOString(),
      read_at: readAt ? new Date(readAt).toISOString() : null,
      read_latency_ms: readAt ? new Date(readAt).getTime() - delivered.getTime() : null,
      action_at: actionAt ? new Date(actionAt).toISOString() : null,
      action_latency_ms: actionAt ? new Date(actionAt).getTime() - delivered.getTime() : null,
      duration_ms: interactionDurationMs || null,
      day_of_week: now.getDay(),
      hour: now.getHours(),
      engagement_type: actionAt ? "read_and_acted" : readAt ? "read_only" : "not_opened",
    };
    appendJsonlLine(engagementLedgerPath, record);
    appendEvent("self_healing.engagement.recorded", "engagement", {
      content_type: contentType,
      engagement_type: record.engagement_type,
    });
  }

  function computeEngagementWindow(contentType, lookbackDays = 14) {
    const lines = readJsonlLines(engagementLedgerPath);
    const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
    const relevant = lines.filter(
      (l) => l.content_type === contentType && l._ts && new Date(l._ts).getTime() > cutoff,
    );
    if (relevant.length === 0) {
      return {
        optimal_hour: null,
        confidence: 0,
        sample_size: 0,
        batch_preference: false,
        median_read_latency_ms: null,
        median_action_latency_ms: null,
      };
    }

    const byHour = {};
    const readLatencies = [];
    const actionLatencies = [];
    for (const r of relevant) {
      const h = r.hour ?? new Date(r._ts).getHours();
      if (!byHour[h]) {
        byHour[h] = [];
      }
      if (r.action_latency_ms != null) {
        byHour[h].push(r.action_latency_ms);
        actionLatencies.push(r.action_latency_ms);
      }
      if (r.read_latency_ms != null) {
        readLatencies.push(r.read_latency_ms);
      }
    }

    let optimalHour = null;
    let bestMedian = Infinity;
    for (const [hour, latencies] of Object.entries(byHour)) {
      if (latencies.length === 0) {
        continue;
      }
      latencies.sort((a, b) => a - b);
      const median = latencies[Math.floor(latencies.length / 2)];
      if (median < bestMedian) {
        bestMedian = median;
        optimalHour = parseInt(hour);
      }
    }

    let batchCount = 0;
    const sortedByRead = relevant
      .filter((r) => r.read_at)
      .toSorted((a, b) => (a.read_at || "").localeCompare(b.read_at || ""));
    for (let i = 0; i < sortedByRead.length - 2; i++) {
      const t1 = new Date(sortedByRead[i].read_at).getTime();
      const t3 = new Date(sortedByRead[i + 2].read_at).getTime();
      if (t3 - t1 < 5 * 60 * 1000) {
        batchCount++;
      }
    }

    readLatencies.sort((a, b) => a - b);
    actionLatencies.sort((a, b) => a - b);
    return {
      optimal_hour: optimalHour,
      confidence: +Math.min(relevant.length / 14, 1).toFixed(2),
      sample_size: relevant.length,
      batch_preference: batchCount >= 3,
      median_read_latency_ms:
        readLatencies.length > 0 ? readLatencies[Math.floor(readLatencies.length / 2)] : null,
      median_action_latency_ms:
        actionLatencies.length > 0 ? actionLatencies[Math.floor(actionLatencies.length / 2)] : null,
    };
  }

  function getEngagementInsights() {
    const contentTypes = ["morning_brief", "eod_digest", "meeting_prep", "triage_alert"];
    const insights = {};
    for (const ct of contentTypes) {
      insights[ct] = computeEngagementWindow(ct);
    }
    return insights;
  }

  function assessDisengagementLevel() {
    const engagement = readJsonlLines(engagementLedgerPath);
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const recent = engagement.filter((e) => e._ts && now - new Date(e._ts).getTime() < sevenDays);
    const triggerSignals = [];

    let fatigueDetected = false;
    let fatigueDays = 0;
    try {
      const blStatus = readJsonlLines(builderLaneStatusPath);
      const fatigueEntries = blStatus
        .filter((s) => s.kind === "fatigue_detected")
        .toSorted((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
      if (fatigueEntries.length > 0) {
        fatigueDetected = true;
        fatigueDays = Math.floor(
          (now - new Date(fatigueEntries[0].timestamp).getTime()) / (24 * 60 * 60 * 1000),
        );
        triggerSignals.push(`fatigue_detected_${fatigueDays}d`);
      }
    } catch {
      /* intentional: ledger may not exist */
    }

    const readLatencies = recent
      .filter((e) => e.read_latency_ms != null)
      .map((e) => e.read_latency_ms);
    const medianReadLatency =
      readLatencies.length > 0
        ? readLatencies.toSorted((a, b) => a - b)[Math.floor(readLatencies.length / 2)]
        : null;
    if (medianReadLatency != null) {
      triggerSignals.push(`median_read_latency_${Math.round(medianReadLatency / 1000)}s`);
    }

    const acted = recent.filter((e) => e.engagement_type === "read_and_acted").length;
    const total = recent.length;
    const actionRate = total > 0 ? acted / total : 0;
    triggerSignals.push(`action_rate_${Math.round(actionRate * 100)}pct`);

    let level = 0;
    if (fatigueDetected && fatigueDays > 14) {
      level = 4;
    } else if (fatigueDetected && fatigueDays >= 7) {
      level = 3;
    } else if (fatigueDetected && fatigueDays > 0) {
      level = 2;
    } else if (medianReadLatency && medianReadLatency > 2 * 60 * 60 * 1000) {
      level = 1;
    }

    if (level >= 2 && actionRate > 0.5 && recent.length >= 6) {
      level = Math.max(level - 1, 0);
      triggerSignals.push("recovery_active_engagement");
    }

    if (level !== _noiseReductionLevel) {
      appendEvent("self_healing.disengagement.level_changed", "noise_reduction", {
        from_level: _noiseReductionLevel,
        to_level: level,
        trigger_signals: triggerSignals,
      });
      logLine(
        `NOISE_REDUCTION: Level ${_noiseReductionLevel} → ${level} (${triggerSignals.join(", ")})`,
      );
      _noiseReductionLevel = level;
      _noiseReductionDaysInState = 0;
    } else {
      _noiseReductionDaysInState++;
    }

    return {
      level,
      days_in_state: _noiseReductionDaysInState,
      trigger_signals: triggerSignals,
      read_latency_ms: medianReadLatency,
      action_rate: +actionRate.toFixed(2),
    };
  }

  function _generateReengagementSummary() {
    const events = readJsonlLines(eventLogPath);
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const missed = events.filter(
      (e) =>
        e._ts &&
        new Date(e._ts).getTime() > cutoff &&
        (e.event_type || "").startsWith("scheduler.dispatch.success"),
    );
    const pendingActions = readJsonlLines(gtdActionsPath).filter(
      (a) => a.status === "active",
    ).length;
    const pendingCommitments = readJsonlLines(commitmentLedgerPath).filter(
      (c) => c.status === "open" || c.status === "active",
    ).length;
    const keyItems = [];
    if (pendingActions > 0) {
      keyItems.push({
        type: "gtd_actions",
        summary: `${pendingActions} open action(s)`,
        priority: 1,
      });
    }
    if (pendingCommitments > 0) {
      keyItems.push({
        type: "commitments",
        summary: `${pendingCommitments} open commitment(s)`,
        priority: 1,
      });
    }
    keyItems.push({
      type: "briefs_missed",
      summary: `${missed.length} scheduled delivery/deliveries since last engagement`,
      priority: 2,
    });

    appendEvent("self_healing.reengagement.summary_generated", "noise_reduction", {
      missed_count: missed.length,
      key_items: keyItems.length,
    });
    return {
      title: "Here's what happened while you were away",
      missed_count: missed.length,
      key_items: keyItems,
      backlog_hours: Math.round(_noiseReductionDaysInState * 24 || 0),
    };
  }

  function getAutonomyPerTask() {
    try {
      return JSON.parse(fs.readFileSync(autonomyPerTaskPath, "utf8"));
    } catch {
      const defaults = {
        draft_tone: { level: 1 },
        triage_classify: { level: 1 },
        meeting_prep: { level: 1 },
        commitment_extract: { level: 1 },
      };
      fs.writeFileSync(autonomyPerTaskPath, JSON.stringify(defaults, null, 2) + "\n", "utf8");
      return defaults;
    }
  }

  function saveAutonomyPerTask(data) {
    fs.writeFileSync(autonomyPerTaskPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  }

  function evaluateAutonomyEligibility(taskType) {
    const autonomy = getAutonomyPerTask();
    const current = autonomy[taskType] || { level: 1 };
    const corrections = readJsonlLines(correctionSignalsPath);
    const engagement = readJsonlLines(engagementLedgerPath);
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    const recentCorrections = corrections.filter(
      (c) =>
        c.timestamp &&
        now - new Date(c.timestamp).getTime() < thirtyDays &&
        (c.domain === taskType || c.context_bucket?.task_type === taskType),
    );
    const recentEngagement = engagement.filter(
      (e) => e._ts && now - new Date(e._ts).getTime() < thirtyDays && e.content_type === taskType,
    );
    const totalExecutions = recentEngagement.length;
    const correctionCount = recentCorrections.length;
    const correctionRate = totalExecutions > 0 ? (correctionCount / totalExecutions) * 100 : 100;
    const actedCount = recentEngagement.filter(
      (e) => e.engagement_type === "read_and_acted",
    ).length;
    const engagementRate = totalExecutions > 0 ? (actedCount / totalExecutions) * 100 : 0;
    const factualCorrections = recentCorrections.filter(
      (c) => c._classification?.category === "factual",
    ).length;

    const blockingReasons = [];
    if (totalExecutions < 20) {
      blockingReasons.push("insufficient_executions");
    }
    if (correctionRate >= 5) {
      blockingReasons.push("correction_rate_too_high");
    }
    if (engagementRate < 70) {
      blockingReasons.push("engagement_rate_too_low");
    }
    if (factualCorrections > 0) {
      blockingReasons.push("factual_error_in_window");
    }
    if (_noiseReductionLevel >= 2) {
      blockingReasons.push("operator_fatigue_detected");
    }

    return {
      eligible: blockingReasons.length === 0 && current.level < 3,
      correction_rate: +correctionRate.toFixed(1),
      engagement_rate: +engagementRate.toFixed(1),
      executions: totalExecutions,
      current_level: current.level,
      proposed_level:
        blockingReasons.length === 0 && current.level < 3 ? current.level + 1 : current.level,
      blocking_reasons: blockingReasons,
      shadow_until: current.shadow_until || null,
      factual_corrections: factualCorrections,
    };
  }

  function _checkAutonomyDemotion(taskType) {
    const autonomy = getAutonomyPerTask();
    const current = autonomy[taskType];
    if (!current || current.level <= 1) {
      return { demoted: false, reason: "already_at_minimum" };
    }

    const corrections = readJsonlLines(correctionSignalsPath);
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const recentCorrections = corrections.filter(
      (c) =>
        c.timestamp &&
        now - new Date(c.timestamp).getTime() < thirtyDays &&
        (c.domain === taskType || c.context_bucket?.task_type === taskType),
    );
    const factualCorrections = recentCorrections.filter(
      (c) => c._classification?.category === "factual",
    );
    const recentSevenDay = recentCorrections.filter(
      (c) => now - new Date(c.timestamp).getTime() < sevenDays,
    );

    if (factualCorrections.length > 0) {
      const newLevel = Math.max(current.level - 1, 1);
      autonomy[taskType].level = newLevel;
      autonomy[taskType].demoted_at = new Date().toISOString();
      autonomy[taskType].demotion_reason = "factual_error";
      delete autonomy[taskType].shadow_until;
      saveAutonomyPerTask(autonomy);
      appendEvent("self_healing.autonomy.demotion_triggered", "autonomy", {
        task_type: taskType,
        reason: "factual_error",
        new_level: newLevel,
      });
      return { demoted: true, reason: "factual_error", new_level: newLevel };
    }

    if (current.promoted_at && recentSevenDay.length >= 3) {
      const promotedAt = new Date(current.promoted_at).getTime();
      const postPromotion = recentSevenDay.filter(
        (c) => new Date(c.timestamp).getTime() > promotedAt,
      );
      if (postPromotion.length >= 3) {
        const newLevel = Math.max(current.level - 1, 1);
        autonomy[taskType].level = newLevel;
        autonomy[taskType].demoted_at = new Date().toISOString();
        autonomy[taskType].demotion_reason = "post_promotion_corrections";
        delete autonomy[taskType].shadow_until;
        saveAutonomyPerTask(autonomy);
        appendEvent("self_healing.autonomy.demotion_triggered", "autonomy", {
          task_type: taskType,
          reason: "post_promotion_corrections",
          new_level: newLevel,
        });
        return { demoted: true, reason: "post_promotion_corrections", new_level: newLevel };
      }
    }

    return { demoted: false, reason: "no_demotion_trigger" };
  }

  function getAutonomyStatus() {
    const taskTypes = ["draft_tone", "triage_classify", "meeting_prep", "commitment_extract"];
    const status = {};
    for (const tt of taskTypes) {
      status[tt] = evaluateAutonomyEligibility(tt);
    }
    return status;
  }

  function _classifyGraphError(statusCode) {
    if (statusCode === 202) {
      return { type: "ambiguous_success", should_retry: false };
    }
    if ([429, 500, 502, 503, 504].includes(statusCode)) {
      return { type: "transient", should_retry: true };
    }
    return { type: "non_transient", should_retry: false };
  }

  function detectZombieDrafts() {
    const drafts = buildDraftQueueState();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const staleMs = ZOMBIE_DRAFT_STALE_HOURS * 60 * 60 * 1000;
    const zombies = [];
    for (const d of drafts) {
      if (d.state !== "approved") {
        continue;
      }
      const age = now - new Date(d.updated_at || d.created_at).getTime();
      if (age < oneHour) {
        continue;
      }
      const ageHours = Math.round(age / (60 * 60 * 1000));
      if (age > staleMs) {
        zombies.push({ ...d, age_hours: ageHours, reason: "stale_draft" });
      } else if (!d.graph_message_id) {
        zombies.push({ ...d, age_hours: ageHours, reason: "no_graph_message_id" });
      }
    }
    return zombies;
  }

  async function retryZombieDraft(draft) {
    if (draft.reason === "stale_draft") {
      appendJsonlLine(draftQueueLedgerPath, {
        kind: "draft_state_changed",
        draft_id: draft.draft_id,
        new_state: "dead_lettered",
        _dead_letter_reason: "stale_draft",
        at: new Date().toISOString(),
      });
      appendEvent("self_healing.draft.dead_lettered", "scheduler", {
        draft_id: draft.draft_id,
        reason: "stale_draft",
        age_hours: draft.age_hours,
      });
      logLine(`ZOMBIE_DRAFT: ${draft.draft_id} dead-lettered (stale: ${draft.age_hours}h)`);
      return { success: false, new_status: "dead_lettered", reason: "stale_draft" };
    }
    if (!draft.graph_message_id) {
      appendJsonlLine(draftQueueLedgerPath, {
        kind: "draft_state_changed",
        draft_id: draft.draft_id,
        new_state: "dead_lettered",
        _dead_letter_reason: "no_graph_message_id",
        at: new Date().toISOString(),
      });
      appendEvent("self_healing.draft.dead_lettered", "scheduler", {
        draft_id: draft.draft_id,
        reason: "no_graph_message_id",
      });
      logLine(`ZOMBIE_DRAFT: ${draft.draft_id} dead-lettered (no graph_message_id)`);
      return { success: false, new_status: "dead_lettered", reason: "no_graph_message_id" };
    }
    appendEvent("self_healing.draft.zombie_detected", "scheduler", {
      draft_id: draft.draft_id,
      age_hours: draft.age_hours,
    });
    logLine(`ZOMBIE_DRAFT: Detected ${draft.draft_id} (${draft.age_hours}h old)`);
    return { success: false, new_status: "dead_lettered", reason: "retry_not_attempted_no_token" };
  }

  return {
    ...deps,
    _classifyCorrection,
    getCorrectionTaxonomyBreakdown,
    getCorrectionSubcategories: () => CORRECTION_SUBCATEGORIES,
    recordEngagement,
    computeEngagementWindow,
    getEngagementInsights,
    assessDisengagementLevel,
    _generateReengagementSummary,
    evaluateAutonomyEligibility,
    _checkAutonomyDemotion,
    getAutonomyStatus,
    _classifyGraphError,
    detectZombieDrafts,
    retryZombieDraft,
  };
}

export function createSelfHealingHandlers(core) {
  return { core };
}

export async function dispatchSelfHealingRoute(ctx, handlers) {
  const { method, route, req, res } = ctx;
  const core = handlers?.core ?? handlers;
  const {
    sendJson,
    logLine,
    readJsonBodyGuarded,
    // Circuit breaker state accessors
    getCircuitBreakerStates,
    // Provider health
    getProviderHealthSummary,
    // Config drift
    getConfigDriftStatus,
    checkConfigDrift,
    // Compaction
    compactAllLedgers,
    isCompactionRunning,
    // Proposals
    expireStaleProposals,
    resurrectProposal,
    // Correction taxonomy
    getCorrectionTaxonomyBreakdown,
    getCorrectionSubcategories,
    // Engagement
    recordEngagement,
    getEngagementInsights,
    // Noise level
    assessDisengagementLevel,
    // Autonomy
    getAutonomyStatus,
    // Shared state for /status
    getArchiveDir,
  } = core;

  // ─── Self-Healing Routes (SH-001 through SH-006) ───
  if (method === "GET" && route === "/ops/self-healing/status") {
    const cbStates = getCircuitBreakerStates();
    const providerHealth = getProviderHealthSummary();
    const configDriftStatus = getConfigDriftStatus();
    const archiveDir = getArchiveDir();
    const fs = await import("node:fs");
    sendJson(res, 200, {
      circuit_breakers: cbStates,
      provider_health: providerHealth,
      config_drift: configDriftStatus,
      compaction: { archive_dir: archiveDir, archive_exists: fs.existsSync(archiveDir) },
      proposal_expiry: { enabled: true, max_age_days: 30, resurrection_grace_days: 14 },
    });
    logLine(`GET ${route} -> 200`);
    return true;
  }

  if (method === "GET" && route === "/ops/self-healing/circuit-breakers") {
    const result = getCircuitBreakerStates();
    sendJson(res, 200, { circuit_breakers: result });
    logLine(`GET ${route} -> 200`);
    return true;
  }

  if (method === "GET" && route === "/ops/self-healing/provider-health") {
    sendJson(res, 200, { providers: getProviderHealthSummary() });
    logLine(`GET ${route} -> 200`);
    return true;
  }

  if (method === "POST" && route === "/ops/self-healing/config-drift/reconcile") {
    const result = checkConfigDrift();
    sendJson(res, 200, result);
    logLine(`POST ${route} -> 200 drift_count=${result.drift_count}`);
    return true;
  }

  if (method === "POST" && route === "/ops/self-healing/compact-ledgers") {
    if (isCompactionRunning()) {
      sendJson(res, 409, { error: "compaction_already_running" });
      logLine(`POST ${route} -> 409`);
      return true;
    }
    const results = compactAllLedgers();
    sendJson(res, 200, { ok: true, compacted: results });
    logLine(`POST ${route} -> 200 compacted=${results.length}`);
    return true;
  }

  if (method === "POST" && route === "/ops/self-healing/expire-proposals") {
    const result = expireStaleProposals();
    sendJson(res, 200, { ok: true, ...result });
    logLine(`POST ${route} -> 200 expired=${result.expired}`);
    return true;
  }

  const resurrectMatch = route.match(/^\/ops\/builder-lane\/proposals\/([^/]+)\/resurrect$/);
  if (method === "POST" && resurrectMatch) {
    const proposalId = decodeURIComponent(resurrectMatch[1]);
    const result = resurrectProposal(proposalId);
    if (!result) {
      sendJson(res, 404, { error: "proposal_not_found" });
      logLine(`POST ${route} -> 404`);
    } else if (result.error) {
      sendJson(res, 400, result);
      logLine(`POST ${route} -> 400 ${result.error}`);
    } else {
      sendJson(res, 200, result);
      logLine(`POST ${route} -> 200`);
    }
    return true;
  }

  // ─── Phase B Self-Healing Routes (SH-007 through SH-011) ───
  if (method === "GET" && route === "/ops/self-healing/correction-taxonomy") {
    const breakdown = getCorrectionTaxonomyBreakdown();
    sendJson(res, 200, { taxonomy: breakdown, subcategories: getCorrectionSubcategories() });
    logLine(`GET ${route} -> 200`);
    return true;
  }

  if (method === "POST" && route === "/ops/engagement/read-receipt") {
    const body = await readJsonBodyGuarded(req, res, route);
    if (!body) {
      return true;
    }
    recordEngagement(
      body.content_type,
      body.delivered_at || new Date().toISOString(),
      new Date().toISOString(),
      null,
      null,
    );
    sendJson(res, 200, { recorded: true, engagement_type: "read_only" });
    logLine(`POST ${route} -> 200`);
    return true;
  }

  if (method === "POST" && route === "/ops/engagement/action-receipt") {
    const body = await readJsonBodyGuarded(req, res, route);
    if (!body) {
      return true;
    }
    const actionAt = new Date();
    const deliveredAt = body.delivered_at || actionAt.toISOString();
    recordEngagement(
      body.content_type,
      deliveredAt,
      deliveredAt,
      actionAt.toISOString(),
      body.duration_ms || null,
    );
    const actionLatency = actionAt.getTime() - new Date(deliveredAt).getTime();
    sendJson(res, 200, { recorded: true, action_latency_ms: actionLatency });
    logLine(`POST ${route} -> 200`);
    return true;
  }

  if (method === "GET" && route === "/ops/self-healing/engagement-insights") {
    sendJson(res, 200, getEngagementInsights());
    logLine(`GET ${route} -> 200`);
    return true;
  }

  if (method === "GET" && route === "/ops/self-healing/noise-level") {
    const level = assessDisengagementLevel();
    sendJson(res, 200, level);
    logLine(`GET ${route} -> 200 level=${level.level}`);
    return true;
  }

  if (method === "GET" && route === "/ops/self-healing/autonomy-status") {
    sendJson(res, 200, getAutonomyStatus());
    logLine(`GET ${route} -> 200`);
    return true;
  }

  return false;
}
