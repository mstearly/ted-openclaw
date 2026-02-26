/**
 * Roadmap governance helpers for SDD 110 R0-003.
 *
 * Validates roadmap graph integrity and module lifecycle policy shape.
 */

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function detectCycles(graph) {
  const visited = new Set();
  const inStack = new Set();
  const cycles = [];

  function dfs(node, path) {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node);
      const cyclePath = cycleStart >= 0 ? path.slice(cycleStart).concat(node) : [node, node];
      cycles.push(cyclePath);
      return;
    }
    if (visited.has(node)) {
      return;
    }

    visited.add(node);
    inStack.add(node);
    const neighbors = graph.get(node) || [];
    for (const next of neighbors) {
      dfs(next, path.concat(next));
    }
    inStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node, [node]);
    }
  }

  return cycles;
}

export function validateRoadmapMaster(roadmap) {
  const errors = [];
  const warnings = [];

  if (!isObject(roadmap)) {
    return {
      ok: false,
      errors: [{ code: "ROADMAP_INVALID_ROOT", message: "roadmap_master must be an object" }],
      warnings,
      stats: { waves: 0, tasks: 0 },
    };
  }

  const waves = Array.isArray(roadmap.waves) ? roadmap.waves : [];
  const tasks = Array.isArray(roadmap.tasks) ? roadmap.tasks : [];

  if (waves.length === 0) {
    errors.push({ code: "ROADMAP_NO_WAVES", message: "roadmap_master.waves must be non-empty" });
  }
  if (tasks.length === 0) {
    errors.push({ code: "ROADMAP_NO_TASKS", message: "roadmap_master.tasks must be non-empty" });
  }

  const waveIds = new Set();
  const taskIds = new Set();
  const taskIndex = new Map();

  for (const wave of waves) {
    const waveId = typeof wave?.wave_id === "string" ? wave.wave_id.trim() : "";
    if (!waveId) {
      errors.push({ code: "WAVE_MISSING_ID", message: "wave missing wave_id" });
      continue;
    }
    if (waveIds.has(waveId)) {
      errors.push({ code: "WAVE_DUPLICATE_ID", message: `duplicate wave_id: ${waveId}` });
      continue;
    }
    waveIds.add(waveId);
  }

  for (const task of tasks) {
    const taskId = typeof task?.task_id === "string" ? task.task_id.trim() : "";
    const waveId = typeof task?.wave_id === "string" ? task.wave_id.trim() : "";
    if (!taskId) {
      errors.push({ code: "TASK_MISSING_ID", message: "task missing task_id" });
      continue;
    }
    if (taskIds.has(taskId)) {
      errors.push({ code: "TASK_DUPLICATE_ID", message: `duplicate task_id: ${taskId}` });
      continue;
    }
    taskIds.add(taskId);
    taskIndex.set(taskId, task);

    if (!waveId || !waveIds.has(waveId)) {
      errors.push({
        code: "TASK_ORPHAN_NO_WAVE",
        message: `task ${taskId} is not attached to a known wave`,
        task_id: taskId,
        wave_id: waveId || null,
      });
    }
  }

  const taskGraph = new Map();
  for (const taskId of taskIds) {
    taskGraph.set(taskId, []);
  }

  for (const task of tasks) {
    const taskId = typeof task?.task_id === "string" ? task.task_id.trim() : "";
    if (!taskId || !taskGraph.has(taskId)) {
      continue;
    }
    const deps = Array.isArray(task?.depends_on) ? task.depends_on : [];
    const normalizedDeps = [];
    for (const dep of deps) {
      const depId = typeof dep === "string" ? dep.trim() : "";
      if (!depId) {
        continue;
      }
      if (!taskIds.has(depId)) {
        errors.push({
          code: "TASK_DEPENDENCY_MISSING",
          message: `task ${taskId} depends on unknown task ${depId}`,
          task_id: taskId,
          dependency_id: depId,
        });
        continue;
      }
      if (depId === taskId) {
        errors.push({
          code: "TASK_SELF_DEPENDENCY",
          message: `task ${taskId} cannot depend on itself`,
          task_id: taskId,
        });
        continue;
      }
      normalizedDeps.push(depId);
    }
    taskGraph.set(taskId, normalizedDeps);
  }

  const taskCycles = detectCycles(taskGraph);
  for (const cycle of taskCycles) {
    errors.push({
      code: "TASK_CIRCULAR_DEPENDENCY",
      message: `circular task dependency detected: ${cycle.join(" -> ")}`,
      cycle,
    });
  }

  const waveGraph = new Map();
  for (const waveId of waveIds) {
    waveGraph.set(waveId, []);
  }
  for (const wave of waves) {
    const waveId = typeof wave?.wave_id === "string" ? wave.wave_id.trim() : "";
    if (!waveId) {
      continue;
    }
    const deps = Array.isArray(wave?.depends_on) ? wave.depends_on : [];
    const normalizedDeps = [];
    for (const dep of deps) {
      const depId = typeof dep === "string" ? dep.trim() : "";
      if (!depId) {
        continue;
      }
      if (!waveIds.has(depId)) {
        warnings.push({
          code: "WAVE_DEPENDENCY_EXTERNAL",
          message: `wave ${waveId} has non-wave dependency ${depId}`,
          wave_id: waveId,
          dependency_id: depId,
        });
        continue;
      }
      normalizedDeps.push(depId);
    }
    waveGraph.set(waveId, normalizedDeps);
  }

  const waveCycles = detectCycles(waveGraph);
  for (const cycle of waveCycles) {
    errors.push({
      code: "WAVE_CIRCULAR_DEPENDENCY",
      message: `circular wave dependency detected: ${cycle.join(" -> ")}`,
      cycle,
    });
  }

  for (const task of tasks) {
    const taskId = task.task_id;
    const mode = typeof task?.mode === "string" ? task.mode : "";
    if (mode !== "configure_only" && mode !== "build_cycle") {
      errors.push({
        code: "TASK_INVALID_MODE",
        message: `task ${taskId} has invalid mode: ${String(mode)}`,
        task_id: taskId,
      });
    }
  }

  for (const track of Array.isArray(roadmap.tracks) ? roadmap.tracks : []) {
    const lineItems = Array.isArray(track?.line_items) ? track.line_items : [];
    for (const lineItem of lineItems) {
      const mode = typeof track?.mode === "string" ? track.mode : "";
      if (mode !== "configure_only" && mode !== "build_cycle") {
        errors.push({
          code: "TRACK_INVALID_MODE",
          message: `track ${String(track?.track_id || "unknown")} has invalid mode ${String(mode)}`,
        });
      }
      if (typeof lineItem?.item_id !== "string" || lineItem.item_id.trim().length === 0) {
        errors.push({
          code: "TRACK_LINE_ITEM_INVALID",
          message: "track line item missing item_id",
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      waves: waves.length,
      tasks: tasks.length,
      task_edges: [...taskGraph.values()].reduce((sum, deps) => sum + deps.length, 0),
      wave_edges: [...waveGraph.values()].reduce((sum, deps) => sum + deps.length, 0),
    },
  };
}

export function validateModuleLifecyclePolicy(policy) {
  const errors = [];

  if (!isObject(policy)) {
    return {
      ok: false,
      errors: [
        {
          code: "MODULE_POLICY_INVALID_ROOT",
          message: "module_lifecycle_policy must be an object",
        },
      ],
    };
  }

  if (!isObject(policy.module_classes)) {
    errors.push({ code: "MODULE_POLICY_NO_CLASSES", message: "module_classes must be present" });
  } else {
    const requiredClasses = ["policy", "workflow", "connector", "domain_engine"];
    for (const classId of requiredClasses) {
      const entry = policy.module_classes[classId];
      if (!isObject(entry)) {
        errors.push({ code: "MODULE_CLASS_MISSING", message: `module class missing: ${classId}` });
        continue;
      }
      if (
        !Array.isArray(entry.admission_requirements) ||
        entry.admission_requirements.length === 0
      ) {
        errors.push({
          code: "MODULE_CLASS_ADMISSION_MISSING",
          message: `module class ${classId} requires non-empty admission_requirements`,
        });
      }
      if (
        !Array.isArray(entry.promotion_requirements) ||
        entry.promotion_requirements.length === 0
      ) {
        errors.push({
          code: "MODULE_CLASS_PROMOTION_MISSING",
          message: `module class ${classId} requires non-empty promotion_requirements`,
        });
      }
    }
  }

  const precedence = Array.isArray(policy.policy_precedence) ? policy.policy_precedence : [];
  if (precedence.length === 0) {
    errors.push({
      code: "MODULE_POLICY_PRECEDENCE_MISSING",
      message: "policy_precedence must be non-empty",
    });
  }

  const requiredIntakeFields = Array.isArray(policy.intake_template_required_fields)
    ? policy.intake_template_required_fields
    : [];
  if (requiredIntakeFields.length < 5) {
    errors.push({
      code: "MODULE_POLICY_INTAKE_FIELDS_WEAK",
      message: "intake_template_required_fields must include a meaningful minimum set",
    });
  }

  const kpis = Array.isArray(policy?.release_gate?.kpis) ? policy.release_gate.kpis : [];
  if (kpis.length < 4) {
    errors.push({
      code: "MODULE_POLICY_KPI_SET_WEAK",
      message: "release_gate.kpis must include at least 4 KPIs",
    });
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function validateModuleRequestIntakeTemplate(template) {
  const errors = [];

  if (!isObject(template)) {
    return {
      ok: false,
      errors: [
        {
          code: "MODULE_INTAKE_INVALID_ROOT",
          message: "module_request_intake_template must be an object",
        },
      ],
    };
  }

  const requiredFields = Array.isArray(template.required_fields) ? template.required_fields : [];
  if (requiredFields.length < 5) {
    errors.push({
      code: "MODULE_INTAKE_REQUIRED_FIELDS_WEAK",
      message: "required_fields must include a meaningful minimum set",
    });
  }
  const mustInclude = [
    "jtbd",
    "permissions",
    "success_metrics",
    "plane_mapping",
    "ledger_read_write_map",
  ];
  for (const field of mustInclude) {
    if (!requiredFields.includes(field)) {
      errors.push({
        code: "MODULE_INTAKE_REQUIRED_FIELD_MISSING",
        message: `required_fields missing ${field}`,
      });
    }
  }

  if (!isObject(template.field_schema)) {
    errors.push({
      code: "MODULE_INTAKE_SCHEMA_MISSING",
      message: "field_schema must be present",
    });
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function validateProviderAuthEntry(params) {
  const errors = [];
  if (!isObject(params.entry)) {
    errors.push({
      code: "CONNECTOR_AUTH_PROVIDER_INVALID",
      message: `provider ${params.providerId} auth policy must be an object`,
    });
    return errors;
  }

  const preferred =
    typeof params.entry.preferred_auth_mode === "string" ? params.entry.preferred_auth_mode : "";
  const allowedModes = Array.isArray(params.entry.allowed_auth_modes)
    ? params.entry.allowed_auth_modes
    : [];
  if (allowedModes.length === 0) {
    errors.push({
      code: "CONNECTOR_AUTH_ALLOWED_MODES_MISSING",
      message: `provider ${params.providerId} must define allowed_auth_modes`,
    });
  }
  if (!preferred) {
    errors.push({
      code: "CONNECTOR_AUTH_PREFERRED_MODE_MISSING",
      message: `provider ${params.providerId} must define preferred_auth_mode`,
    });
  } else if (!allowedModes.includes(preferred)) {
    errors.push({
      code: "CONNECTOR_AUTH_PREFERRED_MODE_INVALID",
      message: `provider ${params.providerId} preferred_auth_mode must be listed in allowed_auth_modes`,
    });
  }

  return errors;
}

export function validateConnectorAuthModePolicy(policy) {
  const errors = [];

  if (!isObject(policy)) {
    return {
      ok: false,
      errors: [
        {
          code: "CONNECTOR_AUTH_POLICY_INVALID_ROOT",
          message: "connector_auth_mode_policy must be an object",
        },
      ],
    };
  }

  const providers = isObject(policy.providers) ? policy.providers : null;
  if (!providers) {
    errors.push({
      code: "CONNECTOR_AUTH_POLICY_NO_PROVIDERS",
      message: "providers must be present",
    });
  } else {
    for (const providerId of ["monday", "rightsignature"]) {
      const entry = providers[providerId];
      if (!isObject(entry)) {
        errors.push({
          code: "CONNECTOR_AUTH_POLICY_PROVIDER_MISSING",
          message: `providers.${providerId} must be present`,
        });
        continue;
      }
      errors.push(
        ...validateProviderAuthEntry({
          providerId,
          entry,
        }),
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function validateAdmissionProvider(params) {
  const errors = [];
  if (!isObject(params.entry)) {
    errors.push({
      code: "CONNECTOR_ADMISSION_PROVIDER_INVALID",
      message: `providers.${params.providerId} must be an object`,
    });
    return errors;
  }

  if (typeof params.entry.trust_tier !== "string" || params.entry.trust_tier.trim().length === 0) {
    errors.push({
      code: "CONNECTOR_ADMISSION_TRUST_TIER_MISSING",
      message: `providers.${params.providerId}.trust_tier must be a non-empty string`,
    });
  }
  if (!isObject(params.entry.allowed_operations_by_phase)) {
    errors.push({
      code: "CONNECTOR_ADMISSION_PHASE_POLICY_MISSING",
      message: `providers.${params.providerId}.allowed_operations_by_phase must be an object`,
    });
  }

  return errors;
}

export function validateConnectorAdmissionPolicy(policy) {
  const errors = [];

  if (!isObject(policy)) {
    return {
      ok: false,
      errors: [
        {
          code: "CONNECTOR_ADMISSION_INVALID_ROOT",
          message: "connector_admission_policy must be an object",
        },
      ],
    };
  }

  if (typeof policy.default_mode !== "string" || policy.default_mode.trim().length === 0) {
    errors.push({
      code: "CONNECTOR_ADMISSION_DEFAULT_MODE_MISSING",
      message: "default_mode must be a non-empty string",
    });
  }

  const providers = isObject(policy.providers) ? policy.providers : null;
  if (!providers) {
    errors.push({
      code: "CONNECTOR_ADMISSION_NO_PROVIDERS",
      message: "providers must be present",
    });
  } else {
    for (const providerId of ["monday", "rightsignature"]) {
      const entry = providers[providerId];
      if (!entry) {
        errors.push({
          code: "CONNECTOR_ADMISSION_PROVIDER_MISSING",
          message: `providers.${providerId} must be present`,
        });
        continue;
      }
      errors.push(...validateAdmissionProvider({ providerId, entry }));
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function validateEsignProviderPolicy(policy) {
  const errors = [];
  if (!isObject(policy)) {
    return {
      ok: false,
      errors: [
        {
          code: "ESIGN_POLICY_INVALID_ROOT",
          message: "esign_provider_policy must be an object",
        },
      ],
    };
  }

  const activePolicy = typeof policy.active_policy === "string" ? policy.active_policy : "";
  const validPolicies = ["docusign_only", "rightsignature_only", "dual_provider"];
  if (!validPolicies.includes(activePolicy)) {
    errors.push({
      code: "ESIGN_POLICY_ACTIVE_INVALID",
      message: `active_policy must be one of: ${validPolicies.join(", ")}`,
    });
  }

  const providers = isObject(policy.providers) ? policy.providers : null;
  if (!providers) {
    errors.push({
      code: "ESIGN_POLICY_PROVIDERS_MISSING",
      message: "providers must be present",
    });
  } else {
    const docusignEnabled = providers.docusign?.enabled === true;
    const rightsignatureEnabled = providers.rightsignature?.enabled === true;
    if (activePolicy === "docusign_only" && rightsignatureEnabled) {
      errors.push({
        code: "ESIGN_POLICY_RIGHTSIGNATURE_DISABLED_REQUIRED",
        message: "rightsignature must be disabled when active_policy=docusign_only",
      });
    }
    if (activePolicy === "rightsignature_only" && docusignEnabled) {
      errors.push({
        code: "ESIGN_POLICY_DOCUSIGN_DISABLED_REQUIRED",
        message: "docusign must be disabled when active_policy=rightsignature_only",
      });
    }
    if (activePolicy === "dual_provider" && (!docusignEnabled || !rightsignatureEnabled)) {
      errors.push({
        code: "ESIGN_POLICY_DUAL_PROVIDER_REQUIRES_BOTH_ENABLED",
        message:
          "both docusign and rightsignature must be enabled when active_policy=dual_provider",
      });
    }
  }

  if (!isObject(policy.routing)) {
    errors.push({
      code: "ESIGN_POLICY_ROUTING_MISSING",
      message: "routing must be present",
    });
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function validateCompatibilityPolicy(policy) {
  const errors = [];

  if (!isObject(policy)) {
    return {
      ok: false,
      errors: [
        {
          code: "COMPAT_POLICY_INVALID_ROOT",
          message: "compatibility_policy must be an object",
        },
      ],
    };
  }

  const supportWindow = isObject(policy.support_window) ? policy.support_window : null;
  if (!supportWindow) {
    errors.push({
      code: "COMPAT_POLICY_SUPPORT_WINDOW_MISSING",
      message: "support_window must be present",
    });
  } else {
    if (
      typeof supportWindow.min_supported_api_version !== "string" ||
      supportWindow.min_supported_api_version.trim().length === 0
    ) {
      errors.push({
        code: "COMPAT_POLICY_MIN_API_VERSION_MISSING",
        message: "support_window.min_supported_api_version must be a non-empty string",
      });
    }
    if (
      !Number.isInteger(supportWindow.backward_compatible_releases) ||
      supportWindow.backward_compatible_releases < 1
    ) {
      errors.push({
        code: "COMPAT_POLICY_SUPPORT_WINDOW_INVALID",
        message: "support_window.backward_compatible_releases must be an integer >= 1",
      });
    }
  }

  const deprecation = isObject(policy.deprecation) ? policy.deprecation : null;
  if (!deprecation) {
    errors.push({
      code: "COMPAT_POLICY_DEPRECATION_MISSING",
      message: "deprecation must be present",
    });
  } else {
    const minNotice = deprecation.min_notice_days;
    const maxNotice = deprecation.max_notice_days;
    const defaultNotice = deprecation.default_notice_days;
    if (!Number.isInteger(minNotice) || minNotice < 1) {
      errors.push({
        code: "COMPAT_POLICY_DEPRECATION_MIN_INVALID",
        message: "deprecation.min_notice_days must be an integer >= 1",
      });
    }
    if (!Number.isInteger(maxNotice) || maxNotice < 1) {
      errors.push({
        code: "COMPAT_POLICY_DEPRECATION_MAX_INVALID",
        message: "deprecation.max_notice_days must be an integer >= 1",
      });
    }
    if (!Number.isInteger(defaultNotice) || defaultNotice < 1) {
      errors.push({
        code: "COMPAT_POLICY_DEPRECATION_DEFAULT_INVALID",
        message: "deprecation.default_notice_days must be an integer >= 1",
      });
    }
    if (Number.isInteger(minNotice) && Number.isInteger(maxNotice) && minNotice > maxNotice) {
      errors.push({
        code: "COMPAT_POLICY_DEPRECATION_WINDOW_INVALID",
        message: "deprecation.min_notice_days cannot exceed deprecation.max_notice_days",
      });
    }
    if (
      Number.isInteger(defaultNotice) &&
      Number.isInteger(minNotice) &&
      Number.isInteger(maxNotice) &&
      (defaultNotice < minNotice || defaultNotice > maxNotice)
    ) {
      errors.push({
        code: "COMPAT_POLICY_DEPRECATION_DEFAULT_OUT_OF_RANGE",
        message: "deprecation.default_notice_days must be within min/max notice window",
      });
    }

    const requiredStatusFields = Array.isArray(deprecation.required_status_fields)
      ? deprecation.required_status_fields
      : [];
    for (const field of ["deprecated_routes", "sunset_schedule"]) {
      if (!requiredStatusFields.includes(field)) {
        errors.push({
          code: "COMPAT_POLICY_DEPRECATION_STATUS_FIELD_MISSING",
          message: `deprecation.required_status_fields must include ${field}`,
        });
      }
    }
  }

  const compatibilityClasses = isObject(policy.compatibility_classes)
    ? policy.compatibility_classes
    : null;
  const requiredClasses = [
    "workflow_definition",
    "event_ledger_schema",
    "route_contract",
    "connector_contract",
    "config_schema",
  ];
  if (!compatibilityClasses) {
    errors.push({
      code: "COMPAT_POLICY_CLASSES_MISSING",
      message: "compatibility_classes must be present",
    });
  } else {
    for (const classId of requiredClasses) {
      const entry = compatibilityClasses[classId];
      if (!isObject(entry)) {
        errors.push({
          code: "COMPAT_POLICY_CLASS_MISSING",
          message: `compatibility_classes.${classId} must be present`,
        });
        continue;
      }
      if (!Number.isInteger(entry.support_window_releases) || entry.support_window_releases < 1) {
        errors.push({
          code: "COMPAT_POLICY_CLASS_SUPPORT_WINDOW_INVALID",
          message: `compatibility_classes.${classId}.support_window_releases must be an integer >= 1`,
        });
      }
      if (
        typeof entry.breaking_change_policy !== "string" ||
        entry.breaking_change_policy.trim().length === 0
      ) {
        errors.push({
          code: "COMPAT_POLICY_CLASS_BREAKING_POLICY_MISSING",
          message: `compatibility_classes.${classId}.breaking_change_policy must be a non-empty string`,
        });
      }
      const requiredControls = Array.isArray(entry.required_migration_controls)
        ? entry.required_migration_controls
        : [];
      if (requiredControls.length === 0) {
        errors.push({
          code: "COMPAT_POLICY_CLASS_MIGRATION_CONTROLS_MISSING",
          message: `compatibility_classes.${classId}.required_migration_controls must be non-empty`,
        });
      }
    }
  }

  const releaseGates = isObject(policy.release_gates) ? policy.release_gates : null;
  if (!releaseGates) {
    errors.push({
      code: "COMPAT_POLICY_RELEASE_GATES_MISSING",
      message: "release_gates must be present",
    });
  } else {
    for (const field of [
      "require_replay_gate_pass",
      "require_upcaster_for_schema_bump",
      "require_deprecation_entry_for_breaking_changes",
    ]) {
      if (typeof releaseGates[field] !== "boolean") {
        errors.push({
          code: "COMPAT_POLICY_RELEASE_GATE_INVALID",
          message: `release_gates.${field} must be boolean`,
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function validateRouteFreezeCollection(params) {
  const errors = [];
  if (!Array.isArray(params.entries) || params.entries.length === 0) {
    errors.push({
      code: "RETROFIT_BASELINE_ROUTE_FREEZE_EMPTY",
      message: `route_contract_freeze.${params.collectionName} must be a non-empty array`,
    });
    return errors;
  }
  for (const [index, entry] of params.entries.entries()) {
    if (!isObject(entry)) {
      errors.push({
        code: "RETROFIT_BASELINE_ROUTE_ENTRY_INVALID",
        message: `route_contract_freeze.${params.collectionName}[${index}] must be an object`,
      });
      continue;
    }
    if (typeof entry.route_key !== "string" || entry.route_key.trim().length === 0) {
      errors.push({
        code: "RETROFIT_BASELINE_ROUTE_KEY_INVALID",
        message: `route_contract_freeze.${params.collectionName}[${index}].route_key must be a non-empty string`,
      });
    }
    if (typeof entry.contract_hash !== "string" || entry.contract_hash.trim().length === 0) {
      errors.push({
        code: "RETROFIT_BASELINE_ROUTE_HASH_INVALID",
        message: `route_contract_freeze.${params.collectionName}[${index}].contract_hash must be a non-empty string`,
      });
    }
    if (!isObject(entry.contract)) {
      errors.push({
        code: "RETROFIT_BASELINE_ROUTE_CONTRACT_INVALID",
        message: `route_contract_freeze.${params.collectionName}[${index}].contract must be an object`,
      });
      continue;
    }
    if (
      !Array.isArray(entry.contract.status_codes) ||
      entry.contract.status_codes.length === 0 ||
      entry.contract.status_codes.some((status) => !Number.isInteger(status))
    ) {
      errors.push({
        code: "RETROFIT_BASELINE_ROUTE_STATUS_CODES_INVALID",
        message: `route_contract_freeze.${params.collectionName}[${index}].contract.status_codes must be a non-empty integer array`,
      });
    }
    if (
      !Array.isArray(entry.contract.required_fields) ||
      entry.contract.required_fields.length === 0 ||
      entry.contract.required_fields.some(
        (field) => typeof field !== "string" || field.trim().length === 0,
      )
    ) {
      errors.push({
        code: "RETROFIT_BASELINE_ROUTE_REQUIRED_FIELDS_INVALID",
        message: `route_contract_freeze.${params.collectionName}[${index}].contract.required_fields must be a non-empty string array`,
      });
    }
    if (entry.contract.content_type !== "application/json") {
      errors.push({
        code: "RETROFIT_BASELINE_ROUTE_CONTENT_TYPE_INVALID",
        message: `route_contract_freeze.${params.collectionName}[${index}].contract.content_type must be application/json`,
      });
    }
  }
  return errors;
}

export function validateRetrofitBaselineLock(baseline) {
  const errors = [];

  if (!isObject(baseline)) {
    return {
      ok: false,
      errors: [
        {
          code: "RETROFIT_BASELINE_INVALID_ROOT",
          message: "retrofit_rf0_baseline_lock must be an object",
        },
      ],
    };
  }

  if (typeof baseline.baseline_id !== "string" || baseline.baseline_id.trim().length === 0) {
    errors.push({
      code: "RETROFIT_BASELINE_ID_MISSING",
      message: "baseline_id must be a non-empty string",
    });
  }
  if (typeof baseline.captured_at !== "string" || baseline.captured_at.trim().length === 0) {
    errors.push({
      code: "RETROFIT_BASELINE_CAPTURED_AT_MISSING",
      message: "captured_at must be a non-empty string",
    });
  }

  const replaySampleSet = isObject(baseline.replay_sample_set) ? baseline.replay_sample_set : null;
  if (!replaySampleSet) {
    errors.push({
      code: "RETROFIT_BASELINE_REPLAY_SET_MISSING",
      message: "replay_sample_set must be present",
    });
  } else {
    const scenarioIds = Array.isArray(replaySampleSet.scenario_ids)
      ? replaySampleSet.scenario_ids
      : [];
    if (
      scenarioIds.length === 0 ||
      scenarioIds.some((entry) => typeof entry !== "string" || entry.trim().length === 0)
    ) {
      errors.push({
        code: "RETROFIT_BASELINE_REPLAY_SCENARIOS_INVALID",
        message: "replay_sample_set.scenario_ids must be a non-empty string array",
      });
    }
  }

  const runSample = isObject(baseline.workflow_run_sample) ? baseline.workflow_run_sample : null;
  if (!runSample) {
    errors.push({
      code: "RETROFIT_BASELINE_RUN_SAMPLE_MISSING",
      message: "workflow_run_sample must be present",
    });
  } else {
    const sampleCount = Number(runSample.sample_count ?? NaN);
    const samples = Array.isArray(runSample.samples) ? runSample.samples : null;
    if (!Number.isInteger(sampleCount) || sampleCount < 0) {
      errors.push({
        code: "RETROFIT_BASELINE_RUN_SAMPLE_COUNT_INVALID",
        message: "workflow_run_sample.sample_count must be an integer >= 0",
      });
    }
    if (!samples) {
      errors.push({
        code: "RETROFIT_BASELINE_RUN_SAMPLE_ARRAY_INVALID",
        message: "workflow_run_sample.samples must be an array",
      });
    } else if (Number.isInteger(sampleCount) && sampleCount !== samples.length) {
      errors.push({
        code: "RETROFIT_BASELINE_RUN_SAMPLE_MISMATCH",
        message: "workflow_run_sample.sample_count must match samples length",
      });
    }
  }

  const rollupSample = isObject(baseline.friction_rollup_sample)
    ? baseline.friction_rollup_sample
    : null;
  if (!rollupSample) {
    errors.push({
      code: "RETROFIT_BASELINE_ROLLUP_SAMPLE_MISSING",
      message: "friction_rollup_sample must be present",
    });
  } else {
    const sampleCount = Number(rollupSample.sample_count ?? NaN);
    const samples = Array.isArray(rollupSample.samples) ? rollupSample.samples : null;
    if (!Number.isInteger(sampleCount) || sampleCount < 0) {
      errors.push({
        code: "RETROFIT_BASELINE_ROLLUP_SAMPLE_COUNT_INVALID",
        message: "friction_rollup_sample.sample_count must be an integer >= 0",
      });
    }
    if (!samples) {
      errors.push({
        code: "RETROFIT_BASELINE_ROLLUP_SAMPLE_ARRAY_INVALID",
        message: "friction_rollup_sample.samples must be an array",
      });
    } else if (Number.isInteger(sampleCount) && sampleCount !== samples.length) {
      errors.push({
        code: "RETROFIT_BASELINE_ROLLUP_SAMPLE_MISMATCH",
        message: "friction_rollup_sample.sample_count must match samples length",
      });
    }
  }

  const baselineMetrics = isObject(baseline.baseline_metrics) ? baseline.baseline_metrics : null;
  if (!baselineMetrics) {
    errors.push({
      code: "RETROFIT_BASELINE_METRICS_MISSING",
      message: "baseline_metrics must be present",
    });
  } else {
    if (!Number.isInteger(baselineMetrics.total_runs) || baselineMetrics.total_runs < 0) {
      errors.push({
        code: "RETROFIT_BASELINE_METRICS_TOTAL_RUNS_INVALID",
        message: "baseline_metrics.total_runs must be an integer >= 0",
      });
    }
    for (const field of ["avg_job_friction_score", "failure_ratio"]) {
      if (typeof baselineMetrics[field] !== "number" || !Number.isFinite(baselineMetrics[field])) {
        errors.push({
          code: "RETROFIT_BASELINE_METRICS_FIELD_INVALID",
          message: `baseline_metrics.${field} must be a finite number`,
        });
      }
    }
    if (
      baselineMetrics.retry_recovery_ratio !== null &&
      (typeof baselineMetrics.retry_recovery_ratio !== "number" ||
        !Number.isFinite(baselineMetrics.retry_recovery_ratio))
    ) {
      errors.push({
        code: "RETROFIT_BASELINE_METRICS_RETRY_RECOVERY_INVALID",
        message: "baseline_metrics.retry_recovery_ratio must be number or null",
      });
    }
  }

  const routeFreeze = isObject(baseline.route_contract_freeze)
    ? baseline.route_contract_freeze
    : null;
  if (!routeFreeze) {
    errors.push({
      code: "RETROFIT_BASELINE_ROUTE_FREEZE_MISSING",
      message: "route_contract_freeze must be present",
    });
  } else {
    if (
      typeof routeFreeze.route_contracts_source_hash !== "string" ||
      routeFreeze.route_contracts_source_hash.trim().length === 0
    ) {
      errors.push({
        code: "RETROFIT_BASELINE_ROUTE_SOURCE_HASH_INVALID",
        message: "route_contract_freeze.route_contracts_source_hash must be a non-empty string",
      });
    }
    errors.push(
      ...validateRouteFreezeCollection({
        collectionName: "workflow_routes",
        entries: routeFreeze.workflow_routes,
      }),
    );
    errors.push(
      ...validateRouteFreezeCollection({
        collectionName: "migration_routes",
        entries: routeFreeze.migration_routes,
      }),
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function isValidTimeOfDay(value) {
  if (typeof value !== "string") {
    return false;
  }
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry) => typeof entry === "string" && entry.trim().length > 0);
}

function severityRankMap(severityLadder) {
  const map = new Map();
  severityLadder.forEach((severity, index) => {
    map.set(severity, index);
  });
  return map;
}

export function validateMobileAlertPolicy(policy) {
  const errors = [];

  if (!isObject(policy)) {
    return {
      ok: false,
      errors: [
        {
          code: "MOBILE_ALERT_POLICY_INVALID_ROOT",
          message: "mobile_alert_policy must be an object",
        },
      ],
    };
  }

  const classes = isObject(policy.classes) ? policy.classes : null;
  const severityLadder = normalizeStringArray(policy.severity_ladder);
  const channels = normalizeStringArray(policy.channels);
  const routing = isObject(policy.routing) ? policy.routing : null;
  const quietHours = isObject(policy.quiet_hours) ? policy.quiet_hours : null;
  const escalation = isObject(policy.escalation) ? policy.escalation : null;

  const requiredClasses = [
    "approval_required",
    "deadline_risk",
    "compliance_risk",
    "critical_incident",
  ];
  if (!classes) {
    errors.push({
      code: "MOBILE_ALERT_POLICY_CLASSES_MISSING",
      message: "classes must be present",
    });
  } else {
    for (const classId of requiredClasses) {
      const classEntry = classes[classId];
      if (!isObject(classEntry)) {
        errors.push({
          code: "MOBILE_ALERT_POLICY_CLASS_MISSING",
          message: `classes.${classId} must be present`,
        });
      }
    }
  }

  if (severityLadder.length < 3) {
    errors.push({
      code: "MOBILE_ALERT_POLICY_SEVERITY_LADDER_WEAK",
      message: "severity_ladder must include at least 3 ordered severities",
    });
  }
  if (channels.length < 2) {
    errors.push({
      code: "MOBILE_ALERT_POLICY_CHANNELS_WEAK",
      message: "channels must include at least 2 channel ids",
    });
  }

  if (!routing) {
    errors.push({
      code: "MOBILE_ALERT_POLICY_ROUTING_MISSING",
      message: "routing must be present",
    });
  } else {
    for (const classId of requiredClasses) {
      const classRouting = routing[classId];
      if (!isObject(classRouting)) {
        errors.push({
          code: "MOBILE_ALERT_POLICY_CLASS_ROUTING_MISSING",
          message: `routing.${classId} must be present`,
        });
        continue;
      }
      for (const severity of severityLadder) {
        const severityRouting = classRouting[severity];
        if (!isObject(severityRouting)) {
          errors.push({
            code: "MOBILE_ALERT_POLICY_SEVERITY_ROUTING_MISSING",
            message: `routing.${classId}.${severity} must be present`,
          });
          continue;
        }
        const primaryChannel = severityRouting.primary_channel;
        const fallbackChain = normalizeStringArray(severityRouting.fallback_chain);

        if (typeof primaryChannel !== "string" || primaryChannel.trim().length === 0) {
          errors.push({
            code: "MOBILE_ALERT_POLICY_PRIMARY_CHANNEL_MISSING",
            message: `routing.${classId}.${severity}.primary_channel must be a non-empty string`,
          });
          continue;
        }
        if (!channels.includes(primaryChannel)) {
          errors.push({
            code: "MOBILE_ALERT_POLICY_CHANNEL_UNKNOWN",
            message: `routing.${classId}.${severity}.primary_channel references unknown channel ${primaryChannel}`,
          });
        }

        const seen = new Set([primaryChannel]);
        for (const channel of fallbackChain) {
          if (!channels.includes(channel)) {
            errors.push({
              code: "MOBILE_ALERT_POLICY_CHANNEL_UNKNOWN",
              message: `routing.${classId}.${severity}.fallback_chain references unknown channel ${channel}`,
            });
          }
          if (seen.has(channel)) {
            errors.push({
              code: "MOBILE_ALERT_POLICY_FALLBACK_CHAIN_CYCLE",
              message: `routing.${classId}.${severity}.fallback_chain contains a repeated channel ${channel}`,
            });
          }
          seen.add(channel);
        }
      }
    }
  }

  if (!quietHours) {
    errors.push({
      code: "MOBILE_ALERT_POLICY_QUIET_HOURS_MISSING",
      message: "quiet_hours must be present",
    });
  } else {
    if (!isValidTimeOfDay(quietHours.start)) {
      errors.push({
        code: "MOBILE_ALERT_POLICY_QUIET_HOURS_START_INVALID",
        message: "quiet_hours.start must be HH:MM",
      });
    }
    if (!isValidTimeOfDay(quietHours.end)) {
      errors.push({
        code: "MOBILE_ALERT_POLICY_QUIET_HOURS_END_INVALID",
        message: "quiet_hours.end must be HH:MM",
      });
    }
    const overrideRules = Array.isArray(quietHours.override_rules) ? quietHours.override_rules : [];
    const severityRank = severityRankMap(severityLadder);
    for (const [index, rule] of overrideRules.entries()) {
      if (!isObject(rule)) {
        errors.push({
          code: "MOBILE_ALERT_POLICY_QUIET_OVERRIDE_INVALID",
          message: `quiet_hours.override_rules[${index}] must be an object`,
        });
        continue;
      }
      if (typeof rule.class !== "string" || !requiredClasses.includes(rule.class)) {
        errors.push({
          code: "MOBILE_ALERT_POLICY_QUIET_OVERRIDE_CLASS_INVALID",
          message: `quiet_hours.override_rules[${index}].class must be a known class`,
        });
      }
      if (typeof rule.min_severity !== "string" || !severityRank.has(rule.min_severity)) {
        errors.push({
          code: "MOBILE_ALERT_POLICY_QUIET_OVERRIDE_SEVERITY_INVALID",
          message: `quiet_hours.override_rules[${index}].min_severity must be in severity_ladder`,
        });
      }
      if (rule.bypass_quiet_hours !== true) {
        errors.push({
          code: "MOBILE_ALERT_POLICY_QUIET_OVERRIDE_BYPASS_INVALID",
          message: `quiet_hours.override_rules[${index}].bypass_quiet_hours must be true`,
        });
      }
    }
  }

  if (!escalation) {
    errors.push({
      code: "MOBILE_ALERT_POLICY_ESCALATION_MISSING",
      message: "escalation must be present",
    });
  } else {
    if (
      typeof escalation.default_delay_seconds !== "number" ||
      !Number.isFinite(escalation.default_delay_seconds) ||
      escalation.default_delay_seconds < 0
    ) {
      errors.push({
        code: "MOBILE_ALERT_POLICY_ESCALATION_DELAY_INVALID",
        message: "escalation.default_delay_seconds must be a non-negative number",
      });
    }
    if (!isObject(escalation.retry_limits)) {
      errors.push({
        code: "MOBILE_ALERT_POLICY_ESCALATION_LIMITS_MISSING",
        message: "escalation.retry_limits must be present",
      });
    } else {
      const perChannel = escalation.retry_limits.per_channel;
      const maxDepth = escalation.retry_limits.max_chain_depth;
      if (!Number.isInteger(perChannel) || perChannel < 0) {
        errors.push({
          code: "MOBILE_ALERT_POLICY_ESCALATION_PER_CHANNEL_INVALID",
          message: "escalation.retry_limits.per_channel must be a non-negative integer",
        });
      }
      if (!Number.isInteger(maxDepth) || maxDepth < 1) {
        errors.push({
          code: "MOBILE_ALERT_POLICY_ESCALATION_MAX_DEPTH_INVALID",
          message: "escalation.retry_limits.max_chain_depth must be an integer >= 1",
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
