function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
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

function readArrayField(feature, fieldName, errors, featureId) {
  const value = feature?.[fieldName];
  if (!Array.isArray(value)) {
    errors.push({
      code: "FEATURE_FIELD_NOT_ARRAY",
      message: `${featureId}.${fieldName} must be an array`,
      feature_id: featureId,
      field: fieldName,
    });
    return [];
  }
  for (const item of value) {
    if (typeof item !== "string" || item.trim().length === 0) {
      errors.push({
        code: "FEATURE_FIELD_ARRAY_ITEM_INVALID",
        message: `${featureId}.${fieldName} must contain non-empty strings`,
        feature_id: featureId,
        field: fieldName,
      });
      break;
    }
  }
  return value;
}

export const FEATURE_PLANES = new Set(["control", "connector", "state", "contract", "experience"]);
export const FEATURE_LIFECYCLE_STATES = new Set([
  "proposed",
  "incubating",
  "graduated",
  "mature",
  "retiring",
]);
export const OWASP_LLM_TOP10_CODES = new Set([
  "LLM01",
  "LLM02",
  "LLM03",
  "LLM04",
  "LLM05",
  "LLM06",
  "LLM07",
  "LLM08",
  "LLM09",
  "LLM10",
]);

function validateNestedArrayObject(options) {
  const { parent, fieldName, requiredFields, errors, featureId } = options;
  const value = parent?.[fieldName];
  if (!isObject(value)) {
    errors.push({
      code: "FEATURE_NESTED_OBJECT_MISSING",
      message: `${featureId}.${fieldName} must be an object`,
      feature_id: featureId,
      field: fieldName,
    });
    return;
  }
  for (const nestedField of requiredFields) {
    readArrayField(value, nestedField, errors, `${featureId}.${fieldName}`);
  }
}

function validateOptionalNumericField(options) {
  const { object, fieldName, min, max, errors, featureId } = options;
  const value = object?.[fieldName];
  if (value === null) {
    return;
  }
  if (!isFiniteNumber(value) || value < min || value > max) {
    errors.push({
      code: "FEATURE_USAGE_SIGNAL_INVALID",
      message: `${featureId}.usage_signals.${fieldName} must be null or number in [${min}, ${max}]`,
      feature_id: featureId,
      field: fieldName,
    });
  }
}

