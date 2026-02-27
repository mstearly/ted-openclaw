#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function parseArgs(argv) {
  const out = {
    source: path.join(
      repoRoot,
      "sidecars/ted-engine/artifacts/governance/feature_opportunities.jsonl",
    ),
    output: path.join(repoRoot, "docs/ted-profile/sdd-pack/LOW_USAGE_FEATURE_OPPORTUNITY_BRIEF.md"),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--source") {
      out.source = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--output") {
      out.output = path.resolve(repoRoot, argv[i + 1] || "");
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

function markdownForOpportunity(entry) {
  return [
    `## ${entry.name} (${entry.feature_id})`,
    `- Plane: ${entry.plane}`,
    `- Maturity: ${entry.maturity_score}`,
    `- Fragility: ${entry.fragility_score}`,
    `- Adoption ratio (30d): ${entry.adoption_ratio_30d}`,
    `- Invocation count (30d): ${entry.invocation_count_30d}`,
    `- Opportunity score: ${entry.opportunity_score}`,
    `- Observed friction: ${entry.observed_friction}`,
    `- Activation experiment: ${entry.activation_experiment}`,
    "",
  ].join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const records = readJsonl(args.source);
  const latest = records.length > 0 ? records[records.length - 1] : null;
  const generatedAt = latest?.generated_at || new Date().toISOString();
  const opportunities = Array.isArray(latest?.opportunities) ? latest.opportunities : [];

  const header = [
    "# LOW_USAGE_FEATURE_OPPORTUNITY_BRIEF",
    "",
    `Generated at: ${generatedAt}`,
    `Total candidates: ${latest?.total_candidates ?? 0}`,
    `Rendered opportunities: ${opportunities.length}`,
    "",
    "This brief is auto-generated from `artifacts/governance/feature_opportunities.jsonl`.",
    "",
  ].join("\n");

  const sections = opportunities.length
    ? opportunities.map((entry) => markdownForOpportunity(entry)).join("\n")
    : "No opportunity candidates were available in the latest snapshot.\n";

  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, `${header}\n${sections}`, "utf8");
  console.log(`[generate-low-usage-opportunity-brief] wrote ${args.output}`);
}

main();
