#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  backfillWorkflowMetadataBatch,
  buildWorkflowMetadataLookupFromRegistry,
} from "../../sidecars/ted-engine/modules/workflow_run_metadata.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");

const repoRoot = path.resolve(__dirname, "..", "..");
const sidecarDir = path.join(repoRoot, "sidecars", "ted-engine");
const configDir = path.join(sidecarDir, "config");
const artifactsDir = path.join(sidecarDir, "artifacts");

const workflowRunsPath = path.join(artifactsDir, "workflows", "workflow_runs.jsonl");
const frictionRollupsPath = path.join(artifactsDir, "friction", "friction_rollups.jsonl");
const eventLogPath = path.join(artifactsDir, "event_log", "event_log.jsonl");
const auditLedgerPath = path.join(artifactsDir, "audit", "audit.jsonl");
const policyLedgerPath = path.join(artifactsDir, "policy", "policy.jsonl");
const workflowRegistryConfigPath = path.join(configDir, "workflow_registry.json");

function readJsonFileStrict(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read JSON file ${filePath}: ${error.message}`, { cause: error });
  }
}

function readJsonlFileStrict(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  const records = [];
  for (let i = 0; i < lines.length; i += 1) {
    try {
      records.push(JSON.parse(lines[i]));
    } catch (error) {
      throw new Error(`Invalid JSONL in ${filePath} at line ${i + 1}: ${error.message}`, {
        cause: error,
      });
    }
  }
  return records;
}

function writeJsonlFileAtomic(filePath, records) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  const body = records.map((record) => JSON.stringify(record)).join("\n");
  fs.writeFileSync(tempPath, body.length > 0 ? `${body}\n` : "", "utf8");
  fs.renameSync(tempPath, filePath);
}

function appendJsonlLine(filePath, record) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, JSON.stringify(record) + "\n", "utf8");
}

function appendBackfillEvidence(summary, atIso) {
  appendJsonlLine(auditLedgerPath, {
    kind: "AUDIT",
    action: "WORKFLOW_RUN_METADATA_BACKFILL",
    at: atIso,
    details: summary,
  });
  appendJsonlLine(eventLogPath, {
    event_id: crypto.randomUUID(),
    event_type: "workflow.registry.run_metadata_backfilled",
    timestamp: atIso,
    source: "scripts/ted-profile/backfill-workflow-run-metadata.mjs",
    trace_id: null,
    payload: summary,
  });
  appendJsonlLine(policyLedgerPath, {
    kind: "workflow_run_metadata_backfill",
    timestamp: atIso,
    executed_by: "script",
    dry_run: false,
    ...summary,
  });
}

function main() {
  if (!fs.existsSync(workflowRegistryConfigPath)) {
    throw new Error(`Workflow registry config not found: ${workflowRegistryConfigPath}`);
  }

  const workflowRegistry = readJsonFileStrict(workflowRegistryConfigPath);
  const workflowLookup = buildWorkflowMetadataLookupFromRegistry(workflowRegistry);
  const workflowRunRecords = readJsonlFileStrict(workflowRunsPath);
  const rollupRecords = readJsonlFileStrict(frictionRollupsPath);

  const workflowRunBatch = backfillWorkflowMetadataBatch(
    workflowRunRecords,
    "workflow_run",
    workflowLookup,
  );
  const rollupBatch = backfillWorkflowMetadataBatch(
    rollupRecords,
    "friction_rollup",
    workflowLookup,
  );

  const summary = {
    workflow_runs: {
      total: workflowRunBatch.total,
      touched: workflowRunBatch.touched,
      unchanged: workflowRunBatch.unchanged,
    },
    friction_rollups: {
      total: rollupBatch.total,
      touched: rollupBatch.touched,
      unchanged: rollupBatch.unchanged,
    },
    total_touched: workflowRunBatch.touched + rollupBatch.touched,
  };

  if (!dryRun && summary.total_touched > 0) {
    writeJsonlFileAtomic(workflowRunsPath, workflowRunBatch.records);
    writeJsonlFileAtomic(frictionRollupsPath, rollupBatch.records);
    appendBackfillEvidence(summary, new Date().toISOString());
  }

  const modeLabel = dryRun ? "[DRY-RUN]" : "[APPLIED]";
  process.stdout.write(`${modeLabel} workflow run metadata backfill summary\n`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`[ERROR] ${error.message}\n`);
  process.exit(1);
}
