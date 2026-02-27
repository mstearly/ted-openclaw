#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateFeatureRegistry,
  validateFeatureRegistrySchema,
} from "../../sidecars/ted-engine/modules/feature_registry.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function parseArgs(argv) {
  const out = {
    registry: path.join(repoRoot, "sidecars/ted-engine/config/feature_registry.json"),
    schema: path.join(repoRoot, "sidecars/ted-engine/config/feature_registry_schema.json"),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--registry") {
      out.registry = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--schema") {
      out.schema = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
    }
  }
  return out;
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function printErrors(kind, errors) {
  for (const error of errors || []) {
    console.error(`  - ${kind}: ${error.code}: ${error.message}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  let registry;
  let schema;
  try {
    registry = readJson(args.registry);
  } catch (err) {
    console.error(
      `[FAIL] could not read feature registry JSON at ${args.registry}: ${err?.message || String(err)}`,
    );
    process.exit(1);
  }
  try {
    schema = readJson(args.schema);
  } catch (err) {
    console.error(
      `[FAIL] could not read feature registry schema JSON at ${args.schema}: ${err?.message || String(err)}`,
    );
    process.exit(1);
  }

  const schemaValidation = validateFeatureRegistrySchema(schema);
  const registryValidation = validateFeatureRegistry(registry);

  if (schemaValidation.ok) {
    console.log("[OK] feature registry schema valid");
  } else {
    console.error("[FAIL] feature registry schema invalid");
    printErrors("schema", schemaValidation.errors);
  }

  if (registryValidation.ok) {
    const stats = registryValidation.stats || {};
    console.log(
      `[OK] feature registry valid (features=${stats.features || 0}, dependencies=${stats.dependencies || 0})`,
    );
  } else {
    console.error("[FAIL] feature registry invalid");
    printErrors("registry", registryValidation.errors);
  }

  if (Array.isArray(registryValidation.warnings) && registryValidation.warnings.length > 0) {
    console.log("[WARN] feature registry warnings:");
    for (const warning of registryValidation.warnings) {
      console.log(`  - ${warning.code}: ${warning.message}`);
    }
  }

  if (!schemaValidation.ok || !registryValidation.ok) {
    process.exit(1);
  }
}

main();
