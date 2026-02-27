import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  validateFeatureCoverage,
  validateFeatureRegistry,
  validateFeatureRegistrySchema,
} from "../modules/feature_registry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const featureRegistryPath = resolve(__dirname, "../config/feature_registry.json");
const featureRegistrySchemaPath = resolve(__dirname, "../config/feature_registry_schema.json");

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

describe("feature registry governance", () => {
  test("accepts current feature registry schema and registry", () => {
    const schema = loadJson(featureRegistrySchemaPath);
    const registry = loadJson(featureRegistryPath);

    const schemaResult = validateFeatureRegistrySchema(schema);
    const registryResult = validateFeatureRegistry(registry);

    expect(schemaResult.ok).toBe(true);
    expect(schemaResult.errors).toHaveLength(0);
    expect(registryResult.ok).toBe(true);
    expect(registryResult.errors).toHaveLength(0);
    expect(registryResult.stats.features).toBeGreaterThan(0);
    const coverageResult = validateFeatureCoverage(registry);
    expect(coverageResult.ok).toBe(true);
    expect(coverageResult.errors).toHaveLength(0);
  });

  test("rejects registry entries with missing required owner field", () => {
    const registry = loadJson(featureRegistryPath);
    const mutated = JSON.parse(JSON.stringify(registry));
    mutated.features[0].owner = "";

    const result = validateFeatureRegistry(mutated);
    const codes = new Set((result.errors || []).map((entry) => entry.code));

    expect(result.ok).toBe(false);
    expect(codes.has("FEATURE_REQUIRED_FIELD_MISSING")).toBe(true);
  });

  test("rejects registry entries with unknown dependencies", () => {
    const registry = loadJson(featureRegistryPath);
    const mutated = JSON.parse(JSON.stringify(registry));
    mutated.features[0].dependencies = ["does_not_exist"];

    const result = validateFeatureRegistry(mutated);
    const codes = new Set((result.errors || []).map((entry) => entry.code));

    expect(result.ok).toBe(false);
    expect(codes.has("FEATURE_DEPENDENCY_MISSING")).toBe(true);
  });

  test("rejects schema when artifact identifier is incorrect", () => {
    const schema = loadJson(featureRegistrySchemaPath);
    const mutated = {
      ...schema,
      _artifact: "invalid_artifact_name",
    };

    const result = validateFeatureRegistrySchema(mutated);
    const codes = new Set((result.errors || []).map((entry) => entry.code));

    expect(result.ok).toBe(false);
    expect(codes.has("FEATURE_REGISTRY_SCHEMA_ARTIFACT_INVALID")).toBe(true);
  });

  test("rejects registry entries with missing OWASP mappings", () => {
    const registry = loadJson(featureRegistryPath);
    const mutated = JSON.parse(JSON.stringify(registry));
    mutated.features[0].security_controls.owasp_llm_top10 = [];

    const result = validateFeatureCoverage(mutated);
    const codes = new Set((result.errors || []).map((entry) => entry.code));

    expect(result.ok).toBe(false);
    expect(codes.has("FEATURE_COVERAGE_OWASP_MISSING")).toBe(true);
  });
});