export function validateFeatureRegistrySchema(schema) {
  const errors = [];

  if (!isObject(schema)) {
    return {
      ok: false,
      errors: [
        {
          code: "FEATURE_REGISTRY_SCHEMA_INVALID_ROOT",
          message: "feature_registry_schema must be an object",
        },
      ],
    };
  }

  if (!Number.isInteger(schema._config_version) || schema._config_version < 1) {
    errors.push({
      code: "FEATURE_REGISTRY_SCHEMA_CONFIG_VERSION_INVALID",
      message: "feature_registry_schema._config_version must be an integer >= 1",
    });
  }

  if (schema._artifact !== "feature_registry_schema") {
    errors.push({
      code: "FEATURE_REGISTRY_SCHEMA_ARTIFACT_INVALID",
      message: 'feature_registry_schema._artifact must be "feature_registry_schema"',
    });
  }

  if (typeof schema.$schema !== "string" || !schema.$schema.includes("json-schema")) {
    errors.push({
      code: "FEATURE_REGISTRY_SCHEMA_DRAFT_MISSING",
      message: "feature_registry_schema.$schema must be a JSON Schema URI",
    });
  }

  if (schema.type !== "object") {
    errors.push({
      code: "FEATURE_REGISTRY_SCHEMA_TYPE_INVALID",
      message: "feature_registry_schema.type must be object",
    });
  }

  const required = normalizeStringList(schema.required || []);
  for (const field of ["_config_version", "_artifact", "policy_context", "features"]) {
    if (!required.includes(field)) {
      errors.push({
        code: "FEATURE_REGISTRY_SCHEMA_REQUIRED_FIELD_MISSING",
        message: `feature_registry_schema.required must include ${field}`,
      });
    }
  }

  if (!isObject(schema.properties) || !isObject(schema.properties.features)) {
    errors.push({
      code: "FEATURE_REGISTRY_SCHEMA_PROPERTIES_MISSING",
      message: "feature_registry_schema.properties.features must be defined",
    });
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function validateFeatureRegistry(registry) {
  const errors = [];
  const warnings = [];

  if (!isObject(registry)) {
    return {
      ok: false,
      errors: [
        {
          code: "FEATURE_REGISTRY_INVALID_ROOT",
          message: "feature_registry must be an object",
        },
      ],
      warnings,
      stats: { features: 0, dependencies: 0 },
    };
  }

  if (!Number.isInteger(registry._config_version) || registry._config_version < 1) {
    errors.push({
      code: "FEATURE_REGISTRY_CONFIG_VERSION_INVALID",
      message: "feature_registry._config_version must be an integer >= 1",
    });
  }

  if (registry._artifact !== "feature_registry") {
    errors.push({
      code: "FEATURE_REGISTRY_ARTIFACT_INVALID",
      message: 'feature_registry._artifact must be "feature_registry"',
    });
  }

  const policyContext = isObject(registry.policy_context) ? registry.policy_context : null;
  if (!policyContext) {
    errors.push({
      code: "FEATURE_REGISTRY_POLICY_CONTEXT_MISSING",
      message: "feature_registry.policy_context must be an object",
    });
  }

  const moduleClasses = normalizeStringList(policyContext?.module_classes || []);
  if (moduleClasses.length === 0) {
    errors.push({
      code: "FEATURE_REGISTRY_MODULE_CLASSES_MISSING",
      message: "feature_registry.policy_context.module_classes must be non-empty",
    });
  }

  const features = Array.isArray(registry.features) ? registry.features : [];
  if (features.length === 0) {
    errors.push({
      code: "FEATURE_REGISTRY_FEATURES_MISSING",
      message: "feature_registry.features must be non-empty",
    });
  }

  const featureIds = new Set();
  const dependenciesByFeature = new Map();
  let dependencyEdges = 0;

  for (const feature of features) {
    if (!isObject(feature)) {
      errors.push({
        code: "FEATURE_ENTRY_INVALID",
        message: "feature entry must be an object",
      });
      continue;
    }

    const featureId = typeof feature.feature_id === "string" ? feature.feature_id.trim() : "";
    if (!featureId) {
      errors.push({
        code: "FEATURE_ID_MISSING",
        message: "feature.feature_id must be non-empty",
      });
      continue;
    }

    if (featureIds.has(featureId)) {
      errors.push({
        code: "FEATURE_ID_DUPLICATE",
        message: `duplicate feature_id: ${featureId}`,
        feature_id: featureId,
      });
      continue;
    }
    featureIds.add(featureId);

    const plane = typeof feature.plane === "string" ? feature.plane.trim() : "";
    if (!FEATURE_PLANES.has(plane)) {
      errors.push({
        code: "FEATURE_PLANE_INVALID",
        message: `${featureId}.plane must be one of: ${Array.from(FEATURE_PLANES).join(", ")}`,
        feature_id: featureId,
      });
    }

    for (const field of ["name", "owner", "backup_owner", "module_class"]) {
      const value = typeof feature[field] === "string" ? feature[field].trim() : "";
      if (!value) {
        errors.push({
          code: "FEATURE_REQUIRED_FIELD_MISSING",
          message: `${featureId}.${field} must be a non-empty string`,
          feature_id: featureId,
          field,
        });
      }
    }

    const moduleClass = typeof feature.module_class === "string" ? feature.module_class.trim() : "";
    if (moduleClasses.length > 0 && moduleClass && !moduleClasses.includes(moduleClass)) {
      errors.push({
        code: "FEATURE_MODULE_CLASS_UNKNOWN",
        message: `${featureId}.module_class must be one of policy, workflow, connector, domain_engine`,
        feature_id: featureId,
      });
    }

    const lifecycleState =
      typeof feature.lifecycle_state === "string" ? feature.lifecycle_state.trim() : "";
    if (!FEATURE_LIFECYCLE_STATES.has(lifecycleState)) {
      errors.push({
        code: "FEATURE_LIFECYCLE_INVALID",
        message: `${featureId}.lifecycle_state must be one of: ${Array.from(
          FEATURE_LIFECYCLE_STATES,
        ).join(", ")}`,
        feature_id: featureId,
      });
    }

    const maturityScore = feature.maturity_score;
    if (!Number.isInteger(maturityScore) || maturityScore < 0 || maturityScore > 5) {
      errors.push({
        code: "FEATURE_MATURITY_SCORE_INVALID",
        message: `${featureId}.maturity_score must be an integer in [0, 5]`,
        feature_id: featureId,
      });
    }

    const fragilityScore = feature.fragility_score;
    if (!isFiniteNumber(fragilityScore) || fragilityScore < 0 || fragilityScore > 100) {
      errors.push({
        code: "FEATURE_FRAGILITY_SCORE_INVALID",
        message: `${featureId}.fragility_score must be a number in [0, 100]`,
        feature_id: featureId,
      });
    }

    validateNestedArrayObject({
      parent: feature,
      fieldName: "qa_contracts",
      requiredFields: ["test_suites", "replay_scenarios", "browser_gates"],
      errors,
      featureId,
    });
    validateNestedArrayObject({
      parent: feature,
      fieldName: "security_controls",
      requiredFields: ["policy_refs", "owasp_llm_top10"],
      errors,
      featureId,
    });
    validateNestedArrayObject({
      parent: feature,
      fieldName: "runtime_signals",
      requiredFields: ["events", "slos", "alerts"],
      errors,
      featureId,
    });

    const usageSignals = isObject(feature.usage_signals) ? feature.usage_signals : null;
    if (!usageSignals) {
      errors.push({
        code: "FEATURE_USAGE_SIGNALS_MISSING",
        message: `${featureId}.usage_signals must be an object`,
        feature_id: featureId,
      });
    } else {
      validateOptionalNumericField({
        object: usageSignals,
        fieldName: "invocation_count_30d",
        min: 0,
        max: 1_000_000_000,
        errors,
        featureId,
      });
      validateOptionalNumericField({
        object: usageSignals,
        fieldName: "adoption_ratio_30d",
        min: 0,
        max: 1,
        errors,
        featureId,
      });
      validateOptionalNumericField({
        object: usageSignals,
        fieldName: "success_rate_30d",
        min: 0,
        max: 1,
        errors,
        featureId,
      });
    }

    const dependencies = readArrayField(feature, "dependencies", errors, featureId);
    dependencyEdges += dependencies.length;
    dependenciesByFeature.set(featureId, dependencies);

    const researchProfile = isObject(feature.research_profile) ? feature.research_profile : null;
    if (!researchProfile) {
      errors.push({
        code: "FEATURE_RESEARCH_PROFILE_MISSING",
        message: `${featureId}.research_profile must be an object`,
        feature_id: featureId,
      });
    } else {
      if (researchProfile.last_benchmark_date !== null) {
        const value =
          typeof researchProfile.last_benchmark_date === "string"
            ? researchProfile.last_benchmark_date.trim()
            : "";
        if (!value) {
          errors.push({
            code: "FEATURE_RESEARCH_BENCHMARK_DATE_INVALID",
            message: `${featureId}.research_profile.last_benchmark_date must be null or non-empty string`,
            feature_id: featureId,
          });
        }
      }
      readArrayField(
        researchProfile,
        "trigger_conditions",
        errors,
        `${featureId}.research_profile`,
      );
      readArrayField(researchProfile, "external_patterns", errors, `${featureId}.research_profile`);
    }

    const hasQa =
      Array.isArray(feature.qa_contracts?.test_suites) &&
      feature.qa_contracts.test_suites.length > 0;
    if (!hasQa) {
      warnings.push({
        code: "FEATURE_QA_CONTRACTS_EMPTY",
        message: `${featureId} has no test_suites mapped yet`,
        feature_id: featureId,
      });
    }
  }

  for (const [featureId, dependencies] of dependenciesByFeature.entries()) {
    for (const dependency of dependencies) {
      const normalized = typeof dependency === "string" ? dependency.trim() : "";
      if (!normalized) {
        continue;
      }
      if (normalized === featureId) {
        errors.push({
          code: "FEATURE_SELF_DEPENDENCY",
          message: `${featureId} cannot depend on itself`,
          feature_id: featureId,
        });
        continue;
      }
      if (!featureIds.has(normalized)) {
        errors.push({
          code: "FEATURE_DEPENDENCY_MISSING",
          message: `${featureId} depends on unknown feature ${normalized}`,
          feature_id: featureId,
          dependency_id: normalized,
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      features: features.length,
      dependencies: dependencyEdges,
    },
  };
}

export function validateFeatureCoverage(registry) {
  const errors = [];

  if (!isObject(registry)) {
    return {
      ok: false,
      errors: [
        {
          code: "FEATURE_COVERAGE_INVALID_ROOT",
          message: "feature_registry must be an object",
        },
      ],
      stats: {
        features_checked: 0,
        qa_refs: 0,
        security_refs: 0,
        runtime_signal_refs: 0,
      },
    };
  }

  const features = Array.isArray(registry.features) ? registry.features : [];
  let qaRefs = 0;
  let securityRefs = 0;
  let runtimeRefs = 0;

  for (const feature of features) {
    const featureId = typeof feature?.feature_id === "string" ? feature.feature_id.trim() : "";
    if (!featureId) {
      continue;
    }

    const testSuites = normalizeStringList(feature?.qa_contracts?.test_suites || []);
    const replayScenarios = normalizeStringList(feature?.qa_contracts?.replay_scenarios || []);
    const browserGates = normalizeStringList(feature?.qa_contracts?.browser_gates || []);
    if (testSuites.length === 0) {
      errors.push({
        code: "FEATURE_COVERAGE_QA_TESTS_MISSING",
        message: `${featureId} must map at least one qa_contracts.test_suites entry`,
        feature_id: featureId,
      });
    }
    if (replayScenarios.length === 0) {
      errors.push({
        code: "FEATURE_COVERAGE_QA_REPLAY_MISSING",
        message: `${featureId} must map at least one qa_contracts.replay_scenarios entry`,
        feature_id: featureId,
      });
    }
    if (browserGates.length === 0) {
      errors.push({
        code: "FEATURE_COVERAGE_QA_BROWSER_MISSING",
        message: `${featureId} must map at least one qa_contracts.browser_gates entry`,
        feature_id: featureId,
      });
    }
    qaRefs += testSuites.length + replayScenarios.length + browserGates.length;

    const policyRefs = normalizeStringList(feature?.security_controls?.policy_refs || []);
    const owasp = normalizeStringList(feature?.security_controls?.owasp_llm_top10 || []);
    if (policyRefs.length === 0) {
      errors.push({
        code: "FEATURE_COVERAGE_POLICY_REFS_MISSING",
        message: `${featureId} must map at least one security_controls.policy_refs entry`,
        feature_id: featureId,
      });
    }
    if (owasp.length === 0) {
      errors.push({
        code: "FEATURE_COVERAGE_OWASP_MISSING",
        message: `${featureId} must map at least one security_controls.owasp_llm_top10 entry`,
        feature_id: featureId,
      });
    } else {
      for (const code of owasp) {
        if (!OWASP_LLM_TOP10_CODES.has(code)) {
          errors.push({
            code: "FEATURE_COVERAGE_OWASP_INVALID",
            message: `${featureId} has unsupported OWASP code ${code}`,
            feature_id: featureId,
            code_value: code,
          });
        }
      }
    }
    securityRefs += policyRefs.length + owasp.length;

    const runtimeEvents = normalizeStringList(feature?.runtime_signals?.events || []);
    const runtimeSlos = normalizeStringList(feature?.runtime_signals?.slos || []);
    const runtimeAlerts = normalizeStringList(feature?.runtime_signals?.alerts || []);
    if (runtimeEvents.length === 0 || runtimeSlos.length === 0 || runtimeAlerts.length === 0) {
      errors.push({
        code: "FEATURE_COVERAGE_RUNTIME_SIGNALS_INCOMPLETE",
        message: `${featureId} must map runtime_signals events/slos/alerts`,
        feature_id: featureId,
      });
    }
    runtimeRefs += runtimeEvents.length + runtimeSlos.length + runtimeAlerts.length;
  }

  return {
    ok: errors.length === 0,
    errors,
    stats: {
      features_checked: features.length,
      qa_refs: qaRefs,
      security_refs: securityRefs,
      runtime_signal_refs: runtimeRefs,
    },
  };
}
