import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  buildFeatureSignalMatcher,
  buildLowUsageOpportunities,
  computeFeatureHealthSnapshot,
  validateFeatureFragilityPolicy,
  validateFeatureUsagePolicy,
  validateResearchTriggerPolicy,
} from "../modules/feature_health.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadJson(pathFromHere) {
  const fullPath = resolve(__dirname, pathFromHere);
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

describe("feature health policies", () => {
  test("validate feature_fragility_policy.json", () => {
    const policy = loadJson("../config/feature_fragility_policy.json");
    const result = validateFeatureFragilityPolicy(policy);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("validate feature_usage_policy.json", () => {
    const policy = loadJson("../config/feature_usage_policy.json");
    const result = validateFeatureUsagePolicy(policy);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("validate research_trigger_policy.json", () => {
    const policy = loadJson("../config/research_trigger_policy.json");
    const result = validateResearchTriggerPolicy(policy);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("feature health scoring", () => {
  test("computes snapshot with freeze and research flags", () => {
    const registry = loadJson("../config/feature_registry.json");
    const fragility = loadJson("../config/feature_fragility_policy.json");
    const usage = loadJson("../config/feature_usage_policy.json");
    const research = loadJson("../config/research_trigger_policy.json");

    const replayRuns = [
      {
        started_at: "2026-02-25T10:00:00.000Z",
        completed_at: "2026-02-25T10:05:00.000Z",
        summary: { total: 10, failed: 4 },
      },
    ];

    const frictionEvents = [
      {
        timestamp: "2026-02-25T12:00:00.000Z",
        category: "harmful",
        severity: "high",
      },
      {
        timestamp: "2026-02-25T12:02:00.000Z",
        category: "productive",
        severity: "warn",
      },
    ];

    const eventLog = [
      {
        timestamp: "2026-02-25T12:05:00.000Z",
        event_type: "governance.operator_required.blocked",
      },
      {
        timestamp: "2026-02-25T12:06:00.000Z",
        event_type: "governance.output_contract.passed",
      },
    ];

    const usageEvents = [
      {
        kind: "feature_usage",
        feature_id: "m365_integration",
        timestamp: "2026-02-26T08:00:00.000Z",
        status: "ok",
      },
      {
        kind: "feature_usage",
        feature_id: "builder_lane",
        timestamp: "2026-02-26T08:01:00.000Z",
        status: "failed",
      },
    ];

    const snapshot = computeFeatureHealthSnapshot({
      registry,
      fragilityPolicy: fragility,
      usagePolicy: usage,
      researchTriggerPolicy: research,
      replayRuns,
      frictionEvents,
      eventLog,
      usageEvents,
      generatedAt: "2026-02-27T00:00:00.000Z",
    });

    expect(snapshot.totals.features).toBeGreaterThan(0);
    expect(snapshot.features.length).toBe(snapshot.totals.features);
    expect(snapshot.features.some((feature) => feature.state.research_required)).toBe(true);
    expect(snapshot.features.every((feature) => feature.fragility_score >= 0)).toBe(true);
    expect(snapshot.features.every((feature) => feature.fragility_score <= 100)).toBe(true);
  });

  test("matches wildcard runtime event patterns", () => {
    const registry = loadJson("../config/feature_registry.json");
    const matcher = buildFeatureSignalMatcher(registry);

    const features = matcher.match("deal.created");
    expect(features.includes("deal_tracking")).toBe(true);
  });

  test("builds low-usage opportunities", () => {
    const snapshot = {
      generated_at: "2026-02-27T00:00:00.000Z",
      features: [
        {
          feature_id: "alpha",
          name: "alpha",
          plane: "experience",
          maturity_score: 4,
          fragility_score: 30,
          usage_signals: { invocation_count_30d: 2, adoption_ratio_30d: 0.05 },
          state: { low_usage: true },
          recommendations: { activation_experiment: "template" },
        },
      ],
    };

    const opportunities = buildLowUsageOpportunities(snapshot, {
      usagePolicy: {
        thresholds: {
          low_usage_max_adoption_ratio: 0.25,
        },
      },
      topN: 5,
    });

    expect(opportunities.opportunities).toHaveLength(1);
    expect(opportunities.total_candidates).toBe(1);
  });
});
