import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dryRunScriptPath = path.resolve(
  __dirname,
  "../../../scripts/ted-profile/migration-dry-run-report.mjs",
);

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function runDryRunReport(configDir, manifestPath, migrationStatePath) {
  const stdout = execFileSync(
    process.execPath,
    [
      dryRunScriptPath,
      "--config-dir",
      configDir,
      "--manifest",
      manifestPath,
      "--migration-state",
      migrationStatePath,
    ],
    { encoding: "utf8" },
  );
  return JSON.parse(stdout);
}

describe("migration dry-run reporting", () => {
  test("dry-run report identifies pending changes and leaves configs untouched", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ted-migration-dry-run-"));
    try {
      const configDir = path.join(tempDir, "config");
      const hardBansPath = path.join(configDir, "hard_bans.json");
      const manifestPath = path.join(configDir, "migration_manifest.json");
      const migrationStatePath = path.join(configDir, "migration_state.json");

      writeJson(hardBansPath, { bans: [] });
      writeJson(manifestPath, {
        _config_version: 1,
        migrations: [{ id: "001_baseline_schema_versions", order: 1, depends_on: [] }],
      });
      writeJson(migrationStatePath, { _config_version: 1, applied: [], last_run: null });

      const before = fs.readFileSync(hardBansPath, "utf8");
      const report = runDryRunReport(configDir, manifestPath, migrationStatePath);
      const after = fs.readFileSync(hardBansPath, "utf8");

      expect(after).toBe(before);
      expect(report.plan_size).toBe(1);
      expect(report.totals.pending).toBe(1);
      expect(report.totals.would_change_files).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(report.migrations)).toBe(true);
      expect(report.migrations[0].id).toBe("001_baseline_schema_versions");
      expect(report.migrations[0].status).toBe("dry_run_complete");
      expect(report.migrations[0].summary.would_version).toBeGreaterThanOrEqual(1);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("dry-run report is deterministic for the same inputs (except timestamp)", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ted-migration-dry-run-deterministic-"));
    try {
      const configDir = path.join(tempDir, "config");
      const hardBansPath = path.join(configDir, "hard_bans.json");
      const manifestPath = path.join(configDir, "migration_manifest.json");
      const migrationStatePath = path.join(configDir, "migration_state.json");

      writeJson(hardBansPath, { bans: [] });
      writeJson(manifestPath, {
        _config_version: 1,
        migrations: [{ id: "001_baseline_schema_versions", order: 1, depends_on: [] }],
      });
      writeJson(migrationStatePath, { _config_version: 1, applied: [], last_run: null });

      const first = runDryRunReport(configDir, manifestPath, migrationStatePath);
      const second = runDryRunReport(configDir, manifestPath, migrationStatePath);
      delete first.generated_at;
      delete second.generated_at;
      expect(second).toEqual(first);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
