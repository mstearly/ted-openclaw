function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function uniqueStringList(value, maxItems = 256) {
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

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function toTimestampMs(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return 0;
  }
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function expectArtifact(policy, expectedArtifact, label, errors) {
  if (!isObject(policy)) {
    errors.push({
      code: `${label}_INVALID_ROOT`,
      message: `${expectedArtifact} must be an object`,
    });
    return false;
  }

  if (policy._artifact !== expectedArtifact) {
    errors.push({
      code: `${label}_ARTIFACT_INVALID`,
      message: `${expectedArtifact}._artifact must be "${expectedArtifact}"`,
    });
  }

  if (!Number.isInteger(policy._config_version) || policy._config_version < 1) {
    errors.push({
      code: `${label}_CONFIG_VERSION_INVALID`,
      message: `${expectedArtifact}._config_version must be integer >= 1`,
    });
  }

  return true;
}

export function validateFeatureOperatingCadencePolicy(policy) {
  const errors = [];
  if (
    !expectArtifact(
      policy,
      "feature_operating_cadence_policy",
      "FEATURE_OPERATING_CADENCE_POLICY",
      errors,
    )
  ) {
    return { ok: false, errors };
  }

  if (typeof policy.timezone !== "string" || policy.timezone.trim().length === 0) {
    errors.push({
      code: "FEATURE_OPERATING_CADENCE_POLICY_TIMEZONE_INVALID",
      message: "timezone must be a non-empty string",
    });
  }

  const jobs = isObject(policy.jobs) ? policy.jobs : null;
  if (!jobs) {
    errors.push({
      code: "FEATURE_OPERATING_CADENCE_POLICY_JOBS_MISSING",
      message: "jobs must be an object",
    });
  } else {
    for (const cadence of ["daily", "weekly", "monthly"]) {
      const job = jobs[cadence];
      if (!isObject(job)) {
        errors.push({
          code: "FEATURE_OPERATING_CADENCE_POLICY_JOB_MISSING",
          message: `jobs.${cadence} must be an object`,
        });
        continue;
      }
      if (typeof job.enabled !== "boolean") {
        errors.push({
          code: "FEATURE_OPERATING_CADENCE_POLICY_JOB_ENABLED_INVALID",
          message: `jobs.${cadence}.enabled must be boolean`,
        });
      }
      if (typeof job.owner !== "string" || job.owner.trim().length === 0) {
        errors.push({
          code: "FEATURE_OPERATING_CADENCE_POLICY_JOB_OWNER_INVALID",
          message: `jobs.${cadence}.owner must be a non-empty string`,
        });
      }
      if (typeof job.run_window_utc !== "string" || job.run_window_utc.trim().length === 0) {
        errors.push({
          code: "FEATURE_OPERATING_CADENCE_POLICY_JOB_WINDOW_INVALID",
          message: `jobs.${cadence}.run_window_utc must be a non-empty string`,
        });
      }
      if (
        !Number.isInteger(job.max_staleness_hours) ||
        job.max_staleness_hours < 1 ||
        job.max_staleness_hours > 24 * 366
      ) {
        errors.push({
          code: "FEATURE_OPERATING_CADENCE_POLICY_JOB_STALENESS_INVALID",
          message: `jobs.${cadence}.max_staleness_hours must be integer in [1, 8784]`,
        });
      }
      if (uniqueStringList(job.actions).length === 0) {
        errors.push({
          code: "FEATURE_OPERATING_CADENCE_POLICY_JOB_ACTIONS_INVALID",
          message: `jobs.${cadence}.actions must include at least one action`,
        });
      }
    }
  }

  const escalation = isObject(policy.escalation) ? policy.escalation : null;
  if (!escalation) {
    errors.push({
      code: "FEATURE_OPERATING_CADENCE_POLICY_ESCALATION_MISSING",
      message: "escalation must be an object",
    });
  } else if (uniqueStringList(escalation.notify_roles).length === 0) {
    errors.push({
      code: "FEATURE_OPERATING_CADENCE_POLICY_ESCALATION_NOTIFY_INVALID",
      message: "escalation.notify_roles must be non-empty",
    });
  }

  return { ok: errors.length === 0, errors };
}

export function validateFeatureReleaseGatePolicy(policy) {
  const errors = [];
  if (
    !expectArtifact(policy, "feature_release_gate_policy", "FEATURE_RELEASE_GATE_POLICY", errors)
  ) {
    return { ok: false, errors };
  }

  if (!["advisory", "hard"].includes(policy.mode)) {
    errors.push({
      code: "FEATURE_RELEASE_GATE_POLICY_MODE_INVALID",
      message: "mode must be advisory or hard",
    });
  }

  const hardFailRules = isObject(policy.hard_fail_rules) ? policy.hard_fail_rules : null;
  if (!hardFailRules) {
    errors.push({
      code: "FEATURE_RELEASE_GATE_POLICY_HARD_FAIL_RULES_MISSING",
      message: "hard_fail_rules must be an object",
    });
  } else {
    for (const key of [
      "block_on_frozen_feature_change",
      "block_on_missing_qa_security_mapping",
      "block_on_open_research_trigger_for_strategic_feature",
    ]) {
      if (typeof hardFailRules[key] !== "boolean") {
        errors.push({
          code: "FEATURE_RELEASE_GATE_POLICY_HARD_FAIL_RULE_INVALID",
          message: `hard_fail_rules.${key} must be boolean`,
        });
      }
    }
  }

  const advisoryRules = isObject(policy.advisory_rules) ? policy.advisory_rules : null;
  if (!advisoryRules) {
    errors.push({
      code: "FEATURE_RELEASE_GATE_POLICY_ADVISORY_RULES_MISSING",
      message: "advisory_rules must be an object",
    });
  }

  const thresholds = isObject(policy.thresholds) ? policy.thresholds : null;
  if (!thresholds) {
    errors.push({
      code: "FEATURE_RELEASE_GATE_POLICY_THRESHOLDS_MISSING",
      message: "thresholds must be an object",
    });
  } else {
    for (const key of ["freeze_fragility_score", "escalation_fragility_score"]) {
      const value = thresholds[key];
      if (!isFiniteNumber(value) || value < 0 || value > 100) {
        errors.push({
          code: "FEATURE_RELEASE_GATE_POLICY_THRESHOLD_INVALID",
          message: `thresholds.${key} must be in [0, 100]`,
        });
      }
    }
    const adoption = thresholds.low_usage_adoption_ratio;
    if (!isFiniteNumber(adoption) || adoption < 0 || adoption > 1) {
      errors.push({
        code: "FEATURE_RELEASE_GATE_POLICY_LOW_USAGE_THRESHOLD_INVALID",
        message: "thresholds.low_usage_adoption_ratio must be in [0, 1]",
      });
    }
  }

  const override = isObject(policy.override) ? policy.override : null;
  if (!override) {
    errors.push({
      code: "FEATURE_RELEASE_GATE_POLICY_OVERRIDE_MISSING",
      message: "override must be an object",
    });
  } else {
    if (typeof override.enabled !== "boolean") {
      errors.push({
        code: "FEATURE_RELEASE_GATE_POLICY_OVERRIDE_ENABLED_INVALID",
        message: "override.enabled must be boolean",
      });
    }
    if (uniqueStringList(override.allowed_roles).length === 0) {
      errors.push({
        code: "FEATURE_RELEASE_GATE_POLICY_OVERRIDE_ROLES_INVALID",
        message: "override.allowed_roles must be non-empty",
      });
    }
  }

  if (uniqueStringList(policy.required_reason_codes).length === 0) {
    errors.push({
      code: "FEATURE_RELEASE_GATE_POLICY_REASON_CODES_INVALID",
      message: "required_reason_codes must be non-empty",
    });
  }

  return { ok: errors.length === 0, errors };
}

export function validateFeatureDecisionPolicy(policy) {
  const errors = [];
  if (!expectArtifact(policy, "feature_decision_policy", "FEATURE_DECISION_POLICY", errors)) {
    return { ok: false, errors };
  }

  const weights = isObject(policy.weights) ? policy.weights : null;
  if (!weights) {
    errors.push({
      code: "FEATURE_DECISION_POLICY_WEIGHTS_MISSING",
      message: "weights must be an object",
    });
  } else {
    let sum = 0;
    for (const key of ["fragility_risk", "maturity_gap", "value_opportunity"]) {
      const value = weights[key];
      if (!isFiniteNumber(value) || value < 0 || value > 1) {
        errors.push({
          code: "FEATURE_DECISION_POLICY_WEIGHT_INVALID",
          message: `weights.${key} must be in [0, 1]`,
        });
      } else {
        sum += value;
      }
    }
    if (Math.abs(sum - 1) > 0.0001) {
      errors.push({
        code: "FEATURE_DECISION_POLICY_WEIGHT_SUM_INVALID",
        message: "weights must sum to 1.0",
      });
    }
  }

  const buckets = isObject(policy.buckets) ? policy.buckets : null;
  const bucketIds = [
    "RISK_REMEDIATION_NOW",
    "VALUE_ACTIVATION_NOW",
    "RESEARCH_BEFORE_BUILD",
    "BACKLOG_MONITOR",
  ];
  if (!buckets) {
    errors.push({
      code: "FEATURE_DECISION_POLICY_BUCKETS_MISSING",
      message: "buckets must be an object",
    });
  } else {
    for (const bucketId of bucketIds) {
      const bucket = buckets[bucketId];
      if (!isObject(bucket)) {
        errors.push({
          code: "FEATURE_DECISION_POLICY_BUCKET_MISSING",
          message: `buckets.${bucketId} must be present`,
        });
        continue;
      }
      if (!isFiniteNumber(bucket.min_score) || bucket.min_score < 0 || bucket.min_score > 100) {
        errors.push({
          code: "FEATURE_DECISION_POLICY_BUCKET_SCORE_INVALID",
          message: `buckets.${bucketId}.min_score must be in [0, 100]`,
        });
      }
      if (uniqueStringList(bucket.conditions).length === 0) {
        errors.push({
          code: "FEATURE_DECISION_POLICY_BUCKET_CONDITIONS_INVALID",
          message: `buckets.${bucketId}.conditions must be non-empty`,
        });
      }
    }
  }

  const topN = isObject(policy.top_n) ? policy.top_n : null;
  if (!topN) {
    errors.push({
      code: "FEATURE_DECISION_POLICY_TOP_N_MISSING",
      message: "top_n must be an object",
    });
  } else {
    for (const key of ["risk", "value", "research"]) {
      if (!Number.isInteger(topN[key]) || topN[key] < 1 || topN[key] > 50) {
        errors.push({
          code: "FEATURE_DECISION_POLICY_TOP_N_INVALID",
          message: `top_n.${key} must be integer in [1, 50]`,
        });
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateFeatureActivationCatalog(catalog) {
  const errors = [];
  if (
    !expectArtifact(catalog, "feature_activation_catalog", "FEATURE_ACTIVATION_CATALOG", errors)
  ) {
    return { ok: false, errors };
  }

  const experiments = Array.isArray(catalog.experiments) ? catalog.experiments : [];
  if (experiments.length === 0) {
    errors.push({
      code: "FEATURE_ACTIVATION_CATALOG_EXPERIMENTS_MISSING",
      message: "experiments must be non-empty",
    });
  }

  for (const experiment of experiments) {
    if (!isObject(experiment)) {
      errors.push({
        code: "FEATURE_ACTIVATION_CATALOG_EXPERIMENT_INVALID",
        message: "each experiment must be an object",
      });
      continue;
    }
    for (const field of [
      "feature_id",
      "jtbd",
      "activation_hypothesis",
      "owner",
      "success_metric",
    ]) {
      if (typeof experiment[field] !== "string" || experiment[field].trim().length === 0) {
        errors.push({
          code: "FEATURE_ACTIVATION_CATALOG_FIELD_INVALID",
          message: `${field} must be a non-empty string`,
        });
      }
    }
    if (!isFiniteNumber(experiment.target_delta) || experiment.target_delta <= 0) {
      errors.push({
        code: "FEATURE_ACTIVATION_CATALOG_TARGET_DELTA_INVALID",
        message: "target_delta must be > 0",
      });
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateConnectorCertificationMatrix(matrix) {
  const errors = [];
  if (
    !expectArtifact(
      matrix,
      "connector_certification_matrix",
      "CONNECTOR_CERTIFICATION_MATRIX",
      errors,
    )
  ) {
    return { ok: false, errors };
  }

  const providers = isObject(matrix.providers) ? matrix.providers : null;
  if (!providers || Object.keys(providers).length === 0) {
    errors.push({
      code: "CONNECTOR_CERTIFICATION_MATRIX_PROVIDERS_MISSING",
      message: "providers must be a non-empty object",
    });
    return { ok: errors.length === 0, errors };
  }

  for (const [providerId, provider] of Object.entries(providers)) {
    if (!isObject(provider)) {
      errors.push({
        code: "CONNECTOR_CERTIFICATION_MATRIX_PROVIDER_INVALID",
        message: `providers.${providerId} must be an object`,
      });
      continue;
    }
    if (uniqueStringList(provider.required_checks).length === 0) {
      errors.push({
        code: "CONNECTOR_CERTIFICATION_MATRIX_CHECKS_INVALID",
        message: `providers.${providerId}.required_checks must be non-empty`,
      });
    }
    const slo = isObject(provider.slo) ? provider.slo : null;
    if (!slo) {
      errors.push({
        code: "CONNECTOR_CERTIFICATION_MATRIX_SLO_MISSING",
        message: `providers.${providerId}.slo must be present`,
      });
      continue;
    }
    if (
      !isFiniteNumber(slo.success_rate_min) ||
      slo.success_rate_min < 0 ||
      slo.success_rate_min > 1
    ) {
      errors.push({
        code: "CONNECTOR_CERTIFICATION_MATRIX_SLO_SUCCESS_INVALID",
        message: `providers.${providerId}.slo.success_rate_min must be in [0, 1]`,
      });
    }
    if (!Number.isInteger(slo.p95_latency_ms_max) || slo.p95_latency_ms_max < 1) {
      errors.push({
        code: "CONNECTOR_CERTIFICATION_MATRIX_SLO_LATENCY_INVALID",
        message: `providers.${providerId}.slo.p95_latency_ms_max must be integer >= 1`,
      });
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateTransportPolicy(policy) {
  const errors = [];
  if (!expectArtifact(policy, "transport_policy", "TRANSPORT_POLICY", errors)) {
    return { ok: false, errors };
  }

  const allowedModes = uniqueStringList(policy.allowed_modes);
  if (allowedModes.length === 0) {
    errors.push({
      code: "TRANSPORT_POLICY_ALLOWED_MODES_INVALID",
      message: "allowed_modes must be non-empty",
    });
  }

  if (typeof policy.default_mode !== "string" || !allowedModes.includes(policy.default_mode)) {
    errors.push({
      code: "TRANSPORT_POLICY_DEFAULT_MODE_INVALID",
      message: "default_mode must be one of allowed_modes",
    });
  }

  const providerOverrides = isObject(policy.provider_overrides) ? policy.provider_overrides : null;
  if (!providerOverrides || Object.keys(providerOverrides).length === 0) {
    errors.push({
      code: "TRANSPORT_POLICY_PROVIDER_OVERRIDES_MISSING",
      message: "provider_overrides must be non-empty",
    });
  } else {
    for (const [providerId, override] of Object.entries(providerOverrides)) {
      if (!isObject(override)) {
        errors.push({
          code: "TRANSPORT_POLICY_PROVIDER_OVERRIDE_INVALID",
          message: `provider_overrides.${providerId} must be an object`,
        });
        continue;
      }
      for (const field of ["mode", "fallback_mode"]) {
        if (typeof override[field] !== "string" || !allowedModes.includes(override[field])) {
          errors.push({
            code: "TRANSPORT_POLICY_PROVIDER_MODE_INVALID",
            message: `provider_overrides.${providerId}.${field} must be one of allowed_modes`,
          });
        }
      }
      if (!Number.isInteger(override.max_parallel_sockets) || override.max_parallel_sockets < 1) {
        errors.push({
          code: "TRANSPORT_POLICY_PROVIDER_MAX_SOCKETS_INVALID",
          message: `provider_overrides.${providerId}.max_parallel_sockets must be integer >= 1`,
        });
      }
      if (typeof override.retry_on_previous_response_not_found !== "boolean") {
        errors.push({
          code: "TRANSPORT_POLICY_PROVIDER_RETRY_FLAG_INVALID",
          message: `provider_overrides.${providerId}.retry_on_previous_response_not_found must be boolean`,
        });
      }
    }
  }

  const guardrails = isObject(policy.guardrails) ? policy.guardrails : null;
  if (!guardrails) {
    errors.push({
      code: "TRANSPORT_POLICY_GUARDRAILS_MISSING",
      message: "guardrails must be an object",
    });
  }

  return { ok: errors.length === 0, errors };
}

export function validateContextPolicy(policy) {
  const errors = [];
  if (!expectArtifact(policy, "context_policy", "CONTEXT_POLICY", errors)) {
    return { ok: false, errors };
  }

  const management = isObject(policy.context_management) ? policy.context_management : null;
  if (!management) {
    errors.push({
      code: "CONTEXT_POLICY_MANAGEMENT_MISSING",
      message: "context_management must be an object",
    });
  } else {
    if (
      !Number.isInteger(management.compact_threshold_tokens) ||
      management.compact_threshold_tokens < 2000
    ) {
      errors.push({
        code: "CONTEXT_POLICY_COMPACT_THRESHOLD_INVALID",
        message: "context_management.compact_threshold_tokens must be integer >= 2000",
      });
    }
    if (
      !Number.isInteger(management.target_post_compaction_tokens) ||
      management.target_post_compaction_tokens < 1000
    ) {
      errors.push({
        code: "CONTEXT_POLICY_POST_COMPACTION_TARGET_INVALID",
        message: "context_management.target_post_compaction_tokens must be integer >= 1000",
      });
    }
    if (uniqueStringList(management.preserve_sections).length === 0) {
      errors.push({
        code: "CONTEXT_POLICY_PRESERVE_SECTIONS_INVALID",
        message: "context_management.preserve_sections must be non-empty",
      });
    }
  }

  const promptCaching = isObject(policy.prompt_caching) ? policy.prompt_caching : null;
  if (!promptCaching) {
    errors.push({
      code: "CONTEXT_POLICY_PROMPT_CACHING_MISSING",
      message: "prompt_caching must be an object",
    });
  } else if (
    !Number.isInteger(promptCaching.max_cacheable_prefix_tokens) ||
    promptCaching.max_cacheable_prefix_tokens < 1
  ) {
    errors.push({
      code: "CONTEXT_POLICY_PROMPT_CACHE_MAX_PREFIX_INVALID",
      message: "prompt_caching.max_cacheable_prefix_tokens must be integer >= 1",
    });
  }

  const governance = isObject(policy.governance) ? policy.governance : null;
  if (!governance) {
    errors.push({
      code: "CONTEXT_POLICY_GOVERNANCE_MISSING",
      message: "governance must be an object",
    });
  }

  return { ok: errors.length === 0, errors };
}

export function validateKnowledgeRetrievalPolicy(policy) {
  const errors = [];
  if (!expectArtifact(policy, "knowledge_retrieval_policy", "KNOWLEDGE_RETRIEVAL_POLICY", errors)) {
    return { ok: false, errors };
  }

  const allowedModes = uniqueStringList(policy.allowed_modes);
  if (allowedModes.length === 0) {
    errors.push({
      code: "KNOWLEDGE_RETRIEVAL_POLICY_ALLOWED_MODES_INVALID",
      message: "allowed_modes must be non-empty",
    });
  }

  if (typeof policy.default_mode !== "string" || !allowedModes.includes(policy.default_mode)) {
    errors.push({
      code: "KNOWLEDGE_RETRIEVAL_POLICY_DEFAULT_MODE_INVALID",
      message: "default_mode must be one of allowed_modes",
    });
  }

  const indexes = isObject(policy.indexes) ? policy.indexes : null;
  if (!indexes || Object.keys(indexes).length === 0) {
    errors.push({
      code: "KNOWLEDGE_RETRIEVAL_POLICY_INDEXES_MISSING",
      message: "indexes must be a non-empty object",
    });
  } else {
    for (const mode of allowedModes) {
      const entry = indexes[mode];
      if (!isObject(entry)) {
        errors.push({
          code: "KNOWLEDGE_RETRIEVAL_POLICY_INDEX_ENTRY_MISSING",
          message: `indexes.${mode} must be an object`,
        });
        continue;
      }
      if (typeof entry.enabled !== "boolean") {
        errors.push({
          code: "KNOWLEDGE_RETRIEVAL_POLICY_INDEX_ENABLED_INVALID",
          message: `indexes.${mode}.enabled must be boolean`,
        });
      }
      if (uniqueStringList(entry.allowed_ledgers).length === 0) {
        errors.push({
          code: "KNOWLEDGE_RETRIEVAL_POLICY_INDEX_ALLOWED_LEDGERS_INVALID",
          message: `indexes.${mode}.allowed_ledgers must be non-empty`,
        });
      }
      if (!Number.isInteger(entry.max_candidates) || entry.max_candidates < 1) {
        errors.push({
          code: "KNOWLEDGE_RETRIEVAL_POLICY_INDEX_MAX_CANDIDATES_INVALID",
          message: `indexes.${mode}.max_candidates must be integer >= 1`,
        });
      }
    }
  }

  const constraints = isObject(policy.query_constraints) ? policy.query_constraints : null;
  if (!constraints) {
    errors.push({
      code: "KNOWLEDGE_RETRIEVAL_POLICY_QUERY_CONSTRAINTS_MISSING",
      message: "query_constraints must be an object",
    });
  } else {
    if (
      !Number.isInteger(constraints.max_query_length_chars) ||
      constraints.max_query_length_chars < 32
    ) {
      errors.push({
        code: "KNOWLEDGE_RETRIEVAL_POLICY_MAX_QUERY_LENGTH_INVALID",
        message: "query_constraints.max_query_length_chars must be integer >= 32",
      });
    }
    if (!Number.isInteger(constraints.max_top_k) || constraints.max_top_k < 1) {
      errors.push({
        code: "KNOWLEDGE_RETRIEVAL_POLICY_MAX_TOP_K_INVALID",
        message: "query_constraints.max_top_k must be integer >= 1",
      });
    }
    if (!Number.isInteger(constraints.max_context_tokens) || constraints.max_context_tokens < 256) {
      errors.push({
        code: "KNOWLEDGE_RETRIEVAL_POLICY_MAX_CONTEXT_TOKENS_INVALID",
        message: "query_constraints.max_context_tokens must be integer >= 256",
      });
    }
    if (
      !isFiniteNumber(constraints.min_similarity_score) ||
      constraints.min_similarity_score < 0 ||
      constraints.min_similarity_score > 1
    ) {
      errors.push({
        code: "KNOWLEDGE_RETRIEVAL_POLICY_MIN_SIMILARITY_INVALID",
        message: "query_constraints.min_similarity_score must be in [0, 1]",
      });
    }
    if (!Number.isInteger(constraints.min_citation_count) || constraints.min_citation_count < 1) {
      errors.push({
        code: "KNOWLEDGE_RETRIEVAL_POLICY_MIN_CITATION_COUNT_INVALID",
        message: "query_constraints.min_citation_count must be integer >= 1",
      });
    }
  }

  const security = isObject(policy.security) ? policy.security : null;
  if (!security) {
    errors.push({
      code: "KNOWLEDGE_RETRIEVAL_POLICY_SECURITY_MISSING",
      message: "security must be an object",
    });
  } else {
    for (const key of [
      "require_scope_filter",
      "require_citation_offsets",
      "redact_sensitive_patterns",
    ]) {
      if (typeof security[key] !== "boolean") {
        errors.push({
          code: "KNOWLEDGE_RETRIEVAL_POLICY_SECURITY_FLAG_INVALID",
          message: `security.${key} must be boolean`,
        });
      }
    }
    if (uniqueStringList(security.blocked_pattern_policy_refs).length === 0) {
      errors.push({
        code: "KNOWLEDGE_RETRIEVAL_POLICY_BLOCKED_PATTERN_REFS_INVALID",
        message: "security.blocked_pattern_policy_refs must be non-empty",
      });
    }
  }

  const fallback = isObject(policy.fallback) ? policy.fallback : null;
  if (!fallback) {
    errors.push({
      code: "KNOWLEDGE_RETRIEVAL_POLICY_FALLBACK_MISSING",
      message: "fallback must be an object",
    });
  } else {
    for (const key of ["on_no_results", "on_policy_block"]) {
      if (typeof fallback[key] !== "string" || fallback[key].trim().length === 0) {
        errors.push({
          code: "KNOWLEDGE_RETRIEVAL_POLICY_FALLBACK_VALUE_INVALID",
          message: `fallback.${key} must be non-empty string`,
        });
      }
    }
    if (typeof fallback.emit_governance_event !== "boolean") {
      errors.push({
        code: "KNOWLEDGE_RETRIEVAL_POLICY_FALLBACK_EMIT_FLAG_INVALID",
        message: "fallback.emit_governance_event must be boolean",
      });
    }
  }

  const governance = isObject(policy.governance) ? policy.governance : null;
  if (!governance) {
    errors.push({
      code: "KNOWLEDGE_RETRIEVAL_POLICY_GOVERNANCE_MISSING",
      message: "governance must be an object",
    });
  } else {
    if (uniqueStringList(governance.emit_events).length === 0) {
      errors.push({
        code: "KNOWLEDGE_RETRIEVAL_POLICY_EMIT_EVENTS_INVALID",
        message: "governance.emit_events must be non-empty",
      });
    }
    if (uniqueStringList(governance.required_reason_codes).length === 0) {
      errors.push({
        code: "KNOWLEDGE_RETRIEVAL_POLICY_REASON_CODES_INVALID",
        message: "governance.required_reason_codes must be non-empty",
      });
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateDiscoveryIngestionQualityPolicy(policy) {
  const errors = [];
  if (
    !expectArtifact(
      policy,
      "discovery_ingestion_quality_policy",
      "DISCOVERY_INGESTION_QUALITY_POLICY",
      errors,
    )
  ) {
    return { ok: false, errors };
  }

  const discovery = isObject(policy.discovery) ? policy.discovery : null;
  if (!discovery) {
    errors.push({
      code: "DISCOVERY_INGESTION_QUALITY_POLICY_DISCOVERY_MISSING",
      message: "discovery must be an object",
    });
  } else {
    if (typeof discovery.require_incremental_scan_cursor !== "boolean") {
      errors.push({
        code: "DISCOVERY_INGESTION_QUALITY_POLICY_DISCOVERY_INCREMENTAL_FLAG_INVALID",
        message: "discovery.require_incremental_scan_cursor must be boolean",
      });
    }
    if (
      !isFiniteNumber(discovery.dedup_precision_min) ||
      discovery.dedup_precision_min < 0 ||
      discovery.dedup_precision_min > 1
    ) {
      errors.push({
        code: "DISCOVERY_INGESTION_QUALITY_POLICY_DISCOVERY_DEDUP_PRECISION_INVALID",
        message: "discovery.dedup_precision_min must be in [0, 1]",
      });
    }
    if (
      !isFiniteNumber(discovery.max_false_positive_rate) ||
      discovery.max_false_positive_rate < 0 ||
      discovery.max_false_positive_rate > 1
    ) {
      errors.push({
        code: "DISCOVERY_INGESTION_QUALITY_POLICY_DISCOVERY_FALSE_POSITIVE_INVALID",
        message: "discovery.max_false_positive_rate must be in [0, 1]",
      });
    }
    if (
      !isFiniteNumber(discovery.entity_link_confidence_min) ||
      discovery.entity_link_confidence_min < 0 ||
      discovery.entity_link_confidence_min > 1
    ) {
      errors.push({
        code: "DISCOVERY_INGESTION_QUALITY_POLICY_DISCOVERY_ENTITY_CONFIDENCE_INVALID",
        message: "discovery.entity_link_confidence_min must be in [0, 1]",
      });
    }
    if (
      !Number.isInteger(discovery.max_candidates_per_entity) ||
      discovery.max_candidates_per_entity < 1
    ) {
      errors.push({
        code: "DISCOVERY_INGESTION_QUALITY_POLICY_DISCOVERY_MAX_CANDIDATES_INVALID",
        message: "discovery.max_candidates_per_entity must be integer >= 1",
      });
    }
  }

  const ingestion = isObject(policy.ingestion) ? policy.ingestion : null;
  if (!ingestion) {
    errors.push({
      code: "DISCOVERY_INGESTION_QUALITY_POLICY_INGESTION_MISSING",
      message: "ingestion must be an object",
    });
  } else {
    if (typeof ingestion.require_idempotency_key !== "boolean") {
      errors.push({
        code: "DISCOVERY_INGESTION_QUALITY_POLICY_INGESTION_IDEMPOTENCY_FLAG_INVALID",
        message: "ingestion.require_idempotency_key must be boolean",
      });
    }
    if (
      !isFiniteNumber(ingestion.duplicate_suppression_rate_min) ||
      ingestion.duplicate_suppression_rate_min < 0 ||
      ingestion.duplicate_suppression_rate_min > 1
    ) {
      errors.push({
        code: "DISCOVERY_INGESTION_QUALITY_POLICY_INGESTION_DUP_SUPPRESSION_INVALID",
        message: "ingestion.duplicate_suppression_rate_min must be in [0, 1]",
      });
    }
    if (
      !isFiniteNumber(ingestion.max_parse_error_rate) ||
      ingestion.max_parse_error_rate < 0 ||
      ingestion.max_parse_error_rate > 1
    ) {
      errors.push({
        code: "DISCOVERY_INGESTION_QUALITY_POLICY_INGESTION_PARSE_ERROR_INVALID",
        message: "ingestion.max_parse_error_rate must be in [0, 1]",
      });
    }
    if (typeof ingestion.require_pii_redaction_on_extract !== "boolean") {
      errors.push({
        code: "DISCOVERY_INGESTION_QUALITY_POLICY_INGESTION_PII_REDACTION_FLAG_INVALID",
        message: "ingestion.require_pii_redaction_on_extract must be boolean",
      });
    }
    if (!Number.isInteger(ingestion.max_batch_latency_ms) || ingestion.max_batch_latency_ms < 1) {
      errors.push({
        code: "DISCOVERY_INGESTION_QUALITY_POLICY_INGESTION_BATCH_LATENCY_INVALID",
        message: "ingestion.max_batch_latency_ms must be integer >= 1",
      });
    }
  }

  const governance = isObject(policy.governance) ? policy.governance : null;
  if (!governance) {
    errors.push({
      code: "DISCOVERY_INGESTION_QUALITY_POLICY_GOVERNANCE_MISSING",
      message: "governance must be an object",
    });
  } else {
    if (uniqueStringList(governance.emit_events).length === 0) {
      errors.push({
        code: "DISCOVERY_INGESTION_QUALITY_POLICY_EMIT_EVENTS_INVALID",
        message: "governance.emit_events must be non-empty",
      });
    }
    if (uniqueStringList(governance.required_reason_codes).length === 0) {
      errors.push({
        code: "DISCOVERY_INGESTION_QUALITY_POLICY_REASON_CODES_INVALID",
        message: "governance.required_reason_codes must be non-empty",
      });
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateMcpTrustPolicy(policy) {
  const errors = [];
  if (!isObject(policy)) {
    return {
      ok: false,
      errors: [
        { code: "MCP_TRUST_POLICY_INVALID_ROOT", message: "mcp_trust_policy must be object" },
      ],
    };
  }

  if (policy._artifact && policy._artifact !== "mcp_trust_policy") {
    errors.push({
      code: "MCP_TRUST_POLICY_ARTIFACT_INVALID",
      message: "mcp_trust_policy._artifact must be mcp_trust_policy when present",
    });
  }

  if (!Number.isInteger(policy._config_version) || policy._config_version < 1) {
    errors.push({
      code: "MCP_TRUST_POLICY_CONFIG_VERSION_INVALID",
      message: "mcp_trust_policy._config_version must be integer >= 1",
    });
  }

  const trustTiers = uniqueStringList(policy.trust_tiers);
  if (trustTiers.length === 0) {
    errors.push({
      code: "MCP_TRUST_POLICY_TRUST_TIERS_INVALID",
      message: "trust_tiers must be non-empty",
    });
  }

  if (
    typeof policy.default_server_trust_tier !== "string" ||
    !trustTiers.includes(policy.default_server_trust_tier)
  ) {
    errors.push({
      code: "MCP_TRUST_POLICY_DEFAULT_TIER_INVALID",
      message: "default_server_trust_tier must be one of trust_tiers",
    });
  }

  const toolActions = uniqueStringList(policy.tool_actions);
  if (toolActions.length === 0) {
    errors.push({
      code: "MCP_TRUST_POLICY_TOOL_ACTIONS_INVALID",
      message: "tool_actions must be non-empty",
    });
  }

  if (
    typeof policy.default_tool_action !== "string" ||
    !toolActions.includes(policy.default_tool_action)
  ) {
    errors.push({
      code: "MCP_TRUST_POLICY_DEFAULT_ACTION_INVALID",
      message: "default_tool_action must be one of tool_actions",
    });
  }

  const controls = isObject(policy.trust_tier_controls) ? policy.trust_tier_controls : null;
  if (!controls) {
    errors.push({
      code: "MCP_TRUST_POLICY_TIER_CONTROLS_MISSING",
      message: "trust_tier_controls must be an object",
    });
  } else {
    for (const tier of trustTiers) {
      const entry = controls[tier];
      if (!isObject(entry)) {
        errors.push({
          code: "MCP_TRUST_POLICY_TIER_CONTROL_MISSING",
          message: `trust_tier_controls.${tier} must be an object`,
        });
        continue;
      }
      for (const key of [
        "allow_write_tools",
        "require_operator_approval",
        "egress_logging_required",
      ]) {
        if (typeof entry[key] !== "boolean") {
          errors.push({
            code: "MCP_TRUST_POLICY_TIER_CONTROL_FLAG_INVALID",
            message: `trust_tier_controls.${tier}.${key} must be boolean`,
          });
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

export function resolveChangedFeatureIds(changedFiles, registry) {
  const paths = uniqueStringList(changedFiles || []);
  const features = Array.isArray(registry?.features) ? registry.features : [];
  if (paths.length === 0 || features.length === 0) {
    return [];
  }

  const loweredPaths = paths.map((entry) => entry.toLowerCase());
  const matched = new Set();

  // If registry changed, conservatively include all features.
  if (
    loweredPaths.some((entry) => entry.includes("sidecars/ted-engine/config/feature_registry.json"))
  ) {
    for (const feature of features) {
      if (typeof feature?.feature_id === "string" && feature.feature_id.trim().length > 0) {
        matched.add(feature.feature_id.trim());
      }
    }
    return [...matched].toSorted((a, b) => a.localeCompare(b));
  }

  for (const feature of features) {
    const featureId = typeof feature?.feature_id === "string" ? feature.feature_id.trim() : "";
    if (!featureId) {
      continue;
    }
    const featureToken = featureId.replaceAll("_", "").replaceAll("-", "").toLowerCase();
    if (
      loweredPaths.some((entry) => {
        const pathToken = entry.replaceAll("_", "").replaceAll("-", "");
        return pathToken.includes(featureToken);
      })
    ) {
      matched.add(featureId);
    }
  }

  return [...matched].toSorted((a, b) => a.localeCompare(b));
}

function hasMissingMappings(feature) {
  const testSuites = uniqueStringList(feature?.qa_contracts?.test_suites || []);
  const policyRefs = uniqueStringList(feature?.security_controls?.policy_refs || []);
  const owaspRefs = uniqueStringList(feature?.security_controls?.owasp_llm_top10 || []);
  return testSuites.length === 0 || policyRefs.length === 0 || owaspRefs.length === 0;
}

export function evaluateFeatureReleaseGate(input) {
  const policy = isObject(input?.policy) ? input.policy : {};
  const snapshot = isObject(input?.snapshot) ? input.snapshot : { features: [] };
  const features = Array.isArray(snapshot.features) ? snapshot.features : [];
  const changedFeatureIds = uniqueStringList(input?.changedFeatureIds || []);
  const researchTriggers = Array.isArray(input?.researchTriggers) ? input.researchTriggers : [];
  const override = isObject(input?.override) ? input.override : null;

  const featureById = new Map();
  for (const feature of features) {
    const featureId = typeof feature?.feature_id === "string" ? feature.feature_id : "";
    if (!featureId) {
      continue;
    }
    featureById.set(featureId, feature);
  }

  const thresholds = isObject(policy.thresholds)
    ? policy.thresholds
    : { freeze_fragility_score: 70, escalation_fragility_score: 85, low_usage_adoption_ratio: 0.2 };
  const hardRules = isObject(policy.hard_fail_rules) ? policy.hard_fail_rules : {};
  const advisoryRules = isObject(policy.advisory_rules) ? policy.advisory_rules : {};

  const violations = [];
  const warnings = [];

  for (const featureId of changedFeatureIds) {
    const feature = featureById.get(featureId);
    if (!feature) {
      warnings.push({
        code: "FEATURE_NOT_IN_HEALTH_SNAPSHOT",
        feature_id: featureId,
        message: "feature not found in latest health snapshot",
      });
      continue;
    }

    const fragility = isFiniteNumber(feature.fragility_score) ? feature.fragility_score : 0;
    const adoption = isFiniteNumber(feature?.usage_signals?.adoption_ratio_30d)
      ? feature.usage_signals.adoption_ratio_30d
      : 1;
    const isConnector = feature.plane === "connector";
    const hasOpenResearchTrigger = researchTriggers.some(
      (entry) => entry?.feature_id === featureId && toTimestampMs(entry?.triggered_at) > 0,
    );

    if (
      hardRules.block_on_frozen_feature_change === true &&
      fragility >= thresholds.freeze_fragility_score
    ) {
      violations.push({
        code: "FROZEN_FEATURE_CHANGE_BLOCKED",
        feature_id: featureId,
        message: `feature fragility ${fragility} is >= freeze threshold ${thresholds.freeze_fragility_score}`,
      });
    }

    if (hardRules.block_on_missing_qa_security_mapping === true && hasMissingMappings(feature)) {
      violations.push({
        code: "MISSING_QA_SECURITY_MAPPING",
        feature_id: featureId,
        message: "feature is missing required QA/security mappings",
      });
    }

    if (
      hardRules.block_on_open_research_trigger_for_strategic_feature === true &&
      hasOpenResearchTrigger === true
    ) {
      violations.push({
        code: "OPEN_RESEARCH_TRIGGER_BLOCK",
        feature_id: featureId,
        message: "feature has an open research trigger and no approved delta",
      });
    }

    if (
      advisoryRules.warn_on_escalated_fragility === true &&
      fragility >= thresholds.escalation_fragility_score
    ) {
      warnings.push({
        code: "ESCALATED_FRAGILITY_WARNING",
        feature_id: featureId,
        message: `feature fragility ${fragility} is >= escalation threshold ${thresholds.escalation_fragility_score}`,
      });
    }

    if (
      advisoryRules.warn_on_low_usage_without_activation_plan === true &&
      adoption <= thresholds.low_usage_adoption_ratio
    ) {
      warnings.push({
        code: "LOW_USAGE_ACTIVATION_WARNING",
        feature_id: featureId,
        message: `adoption ratio ${adoption} is <= low usage threshold ${thresholds.low_usage_adoption_ratio}`,
      });
    }

    if (advisoryRules.warn_on_connector_certification_gap === true && isConnector) {
      warnings.push({
        code: "CONNECTOR_CERTIFICATION_REVIEW_REQUIRED",
        feature_id: featureId,
        message: "connector feature changed; certification matrix should be re-validated",
      });
    }
  }

  const mode = policy.mode === "hard" ? "hard" : "advisory";
  const blocking = violations.length > 0;

  let overrideAccepted = false;
  if (blocking && mode === "hard" && policy?.override?.enabled === true && override) {
    const requiredCodes = new Set(uniqueStringList(policy.required_reason_codes || []));
    const reasonCode = typeof override.reason_code === "string" ? override.reason_code.trim() : "";
    const ticketRef = typeof override.ticket_ref === "string" ? override.ticket_ref.trim() : "";
    if (requiredCodes.has(reasonCode) && ticketRef.length > 0) {
      overrideAccepted = true;
    }
  }

  return {
    evaluated_at: new Date().toISOString(),
    mode,
    changed_feature_ids: changedFeatureIds,
    pass: mode === "advisory" ? true : !blocking || overrideAccepted,
    would_block: blocking,
    violations,
    warnings,
    override: {
      accepted: overrideAccepted,
      reason_code: overrideAccepted ? override.reason_code : null,
      ticket_ref: overrideAccepted ? override.ticket_ref : null,
    },
  };
}

function getDecisionBucket(feature, score, thresholds) {
  const fragility = isFiniteNumber(feature?.fragility_score) ? feature.fragility_score : 0;
  const maturity = isFiniteNumber(feature?.maturity_score) ? feature.maturity_score : 0;
  const adoption = isFiniteNumber(feature?.usage_signals?.adoption_ratio_30d)
    ? feature.usage_signals.adoption_ratio_30d
    : 1;
  const lifecycle = typeof feature?.lifecycle_state === "string" ? feature.lifecycle_state : "";
  const invocations = isFiniteNumber(feature?.usage_signals?.invocation_count_30d)
    ? feature.usage_signals.invocation_count_30d
    : 0;
  const researchRequired = feature?.state?.research_required === true;

  // Proposed, unused M0 features are roadmap placeholders; they should not be treated as active
  // operational risk until scoped for implementation.
  if (lifecycle === "proposed" && maturity === 0 && invocations === 0) {
    return "BACKLOG_MONITOR";
  }

  if (fragility >= (thresholds.freezeFragilityScore || 70)) {
    return "RISK_REMEDIATION_NOW";
  }
  if (researchRequired || maturity <= 2) {
    return "RESEARCH_BEFORE_BUILD";
  }
  if (adoption <= (thresholds.lowUsageAdoptionRatio || 0.2) && maturity >= 3) {
    return "VALUE_ACTIVATION_NOW";
  }
  if (score >= 75) {
    return "RISK_REMEDIATION_NOW";
  }
  return "BACKLOG_MONITOR";
}

export function buildFeaturePriorityQueue(input) {
  const snapshot = isObject(input?.snapshot) ? input.snapshot : { features: [] };
  const policy = isObject(input?.policy) ? input.policy : {};
  const features = Array.isArray(snapshot.features) ? snapshot.features : [];

  const weights = isObject(policy.weights)
    ? policy.weights
    : { fragility_risk: 0.45, maturity_gap: 0.25, value_opportunity: 0.3 };

  const topN = isObject(policy.top_n) ? policy.top_n : { risk: 5, value: 5, research: 5 };

  const thresholds = {
    freezeFragilityScore: input?.thresholds?.freezeFragilityScore || 70,
    lowUsageAdoptionRatio: input?.thresholds?.lowUsageAdoptionRatio || 0.2,
  };

  const entries = [];
  for (const feature of features) {
    const featureId = typeof feature?.feature_id === "string" ? feature.feature_id : "";
    if (!featureId) {
      continue;
    }
    const fragility = clamp(
      isFiniteNumber(feature?.fragility_score) ? feature.fragility_score : 0,
      0,
      100,
    );
    const maturity = clamp(
      isFiniteNumber(feature?.maturity_score) ? feature.maturity_score : 0,
      0,
      5,
    );
    const adoption = clamp(
      isFiniteNumber(feature?.usage_signals?.adoption_ratio_30d)
        ? feature.usage_signals.adoption_ratio_30d
        : 1,
      0,
      1,
    );

    const maturityGap = ((5 - maturity) / 5) * 100;
    const valueOpportunity = (1 - adoption) * 100;
    const score =
      fragility * (weights.fragility_risk || 0) +
      maturityGap * (weights.maturity_gap || 0) +
      valueOpportunity * (weights.value_opportunity || 0);

    const bucket = getDecisionBucket(feature, score, thresholds);

    entries.push({
      feature_id: featureId,
      name: typeof feature?.name === "string" ? feature.name : featureId,
      plane: feature?.plane || null,
      bucket,
      score: Math.round(score * 100) / 100,
      fragility_score: fragility,
      maturity_score: maturity,
      adoption_ratio_30d: adoption,
      recommended_action:
        bucket === "RISK_REMEDIATION_NOW"
          ? "stabilize_and_reduce_fragility"
          : bucket === "VALUE_ACTIVATION_NOW"
            ? "run_activation_experiment"
            : bucket === "RESEARCH_BEFORE_BUILD"
              ? "perform_targeted_research_delta"
              : "monitor_in_backlog",
    });
  }

  const byBucket = {
    RISK_REMEDIATION_NOW: entries
      .filter((entry) => entry.bucket === "RISK_REMEDIATION_NOW")
      .toSorted((a, b) => b.score - a.score),
    VALUE_ACTIVATION_NOW: entries
      .filter((entry) => entry.bucket === "VALUE_ACTIVATION_NOW")
      .toSorted((a, b) => b.score - a.score),
    RESEARCH_BEFORE_BUILD: entries
      .filter((entry) => entry.bucket === "RESEARCH_BEFORE_BUILD")
      .toSorted((a, b) => b.score - a.score),
    BACKLOG_MONITOR: entries
      .filter((entry) => entry.bucket === "BACKLOG_MONITOR")
      .toSorted((a, b) => b.score - a.score),
  };

  return {
    generated_at: new Date().toISOString(),
    totals: {
      features: entries.length,
      risk_now: byBucket.RISK_REMEDIATION_NOW.length,
      value_now: byBucket.VALUE_ACTIVATION_NOW.length,
      research_before_build: byBucket.RESEARCH_BEFORE_BUILD.length,
      backlog_monitor: byBucket.BACKLOG_MONITOR.length,
    },
    queue: {
      risk: byBucket.RISK_REMEDIATION_NOW.slice(0, topN.risk || 5),
      value: byBucket.VALUE_ACTIVATION_NOW.slice(0, topN.value || 5),
      research: byBucket.RESEARCH_BEFORE_BUILD.slice(0, topN.research || 5),
      backlog: byBucket.BACKLOG_MONITOR,
    },
  };
}

export function buildFeatureOperatingStatus(input) {
  const policy = isObject(input?.policy) ? input.policy : { jobs: {} };
  const runs = Array.isArray(input?.runs) ? input.runs : [];
  const nowMs = Number.isFinite(input?.nowMs) ? input.nowMs : Date.now();

  const jobs = isObject(policy.jobs) ? policy.jobs : {};
  const status = {};

  for (const cadence of ["daily", "weekly", "monthly"]) {
    const job = isObject(jobs[cadence]) ? jobs[cadence] : null;
    const lastRun = runs
      .filter((entry) => entry?.kind === "feature_operating_run" && entry?.cadence === cadence)
      .toSorted((a, b) => toTimestampMs(b?.run_at) - toTimestampMs(a?.run_at))[0];

    const maxStalenessHours = Number.isInteger(job?.max_staleness_hours)
      ? job.max_staleness_hours
      : cadence === "daily"
        ? 24
        : cadence === "weekly"
          ? 24 * 7
          : 24 * 35;

    const lastRunMs = toTimestampMs(lastRun?.run_at);
    const stale = !lastRunMs || nowMs - lastRunMs > maxStalenessHours * 60 * 60 * 1000;

    status[cadence] = {
      enabled: job?.enabled !== false,
      owner: typeof job?.owner === "string" ? job.owner : null,
      run_window_utc: typeof job?.run_window_utc === "string" ? job.run_window_utc : null,
      max_staleness_hours: maxStalenessHours,
      last_run_at: lastRun?.run_at || null,
      last_status: lastRun?.status || null,
      stale,
      stale_hours: lastRunMs
        ? Math.round(((nowMs - lastRunMs) / (1000 * 60 * 60)) * 100) / 100
        : null,
    };
  }

  const staleCount = Object.values(status).filter((entry) => entry.stale).length;

  return {
    generated_at: new Date(nowMs).toISOString(),
    stale_count: staleCount,
    stale: staleCount > 0,
    jobs: status,
  };
}
