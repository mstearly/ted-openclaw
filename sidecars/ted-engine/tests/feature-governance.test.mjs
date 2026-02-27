import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  buildFeatureOperatingStatus,
  buildFeaturePriorityQueue,
  evaluateFeatureReleaseGate,
  resolveChangedFeatureIds,
  validateConnectorCertificationMatrix,
  validateContextPolicy,
  validateFeatureActivationCatalog,
  validateFeatureDecisionPolicy,
  validateFeatureOperatingCadencePolicy,
  validateFeatureReleaseGatePolicy,
  validateMcpTrustPolicy,
  validateTransportPolicy,
} from "../modules/feature_governance.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadJson(pathFromHere) {
  return JSON.parse(readFileSync(resolve(__dirname, pathFromHere), "utf8"));
}

describe("feature governance policy validators", () => {
  test("new governance policies validate", () => {
    const cadence = loadJson("../config/feature_operating_cadence_policy.json");
    const release = loadJson("../config/feature_release_gate_policy.json");
    const decision = loadJson("../config/feature_decision_policy.json");
    const activation = loadJson("../config/feature_activation_catalog.json");
    const matrix = loadJson("../config/connector_certification_matrix.json");
    const transport = loadJson("../config/transport_policy.json");
    const context = loadJson("../config/context_policy.json");
    const mcpTrust = loadJson("../config/mcp_trust_policy.json");

    expect(validateFeatureOperatingCadencePolicy(cadence).ok).toBe(true);
    expect(validateFeatureReleaseGatePolicy(release).ok).toBe(true);
    expect(validateFeatureDecisionPolicy(decision).ok).toBe(true);
    expect(validateFeatureActivationCatalog(activation).ok).toBe(true);
    expect(validateConnectorCertificationMatrix(matrix).ok).toBe(true);
    expect(validateTransportPolicy(transport).ok).toBe(true);
    expect(validateContextPolicy(context).ok).toBe(true);
    expect(validateMcpTrustPolicy(mcpTrust).ok).toBe(true);
  });
});

describe("feature governance engines", () => {
  test("release gate blocks frozen feature in hard mode", () => {
    const policy = loadJson("../config/feature_release_gate_policy.json");
    policy.mode = "hard";

    const snapshot = {
      features: [
        {
          feature_id: "connector_alpha",
          plane: "connector",
          fragility_score: 90,
          maturity_score: 3,
          qa_contracts: { test_suites: ["a"] },
          security_controls: { policy_refs: ["b"], owasp_llm_top10: ["LLM01"] },
          usage_signals: { adoption_ratio_30d: 0.4 },
          state: { research_required: false },
        },
      ],
    };

    const result = evaluateFeatureReleaseGate({
      policy,
      snapshot,
      changedFeatureIds: ["connector_alpha"],
      researchTriggers: [],
    });

    expect(result.pass).toBe(false);
    expect(result.violations.some((entry) => entry.code === "FROZEN_FEATURE_CHANGE_BLOCKED")).toBe(
      true,
    );
  });

  test("resolve changed feature ids from file paths", () => {
    const registry = {
      features: [{ feature_id: "m365_integration" }, { feature_id: "builder_lane" }],
    };

    const ids = resolveChangedFeatureIds(
      ["sidecars/ted-engine/modules/builder_lane.mjs", "docs/readme.md"],
      registry,
    );

    expect(ids).toContain("builder_lane");
  });

  test("build feature priority queue returns buckets", () => {
    const policy = loadJson("../config/feature_decision_policy.json");
    const queue = buildFeaturePriorityQueue({
      snapshot: {
        features: [
          {
            feature_id: "high_risk",
            name: "high_risk",
            plane: "connector",
            fragility_score: 90,
            maturity_score: 3,
            usage_signals: { adoption_ratio_30d: 0.5 },
            state: { research_required: false },
          },
          {
            feature_id: "low_usage",
            name: "low_usage",
            plane: "experience",
            fragility_score: 20,
            maturity_score: 4,
            usage_signals: { adoption_ratio_30d: 0.1 },
            state: { research_required: false },
          },
        ],
      },
      policy,
    });

    expect(queue.totals.features).toBe(2);
    expect(Array.isArray(queue.queue.risk)).toBe(true);
    expect(Array.isArray(queue.queue.value)).toBe(true);
  });

  test("proposed unused M0 feature is bucketed to backlog monitor", () => {
    const policy = loadJson("../config/feature_decision_policy.json");
    const queue = buildFeaturePriorityQueue({
      snapshot: {
        features: [
          {
            feature_id: "future_multi_user",
            name: "future_multi_user",
            plane: "experience",
            lifecycle_state: "proposed",
            fragility_score: 90,
            maturity_score: 0,
            usage_signals: { invocation_count_30d: 0, adoption_ratio_30d: 0 },
            state: { research_required: false },
          },
        ],
      },
      policy,
    });

    expect(queue.queue.risk.some((entry) => entry.feature_id === "future_multi_user")).toBe(false);
    expect(queue.queue.backlog.some((entry) => entry.feature_id === "future_multi_user")).toBe(
      true,
    );
  });

  test("build feature operating status marks stale jobs", () => {
    const policy = loadJson("../config/feature_operating_cadence_policy.json");
    const status = buildFeatureOperatingStatus({
      policy,
      runs: [
        {
          kind: "feature_operating_run",
          cadence: "daily",
          run_at: "2026-02-20T00:00:00.000Z",
          status: "completed",
        },
      ],
      nowMs: Date.parse("2026-02-27T00:00:00.000Z"),
    });

    expect(status.stale).toBe(true);
    expect(status.jobs.daily.stale).toBe(true);
  });
});
