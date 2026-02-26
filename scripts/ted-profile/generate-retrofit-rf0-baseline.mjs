#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const DEFAULT_OUTPUT_PATH = path.join(
  repoRoot,
  "sidecars/ted-engine/config/retrofit_rf0_baseline_lock.json",
);
const DEFAULT_ROUTE_CONTRACTS_PATH = path.join(
  repoRoot,
  "sidecars/ted-engine/config/route_contracts.json",
);
const DEFAULT_REPLAY_CORPUS_PATH = path.join(
  repoRoot,
  "sidecars/ted-engine/config/replay_corpus.json",
);
const DEFAULT_WORKFLOW_RUNS_PATH = path.join(
  repoRoot,
  "sidecars/ted-engine/artifacts/workflows/workflow_runs.jsonl",
);
const DEFAULT_FRICTION_ROLLUPS_PATH = path.join(
  repoRoot,
  "sidecars/ted-engine/artifacts/friction/friction_rollups.jsonl",
);

const WORKFLOW_ROUTE_KEYS = [
  "GET /ops/workflows",
  "POST /ops/workflows",
  "POST /ops/workflows/lint",
  "POST /ops/workflows/run",
  "GET /ops/workflows/runs",
];

const MIGRATION_ROUTE_KEYS = [
  "GET /status",
  "GET /doctor",
  "GET /ops/setup/validate",
  "GET /ops/setup/state",
];

function parseArgs(argv) {
  const args = {
    writePath: null,
    routeContractsPath: DEFAULT_ROUTE_CONTRACTS_PATH,
    replayCorpusPath: DEFAULT_REPLAY_CORPUS_PATH,
    workflowRunsPath: DEFAULT_WORKFLOW_RUNS_PATH,
    frictionRollupsPath: DEFAULT_FRICTION_ROLLUPS_PATH,
    capturedAt: process.env.RF0_BASELINE_CAPTURED_AT || "2026-02-26T00:00:00.000Z",
    maxSamples: 25,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--write") {
      const maybePath = argv[i + 1];
      if (maybePath && !maybePath.startsWith("--")) {
        args.writePath = path.resolve(repoRoot, maybePath);
        i += 1;
      } else {
        args.writePath = DEFAULT_OUTPUT_PATH;
      }
      continue;
    }
    if (arg === "--output") {
      args.writePath = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--route-contracts") {
      args.routeContractsPath = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--replay-corpus") {
      args.replayCorpusPath = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--workflow-runs") {
      args.workflowRunsPath = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--friction-rollups") {
      args.frictionRollupsPath = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--captured-at") {
      args.capturedAt = argv[i + 1] || args.capturedAt;
      i += 1;
      continue;
    }
    if (arg === "--max-samples") {
      const parsed = Number.parseInt(String(argv[i + 1] || ""), 10);
      args.maxSamples =
        Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 200) : args.maxSamples;
      i += 1;
    }
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) {
    return [];
  }
  const lines = raw.split("\n").filter(Boolean);
  const parsed = [];
  for (const line of lines) {
    try {
      parsed.push(JSON.parse(line));
    } catch {
      // Ignore malformed lines in evidence capture.
    }
  }
  return parsed;
}

function round(value, digits = 4) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry));
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).toSorted()) {
      out[key] = canonicalize(value[key]);
    }
    return out;
  }
  return value;
}

function hashJson(value) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");
}

function normalizeWorkflowRun(entry) {
  const summary = entry && typeof entry.friction_summary === "object" ? entry.friction_summary : {};
  const totals =
    summary && typeof summary.friction_totals === "object" ? summary.friction_totals : {};
  return {
    run_id: typeof entry.run_id === "string" ? entry.run_id : null,
    workflow_id: typeof entry.workflow_id === "string" ? entry.workflow_id : null,
    workflow_name: typeof entry.workflow_name === "string" ? entry.workflow_name : null,
    status: typeof entry.status === "string" ? entry.status : "unknown",
    dry_run: entry.dry_run === true,
    step_count: Number.isFinite(entry.step_count) ? Number(entry.step_count) : 0,
    started_at: typeof entry.started_at === "string" ? entry.started_at : null,
    completed_at: typeof entry.completed_at === "string" ? entry.completed_at : null,
    run_duration_ms: Number.isFinite(entry.run_duration_ms) ? Number(entry.run_duration_ms) : 0,
    job_friction_score: Number.isFinite(summary.job_friction_score)
      ? Number(summary.job_friction_score)
      : 0,
    retry_attempts: Number.isFinite(totals.retry_attempts) ? Number(totals.retry_attempts) : 0,
    recovered_retries: Number.isFinite(totals.recovered_retries)
      ? Number(totals.recovered_retries)
      : 0,
  };
}

