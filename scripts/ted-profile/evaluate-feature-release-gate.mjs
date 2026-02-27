#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateFeatureReleaseGate,
  resolveChangedFeatureIds,
  validateFeatureReleaseGatePolicy,
} from "../../sidecars/ted-engine/modules/feature_governance.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function parseArgs(argv) {
  const out = {
    policy: path.join(repoRoot, "sidecars/ted-engine/config/feature_release_gate_policy.json"),
    registry: path.join(repoRoot, "sidecars/ted-engine/config/feature_registry.json"),
    featureHealthLedger: path.join(
      repoRoot,
      "sidecars/ted-engine/artifacts/governance/feature_health.jsonl",
    ),
    researchTriggerLedger: path.join(
      repoRoot,
      "sidecars/ted-engine/artifacts/governance/research_triggers.jsonl",
    ),
    output: path.join(repoRoot, "artifacts/replay/feature-release-gate-summary.json"),
    changedFiles: [],
    featureIds: [],
    overrideReasonCode: "",
    overrideTicketRef: "",
    baseRef: "",
    headRef: "HEAD",
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--policy") {
      out.policy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--registry") {
      out.registry = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--feature-health-ledger") {
      out.featureHealthLedger = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--research-trigger-ledger") {
      out.researchTriggerLedger = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--output") {
      out.output = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--changed-file") {
      out.changedFiles.push(argv[++i] || "");
      continue;
    }
    if (arg === "--feature-id") {
      out.featureIds.push(argv[++i] || "");
      continue;
    }
    if (arg === "--override-reason-code") {
      out.overrideReasonCode = argv[++i] || "";
      continue;
    }
    if (arg === "--override-ticket-ref") {
      out.overrideTicketRef = argv[++i] || "";
      continue;
    }
    if (arg === "--base-ref") {
      out.baseRef = argv[++i] || "";
      continue;
    }
    if (arg === "--head-ref") {
      out.headRef = argv[++i] || "HEAD";
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

function latestFeatureHealthSnapshot(filePath, registry) {
  const lines = readJsonl(filePath);
  const snapshots = lines.filter((entry) => Array.isArray(entry?.features));
  if (snapshots.length > 0) {
    return snapshots[snapshots.length - 1];
  }

  const features = Array.isArray(registry?.features)
    ? registry.features.map((feature) => ({
        feature_id: feature.feature_id,
        name: feature.name,
        plane: feature.plane,
        maturity_score: feature.maturity_score,
        fragility_score: feature.fragility_score,
        qa_contracts: feature.qa_contracts,
        security_controls: feature.security_controls,
        usage_signals: {
          invocation_count_30d: feature?.usage_signals?.invocation_count_30d ?? null,
          adoption_ratio_30d: feature?.usage_signals?.adoption_ratio_30d ?? null,
          success_rate_30d: feature?.usage_signals?.success_rate_30d ?? null,
        },
        state: {
          freeze: feature.fragility_score >= 70,
          escalation: feature.fragility_score >= 85,
          research_required: feature.fragility_score >= 70 || feature.maturity_score <= 2,
          low_usage: false,
        },
      }))
    : [];

  return {
    generated_at: new Date().toISOString(),
    features,
  };
}

function inferChangedFilesFromGit(baseRef, headRef) {
  if (!baseRef) {
    return [];
  }
  try {
    const out = execSync(`git diff --name-only ${baseRef}...${headRef}`, {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    });
    return out
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const policy = readJson(args.policy);
  const policyValidation = validateFeatureReleaseGatePolicy(policy);
  if (!policyValidation.ok) {
    console.error("feature_release_gate_policy validation failed");
    for (const error of policyValidation.errors || []) {
      console.error(`- ${error.code}: ${error.message}`);
    }
    process.exit(1);
  }

  const registry = readJson(args.registry);
  const snapshot = latestFeatureHealthSnapshot(args.featureHealthLedger, registry);
  const researchTriggers = readJsonl(args.researchTriggerLedger);

  const inferredChangedFiles =
    args.changedFiles.length > 0
      ? args.changedFiles
      : inferChangedFilesFromGit(args.baseRef, args.headRef);

  const changedFeatureIds =
    args.featureIds.length > 0
      ? args.featureIds
      : resolveChangedFeatureIds(inferredChangedFiles, registry);

  const override =
    args.overrideReasonCode && args.overrideTicketRef
      ? {
          reason_code: args.overrideReasonCode,
          ticket_ref: args.overrideTicketRef,
        }
      : null;

  const summary = evaluateFeatureReleaseGate({
    policy,
    snapshot,
    changedFeatureIds,
    researchTriggers,
    override,
  });

  summary.changed_files = inferredChangedFiles;

  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log(JSON.stringify(summary, null, 2));

  if (summary.mode === "hard" && !summary.pass) {
    process.exitCode = 1;
  }
}

main();
