function uniqueStringList(raw, maxItems = 256) {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    const normalized = typeof item === "string" ? item.trim() : "";
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

function toBoundedInt(value, fallback, min = 0, max = 100) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  if (parsed < min) {
    return min;
  }
  if (parsed > max) {
    return max;
  }
  return parsed;
}

function hashToPercent(seed) {
  let hash = 5381;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33) ^ seed.charCodeAt(index);
  }
  const normalized = Math.abs(hash >>> 0);
  return normalized % 100;
}

function normalizeCohort(raw, index) {
  const cohort = raw && typeof raw === "object" ? raw : {};
  return {
    cohort_id:
      typeof cohort.cohort_id === "string" && cohort.cohort_id.trim().length > 0
        ? cohort.cohort_id.trim()
        : `cohort_${index + 1}`,
    enabled: cohort.enabled !== false,
    rollout_percent: toBoundedInt(cohort.rollout_percent, 0),
    operator_ids: uniqueStringList(cohort.operator_ids || [], 128),
    workflow_ids: uniqueStringList(cohort.workflow_ids || [], 128),
    route_keys: uniqueStringList(cohort.route_keys || [], 128),
  };
}

function normalizeRollbackTrigger(raw) {
  const trigger = raw && typeof raw === "object" ? raw : {};
  return {
    reason_code:
      typeof trigger.reason_code === "string" && trigger.reason_code.trim().length > 0
        ? trigger.reason_code.trim()
        : "",
    severity:
      trigger.severity === "high" || trigger.severity === "medium" || trigger.severity === "low"
        ? trigger.severity
        : "high",
    action:
      typeof trigger.action === "string" && trigger.action.trim().length > 0
        ? trigger.action.trim()
        : "disable_rollout",
  };
}

export function normalizeRolloutPolicy(raw, fallback) {
  const cfg = raw && typeof raw === "object" ? raw : {};
  const cohortsRaw = Array.isArray(cfg.cohorts) ? cfg.cohorts : [];
  const rollbackTriggersRaw = Array.isArray(cfg.rollback_triggers) ? cfg.rollback_triggers : [];
  return {
    ...fallback,
    ...cfg,
    version:
      typeof cfg.version === "string" && cfg.version.trim().length > 0
        ? cfg.version.trim()
        : fallback.version,
    default_rollout_percent: toBoundedInt(
      cfg.default_rollout_percent,
      fallback.default_rollout_percent,
    ),
    transport_canary_percent: toBoundedInt(
      cfg.transport_canary_percent,
      fallback.transport_canary_percent,
    ),
    stickiness_key_fields: uniqueStringList(
      cfg.stickiness_key_fields || fallback.stickiness_key_fields,
      16,
    ),
    cohorts: cohortsRaw.map((cohort, index) => normalizeCohort(cohort, index)),
    rollback_triggers: rollbackTriggersRaw.map((trigger) => normalizeRollbackTrigger(trigger)),
  };
}