function normalizeFrictionRollup(entry) {
  const totals = entry && typeof entry.friction_totals === "object" ? entry.friction_totals : {};
  return {
    run_id: typeof entry.run_id === "string" ? entry.run_id : null,
    workflow_id: typeof entry.workflow_id === "string" ? entry.workflow_id : null,
    workflow_name: typeof entry.workflow_name === "string" ? entry.workflow_name : null,
    status: typeof entry.status === "string" ? entry.status : "unknown",
    dry_run: entry.dry_run === true,
    started_at: typeof entry.started_at === "string" ? entry.started_at : null,
    completed_at: typeof entry.completed_at === "string" ? entry.completed_at : null,
    job_friction_score: Number.isFinite(entry.job_friction_score)
      ? Number(entry.job_friction_score)
      : 0,
    retry_attempts: Number.isFinite(totals.retry_attempts) ? Number(totals.retry_attempts) : 0,
    recovered_retries: Number.isFinite(totals.recovered_retries)
      ? Number(totals.recovered_retries)
      : 0,
    tool_failures: Number.isFinite(totals.tool_failures) ? Number(totals.tool_failures) : 0,
  };
}

function deriveBaselineMetrics(frictionSamples, workflowSamples) {
  const sourceRows =
    frictionSamples.length > 0
      ? frictionSamples
      : workflowSamples.map((sample) => ({
          status: sample.status,
          job_friction_score: sample.job_friction_score,
          retry_attempts: sample.retry_attempts,
          recovered_retries: sample.recovered_retries,
        }));
  const totalRuns = sourceRows.length;
  if (totalRuns === 0) {
    return {
      total_runs: 0,
      avg_job_friction_score: 0,
      failure_ratio: 0,
      retry_recovery_ratio: null,
      status_counts: {
        completed: 0,
        blocked: 0,
        failed: 0,
        other: 0,
      },
    };
  }

  const statusCounts = {
    completed: 0,
    blocked: 0,
    failed: 0,
    other: 0,
  };
  let totalScore = 0;
  let retryAttempts = 0;
  let recoveredRetries = 0;
  for (const row of sourceRows) {
    totalScore += Number(row.job_friction_score || 0);
    retryAttempts += Number(row.retry_attempts || 0);
    recoveredRetries += Number(row.recovered_retries || 0);
    const status = typeof row.status === "string" ? row.status : "other";
    if (status === "completed") {
      statusCounts.completed += 1;
    } else if (status === "blocked") {
      statusCounts.blocked += 1;
    } else if (status === "failed") {
      statusCounts.failed += 1;
    } else {
      statusCounts.other += 1;
    }
  }

  return {
    total_runs: totalRuns,
    avg_job_friction_score: round(totalScore / totalRuns, 2),
    failure_ratio: round(statusCounts.failed / totalRuns, 4),
    retry_recovery_ratio: retryAttempts > 0 ? round(recoveredRetries / retryAttempts, 4) : null,
    status_counts: statusCounts,
  };
}

function buildFrozenRoutes(routeContracts, routeKeys) {
  return routeKeys.map((routeKey) => {
    const contract = routeContracts?.routes?.[routeKey];
    if (!contract || typeof contract !== "object") {
      throw new Error(`Missing route contract for ${routeKey}`);
    }
    return {
      route_key: routeKey,
      contract_hash: hashJson(contract),
      contract,
    };
  });
}

