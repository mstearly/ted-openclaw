function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeStringList(value, maxItems = 128) {
  if (!Array.isArray(value)) {
    return [];
  }
  const out = [];
  const seen = new Set();
  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }
    const normalized = item.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    out.push(normalized);
    if (out.length >= maxItems) {
      break;
    }
  }
  return out;
}

function toTimestampMs(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return 0;
  }
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : 0;
}

function withinWindow(timestamp, sinceMs) {
  return toTimestampMs(timestamp) >= sinceMs;
}

function ratio(numerator, denominator) {
  if (denominator <= 0) {
    return 0;
  }
  return numerator / denominator;
}

function severityWeight(value) {
  const severity = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (severity === "critical") {
    return 1;
  }
  if (severity === "high") {
    return 0.8;
  }
  if (severity === "warn" || severity === "warning") {
    return 0.55;
  }
  if (severity === "medium") {
    return 0.45;
  }
  return 0.25;
}

function dedupeSorted(values) {
  return [...new Set(values)].toSorted((a, b) => a.localeCompare(b));
}

export function validateFeatureFragilityPolicy(policy) {
  const errors = [];

  if (!isObject(policy)) {
    return {
      ok: false,
      errors: [
        {
          code: "FEATURE_FRAGILITY_POLICY_INVALID_ROOT",
          message: "feature_fragility_policy must be an object",
        },
      ],
    };
  }

  if (policy._artifact !== "feature_fragility_policy") {
    errors.push({
      code: "FEATURE_FRAGILITY_POLICY_ARTIFACT_INVALID",
      message: 'feature_fragility_policy._artifact must be "feature_fragility_policy"',
    });
  }

  if (!Number.isInteger(policy._config_version) || policy._config_version < 1) {
    errors.push({
      code: "FEATURE_FRAGILITY_POLICY_CONFIG_VERSION_INVALID",
      message: "feature_fragility_policy._config_version must be integer >= 1",
    });
  }

  const windowDays = policy?.window?.lookback_days;
  if (!Number.isInteger(windowDays) || windowDays < 1 || windowDays > 365) {
    errors.push({
      code: "FEATURE_FRAGILITY_POLICY_WINDOW_INVALID",
      message: "feature_fragility_policy.window.lookback_days must be integer in [1, 365]",
    });
  }

  const thresholds = policy?.thresholds;
  if (!isObject(thresholds)) {
    errors.push({
      code: "FEATURE_FRAGILITY_POLICY_THRESHOLDS_MISSING",
      message: "feature_fragility_policy.thresholds must be an object",
    });
  } else {
    if (
      !Number.isFinite(thresholds.freeze_score) ||
      thresholds.freeze_score < 0 ||
      thresholds.freeze_score > 100
    ) {
      errors.push({
        code: "FEATURE_FRAGILITY_POLICY_FREEZE_THRESHOLD_INVALID",
        message: "thresholds.freeze_score must be a number in [0, 100]",
      });
    }
    if (
      !Number.isFinite(thresholds.escalation_score) ||
      thresholds.escalation_score < 0 ||
      thresholds.escalation_score > 100
    ) {
      errors.push({
        code: "FEATURE_FRAGILITY_POLICY_ESCALATION_THRESHOLD_INVALID",
        message: "thresholds.escalation_score must be a number in [0, 100]",
      });
    }
  }

  const weights = policy?.weights;
  if (!isObject(weights)) {
    errors.push({
      code: "FEATURE_FRAGILITY_POLICY_WEIGHTS_MISSING",
      message: "feature_fragility_policy.weights must be an object",
    });
  } else {
    const keys = [
      "base_registry",
      "replay_failures",
      "harmful_friction",
      "override_rate",
      "dependency_volatility",
      "test_depth_gap",
    ];
    let sum = 0;
    for (const key of keys) {
      const value = weights[key];
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        errors.push({
          code: "FEATURE_FRAGILITY_POLICY_WEIGHT_INVALID",
          message: `weights.${key} must be a number in [0, 1]`,
        });
        continue;
      }
      sum += value;
    }
    if (Math.abs(sum - 1) > 0.0001) {
      errors.push({
        code: "FEATURE_FRAGILITY_POLICY_WEIGHTS_SUM_INVALID",
        message: "weights must sum to 1.0",
      });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function validateFeatureUsagePolicy(policy) {
  const errors = [];

  if (!isObject(policy)) {
    return {
      ok: false,
      errors: [
        {
          code: "FEATURE_USAGE_POLICY_INVALID_ROOT",
          message: "feature_usage_policy must be an object",
        },
      ],
    };
  }

  if (policy._artifact !== "feature_usage_policy") {
    errors.push({
      code: "FEATURE_USAGE_POLICY_ARTIFACT_INVALID",
      message: 'feature_usage_policy._artifact must be "feature_usage_policy"',
    });
  }

  if (!Number.isInteger(policy._config_version) || policy._config_version < 1) {
    errors.push({
      code: "FEATURE_USAGE_POLICY_CONFIG_VERSION_INVALID",
      message: "feature_usage_policy._config_version must be integer >= 1",
    });
  }

  const windowDays = policy?.window?.lookback_days;
  if (!Number.isInteger(windowDays) || windowDays < 1 || windowDays > 365) {
    errors.push({
      code: "FEATURE_USAGE_POLICY_WINDOW_INVALID",
      message: "feature_usage_policy.window.lookback_days must be integer in [1, 365]",
    });
  }

  const thresholds = policy?.thresholds;
  if (!isObject(thresholds)) {
    errors.push({
      code: "FEATURE_USAGE_POLICY_THRESHOLDS_MISSING",
      message: "feature_usage_policy.thresholds must be an object",
    });
  } else {
    if (
      !Number.isInteger(thresholds.low_usage_max_invocations) ||
      thresholds.low_usage_max_invocations < 0
    ) {
      errors.push({
        code: "FEATURE_USAGE_POLICY_INVOCATION_THRESHOLD_INVALID",
        message: "thresholds.low_usage_max_invocations must be integer >= 0",
      });
    }
    if (
      !Number.isFinite(thresholds.low_usage_max_adoption_ratio) ||
      thresholds.low_usage_max_adoption_ratio < 0 ||
      thresholds.low_usage_max_adoption_ratio > 1
    ) {
      errors.push({
        code: "FEATURE_USAGE_POLICY_ADOPTION_THRESHOLD_INVALID",
        message: "thresholds.low_usage_max_adoption_ratio must be in [0, 1]",
      });
    }
    if (
      !Number.isInteger(thresholds.target_invocations_30d) ||
      thresholds.target_invocations_30d < 1
    ) {
      errors.push({
        code: "FEATURE_USAGE_POLICY_TARGET_INVALID",
        message: "thresholds.target_invocations_30d must be integer >= 1",
      });
    }
    if (
      !Number.isInteger(thresholds.min_success_sample_size) ||
      thresholds.min_success_sample_size < 1
    ) {
      errors.push({
        code: "FEATURE_USAGE_POLICY_SAMPLE_INVALID",
        message: "thresholds.min_success_sample_size must be integer >= 1",
      });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function validateResearchTriggerPolicy(policy) {
  const errors = [];

  if (!isObject(policy)) {
    return {
      ok: false,
      errors: [
        {
          code: "RESEARCH_TRIGGER_POLICY_INVALID_ROOT",
          message: "research_trigger_policy must be an object",
        },
      ],
    };
  }

  if (policy._artifact !== "research_trigger_policy") {
    errors.push({
      code: "RESEARCH_TRIGGER_POLICY_ARTIFACT_INVALID",
      message: 'research_trigger_policy._artifact must be "research_trigger_policy"',
    });
  }

  if (!Number.isInteger(policy._config_version) || policy._config_version < 1) {
    errors.push({
      code: "RESEARCH_TRIGGER_POLICY_CONFIG_VERSION_INVALID",
      message: "research_trigger_policy._config_version must be integer >= 1",
    });
  }

  const thresholds = policy?.thresholds;
  if (!isObject(thresholds)) {
    errors.push({
      code: "RESEARCH_TRIGGER_POLICY_THRESHOLDS_MISSING",
      message: "research_trigger_policy.thresholds must be an object",
    });
  } else {
    if (
      !Number.isFinite(thresholds.fragility_score) ||
      thresholds.fragility_score < 0 ||
      thresholds.fragility_score > 100
    ) {
      errors.push({
        code: "RESEARCH_TRIGGER_POLICY_FRAGILITY_INVALID",
        message: "thresholds.fragility_score must be in [0, 100]",
      });
    }
    if (
      !Number.isInteger(thresholds.maturity_score) ||
      thresholds.maturity_score < 0 ||
      thresholds.maturity_score > 5
    ) {
      errors.push({
        code: "RESEARCH_TRIGGER_POLICY_MATURITY_INVALID",
        message: "thresholds.maturity_score must be integer in [0, 5]",
      });
    }
    if (
      !Number.isFinite(thresholds.low_usage_adoption_ratio) ||
      thresholds.low_usage_adoption_ratio < 0 ||
      thresholds.low_usage_adoption_ratio > 1
    ) {
      errors.push({
        code: "RESEARCH_TRIGGER_POLICY_LOW_USAGE_INVALID",
        message: "thresholds.low_usage_adoption_ratio must be in [0, 1]",
      });
    }
  }

  const strategic = normalizeStringList(policy?.strategic_feature_ids || []);
  if (strategic.length === 0) {
    errors.push({
      code: "RESEARCH_TRIGGER_POLICY_STRATEGIC_FEATURES_MISSING",
      message: "research_trigger_policy.strategic_feature_ids must be non-empty",
    });
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function eventMatchesPattern(eventType, pattern) {
  if (typeof eventType !== "string" || eventType.length === 0) {
    return false;
  }
  if (typeof pattern !== "string" || pattern.length === 0) {
    return false;
  }
  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1);
    return eventType.startsWith(prefix);
  }
  return eventType === pattern;
}

export function buildFeatureSignalMatcher(registry) {
  const features = Array.isArray(registry?.features) ? registry.features : [];
  const matchers = [];

  for (const feature of features) {
    const featureId = typeof feature?.feature_id === "string" ? feature.feature_id.trim() : "";
    if (!featureId) {
      continue;
    }
    const patterns = normalizeStringList(feature?.runtime_signals?.events || []);
    for (const pattern of patterns) {
      matchers.push({
        feature_id: featureId,
        pattern,
      });
    }
  }

  return {
    matchers,
    match(eventType) {
      if (typeof eventType !== "string" || eventType.length === 0) {
        return [];
      }
      const featureIds = [];
      for (const entry of matchers) {
        if (eventMatchesPattern(eventType, entry.pattern)) {
          featureIds.push(entry.feature_id);
        }
      }
      return dedupeSorted(featureIds);
    },
  };
}

function aggregateReplayRisk(replayRuns, sinceMs) {
  let total = 0;
  let failed = 0;
  for (const run of Array.isArray(replayRuns) ? replayRuns : []) {
    const timestamp = run?.completed_at || run?.started_at || run?.timestamp;
    if (!withinWindow(timestamp, sinceMs)) {
      continue;
    }
    const summary = isObject(run?.summary) ? run.summary : {};
    total += Number.isFinite(summary.total) ? Math.max(0, summary.total) : 0;
    failed += Number.isFinite(summary.failed) ? Math.max(0, summary.failed) : 0;
  }
  return clamp(ratio(failed, total), 0, 1);
}

function aggregateFrictionRisk(frictionEvents, sinceMs) {
  let totalWeight = 0;
  let harmfulWeight = 0;
  for (const event of Array.isArray(frictionEvents) ? frictionEvents : []) {
    if (!withinWindow(event?.timestamp, sinceMs)) {
      continue;
    }
    const weight = severityWeight(event?.severity);
    totalWeight += weight;
    if (event?.category === "harmful" || event?.kind === "harmful") {
      harmfulWeight += weight;
    }
  }
  return clamp(ratio(harmfulWeight, totalWeight), 0, 1);
}

function aggregateOverrideRisk(eventLog, sinceMs) {
  let totalGovernance = 0;
  let overrides = 0;
  for (const event of Array.isArray(eventLog) ? eventLog : []) {
    if (!withinWindow(event?.timestamp, sinceMs)) {
      continue;
    }
    const eventType = typeof event?.event_type === "string" ? event.event_type : "";
    if (!eventType.startsWith("governance.")) {
      continue;
    }
    totalGovernance += 1;
    if (eventType === "governance.operator_required.blocked") {
      overrides += 1;
    }
  }
  return clamp(ratio(overrides, totalGovernance), 0, 1);
}

function usageMetricsByFeature(usageEvents, usagePolicy, sinceMs) {
  const perFeature = new Map();
  const minSample = usagePolicy?.thresholds?.min_success_sample_size || 5;
  const targetInvocations = usagePolicy?.thresholds?.target_invocations_30d || 40;

  for (const event of Array.isArray(usageEvents) ? usageEvents : []) {
    if (event?.kind !== "feature_usage") {
      continue;
    }
    if (!withinWindow(event?.timestamp, sinceMs)) {
      continue;
    }
    const featureId = typeof event?.feature_id === "string" ? event.feature_id.trim() : "";
    if (!featureId) {
      continue;
    }
    const existing = perFeature.get(featureId) || {
      invocation_count_30d: 0,
      success_count_30d: 0,
      failure_count_30d: 0,
    };
    existing.invocation_count_30d += 1;
    if (event?.status === "failed") {
      existing.failure_count_30d += 1;
    } else {
      existing.success_count_30d += 1;
    }
    perFeature.set(featureId, existing);
  }

  for (const [featureId, metrics] of perFeature.entries()) {
    const invocations = metrics.invocation_count_30d;
    const successRate =
      invocations >= minSample ? clamp(ratio(metrics.success_count_30d, invocations), 0, 1) : null;
    metrics.success_rate_30d = successRate;
    metrics.adoption_ratio_30d = clamp(ratio(invocations, targetInvocations), 0, 1);
    perFeature.set(featureId, metrics);
  }

  return perFeature;
}

function opportunityExperimentByPlane(plane) {
  if (plane === "connector") {
    return "Add one-click connector health check + remediation CTA in setup card";
  }
  if (plane === "control") {
    return "Add guided policy wizard with before/after explainability preview";
  }
  if (plane === "state") {
    return "Add weekly state drift digest with one-click replay run";
  }
  if (plane === "contract") {
    return "Add contract lint autofix suggestions before publish";
  }
  return "Add quick-start workflow template and inline examples";
}

export function computeFeatureHealthSnapshot(options) {
  const {
    registry,
    fragilityPolicy,
    usagePolicy,
    researchTriggerPolicy,
    replayRuns,
    frictionEvents,
    eventLog,
    usageEvents,
    generatedAt = new Date().toISOString(),
  } = options || {};

  const features = Array.isArray(registry?.features) ? registry.features : [];
  const lookbackDays = fragilityPolicy?.window?.lookback_days || 30;
  const sinceMs = Date.parse(generatedAt) - lookbackDays * 24 * 60 * 60 * 1000;

  const globalReplayFailure = aggregateReplayRisk(replayRuns, sinceMs);
  const globalHarmfulFriction = aggregateFrictionRisk(frictionEvents, sinceMs);
  const globalOverrideRate = aggregateOverrideRisk(eventLog, sinceMs);
  const usageByFeature = usageMetricsByFeature(usageEvents, usagePolicy, sinceMs);

  const weights = {
    base_registry: fragilityPolicy?.weights?.base_registry ?? 0.4,
    replay_failures: fragilityPolicy?.weights?.replay_failures ?? 0.15,
    harmful_friction: fragilityPolicy?.weights?.harmful_friction ?? 0.15,
    override_rate: fragilityPolicy?.weights?.override_rate ?? 0.1,
    dependency_volatility: fragilityPolicy?.weights?.dependency_volatility ?? 0.1,
    test_depth_gap: fragilityPolicy?.weights?.test_depth_gap ?? 0.1,
  };

  const maxDependencies = fragilityPolicy?.scaling?.max_dependencies || 8;
  const targetQaRefs = fragilityPolicy?.scaling?.target_qa_refs || 6;

  const lowUsageInvocations = usagePolicy?.thresholds?.low_usage_max_invocations ?? 8;
  const lowUsageAdoption = usagePolicy?.thresholds?.low_usage_max_adoption_ratio ?? 0.25;

  const strategicFeatureSet = new Set(
    normalizeStringList(researchTriggerPolicy?.strategic_feature_ids || []),
  );
  const researchFragilityThreshold = researchTriggerPolicy?.thresholds?.fragility_score ?? 70;
  const researchMaturityThreshold = researchTriggerPolicy?.thresholds?.maturity_score ?? 2;
  const researchLowUsageThreshold =
    researchTriggerPolicy?.thresholds?.low_usage_adoption_ratio ?? lowUsageAdoption;
  const maturityGapRequiresResearch =
    researchTriggerPolicy?.triggers?.maturity_gap_requires_research !== false;
  const lowUsageRequiresResearch =
    researchTriggerPolicy?.triggers?.low_usage_requires_research !== false;

  const evaluated = [];
  for (const feature of features) {
    const featureId = typeof feature?.feature_id === "string" ? feature.feature_id.trim() : "";
    if (!featureId) {
      continue;
    }

    const previousFragility = Number.isFinite(feature?.fragility_score)
      ? clamp(feature.fragility_score, 0, 100)
      : 50;

    const qaRefs =
      normalizeStringList(feature?.qa_contracts?.test_suites || []).length +
      normalizeStringList(feature?.qa_contracts?.replay_scenarios || []).length +
      normalizeStringList(feature?.qa_contracts?.browser_gates || []).length;

    const dependencyCount = normalizeStringList(feature?.dependencies || []).length;
    const dependencyVolatility = clamp(dependencyCount / maxDependencies, 0, 1);
    const testDepthGap = clamp(1 - qaRefs / targetQaRefs, 0, 1);

    const usage = usageByFeature.get(featureId) || {
      invocation_count_30d: 0,
      success_count_30d: 0,
      failure_count_30d: 0,
      adoption_ratio_30d: 0,
      success_rate_30d: null,
    };

    const lowUsage =
      usage.invocation_count_30d <= lowUsageInvocations ||
      usage.adoption_ratio_30d <= lowUsageAdoption;

    const scoreNormalized =
      weights.base_registry * (previousFragility / 100) +
      weights.replay_failures * globalReplayFailure +
      weights.harmful_friction * globalHarmfulFriction +
      weights.override_rate * globalOverrideRate +
      weights.dependency_volatility * dependencyVolatility +
      weights.test_depth_gap * testDepthGap;

    const fragilityScore = Math.round(clamp(scoreNormalized * 100, 0, 100));

    const maturityScore = Number.isInteger(feature?.maturity_score)
      ? clamp(feature.maturity_score, 0, 5)
      : 0;

    const freeze = fragilityScore >= (fragilityPolicy?.thresholds?.freeze_score ?? 70);
    const escalation = fragilityScore >= (fragilityPolicy?.thresholds?.escalation_score ?? 85);

    const maturityRisk = maturityGapRequiresResearch && maturityScore <= researchMaturityThreshold;
    const lowUsageRisk =
      lowUsageRequiresResearch &&
      strategicFeatureSet.has(featureId) &&
      usage.adoption_ratio_30d <= researchLowUsageThreshold;
    const researchRequired =
      fragilityScore >= researchFragilityThreshold || maturityRisk || lowUsageRisk;

    evaluated.push({
      feature_id: featureId,
      name: feature?.name || featureId,
      plane: feature?.plane || "experience",
      lifecycle_state: feature?.lifecycle_state || "incubating",
      maturity_score: maturityScore,
      fragility_score: fragilityScore,
      previous_fragility_score: previousFragility,
      fragility_delta: Math.round((fragilityScore - previousFragility) * 100) / 100,
      qa_refs: qaRefs,
      dependency_count: dependencyCount,
      metrics: {
        replay_failure_ratio: Math.round(globalReplayFailure * 1000) / 1000,
        harmful_friction_ratio: Math.round(globalHarmfulFriction * 1000) / 1000,
        override_rate: Math.round(globalOverrideRate * 1000) / 1000,
        test_depth_gap: Math.round(testDepthGap * 1000) / 1000,
        dependency_volatility: Math.round(dependencyVolatility * 1000) / 1000,
      },
      usage_signals: {
        invocation_count_30d: usage.invocation_count_30d,
        adoption_ratio_30d: usage.adoption_ratio_30d,
        success_rate_30d: usage.success_rate_30d,
      },
      state: {
        freeze,
        escalation,
        low_usage: lowUsage,
        research_required: researchRequired,
      },
      recommendations: {
        activation_experiment: lowUsage ? opportunityExperimentByPlane(feature?.plane) : null,
      },
    });
  }

  const frozenCount = evaluated.filter((feature) => feature.state.freeze).length;
  const escalationCount = evaluated.filter((feature) => feature.state.escalation).length;
  const researchCount = evaluated.filter((feature) => feature.state.research_required).length;
  const lowUsageCount = evaluated.filter((feature) => feature.state.low_usage).length;

  return {
    generated_at: generatedAt,
    lookback_days: lookbackDays,
    totals: {
      features: evaluated.length,
      frozen: frozenCount,
      escalated: escalationCount,
      research_required: researchCount,
      low_usage: lowUsageCount,
    },
    features: evaluated,
  };
}

export function buildLowUsageOpportunities(snapshot, options) {
  const usagePolicy = options?.usagePolicy || {};
  const topN = Number.isInteger(options?.topN) ? clamp(options.topN, 1, 50) : 10;
  const lowUsageAdoption = usagePolicy?.thresholds?.low_usage_max_adoption_ratio ?? 0.25;
  const candidates = Array.isArray(snapshot?.features)
    ? snapshot.features.filter((feature) => {
        return (
          feature?.state?.low_usage === true &&
          feature?.maturity_score >= 3 &&
          feature?.fragility_score < 70 &&
          (feature?.usage_signals?.adoption_ratio_30d ?? 0) <= lowUsageAdoption
        );
      })
    : [];

  const ranked = candidates
    .map((feature) => {
      const adoption = Number.isFinite(feature?.usage_signals?.adoption_ratio_30d)
        ? clamp(feature.usage_signals.adoption_ratio_30d, 0, 1)
        : 0;
      const fragility = Number.isFinite(feature?.fragility_score)
        ? clamp(feature.fragility_score, 0, 100)
        : 100;
      const maturity = Number.isInteger(feature?.maturity_score)
        ? clamp(feature.maturity_score, 0, 5)
        : 0;
      const opportunityScore = maturity * 20 + (1 - adoption) * 45 + (100 - fragility) * 0.35;
      return {
        feature_id: feature.feature_id,
        name: feature.name,
        plane: feature.plane,
        maturity_score: maturity,
        fragility_score: fragility,
        adoption_ratio_30d: adoption,
        invocation_count_30d: feature?.usage_signals?.invocation_count_30d ?? 0,
        opportunity_score: Math.round(opportunityScore * 100) / 100,
        observed_friction:
          adoption <= 0.1
            ? "Very low invocation volume in current window"
            : "Adoption remains below policy threshold",
        activation_experiment:
          feature?.recommendations?.activation_experiment ||
          opportunityExperimentByPlane(feature.plane),
      };
    })
    .toSorted((a, b) => b.opportunity_score - a.opportunity_score)
    .slice(0, topN);

  return {
    generated_at: snapshot?.generated_at || new Date().toISOString(),
    total_candidates: candidates.length,
    opportunities: ranked,
  };
}
