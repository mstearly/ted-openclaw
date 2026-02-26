function normalizePositiveInteger(value, fallback = 1) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

export function buildWorkflowMetadataLookupFromRegistry(registryConfig) {
  const workflows = Array.isArray(registryConfig?.workflows) ? registryConfig.workflows : [];
  const lookup = new Map();
  for (const workflow of workflows) {
    if (!workflow || typeof workflow !== "object") {
      continue;
    }
    const workflowId = typeof workflow.workflow_id === "string" ? workflow.workflow_id.trim() : "";
    if (!workflowId) {
      continue;
    }
    const definitionHash =
      typeof workflow.definition_hash === "string" && workflow.definition_hash.trim().length > 0
        ? workflow.definition_hash.trim()
        : null;
    lookup.set(workflowId, {
      workflow_version: normalizePositiveInteger(workflow.workflow_version, 1),
      definition_hash: definitionHash,
    });
  }
  return lookup;
}

export function applyWorkflowMetadataFallback(record, workflowLookup = new Map()) {
  if (!record || typeof record !== "object") {
    return record;
  }

  const workflowId = typeof record.workflow_id === "string" ? record.workflow_id.trim() : "";
  const fallback = workflowId ? workflowLookup.get(workflowId) : null;

  const workflowVersion =
    Number.isInteger(record.workflow_version) && record.workflow_version > 0
      ? record.workflow_version
      : normalizePositiveInteger(fallback?.workflow_version, 1);

  const definitionHash =
    typeof record.definition_hash === "string" && record.definition_hash.trim().length > 0
      ? record.definition_hash.trim()
      : fallback?.definition_hash || null;

  const snapshotRef =
    typeof record.workflow_snapshot_ref === "string" &&
    record.workflow_snapshot_ref.trim().length > 0
      ? record.workflow_snapshot_ref.trim()
      : definitionHash && workflowId
        ? `${workflowId}@v${workflowVersion}:${definitionHash}`
        : workflowId
          ? `${workflowId}@legacy`
          : "workflow@legacy";

  return {
    ...record,
    workflow_version: workflowVersion,
    definition_hash: definitionHash,
    workflow_snapshot_ref: snapshotRef,
  };
}

function ensureSchemaVersion(record) {
  if (!record || typeof record !== "object") {
    return record;
  }
  if (Number.isInteger(record._schema_version)) {
    return record;
  }
  return { ...record, _schema_version: 1 };
}

export function upcastWorkflowRunRecord(record, workflowLookup = new Map()) {
  const seeded = ensureSchemaVersion(record);
  if (!seeded || typeof seeded !== "object" || seeded.kind !== "workflow_run") {
    return seeded;
  }
  return applyWorkflowMetadataFallback(seeded, workflowLookup);
}

export function upcastFrictionRollupRecord(record, workflowLookup = new Map()) {
  const seeded = ensureSchemaVersion(record);
  if (!seeded || typeof seeded !== "object" || seeded.kind !== "friction_rollup") {
    return seeded;
  }
  return applyWorkflowMetadataFallback(seeded, workflowLookup);
}

function hasRecordChanged(before, after) {
  if (before === after) {
    return false;
  }
  try {
    return JSON.stringify(before) !== JSON.stringify(after);
  } catch {
    return true;
  }
}

export function backfillWorkflowMetadataBatch(records, recordKind, workflowLookup = new Map()) {
  const input = Array.isArray(records) ? records : [];
  const normalized = [];
  let touched = 0;

  for (const record of input) {
    let transformed = record;
    if (recordKind === "workflow_run") {
      transformed = upcastWorkflowRunRecord(record, workflowLookup);
    } else if (recordKind === "friction_rollup") {
      transformed = upcastFrictionRollupRecord(record, workflowLookup);
    } else {
      transformed = ensureSchemaVersion(record);
    }
    if (hasRecordChanged(record, transformed)) {
      touched += 1;
    }
    normalized.push(transformed);
  }

  return {
    records: normalized,
    total: input.length,
    touched,
    unchanged: input.length - touched,
  };
}
