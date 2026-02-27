#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateFeatureCoverage,
  validateFeatureRegistry,
} from "../../sidecars/ted-engine/modules/feature_registry.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function parseArgs(argv) {
  const out = {
    registry: path.join(repoRoot, "sidecars/ted-engine/config/feature_registry.json"),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--registry") {
      out.registry = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
    }
  }
  return out;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function printErrors(kind, errors) {
  for (const error of errors || []) {
    console.error(`  - ${kind}: ${error.code}: ${error.message}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  let registry;
  try {
    registry = readJson(args.registry);
  } catch (err) {
    console.error(
      `[FAIL] could not read feature registry JSON at ${args.registry}: ${err?.message || String(err)}`,
    );
    process.exit(1);
  }

  const structural = validateFeatureRegistry(registry);
  const coverage = validateFeatureCoverage(registry);

  if (structural.ok) {
    const stats = structural.stats || {};
    console.log(
      `[OK] feature registry structure valid (features=${stats.features || 0}, dependencies=${stats.dependencies || 0})`,
    );
  } else {
    console.error("[FAIL] feature registry structural validation failed");
    printErrors("registry", structural.errors);
  }

  if (coverage.ok) {
    const stats = coverage.stats || {};
    console.log(
      `[OK] feature coverage valid (features=${stats.features_checked || 0}, qa_refs=${stats.qa_refs || 0}, security_refs=${stats.security_refs || 0}, runtime_signal_refs=${stats.runtime_signal_refs || 0})`,
    );
  } else {
    console.error("[FAIL] feature coverage validation failed");
    printErrors("coverage", coverage.errors);
  }

  if (!structural.ok || !coverage.ok) {
    process.exit(1);
  }
}

main();