export function validateRolloutPolicy(policy) {
  const errors = [];
  if (!policy || typeof policy !== "object") {
    return {
      ok: false,
      errors: [{ code: "rollout_policy_not_object", message: "rollout policy must be an object" }],
    };
  }
  if (!Number.isInteger(policy._config_version) || policy._config_version < 1) {
    errors.push({
      code: "rollout_policy_config_version_invalid",
      message: "_config_version must be an integer >= 1",
    });
  }
  if (typeof policy.version !== "string" || policy.version.trim().length === 0) {
    errors.push({
      code: "rollout_policy_version_missing",
      message: "version must be a non-empty string",
    });
  }
  for (const key of ["default_rollout_percent", "transport_canary_percent"]) {
    const parsed = Number.parseInt(String(policy[key] ?? ""), 10);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
      errors.push({
        code: `rollout_policy_${key}_invalid`,
        message: `${key} must be an integer between 0 and 100`,
      });
    }
  }
  const stickiness = uniqueStringList(policy.stickiness_key_fields || [], 16);
  if (stickiness.length === 0) {
    errors.push({
      code: "rollout_policy_stickiness_missing",
      message: "stickiness_key_fields must include at least one key",
    });
  }
  const cohorts = Array.isArray(policy.cohorts) ? policy.cohorts : [];
  const seenCohorts = new Set();
  for (const cohort of cohorts) {
    const cohortId = typeof cohort?.cohort_id === "string" ? cohort.cohort_id.trim() : "";
    if (!cohortId) {
      errors.push({
        code: "rollout_policy_cohort_id_missing",
        message: "cohort entry is missing cohort_id",
      });
      continue;
    }
    if (seenCohorts.has(cohortId)) {
      errors.push({
        code: "rollout_policy_cohort_duplicate",
        message: `duplicate cohort_id: ${cohortId}`,
      });
    }
    seenCohorts.add(cohortId);
    const percent = Number.parseInt(String(cohort.rollout_percent ?? ""), 10);
    if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
      errors.push({
        code: "rollout_policy_cohort_percent_invalid",
        message: `cohort ${cohortId} rollout_percent must be between 0 and 100`,
      });
    }
  }
  const rollbackTriggers = Array.isArray(policy.rollback_triggers) ? policy.rollback_triggers : [];
  if (rollbackTriggers.length === 0) {
    errors.push({
      code: "rollout_policy_rollback_triggers_missing",
      message: "rollback_triggers must contain at least one trigger",
    });
  }
  for (const trigger of rollbackTriggers) {
    const reasonCode = typeof trigger?.reason_code === "string" ? trigger.reason_code.trim() : "";
    if (!reasonCode) {
      errors.push({
        code: "rollout_policy_trigger_reason_missing",
        message: "rollback trigger missing reason_code",
      });
    }
  }
  return {
    ok: errors.length === 0,
    errors,
  };
}

function matchesCohort(cohort, context) {
  const operatorId = typeof context.operator_id === "string" ? context.operator_id : "";
  const workflowId = typeof context.workflow_id === "string" ? context.workflow_id : "";
  const routeKey = typeof context.route_key === "string" ? context.route_key : "";
  if (cohort.operator_ids.length > 0 && !cohort.operator_ids.includes(operatorId)) {
    return false;
  }
  if (cohort.workflow_ids.length > 0 && !cohort.workflow_ids.includes(workflowId)) {
    return false;
  }
  if (cohort.route_keys.length > 0 && !cohort.route_keys.includes(routeKey)) {
    return false;
  }
  return true;
}

export function resolveRolloutDecision(policy, context = {}) {
  const mode = context.mode === "transport_canary" ? "transport_canary" : "general_rollout";
  const activeCohort =
    Array.isArray(policy.cohorts) && policy.cohorts.length > 0
      ? policy.cohorts.find((cohort) => cohort.enabled && matchesCohort(cohort, context)) || null
      : null;
  const percentBase =
    mode === "transport_canary"
      ? policy.transport_canary_percent
      : (activeCohort?.rollout_percent ?? policy.default_rollout_percent);

  const seedParts = (policy.stickiness_key_fields || []).map((field) => {
    const value = context[field];
    return typeof value === "string" ? value.trim() : "";
  });
  const seed = seedParts.join("::");
  const bucket = hashToPercent(seed || "default");

  if (percentBase <= 0) {
    return {
      mode,
      cohort_id: activeCohort?.cohort_id || null,
      selected: false,
      percent: percentBase,
      bucket,
      reason_code: "auto_canary_disabled",
      stickiness_seed: seed || "default",
    };
  }

  const selected = bucket < percentBase;
  return {
    mode,
    cohort_id: activeCohort?.cohort_id || null,
    selected,
    percent: percentBase,
    bucket,
    reason_code: selected ? "selected" : "auto_canary_not_selected",
    stickiness_seed: seed || "default",
  };
}

export function evaluateRollbackTriggers(policy, activeReasonCodes = []) {
  const triggerMap = new Map();
  for (const trigger of policy.rollback_triggers || []) {
    if (!trigger?.reason_code) {
      continue;
    }
    triggerMap.set(trigger.reason_code, trigger);
  }
  const activated = uniqueStringList(activeReasonCodes, 64)
    .map((code) => triggerMap.get(code))
    .filter(Boolean);
  return {
    triggered: activated.length > 0,
    reason_codes: activated.map((trigger) => trigger.reason_code),
    triggers: activated,
  };
}
