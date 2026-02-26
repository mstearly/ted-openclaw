import { describe, expect, test } from "vitest";
import {
  buildMigrationExecutionPlan,
  validateMigrationManifest,
} from "../modules/migration_registry.mjs";

function baselineManifest(overrides = {}) {
  return {
    _config_version: 1,
    migrations: [
      {
        id: "001_baseline_schema_versions",
        order: 1,
        depends_on: [],
      },
      {
        id: "002_followup",
        order: 2,
        depends_on: ["001_baseline_schema_versions"],
      },
    ],
    ...overrides,
  };
}

describe("migration manifest validation", () => {
  test("accepts valid ordered manifest", () => {
    const result = validateMigrationManifest(baselineManifest());
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.migrations.map((entry) => entry.id)).toEqual([
      "001_baseline_schema_versions",
      "002_followup",
    ]);
  });

  test("rejects duplicate migration ids", () => {
    const result = validateMigrationManifest({
      _config_version: 1,
      migrations: [
        { id: "001_dupe", order: 1, depends_on: [] },
        { id: "001_dupe", order: 2, depends_on: [] },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((entry) => entry.code === "migration_id_duplicate")).toBe(true);
  });

  test("rejects order gaps", () => {
    const result = validateMigrationManifest({
      _config_version: 1,
      migrations: [
        { id: "001_baseline", order: 1, depends_on: [] },
        { id: "003_gap", order: 3, depends_on: [] },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((entry) => entry.code === "migration_order_gap")).toBe(true);
  });

  test("rejects unknown dependencies", () => {
    const result = validateMigrationManifest({
      _config_version: 1,
      migrations: [{ id: "001_baseline", order: 1, depends_on: ["999_missing"] }],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((entry) => entry.code === "migration_dependency_unknown")).toBe(true);
  });

  test("rejects dependency with non-lower order", () => {
    const result = validateMigrationManifest({
      _config_version: 1,
      migrations: [
        { id: "001_first", order: 1, depends_on: ["002_second"] },
        { id: "002_second", order: 2, depends_on: [] },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((entry) => entry.code === "migration_dependency_order_invalid")).toBe(
      true,
    );
  });
});

describe("migration execution plan builder", () => {
  test("fails when manifest references migration missing from runtime registry", () => {
    const manifest = baselineManifest();
    const registry = new Map([["001_baseline_schema_versions", { run: () => [] }]]);
    const result = buildMigrationExecutionPlan(manifest, registry);
    expect(result.ok).toBe(false);
    expect(result.errors.some((entry) => entry.code === "migration_registry_missing")).toBe(true);
  });

  test("returns deterministic execution plan when manifest and registry align", () => {
    const manifest = {
      _config_version: 1,
      migrations: [
        { id: "002_followup", order: 2, depends_on: ["001_baseline_schema_versions"] },
        { id: "001_baseline_schema_versions", order: 1, depends_on: [] },
      ],
    };
    const registry = new Map([
      ["001_baseline_schema_versions", { run: () => [] }],
      ["002_followup", { run: () => [] }],
    ]);
    const result = buildMigrationExecutionPlan(manifest, registry);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.plan.map((entry) => entry.id)).toEqual([
      "001_baseline_schema_versions",
      "002_followup",
    ]);
  });
});
