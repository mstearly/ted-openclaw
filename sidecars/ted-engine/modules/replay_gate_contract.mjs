function uniqueStringList(raw, maxItems = 256) {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    const value = typeof item === "string" ? item.trim() : "";
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    out.push(value);
    if (out.length >= maxItems) {
      break;
    }
  }
  return out;
}

function toBoundedFloat(value, fallback, min = 0, max = 1) {
  const parsed = Number.parseFloat(String(value ?? ""));
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

function toBoundedInt(value, fallback, min = 0, max = 1000) {
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

export function normalizeReplayGateContract(raw, fallback) {
  const cfg = raw && typeof raw === "object" ? raw : {};
  return {
    ...fallback,
    ...cfg,
    version:
      typeof cfg.version === "string" && cfg.version.trim().length > 0
        ? cfg.version.trim()
        : fallback.version,
    thresholds: {
      min_pass_rate: toBoundedFloat(
        cfg.thresholds?.min_pass_rate,
        fallback.thresholds.min_pass_rate,
        0,
        1,
      ),
      max_safety_failures: toBoundedInt(
        cfg.thresholds?.max_safety_failures,
        fallback.thresholds.max_safety_failures,
        0,
        1000,
      ),
      max_adversarial_failures: toBoundedInt(
        cfg.thresholds?.max_adversarial_failures,
        fallback.thresholds.max_adversarial_failures,
        0,
        1000,
      ),
    },
    required_scenario_ids: uniqueStringList(
      cfg.required_scenario_ids || fallback.required_scenario_ids,
      512,
    ),
    failure_classes: uniqueStringList(cfg.failure_classes || fallback.failure_classes, 128),
  };
}

export function validateReplayGateContract(contract) {
  const errors = [];
  if (!contract || typeof contract !== "object") {
    return {
      ok: false,
      errors: [{ code: "contract_not_object", message: "replay gate contract must be an object" }],
    };
  }
  if (!Number.isInteger(contract._config_version) || contract._config_version < 1) {
    errors.push({
      code: "contract_config_version_invalid",
      message: "_config_version must be an integer >= 1",
    });
  }
  if (typeof contract.version !== "string" || contract.version.trim().length === 0) {
    errors.push({
      code: "contract_version_missing",
      message: "version must be a non-empty string",
    });
  }
  const thresholds =
    contract.thresholds && typeof contract.thresholds === "object" ? contract.thresholds : {};
  const minPassRate = Number.parseFloat(String(thresholds.min_pass_rate ?? ""));
  if (!Number.isFinite(minPassRate) || minPassRate < 0 || minPassRate > 1) {
    errors.push({
      code: "contract_threshold_min_pass_rate_invalid",
      message: "thresholds.min_pass_rate must be between 0 and 1",
    });
  }
  for (const key of ["max_safety_failures", "max_adversarial_failures"]) {
    const parsed = Number.parseInt(String(thresholds[key] ?? ""), 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
      errors.push({
        code: `contract_threshold_${key}_invalid`,
        message: `thresholds.${key} must be an integer >= 0`,
      });
    }
  }
  const requiredScenarioIds = uniqueStringList(contract.required_scenario_ids || [], 512);
  if (requiredScenarioIds.length === 0) {
    errors.push({
      code: "contract_required_scenarios_missing",
      message: "required_scenario_ids must contain at least one scenario id",
    });
  }
  return {
    ok: errors.length === 0,
    errors,
  };
}
