import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  validateConnectorAdmissionPolicy,
  validateConnectorAuthModePolicy,
  validateEsignProviderPolicy,
  validateModuleRequestIntakeTemplate,
  validateModuleLifecyclePolicy,
  validateRoadmapMaster,
} from "../modules/roadmap_governance.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const roadmapPath = resolve(__dirname, "../config/roadmap_master.json");
const moduleLifecyclePath = resolve(__dirname, "../config/module_lifecycle_policy.json");
const moduleRequestIntakeTemplatePath = resolve(
  __dirname,
  "../config/module_request_intake_template.json",
);
const connectorAuthModePolicyPath = resolve(__dirname, "../config/connector_auth_mode_policy.json");
const connectorAdmissionPolicyPath = resolve(
  __dirname,
  "../config/connector_admission_policy.json",
);
const esignProviderPolicyPath = resolve(__dirname, "../config/esign_provider_policy.json");

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

describe("roadmap governance module", () => {
  test("accepts current roadmap master", () => {
    const roadmap = loadJson(roadmapPath);
    const result = validateRoadmapMaster(roadmap);

    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.stats.waves).toBeGreaterThan(0);
    expect(result.stats.tasks).toBeGreaterThan(0);
  });

  test("rejects orphan tasks and circular dependencies", () => {
    const roadmap = loadJson(roadmapPath);
    const mutated = {
      ...roadmap,
      tasks: roadmap.tasks.map((task) => ({ ...task })),
    };

    mutated.tasks[0].wave_id = "UNKNOWN_WAVE";
    mutated.tasks[1].depends_on = [mutated.tasks[2].task_id];
    mutated.tasks[2].depends_on = [mutated.tasks[1].task_id];

    const result = validateRoadmapMaster(mutated);
    const codes = new Set((result.errors || []).map((entry) => entry.code));

    expect(result.ok).toBe(false);
    expect(codes.has("TASK_ORPHAN_NO_WAVE")).toBe(true);
    expect(codes.has("TASK_CIRCULAR_DEPENDENCY")).toBe(true);
  });

  test("accepts current module lifecycle policy", () => {
    const modulePolicy = loadJson(moduleLifecyclePath);
    const result = validateModuleLifecyclePolicy(modulePolicy);

    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("rejects module lifecycle policy when required class missing", () => {
    const modulePolicy = loadJson(moduleLifecyclePath);
    const mutated = {
      ...modulePolicy,
      module_classes: {
        ...modulePolicy.module_classes,
      },
    };
    delete mutated.module_classes.connector;

    const result = validateModuleLifecyclePolicy(mutated);
    const codes = new Set((result.errors || []).map((entry) => entry.code));

    expect(result.ok).toBe(false);
    expect(codes.has("MODULE_CLASS_MISSING")).toBe(true);
  });

  test("accepts current intake and connector governance policies", () => {
    const intakeTemplate = loadJson(moduleRequestIntakeTemplatePath);
    const authModePolicy = loadJson(connectorAuthModePolicyPath);
    const admissionPolicy = loadJson(connectorAdmissionPolicyPath);
    const esignPolicy = loadJson(esignProviderPolicyPath);

    expect(validateModuleRequestIntakeTemplate(intakeTemplate).ok).toBe(true);
    expect(validateConnectorAuthModePolicy(authModePolicy).ok).toBe(true);
    expect(validateConnectorAdmissionPolicy(admissionPolicy).ok).toBe(true);
    expect(validateEsignProviderPolicy(esignPolicy).ok).toBe(true);
  });

  test("rejects inconsistent e-sign policy combinations", () => {
    const esignPolicy = loadJson(esignProviderPolicyPath);
    const mutated = {
      ...esignPolicy,
      active_policy: "docusign_only",
      providers: {
        ...esignPolicy.providers,
        rightsignature: {
          ...esignPolicy.providers.rightsignature,
          enabled: true,
        },
      },
    };

    const result = validateEsignProviderPolicy(mutated);
    const codes = new Set((result.errors || []).map((entry) => entry.code));
    expect(result.ok).toBe(false);
    expect(codes.has("ESIGN_POLICY_RIGHTSIGNATURE_DISABLED_REQUIRED")).toBe(true);
  });
});
