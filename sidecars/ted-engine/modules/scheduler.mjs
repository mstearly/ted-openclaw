import fs from "node:fs";
import path from "node:path";

/**
 * Scheduler module — extracted from server.mjs (P1-1-003).
 *
 * Exports:
 *   createSchedulerHandlers(deps) — returns route handler functions
 *   dispatchSchedulerRoute(ctx, handlers) — route dispatch, returns true if handled
 *   createSchedulerCore(deps) — returns tick/start/stop and startup helpers
 */

// ─── Pure functions ───

// C10-032: Cron field matcher with comma, step, range, and combined support
export function cronFieldMatches(field, value) {
  if (field === "*") {
    return true;
  }
  // Handle comma-separated lists: "1,3,5" or "1-5,10"
  const parts = field.split(",");
  for (const part of parts) {
    // Handle step with optional range: "*/5", "1-10/2"
    if (part.includes("/")) {
      const [rangePart, stepStr] = part.split("/");
      const step = parseInt(stepStr, 10);
      if (!Number.isFinite(step) || step <= 0) {
        continue;
      }
      if (rangePart === "*") {
        if (value % step === 0) {
          return true;
        }
      } else if (rangePart.includes("-")) {
        const [lo, hi] = rangePart.split("-").map(Number);
        if (value >= lo && value <= hi && (value - lo) % step === 0) {
          return true;
        }
      }
      continue;
    }
    // Handle range: "1-5"
    if (part.includes("-")) {
      const [lo, hi] = part.split("-").map(Number);
      if (value >= lo && value <= hi) {
        return true;
      }
      continue;
    }
    // Exact match
    if (parseInt(part, 10) === value) {
      return true;
    }
  }
  return false;
}

export function cronMatchesNow(cronExpr, timezone) {
  if (!cronExpr || typeof cronExpr !== "string") {
    return false;
  }
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length < 5) {
    return false;
  }

  // Get current time in the specified timezone
  let nowDate;
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "UTC",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const formatted = formatter.formatToParts(new Date());
    const get = (type) => formatted.find((p) => p.type === type)?.value || "";
    const hour = parseInt(get("hour"), 10);
    const minute = parseInt(get("minute"), 10);
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dayOfWeek = dayMap[get("weekday")] ?? new Date().getDay();
    const dayOfMonth = parseInt(get("day"), 10);
    const month = parseInt(get("month"), 10);
    nowDate = { minute, hour, dayOfWeek, dayOfMonth, month };
  } catch {
    const now = new Date();
    nowDate = {
      minute: now.getMinutes(),
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      dayOfMonth: now.getDate(),
      month: now.getMonth() + 1,
    };
  }

  const [cronMinute, cronHour, cronDom, cronMonth, cronDow] = parts;

  if (!cronFieldMatches(cronMinute, nowDate.minute)) {
    return false;
  }
  if (!cronFieldMatches(cronHour, nowDate.hour)) {
    return false;
  }
  if (!cronFieldMatches(cronDom, nowDate.dayOfMonth)) {
    return false;
  }
  if (!cronFieldMatches(cronMonth, nowDate.month)) {
    return false;
  }
  // Standard cron: 7 is alias for Sunday (0)
  const normalizedDow = cronDow.replace(/\b7\b/g, "0");
  if (!cronFieldMatches(normalizedDow, nowDate.dayOfWeek)) {
    return false;
  }

  return true;
}

// ─── Config/state helpers ───

function makeConfigHelpers(configDir, schedulerDir) {
  const schedulerConfigPath = path.join(configDir, "scheduler_config.json");
  const schedulerStatePath = path.join(schedulerDir, "scheduler_state.json");

  function getSchedulerConfig() {
    try {
      const raw = fs.readFileSync(schedulerConfigPath, "utf8");
      return JSON.parse(raw);
    } catch {
      /* intentional: fallback to defaults if config missing */
      return {
        enabled: false,
        tick_interval_ms: 60000,
        max_consecutive_failures: 3,
        failure_backoff_minutes: 15,
        delivery_mode: "pending_ledger",
      };
    }
  }

  function getSchedulerState() {
    try {
      const raw = fs.readFileSync(schedulerStatePath, "utf8");
      return JSON.parse(raw);
    } catch {
      /* intentional: fallback to empty state if file missing */
      return {
        last_run: {},
        consecutive_failures: {},
        daily_notification_count: 0,
        daily_notification_date: "",
      };
    }
  }

  function saveSchedulerState(state) {
    try {
      fs.writeFileSync(schedulerStatePath, JSON.stringify(state, null, 2) + "\n", "utf8");
    } catch {
      // non-fatal
    }
  }

  return { schedulerConfigPath, getSchedulerConfig, getSchedulerState, saveSchedulerState };
}

