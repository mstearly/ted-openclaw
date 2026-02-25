/**
 * Self-Healing module — extracted from server.mjs (P1-1-004).
 *
 * Phase 1: Route dispatch extraction only.
 * Functions remain in server.mjs and are passed as deps.
 * A future iteration can migrate the function bodies here.
 *
 * Exports:
 *   dispatchSelfHealingRoute(ctx, deps) — route dispatch, returns true if handled
 */

export async function dispatchSelfHealingRoute(ctx, deps) {
  const { method, route, req, res } = ctx;
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
  } = deps;

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
