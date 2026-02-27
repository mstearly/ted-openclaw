#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildFeaturePriorityQueue,
  validateFeatureDecisionPolicy,
} from "../../sidecars/ted-engine/modules/feature_governance.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function parseArgs(argv) {
  const out = {
    featureHealthLedger: path.join(
      repoRoot,
      "sidecars/ted-engine/artifacts/governance/feature_health.jsonl",
    ),
    decisionPolicy: path.join(repoRoot, "sidecars/ted-engine/config/feature_decision_policy.json"),
    outputMarkdown: path.join(repoRoot, "docs/ted-profile/sdd-pack/FEATURE_PRIORITY_QUEUE.md"),
    outputJson: path.join(
      repoRoot,
      "sidecars/ted-engine/artifacts/governance/feature_priority_queue.json",
    ),
    featureRegistry: path.join(repoRoot, "sidecars/ted-engine/config/feature_registry.json"),
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--feature-health-ledger") {
      out.featureHealthLedger = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--decision-policy") {
      out.decisionPolicy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--output-markdown") {
      out.outputMarkdown = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--output-json") {
      out.outputJson = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--feature-registry") {
      out.featureRegistry = path.resolve(repoRoot, argv[++i] || "");
      continue;
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
  const raw = fs.readFileSync(filePath, "utf8");
  return raw
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

function fallbackSnapshotFromRegistry(registry) {
  const features = Array.isArray(registry?.features)
    ? registry.features.map((feature) => ({
        feature_id: feature.feature_id,
        name: feature.name,
        plane: feature.plane,
        fragility_score: feature.fragility_score,
        maturity_score: feature.maturity_score,
        usage_signals: {
          adoption_ratio_30d: feature?.usage_signals?.adoption_ratio_30d ?? 0,
        },
        state: {
          research_required: feature?.maturity_score <= 2 || feature?.fragility_score >= 70,
        },
      }))
    : [];
  return {
    generated_at: new Date().toISOString(),
    features,
  };
}

function formatSection(title, rows) {
  const lines = [`## ${title}`];
  if (rows.length === 0) {
    lines.push("- none");
    return lines.join("\n");
  }
  for (const row of rows) {
    lines.push(
      `- ${row.feature_id}: score=${row.score}, fragility=${row.fragility_score}, maturity=${row.maturity_score}, adoption=${row.adoption_ratio_30d}, action=${row.recommended_action}`,
    );
  }
  return lines.join("\n");
}

function buildMarkdown(queue) {
  const lines = [
    "# Feature Priority Queue",
    "",
    `Generated at: ${queue.generated_at}`,
    "",
    "## Totals",
    `- Features: ${queue.totals.features}`,
    `- Risk remediation now: ${queue.totals.risk_now}`,
    `- Value activation now: ${queue.totals.value_now}`,
    `- Research before build: ${queue.totals.research_before_build}`,
    `- Backlog monitor: ${queue.totals.backlog_monitor}`,
    "",
    formatSection("Top Risk Remediation", queue.queue.risk || []),
    "",
    formatSection("Top Value Activation", queue.queue.value || []),
    "",
    formatSection("Top Research Before Build", queue.queue.research || []),
    "",
    formatSection("Backlog Monitor", queue.queue.backlog || []),
    "",
    "## Governance Notes",
    "- Queue is generated from feature health snapshot + decision policy.",
    "- Buckets are policy-derived and deterministic for identical inputs.",
  ];
  return `${lines.join("\n")}\n`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const decisionPolicy = readJson(args.decisionPolicy);
  const policyValidation = validateFeatureDecisionPolicy(decisionPolicy);

  if (!policyValidation.ok) {
    console.error("feature_decision_policy validation failed");
    for (const error of policyValidation.errors || []) {
      console.error(`- ${error.code}: ${error.message}`);
    }
    process.exit(1);
  }

  const healthLines = readJsonl(args.featureHealthLedger);
  const registry = readJson(args.featureRegistry);
  const latestSnapshot =
    healthLines.filter((entry) => Array.isArray(entry?.features)).slice(-1)[0] ||
    fallbackSnapshotFromRegistry(registry);

  const queue = buildFeaturePriorityQueue({
    snapshot: latestSnapshot,
    policy: decisionPolicy,
  });

  fs.mkdirSync(path.dirname(args.outputJson), { recursive: true });
  fs.writeFileSync(args.outputJson, `${JSON.stringify(queue, null, 2)}\n`, "utf8");

  fs.mkdirSync(path.dirname(args.outputMarkdown), { recursive: true });
  fs.writeFileSync(args.outputMarkdown, buildMarkdown(queue), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        output_json: args.outputJson,
        output_markdown: args.outputMarkdown,
        totals: queue.totals,
      },
      null,
      2,
    ),
  );
}

main();
