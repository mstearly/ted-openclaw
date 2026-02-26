#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as baselineSchemaMigration from "../../sidecars/ted-engine/migrations/001_baseline_schema_versions.mjs";
import { buildMigrationExecutionPlan } from "../../sidecars/ted-engine/modules/migration_registry.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function parseArgs(argv) {
  const defaultsConfigDir = path.join(repoRoot, "sidecars/ted-engine/config");
  const out = {
    configDir: defaultsConfigDir,
    manifestPath: path.join(defaultsConfigDir, "migration_manifest.json"),
    migrationStatePath: path.join(defaultsConfigDir, "migration_state.json"),
    outputPath: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--config-dir") {
      out.configDir = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--manifest") {
      out.manifestPath = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--migration-state") {
      out.migrationStatePath = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--output") {
      out.outputPath = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
  }
  return out;
}

function readJsonFileStrict(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read JSON at ${filePath}: ${error.message}`, { cause: error });
  }
}

function readMigrationState(filePath) {
  if (!fs.existsSync(filePath)) {
    return { _config_version: 1, applied: [], last_run: null };
  }
  return readJsonFileStrict(filePath);
}

function summarizeMigrationResult(result) {
  const entries = Array.isArray(result) ? result : [];
  const summary = {
    would_version: 0,
    versioned: 0,
    no_op: 0,
    skipped: 0,
    error: 0,
  };
  for (const row of entries) {
    const action = typeof row?.action === "string" ? row.action : "";
    if (action === "would_version") {
      summary.would_version += 1;
    } else if (action === "versioned") {
      summary.versioned += 1;
    } else if (action === "no_op") {
      summary.no_op += 1;
    } else if (action.startsWith("skip")) {
      summary.skipped += 1;
    } else if (action === "error") {
      summary.error += 1;
    }
  }
  return summary;
}

function buildRegistry() {
  return new Map([
    [
      baselineSchemaMigration.id,
      {
        run: baselineSchemaMigration.up,
      },
    ],
  ]);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = readJsonFileStrict(args.manifestPath);
  const migrationState = readMigrationState(args.migrationStatePath);
  const registry = buildRegistry();
  const planResult = buildMigrationExecutionPlan(manifest, registry);
  if (!planResult.ok) {
    const reason = planResult.errors.map((entry) => `${entry.code}:${entry.message}`).join(" | ");
    throw new Error(`Migration manifest is invalid: ${reason}`);
  }

  const appliedSet = new Set(
    (migrationState.applied || []).map((entry) => (typeof entry === "string" ? entry : entry.id)),
  );
  const migrations = [];
  const totals = {
    pending: 0,
    already_applied: 0,
    would_change_files: 0,
    errors: 0,
  };

  for (const migration of planResult.plan) {
    if (appliedSet.has(migration.id)) {
      migrations.push({
        id: migration.id,
        order: migration.order,
        depends_on: migration.depends_on,
        status: "already_applied",
        summary: {
          would_version: 0,
          versioned: 0,
          no_op: 0,
          skipped: 0,
          error: 0,
        },
        result: [],
      });
      totals.already_applied += 1;
      continue;
    }

    const handler = registry.get(migration.id);
    if (!handler || typeof handler.run !== "function") {
      throw new Error(`Migration ${migration.id} is missing a runtime handler`);
    }
    const result = handler.run(args.configDir, { dry_run: true });
    const summary = summarizeMigrationResult(result);
    migrations.push({
      id: migration.id,
      order: migration.order,
      depends_on: migration.depends_on,
      status: summary.error > 0 ? "error" : "dry_run_complete",
      summary,
      result,
    });
    totals.pending += 1;
    totals.would_change_files += summary.would_version;
    totals.errors += summary.error;
  }

  const report = {
    generated_at: new Date().toISOString(),
    config_dir: args.configDir,
    manifest_path: args.manifestPath,
    migration_state_path: args.migrationStatePath,
    plan_size: planResult.plan.length,
    totals,
    migrations,
  };

  const output = JSON.stringify(report, null, 2);
  if (args.outputPath) {
    fs.mkdirSync(path.dirname(args.outputPath), { recursive: true });
    fs.writeFileSync(args.outputPath, `${output}\n`, "utf8");
  }
  process.stdout.write(`${output}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`[ERROR] ${error.message}\n`);
  process.exit(1);
}