function buildBaseline(args) {
  const routeContracts = readJson(args.routeContractsPath);
  const replayCorpus = readJson(args.replayCorpusPath);

  const workflowRuns = readJsonl(args.workflowRunsPath)
    .filter((entry) => entry && entry.kind === "workflow_run")
    .toSorted((a, b) => String(b.started_at || "").localeCompare(String(a.started_at || "")))
    .slice(0, args.maxSamples)
    .map((entry) => normalizeWorkflowRun(entry));

  const frictionRollups = readJsonl(args.frictionRollupsPath)
    .filter((entry) => entry && entry.kind === "friction_rollup")
    .toSorted((a, b) => String(b.completed_at || "").localeCompare(String(a.completed_at || "")))
    .slice(0, args.maxSamples)
    .map((entry) => normalizeFrictionRollup(entry));

  const replayScenarios = Array.isArray(replayCorpus.scenarios) ? replayCorpus.scenarios : [];
  const replayScenarioRows = replayScenarios
    .map((scenario) => ({
      scenario_id: typeof scenario?.scenario_id === "string" ? scenario.scenario_id : "",
      kind: typeof scenario?.kind === "string" ? scenario.kind : "unknown",
      job: typeof scenario?.job === "string" ? scenario.job : "unknown",
    }))
    .filter((scenario) => scenario.scenario_id.length > 0);

  const replayScenarioIds = replayScenarioRows.map((scenario) => scenario.scenario_id);
  const goldenCount = replayScenarioRows.filter((scenario) => scenario.kind === "golden").length;
  const adversarialCount = replayScenarioRows.filter(
    (scenario) => scenario.kind === "adversarial",
  ).length;

  const baselineMetrics = deriveBaselineMetrics(frictionRollups, workflowRuns);
  const workflowRoutes = buildFrozenRoutes(routeContracts, WORKFLOW_ROUTE_KEYS);
  const migrationRoutes = buildFrozenRoutes(routeContracts, MIGRATION_ROUTE_KEYS);

  return {
    _config_version: 1,
    baseline_id: "rf0-002-retrofit-baseline-v1",
    captured_at: args.capturedAt,
    description:
      "RF0-002 baseline lock for replay scenarios, workflow/friction KPI snapshot, and impacted workflow+migration route contracts.",
    sources: {
      replay_corpus_path: "sidecars/ted-engine/config/replay_corpus.json",
      route_contracts_path: "sidecars/ted-engine/config/route_contracts.json",
      workflow_runs_path: "sidecars/ted-engine/artifacts/workflows/workflow_runs.jsonl",
      friction_rollups_path: "sidecars/ted-engine/artifacts/friction/friction_rollups.jsonl",
    },
    replay_sample_set: {
      replay_corpus_version:
        typeof replayCorpus.version === "string" ? replayCorpus.version : "unknown",
      scenario_count: replayScenarioRows.length,
      golden_count: goldenCount,
      adversarial_count: adversarialCount,
      scenario_ids: replayScenarioIds,
      scenarios: replayScenarioRows,
    },
    workflow_run_sample: {
      selection: {
        kind_filter: "workflow_run",
        sort_by: "started_at_desc",
        max_samples: args.maxSamples,
      },
      sample_count: workflowRuns.length,
      samples: workflowRuns,
    },
    friction_rollup_sample: {
      selection: {
        kind_filter: "friction_rollup",
        sort_by: "completed_at_desc",
        max_samples: args.maxSamples,
      },
      sample_count: frictionRollups.length,
      samples: frictionRollups,
    },
    baseline_metrics: baselineMetrics,
    route_contract_freeze: {
      route_contracts_source_hash: hashJson(routeContracts.routes || {}),
      workflow_routes: workflowRoutes,
      migration_routes: migrationRoutes,
    },
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseline = buildBaseline(args);
  const serialized = JSON.stringify(baseline, null, 2) + "\n";

  if (args.writePath) {
    const outputPath = String(args.writePath);
    fs.writeFileSync(outputPath, serialized, "utf8");
    console.log(`Wrote RF0 baseline lock: ${outputPath}`);
    return;
  }
  process.stdout.write(serialized);
}

main();
