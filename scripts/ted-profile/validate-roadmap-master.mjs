#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateModuleLifecyclePolicy,
  validateRoadmapMaster,
} from "../../sidecars/ted-engine/modules/roadmap_governance.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function parseArgs(argv) {
  const out = {
    roadmap: path.join(repoRoot, "sidecars/ted-engine/config/roadmap_master.json"),
    policy: path.join(repoRoot, "sidecars/ted-engine/config/module_lifecycle_policy.json"),
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--roadmap") {
      out.roadmap = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--policy") {
      out.policy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
  }

  return out;
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function printFindings(kind, result) {
  if (result.ok) {
    if (kind === "roadmap") {
      const stats = result.stats || {};
      console.log(
        `[OK] roadmap_master valid (waves=${stats.waves || 0}, tasks=${stats.tasks || 0}, task_edges=${stats.task_edges || 0})`,
      );
    } else {
      console.log("[OK] module_lifecycle_policy valid");
    }
    return;
  }

  console.error(`[FAIL] ${kind} validation failed:`);
  for (const error of result.errors || []) {
    console.error(`  - ${error.code}: ${error.message}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  let roadmap;
  let policy;

  try {
    roadmap = readJson(args.roadmap);
  } catch (err) {
    console.error(
      `[FAIL] could not read roadmap JSON at ${args.roadmap}: ${err?.message || String(err)}`,
    );
    process.exit(1);
  }

  try {
    policy = readJson(args.policy);
  } catch (err) {
    console.error(
      `[FAIL] could not read module lifecycle JSON at ${args.policy}: ${err?.message || String(err)}`,
    );
    process.exit(1);
  }

  const roadmapResult = validateRoadmapMaster(roadmap);
  const policyResult = validateModuleLifecyclePolicy(policy);

  printFindings("roadmap", roadmapResult);
  printFindings("module lifecycle", policyResult);

  if (Array.isArray(roadmapResult.warnings) && roadmapResult.warnings.length > 0) {
    console.log("[WARN] roadmap non-fatal findings:");
    for (const warning of roadmapResult.warnings) {
      console.log(`  - ${warning.code}: ${warning.message}`);
    }
  }

  if (!roadmapResult.ok || !policyResult.ok) {
    process.exit(1);
  }
}

main();