// ─── Route handlers ───

export function createSchedulerHandlers(deps) {
  const {
    appendEvent,
    appendJsonlLine,
    logLine,
    readJsonBodyGuarded,
    readJsonlLines,
    sendJson,
    configDir,
    schedulerDir,
    pendingDeliveryPath,
  } = deps;

  const { schedulerConfigPath, getSchedulerConfig, getSchedulerState } = makeConfigHelpers(
    configDir,
    schedulerDir,
  );

  // Expose for the core tick engine
  const _cfgHelpers = makeConfigHelpers(configDir, schedulerDir);

  function schedulerStatusEndpoint(res, route) {
    const config = getSchedulerConfig();
    const state = getSchedulerState();

    let cronJobs;
    try {
      const raw = fs.readFileSync(path.join(configDir, "ted_agent.json"), "utf8");
      const agentCfg = JSON.parse(raw);
      cronJobs = agentCfg.cron_jobs || {};
    } catch (err) {
      logLine(`SCHEDULER_STATUS_CONFIG_ERROR: ${err?.message || String(err)}`);
      cronJobs = {};
    }

    const jobs = Object.entries(cronJobs).map(([id, job]) => ({
      job_id: id,
      schedule: job.schedule,
      timezone: job.timezone,
      channel: job.delivery_channel,
      last_run: state.last_run?.[id] || null,
      consecutive_failures: state.consecutive_failures?.[id] || 0,
    }));

    sendJson(res, 200, {
      enabled: config.enabled,
      tick_interval_ms: config.tick_interval_ms,
      paused: deps.getAutomationPauseState?.()?.paused || false,
      jobs,
      daily_notification_count: state.daily_notification_count || 0,
      daily_notification_date: state.daily_notification_date || null,
    });
    logLine(`GET ${route} -> 200`);
  }

  async function schedulerConfigEndpoint(req, res, route) {
    const body = await readJsonBodyGuarded(req, res, route);
    if (!body) {
      return;
    }
    const enabled = typeof body?.enabled === "boolean" ? body.enabled : null;
    if (enabled === null) {
      sendJson(res, 400, { error: "enabled_boolean_required" });
      logLine(`POST ${route} -> 400`);
      return;
    }

    try {
      const config = getSchedulerConfig();
      config.enabled = enabled;
      fs.writeFileSync(schedulerConfigPath, JSON.stringify(config, null, 2) + "\n", "utf8");
    } catch (err) {
      sendJson(res, 500, { error: "config_write_failed", message: err?.message });
      logLine(`POST ${route} -> 500`);
      return;
    }

    // Start or stop the interval via the core engine
    if (deps.onSchedulerToggle) {
      deps.onSchedulerToggle(enabled, route);
    }

    appendEvent("scheduler.config.changed", route, { enabled });
    sendJson(res, 200, { enabled, message: enabled ? "Scheduler enabled" : "Scheduler disabled" });
    logLine(`POST ${route} -> 200`);
  }

  function pendingDeliveriesEndpoint(parsedUrl, res, route) {
    const lines = readJsonlLines(pendingDeliveryPath);
    const deliveryMap = new Map();
    for (const line of lines) {
      if (line.kind === "delivery_pending") {
        deliveryMap.set(line.delivery_id, { ...line });
      } else if (line.kind === "delivery_acknowledged" && deliveryMap.has(line.delivery_id)) {
        deliveryMap.get(line.delivery_id).status = "acknowledged";
        deliveryMap.get(line.delivery_id).acknowledged_at = line.at;
      }
    }

    const statusFilter = parsedUrl?.searchParams?.get("status") || null;
    let deliveries = [...deliveryMap.values()];
    if (statusFilter) {
      deliveries = deliveries.filter((d) => d.status === statusFilter);
    }
    deliveries.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    sendJson(res, 200, { deliveries, total_count: deliveries.length });
    logLine(`GET ${route} -> 200`);
  }

  async function pendingDeliveryAckEndpoint(req, res, route) {
    const body = await readJsonBodyGuarded(req, res, route);
    if (!body) {
      return;
    }
    const deliveryId = typeof body?.delivery_id === "string" ? body.delivery_id.trim() : "";
    if (!deliveryId) {
      sendJson(res, 400, { error: "delivery_id_required" });
      logLine(`POST ${route} -> 400`);
      return;
    }

    appendJsonlLine(pendingDeliveryPath, {
      kind: "delivery_acknowledged",
      delivery_id: deliveryId,
      at: new Date().toISOString(),
    });
    appendEvent("delivery.acknowledged", route, { delivery_id: deliveryId });
    sendJson(res, 200, { delivery_id: deliveryId, status: "acknowledged" });
    logLine(`POST ${route} -> 200`);
  }

  return {
    schedulerStatusEndpoint,
    schedulerConfigEndpoint,
    pendingDeliveriesEndpoint,
    pendingDeliveryAckEndpoint,
  };
}

