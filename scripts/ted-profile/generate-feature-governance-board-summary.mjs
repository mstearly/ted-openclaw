#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function parseArgs(argv) {
  const out = {
    healthSource: path.join(
      repoRoot,
      "sidecars/ted-engine/artifacts/governance/feature_health.jsonl",
    ),
    opportunitiesSource: path.join(
      repoRoot,
      "sidecars/ted-engine/artifacts/governance/feature_opportunities.jsonl",
    ),
    triggersSource: path.join(
      repoRoot,
      "sidecars/ted-engine/artifacts/governance/research_triggers.jsonl",
    ),
    output: path.join(repoRoot, "docs/ted-profile/sdd-pack/153_COUNCIL_DFA_OS_BOARD_SUMMARY.md"),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--output") {
      out.output = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--health-source") {
      out.healthSource = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--opportunities-source") {
      out.opportunitiesSource = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--triggers-source") {
      out.triggersSource = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
    }
  }

  return out;
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
    .filter((value) => value && typeof value === "object");
}

function topFragileFeatures(snapshot, limit = 5) {
  const rows = Array.isArray(snapshot?.features) ? snapshot.features : [];
  return rows
    .slice()
    .toSorted((a, b) => (b?.fragility_score || 0) - (a?.fragility_score || 0))
    .slice(0, limit);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const healthRows = readJsonl(args.healthSource);
  const opportunitiesRows = readJsonl(args.opportunitiesSource);
  const triggerRows = readJsonl(args.triggersSource);

  const latestHealth = healthRows.length > 0 ? healthRows[healthRows.length - 1] : null;
  const latestOpportunities =
    opportunitiesRows.length > 0 ? opportunitiesRows[opportunitiesRows.length - 1] : null;
  const recentTriggers = triggerRows.slice(-25);
  const generatedAt = latestHealth?.generated_at || new Date().toISOString();

  const topFragile = topFragileFeatures(latestHealth, 7)
    .map((feature) => {
      return `- ${feature.feature_id}: fragility=${feature.fragility_score}, maturity=${feature.maturity_score}, research_required=${feature.state?.research_required === true}`;
    })
    .join("\n");

  const topOpportunities = Array.isArray(latestOpportunities?.opportunities)
    ? latestOpportunities.opportunities
        .slice(0, 7)
        .map((entry) => {
          return `- ${entry.feature_id}: score=${entry.opportunity_score}, adoption=${entry.adoption_ratio_30d}, experiment=${entry.activation_experiment}`;
        })
        .join("\n")
    : "- none";

  const triggerSummary = recentTriggers.length
    ? recentTriggers
        .map((entry) => {
          return `- ${entry.feature_id}: fragility=${entry.fragility_score}, maturity=${entry.maturity_score}, adoption=${entry.adoption_ratio_30d}`;
        })
        .join("\n")
    : "- none";

  const markdown = [
    "# SDD 153 - DFA-OS Board Summary",
    "",
    `Generated at: ${generatedAt}`,
    "",
    "## Scorecard",
    `- Features tracked: ${latestHealth?.totals?.features ?? 0}`,
    `- Frozen features: ${latestHealth?.totals?.frozen ?? 0}`,
    `- Escalated features: ${latestHealth?.totals?.escalated ?? 0}`,
    `- Research required: ${latestHealth?.totals?.research_required ?? 0}`,
    `- Low usage features: ${latestHealth?.totals?.low_usage ?? 0}`,
    `- Opportunity candidates: ${latestOpportunities?.total_candidates ?? 0}`,
    `- Research triggers (latest 25): ${recentTriggers.length}`,
    "",
    "## Highest Fragility Features",
    topFragile || "- none",
    "",
    "## Highest Value Low-Usage Opportunities",
    topOpportunities,
    "",
    "## Research Trigger Queue",
    triggerSummary,
    "",
    "## Governance Notes",
    "- This summary is generated from governance ledgers, not manual interpretation.",
    "- Any feature with fragility >= freeze threshold is change-frozen except remediation.",
    "- Strategic low-usage features are routed into research + activation loops.",
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, markdown, "utf8");
  console.log(`[generate-feature-governance-board-summary] wrote ${args.output}`);
}

main();
