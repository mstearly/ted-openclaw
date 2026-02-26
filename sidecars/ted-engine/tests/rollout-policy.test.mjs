import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  evaluateRollbackTriggers,
  normalizeRolloutPolicy,
  resolveRolloutDecision,
  validateRolloutPolicy,
} from "../modules/rollout_policy.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rolloutPolicyPath = resolve(__dirname, "../config/rollout_policy.json");

function loadRolloutPolicy() {
  return JSON.parse(readFileSync(rolloutPolicyPath, "utf8"));
}

describe("rollout policy module", () => {
  test("rollout_policy.json validates", () => {
    const policy = loadRolloutPolicy();
    const result = validateRolloutPolicy(policy);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("resolveRolloutDecision is deterministic for identical identity context", () => {
    const basePolicy = loadRolloutPolicy();
    const policy = normalizeRolloutPolicy(basePolicy, basePolicy);
    const context = {
      operator_id: "operator-rf3",
      workflow_id: "wf-risk-lint",
      route_key: "/ops/replay/run",
      mode: "transport_canary",
    };

    const first = resolveRolloutDecision(policy, context);
    const second = resolveRolloutDecision(policy, context);
    expect(first).toEqual(second);
    expect(first.mode).toBe("transport_canary");
    expect(first.bucket).toBeGreaterThanOrEqual(0);
    expect(first.bucket).toBeLessThan(100);
  });

  test("transport canary disabled returns deterministic fallback reason", () => {
    const policy = normalizeRolloutPolicy(
      {
        _config_version: 1,
        version: "test",
        default_rollout_percent: 100,
        transport_canary_percent: 0,
        stickiness_key_fields: ["operator_id"],
        cohorts: [],
        rollback_triggers: [
          { reason_code: "replay_gate_failed", severity: "high", action: "disable_rollout" },
        ],
      },
      loadRolloutPolicy(),
    );

    const decision = resolveRolloutDecision(policy, {
      operator_id: "operator-rf3",
      mode: "transport_canary",
    });
    expect(decision.selected).toBe(false);
    expect(decision.reason_code).toBe("auto_canary_disabled");
  });

  test("evaluateRollbackTriggers returns configured reason codes only", () => {
    const policy = normalizeRolloutPolicy(loadRolloutPolicy(), loadRolloutPolicy());
    const rollback = evaluateRollbackTriggers(policy, [
      "transport_guardrail_breach",
      "transport_guardrail_breach",
      "unknown_reason",
      "replay_gate_failed",
    ]);

    expect(rollback.triggered).toBe(true);
    expect(rollback.reason_codes).toEqual(["transport_guardrail_breach", "replay_gate_failed"]);
    expect(rollback.triggers).toHaveLength(2);
    expect(rollback.triggers[0].reason_code).toBe("transport_guardrail_breach");
    expect(rollback.triggers[1].reason_code).toBe("replay_gate_failed");
  });
});
