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
