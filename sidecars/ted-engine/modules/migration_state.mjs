function asNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function normalizeMigrationState(rawState) {
  const state = rawState && typeof rawState === "object" ? rawState : {};
  return {
    _config_version:
      Number.isInteger(state._config_version) && state._config_version > 0
        ? state._config_version
        : 1,
    applied: Array.isArray(state.applied) ? [...state.applied] : [],
    last_run: asNonEmptyString(state.last_run),
    last_checkpoint:
      state.last_checkpoint && typeof state.last_checkpoint === "object"
        ? { ...state.last_checkpoint }
        : null,
    partial_failure:
      state.partial_failure && typeof state.partial_failure === "object"
        ? { ...state.partial_failure }
        : null,
  };
}

export function hasActivePartialFailure(state) {
  const normalized = normalizeMigrationState(state);
  return normalized.partial_failure?.active === true;
}

export function hasInProgressCheckpoint(state) {
  const normalized = normalizeMigrationState(state);
  return normalized.last_checkpoint?.status === "in_progress";
}

export function withMigrationCheckpoint(
  state,
  migration,
  backupPath,
  startedAt = new Date().toISOString(),
) {
  const normalized = normalizeMigrationState(state);
  return {
    ...normalized,
    partial_failure: null,
    last_checkpoint: {
      migration_id: migration.id,
      order: migration.order,
      depends_on: Array.isArray(migration.depends_on) ? [...migration.depends_on] : [],
      status: "in_progress",
      started_at: startedAt,
      backup_path: backupPath || null,
    },
  };
}

export function withMigrationApplied(
  state,
  migration,
  record,
  completedAt = new Date().toISOString(),
) {
  const normalized = normalizeMigrationState(state);
  return {
    ...normalized,
    applied: [...normalized.applied, record],
    partial_failure: null,
    last_checkpoint: {
      migration_id: migration.id,
      order: migration.order,
      depends_on: Array.isArray(migration.depends_on) ? [...migration.depends_on] : [],
      status: "applied",
      started_at: normalized.last_checkpoint?.started_at || completedAt,
      completed_at: completedAt,
      backup_path: normalized.last_checkpoint?.backup_path || null,
    },
  };
}

export function withMigrationFailure(
  state,
  migration,
  errorMessage,
  backupPath,
  failedAt = new Date().toISOString(),
) {
  const normalized = normalizeMigrationState(state);
  const safeError = asNonEmptyString(errorMessage) || "unknown_migration_error";
  return {
    ...normalized,
    last_checkpoint: {
      migration_id: migration.id,
      order: migration.order,
      depends_on: Array.isArray(migration.depends_on) ? [...migration.depends_on] : [],
      status: "failed",
      started_at: normalized.last_checkpoint?.started_at || failedAt,
      failed_at: failedAt,
      backup_path: backupPath || normalized.last_checkpoint?.backup_path || null,
      error: safeError,
    },
    partial_failure: {
      active: true,
      migration_id: migration.id,
      order: migration.order,
      failed_at: failedAt,
      error: safeError,
      rollback_checkpoint_path: backupPath || normalized.last_checkpoint?.backup_path || null,
      rollback_required: true,
    },
  };
}
