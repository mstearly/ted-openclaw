#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildLowUsageOpportunities,
  computeFeatureHealthSnapshot,
} from "../../sidecars/ted-engine/modules/feature_health.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function parseArgs(argv) {
  const out = {
    featureRegistry: path.join(repoRoot, "sidecars/ted-engine/config/feature_registry.json"),
    fragilityPolicy: path.join(
      repoRoot,
      "sidecars/ted-engine/config/feature_fragility_policy.json",
    ),
    usagePolicy: path.join(repoRoot, "sidecars/ted-engine/config/feature_usage_policy.json"),
    researchPolicy: path.join(repoRoot, "sidecars/ted-engine/config/research_trigger_policy.json"),
    replayRuns: path.join(repoRoot, "sidecars/ted-engine/artifacts/replay/replay_runs.jsonl"),
    frictionEvents: path.join(repoRoot, "sidecars/ted-engine/artifacts/ledger/job_friction.jsonl"),
    eventLog: path.join(repoRoot, "sidecars/ted-engine/artifacts/ledger/events.jsonl"),
    usageEvents: path.join(repoRoot, "sidecars/ted-engine/artifacts/ledger/feature_usage.jsonl"),
    featureHealthOut: path.join(
      repoRoot,
      "sidecars/ted-engine/artifacts/governance/feature_health.jsonl",
    ),
    opportunitiesOut: path.join(
      repoRoot,
      "sidecars/ted-engine/artifacts/governance/feature_opportunities.jsonl",
    ),
    researchTriggersOut: path.join(
      repoRoot,
      "sidecars/ted-engine/artifacts/governance/research_triggers.jsonl",
    ),
    topN: 10,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--feature-registry") {
      out.featureRegistry = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--feature-health-out") {
      out.featureHealthOut = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--opportunities-out") {
      out.opportunitiesOut = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--research-triggers-out") {
      out.researchTriggersOut = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--top-n") {
      const value = Number.parseInt(argv[i + 1] || "10", 10);
      out.topN = Number.isFinite(value) && value > 0 ? Math.min(value, 50) : 10;
      i += 1;
    }
  }

  return out;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function appendJsonl(filePath, record) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(record)}\n`, "utf8");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const generatedAt = new Date().toISOString();
  const registry = readJson(args.featureRegistry);
  const fragilityPolicy = readJson(args.fragilityPolicy);
  const usagePolicy = readJson(args.usagePolicy);
  const researchTriggerPolicy = readJson(args.researchPolicy);

  const snapshot = computeFeatureHealthSnapshot({
    registry,
    fragilityPolicy,
    usagePolicy,
    researchTriggerPolicy,
    replayRuns: readJsonl(args.replayRuns),
    frictionEvents: readJsonl(args.frictionEvents),
    eventLog: readJsonl(args.eventLog),
    usageEvents: readJsonl(args.usageEvents),
    generatedAt,
  });

  appendJsonl(args.featureHealthOut, snapshot);

  const opportunities = buildLowUsageOpportunities(snapshot, {
    usagePolicy,
    topN: args.topN,
  });
  appendJsonl(args.opportunitiesOut, opportunities);

  const triggerRecords = snapshot.features
    .filter((feature) => feature?.state?.research_required)
    .map((feature) => ({
      kind: "feature_research_trigger",
      feature_id: feature.feature_id,
      fragility_score: feature.fragility_score,
      maturity_score: feature.maturity_score,
      adoption_ratio_30d: feature.usage_signals?.adoption_ratio_30d ?? null,
      triggered_at: generatedAt,
    }));

  for (const trigger of triggerRecords) {
    appendJsonl(args.researchTriggersOut, trigger);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        generated_at: generatedAt,
        feature_health_out: args.featureHealthOut,
        opportunities_out: args.opportunitiesOut,
        research_triggers_out: args.researchTriggersOut,
        totals: snapshot.totals,
        opportunity_candidates: opportunities.total_candidates,
        research_triggers_written: triggerRecords.length,
      },
      null,
      2,
    ),
  );
}

main();