// ─── Route dispatch ───

export async function dispatchSchedulerRoute(ctx, handlers) {
  const { method, route, parsed, req, res } = ctx;

  if (method === "GET" && route === "/ops/scheduler") {
    handlers.schedulerStatusEndpoint(res, route);
    return true;
  }
  if (method === "POST" && route === "/ops/scheduler") {
    await handlers.schedulerConfigEndpoint(req, res, route);
    return true;
  }
  if (method === "GET" && route === "/ops/pending-deliveries") {
    handlers.pendingDeliveriesEndpoint(parsed, res, route);
    return true;
  }
  if (method === "POST" && route === "/ops/pending-deliveries/ack") {
    await handlers.pendingDeliveryAckEndpoint(req, res, route);
    return true;
  }

  return false;
}

// ─── Scheduler core engine (tick, start, stop, startup) ───

export function createSchedulerCore(deps) {
  const {
    appendEvent,
    appendJsonlLine,
    logLine,
    readJsonlLines,
    configDir,
    schedulerDir,
    pendingDeliveryPath,
    // External function deps for job dispatch
    getAutomationPauseState,
    isFeatureEnabledByOnboarding,
    checkNotificationBudget,
    recordNotificationSent,
    mintBearerToken,
    mcpCallInternal,
    runInboxIngestionCycle,
    getBuilderLaneConfig,
    detectCorrectionPatterns,
    generatePatternProposal,
    checkConfigDrift,
    expireStaleProposals,
    detectZombieDrafts,
    retryZombieDraft,
    assessDisengagementLevel,
    loadSyntheticCanariesConfig,
    runSyntheticCanaries,
    detectScoreDrift,
    getLastCanaryResult,
  } = deps;

  const { getSchedulerConfig, getSchedulerState, saveSchedulerState } = makeConfigHelpers(
    configDir,
    schedulerDir,
  );

  let schedulerInterval = null;
  let _tickRunning = false;

  async function schedulerTick() {
    if (_tickRunning) {
      return;
    }
    _tickRunning = true;
    try {
      await _schedulerTickInner();
    } catch (err) {
      logLine("SCHEDULER_TICK_ERROR: " + (err?.message || String(err)));
      try {
        appendEvent("scheduler.tick.error", "scheduler", { error: err?.message });
      } catch {
        /* non-fatal */
      }
    } finally {
      _tickRunning = false;
    }
  }

  async function _schedulerTickInner() {
    const config = getSchedulerConfig();
    if (!config.enabled) {
      return;
    }

    // Check global pause
    const pauseState = getAutomationPauseState();
    if (pauseState?.paused) {
      appendEvent("scheduler.tick.paused", "scheduler", { reason: "automation_paused" });
      return;
    }

    const state = getSchedulerState();
    const nowKey = new Date().toISOString().slice(0, 16); // "2026-02-23T07:00" — minute precision dedup

    // Persist daily notification count across restarts
    const today = new Date().toISOString().slice(0, 10);
    if (state.daily_notification_date !== today) {
      state.daily_notification_count = 0;
      state.daily_notification_date = today;
    }

    // Load cron jobs from ted_agent.json
    let cronJobs;
    try {
      const raw = fs.readFileSync(path.join(configDir, "ted_agent.json"), "utf8");
      const agentCfg = JSON.parse(raw);
      cronJobs = agentCfg.cron_jobs || {};
    } catch {
      logLine("SCHEDULER: Failed to read ted_agent.json");
      return;
    }

    for (const [jobId, job] of Object.entries(cronJobs)) {
      if (!job || typeof job.schedule !== "string") {
        continue;
      }

      // a. Does cron match now?
      if (!cronMatchesNow(job.schedule, job.timezone)) {
        continue;
      }

      // b. Already ran this minute? (dedup)
      const lastRunKey = state.last_run?.[jobId] || "";
      if (lastRunKey === nowKey) {
        continue;
      }

      // c. Onboarding gate
      const featureMap = {
        morning_brief: "morning_brief",
        eod_digest: "eod_digest",
        daily_plan: "daily_plan",
      };
      const featureName = featureMap[jobId] || jobId;
      if (!isFeatureEnabledByOnboarding(featureName)) {
        appendEvent("scheduler.job.skipped", "scheduler", {
          job_id: jobId,
          reason: "onboarding_gate",
          feature: featureName,
        });
        continue;
      }

      // d. Notification budget
      const budgetCheck = checkNotificationBudget("normal");
      if (!budgetCheck.allowed) {
        appendEvent("scheduler.job.skipped", "scheduler", {
          job_id: jobId,
          reason: budgetCheck.reason,
        });
        continue;
      }

      // e. Failure backoff
      const failures = state.consecutive_failures?.[jobId] || 0;
      if (failures >= (config.max_consecutive_failures || 3)) {
        appendEvent("scheduler.job.skipped", "scheduler", {
          job_id: jobId,
          reason: "failure_backoff",
          failures,
        });
        continue;
      }

      // f. Execute
      appendEvent("scheduler.job.started", "scheduler", { job_id: jobId });
      logLine(`SCHEDULER: Executing ${jobId}`);

      try {
        let content = null;
        const minted = mintBearerToken();
        const dispatchToken = minted.token;

        // C9-012: Actually invoke route handlers internally via loopback
        if (jobId === "morning_brief") {
          try {
            const result = await mcpCallInternal("GET", "/reporting/morning-brief", dispatchToken);
            content = {
              type: "morning_brief",
              dispatched: true,
              headline: result?.headline || null,
              narrative_length: result?.narrative?.length || 0,
              calendar_source: result?.calendar_source || null,
              job_id: jobId,
            };
            appendEvent("scheduler.dispatch.success", "scheduler", {
              job_id: jobId,
              has_narrative: !!result?.narrative,
            });
          } catch (dispatchErr) {
            logLine(
              `SCHEDULER_DISPATCH_ERROR: morning_brief -- ${dispatchErr?.message || "unknown"}`,
            );
            content = {
              type: "morning_brief",
              dispatched: false,
              dispatch_error: dispatchErr?.message || "unknown",
              job_id: jobId,
            };
            appendEvent("scheduler.dispatch.failed", "scheduler", {
              job_id: jobId,
              error: dispatchErr?.message,
            });
          }
        } else if (jobId === "eod_digest") {
          try {
            const result = await mcpCallInternal("GET", "/reporting/eod-digest", dispatchToken);
            content = {
              type: "eod_digest",
              dispatched: true,
              headline: result?.headline || null,
              narrative_length: result?.narrative?.length || 0,
              job_id: jobId,
            };
            appendEvent("scheduler.dispatch.success", "scheduler", { job_id: jobId });
          } catch (dispatchErr) {
            logLine(`SCHEDULER_DISPATCH_ERROR: eod_digest -- ${dispatchErr?.message || "unknown"}`);
            content = {
              type: "eod_digest",
              dispatched: false,
              dispatch_error: dispatchErr?.message || "unknown",
              job_id: jobId,
            };
            appendEvent("scheduler.dispatch.failed", "scheduler", {
              job_id: jobId,
              error: dispatchErr?.message,
            });
          }
        } else if (jobId === "daily_plan") {
          try {
            const result = await mcpCallInternal("GET", "/planning/timeblock", dispatchToken);
            content = {
              type: "daily_plan",
              dispatched: true,
              result_keys: Object.keys(result || {}),
              job_id: jobId,
            };
            appendEvent("scheduler.dispatch.success", "scheduler", { job_id: jobId });
          } catch (dispatchErr) {
            content = {
              type: "daily_plan",
              dispatched: false,
              dispatch_error: dispatchErr?.message || "unknown",
              job_id: jobId,
            };
            appendEvent("scheduler.dispatch.failed", "scheduler", {
              job_id: jobId,
              error: dispatchErr?.message,
            });
          }
        } else if (jobId === "inbox_ingestion") {
          try {
            const result = await runInboxIngestionCycle();
            content = {
              type: "inbox_ingestion",
              dispatched: true,
              processed: result?.processed?.length || 0,
              errors: result?.errors?.length || 0,
              job_id: jobId,
            };
            appendEvent("scheduler.dispatch.success", "scheduler", {
              job_id: jobId,
              processed: result?.processed?.length || 0,
            });
          } catch (dispatchErr) {
            content = {
              type: "inbox_ingestion",
              dispatched: false,
              dispatch_error: dispatchErr?.message || "unknown",
              job_id: jobId,
            };
            appendEvent("scheduler.dispatch.failed", "scheduler", {
              job_id: jobId,
              error: dispatchErr?.message,
            });
          }
        } else if (jobId === "builder_lane_scan") {
          // BL-007: Weekly pattern detection
          try {
            const blConfig = getBuilderLaneConfig();
            const detection = detectCorrectionPatterns();
            const proposalPhasePatterns = detection.patterns.filter(
              (p) => p.phase === "proposal" || p.phase === "auto_apply" || p.phase === "mature",
            );
            let generated = 0;
            for (const pattern of proposalPhasePatterns.slice(
              0,
              blConfig.max_proposals_per_scan || 3,
            )) {
              if (pattern.confidence > 0.9) {
                continue;
              } // Skip high-confidence dimensions
              const result = await generatePatternProposal(pattern);
              if (result.ok) {
                generated++;
              }
            }
            // Check for fatigue across all domains
            for (const [key, fState] of Object.entries(detection.fatigue_state)) {
              if (fState.status === "suspected_fatigue") {
                appendEvent("improvement.fatigue.suspected", "builder_lane", {
                  dimension: key,
                  recent_7d: fState.recent_7d,
                  prior_7d: fState.prior_7d,
                });
                appendJsonlLine(deps.builderLaneStatusPath, {
                  kind: "fatigue_detected",
                  dimension: key,
                  ...fState,
                  timestamp: new Date().toISOString(),
                });
              }
            }
            content = {
              type: "builder_lane_scan",
              dispatched: true,
              patterns_found: detection.patterns.length,
              proposals_generated: generated,
              fatigue_flags: Object.values(detection.fatigue_state).filter(
                (s) => s.status === "suspected_fatigue",
              ).length,
              job_id: jobId,
            };
            appendEvent("scheduler.dispatch.success", "scheduler", {
              job_id: jobId,
              patterns: detection.patterns.length,
              generated,
            });
          } catch (dispatchErr) {
            content = {
              type: "builder_lane_scan",
              dispatched: false,
              dispatch_error: dispatchErr?.message || "unknown",
              job_id: jobId,
            };
            appendEvent("scheduler.dispatch.failed", "scheduler", {
              job_id: jobId,
              error: dispatchErr?.message,
            });
          }
        } else if (jobId === "self_healing_maintenance") {
          // SH: Periodic self-healing maintenance
          try {
            const driftResult = checkConfigDrift();
            const expiryResult = expireStaleProposals();
            // SH-011: Detect and handle zombie drafts
            const zombies = detectZombieDrafts();
            let zombieHandled = 0;
            for (const z of zombies) {
              try {
                await retryZombieDraft(z);
                zombieHandled++;
              } catch (zErr) {
                logLine(`ZOMBIE_DRAFT_ERROR: ${z.draft_id} — ${zErr?.message || "unknown"}`);
              }
            }
            // SH-009: Assess disengagement level
            const noiseLevel = assessDisengagementLevel();
            content = {
              type: "self_healing_maintenance",
              dispatched: true,
              drift_count: driftResult.drift_count,
              expired_proposals: expiryResult.expired,
              zombie_drafts_handled: zombieHandled,
              noise_level: noiseLevel.level,
              job_id: jobId,
            };
            appendEvent("scheduler.dispatch.success", "scheduler", {
              job_id: jobId,
              drift: driftResult.drift_count,
              expired: expiryResult.expired,
              zombies: zombieHandled,
              noise_level: noiseLevel.level,
            });
          } catch (dispatchErr) {
            content = {
              type: "self_healing_maintenance",
              dispatched: false,
              dispatch_error: dispatchErr?.message || "unknown",
              job_id: jobId,
            };
            appendEvent("scheduler.dispatch.failed", "scheduler", {
              job_id: jobId,
              error: dispatchErr?.message,
            });
          }
        } else {
          content = { type: jobId, message: `Scheduled ${jobId} for ${today}`, job_id: jobId };
        }

        // Write to pending delivery ledger
        const deliveryId = `del-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        appendJsonlLine(pendingDeliveryPath, {
          kind: "delivery_pending",
          delivery_id: deliveryId,
          job_id: jobId,
          content,
          channel: job.delivery_channel || "imessage",
          status: "pending",
          created_at: new Date().toISOString(),
        });

        recordNotificationSent();
        state.daily_notification_count = (state.daily_notification_count || 0) + 1;

        // Update state
        if (!state.last_run) {
          state.last_run = {};
        }
        state.last_run[jobId] = nowKey;
        if (!state.consecutive_failures) {
          state.consecutive_failures = {};
        }
        state.consecutive_failures[jobId] = 0;

        appendEvent("scheduler.job.completed", "scheduler", {
          job_id: jobId,
          delivery_id: deliveryId,
        });
        logLine(`SCHEDULER: ${jobId} completed -> ${deliveryId}`);
      } catch (err) {
        if (!state.consecutive_failures) {
          state.consecutive_failures = {};
        }
        state.consecutive_failures[jobId] = (state.consecutive_failures[jobId] || 0) + 1;
        if (!state.last_run) {
          state.last_run = {};
        }
        state.last_run[jobId] = nowKey;
        appendEvent("scheduler.job.failed", "scheduler", {
          job_id: jobId,
          error: err?.message || "unknown",
          failures: state.consecutive_failures[jobId],
        });
        logLine(`SCHEDULER_ERROR: ${jobId} — ${err?.message || "unknown"}`);
      }
    }

    saveSchedulerState(state);

    // QA-015: Run synthetic canaries on their own interval
    try {
      const canaryConfig = loadSyntheticCanariesConfig();
      if (canaryConfig.schedule?.enabled) {
        const intervalMin = canaryConfig.schedule.interval_minutes || 60;
        const lastCanaryTs = getLastCanaryResult()?.timestamp;
        const minsSinceLast = lastCanaryTs
          ? (Date.now() - new Date(lastCanaryTs).getTime()) / 60000
          : Infinity;
        if (minsSinceLast >= intervalMin) {
          runSyntheticCanaries();
          // QA-016: Run drift detection after canary scores are recorded
          try {
            detectScoreDrift();
          } catch {
            /* non-fatal */
          }
        }
      }
    } catch (canaryErr) {
      logLine(`CANARY_SCHEDULER_ERROR: ${canaryErr?.message || "unknown"}`);
    }
  }

  function startScheduler(route) {
    const config = getSchedulerConfig();
    if (!schedulerInterval) {
      schedulerInterval = setInterval(() => schedulerTick(), config.tick_interval_ms || 60000);
      schedulerInterval.unref();
      appendEvent("scheduler.started", route, {
        tick_interval_ms: config.tick_interval_ms || 60000,
      });
      logLine("SCHEDULER: Started");
    }
  }

  function stopScheduler(route) {
    if (schedulerInterval) {
      clearInterval(schedulerInterval);
      schedulerInterval = null;
      appendEvent("scheduler.stopped", route, {});
      logLine("SCHEDULER: Stopped");
    }
  }

  function onSchedulerToggle(enabled, route) {
    if (enabled) {
      startScheduler(route);
    } else {
      stopScheduler(route);
    }
  }

  function startupAutoStart() {
    const schedulerCfg = getSchedulerConfig();
    if (schedulerCfg.enabled) {
      schedulerInterval = setInterval(
        () => schedulerTick(),
        schedulerCfg.tick_interval_ms || 60000,
      );
      schedulerInterval.unref();
      logLine(`SCHEDULER: Auto-started (tick=${schedulerCfg.tick_interval_ms || 60000}ms)`);
      try {
        appendEvent("scheduler.started", "startup", {
          tick_interval_ms: schedulerCfg.tick_interval_ms || 60000,
        });
      } catch {
        /* non-fatal */
      }
    }
  }

  function startupRecoveryCheck() {
    try {
      const pendingDeliveries = readJsonlLines(pendingDeliveryPath);
      const incomplete = pendingDeliveries.filter(
        (d) => d.status === "dispatched" && !d.completed_at,
      );
      if (incomplete.length > 0) {
        logLine(
          `STARTUP_RECOVERY: Found ${incomplete.length} incomplete scheduled delivery/deliveries`,
        );
        appendEvent("server.startup_recovery", "startup", {
          incomplete_deliveries: incomplete.length,
          job_ids: incomplete.map((d) => d.job_id),
        });
      }
    } catch {
      /* non-fatal — pending_delivery may not exist yet */
    }
  }

  return {
    schedulerTick,
    startScheduler,
    stopScheduler,
    onSchedulerToggle,
    startupAutoStart,
    startupRecoveryCheck,
    getSchedulerConfig,
  };
}
