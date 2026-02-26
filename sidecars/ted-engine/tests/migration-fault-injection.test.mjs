import { describe, expect, test } from "vitest";
import {
  hasActivePartialFailure,
  hasInProgressCheckpoint,
  normalizeMigrationState,
  withMigrationApplied,
  withMigrationCheckpoint,
  withMigrationFailure,
} from "../modules/migration_state.mjs";

const SAMPLE_MIGRATION = {
  id: "002_fault_injection",
  order: 2,
  depends_on: ["001_baseline_schema_versions"],
};

describe("migration fault injection state transitions", () => {
  test("failure transition marks partial failure with rollback metadata", () => {
    const base = normalizeMigrationState({ _config_version: 1, applied: [], last_run: null });
    const checkpointed = withMigrationCheckpoint(base, SAMPLE_MIGRATION, "/tmp/backup-1");
    const failed = withMigrationFailure(
      checkpointed,
      SAMPLE_MIGRATION,
      "injected_failure",
      "/tmp/backup-1",
      "2026-02-26T12:00:00.000Z",
    );

    expect(hasActivePartialFailure(failed)).toBe(true);
    expect(failed.partial_failure?.rollback_required).toBe(true);
    expect(failed.partial_failure?.rollback_checkpoint_path).toBe("/tmp/backup-1");
    expect(failed.last_checkpoint?.status).toBe("failed");
    expect(failed.last_checkpoint?.error).toBe("injected_failure");
  });

  test("in-progress checkpoint is detected as startup risk", () => {
    const base = normalizeMigrationState({ _config_version: 1, applied: [], last_run: null });
    const checkpointed = withMigrationCheckpoint(base, SAMPLE_MIGRATION, "/tmp/backup-2");
    expect(hasInProgressCheckpoint(checkpointed)).toBe(true);
    expect(hasActivePartialFailure(checkpointed)).toBe(false);
  });

  test("success transition clears partial failure and preserves applied history", () => {
    const failed = withMigrationFailure(
      normalizeMigrationState({ _config_version: 1, applied: [], last_run: null }),
      SAMPLE_MIGRATION,
      "injected_failure",
      "/tmp/backup-3",
      "2026-02-26T12:00:00.000Z",
    );
    const appliedRecord = {
      id: SAMPLE_MIGRATION.id,
      order: SAMPLE_MIGRATION.order,
      depends_on: SAMPLE_MIGRATION.depends_on,
      applied_at: "2026-02-26T12:01:00.000Z",
      affected_configs: [],
      result: [],
    };
    const recovered = withMigrationApplied(
      withMigrationCheckpoint(failed, SAMPLE_MIGRATION, "/tmp/backup-3"),
      SAMPLE_MIGRATION,
      appliedRecord,
      "2026-02-26T12:01:00.000Z",
    );

    expect(hasActivePartialFailure(recovered)).toBe(false);
    expect(hasInProgressCheckpoint(recovered)).toBe(false);
    expect(recovered.last_checkpoint?.status).toBe("applied");
    expect(recovered.applied).toHaveLength(1);
  });
});
