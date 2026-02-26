import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  validateCompatibilityPolicy,
  validateConnectorAdmissionPolicy,
  validateConnectorAuthModePolicy,
  validateEsignProviderPolicy,
  validateMobileAlertPolicy,
  validateModuleRequestIntakeTemplate,
  validateModuleLifecyclePolicy,
  validateRetrofitBaselineLock,
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
const mobileAlertPolicyPath = resolve(__dirname, "../config/mobile_alert_policy.json");
const compatibilityPolicyPath = resolve(__dirname, "../config/compatibility_policy.json");
const retrofitBaselineLockPath = resolve(__dirname, "../config/retrofit_rf0_baseline_lock.json");

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
    const mobileAlertPolicy = loadJson(mobileAlertPolicyPath);
    const compatibilityPolicy = loadJson(compatibilityPolicyPath);
    const retrofitBaselineLock = loadJson(retrofitBaselineLockPath);

    expect(validateModuleRequestIntakeTemplate(intakeTemplate).ok).toBe(true);
    expect(validateConnectorAuthModePolicy(authModePolicy).ok).toBe(true);
    expect(validateConnectorAdmissionPolicy(admissionPolicy).ok).toBe(true);
    expect(validateEsignProviderPolicy(esignPolicy).ok).toBe(true);
    expect(validateMobileAlertPolicy(mobileAlertPolicy).ok).toBe(true);
    expect(validateCompatibilityPolicy(compatibilityPolicy).ok).toBe(true);
    expect(validateRetrofitBaselineLock(retrofitBaselineLock).ok).toBe(true);
  });

  test("rejects connector admission policy when reliability controls are missing", () => {
    const admissionPolicy = loadJson(connectorAdmissionPolicyPath);
    const mutated = JSON.parse(JSON.stringify(admissionPolicy));
    delete mutated.providers.monday.idempotency_strategy;
    mutated.providers.rightsignature.callback_authenticity.secret_env_var = "";
    mutated.providers.rightsignature.retry_backoff_policy.retryable_status_codes = [];

    const result = validateConnectorAdmissionPolicy(mutated);
    const codes = new Set((result.errors || []).map((entry) => entry.code));
    expect(result.ok).toBe(false);
    expect(codes.has("CONNECTOR_ADMISSION_IDEMPOTENCY_STRATEGY_MISSING")).toBe(true);
    expect(codes.has("CONNECTOR_ADMISSION_CALLBACK_AUTH_FIELD_INVALID")).toBe(true);
    expect(codes.has("CONNECTOR_ADMISSION_RETRYABLE_STATUS_CODES_MISSING")).toBe(true);
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

  test("rejects mobile alert policy fallback channel cycles", () => {
    const mobileAlertPolicy = loadJson(mobileAlertPolicyPath);
    const mutated = JSON.parse(JSON.stringify(mobileAlertPolicy));
    mutated.routing.approval_required.high.fallback_chain = ["telegram", "email", "telegram"];

    const result = validateMobileAlertPolicy(mutated);
    const codes = new Set((result.errors || []).map((entry) => entry.code));
    expect(result.ok).toBe(false);
    expect(codes.has("MOBILE_ALERT_POLICY_FALLBACK_CHAIN_CYCLE")).toBe(true);
  });

  test("rejects compatibility policy with invalid support window", () => {
    const compatibilityPolicy = loadJson(compatibilityPolicyPath);
    const mutated = JSON.parse(JSON.stringify(compatibilityPolicy));
    mutated.support_window.backward_compatible_releases = 0;

    const result = validateCompatibilityPolicy(mutated);
    const codes = new Set((result.errors || []).map((entry) => entry.code));
    expect(result.ok).toBe(false);
    expect(codes.has("COMPAT_POLICY_SUPPORT_WINDOW_INVALID")).toBe(true);
  });

  test("rejects retrofit baseline lock when route freeze is empty", () => {
    const baselineLock = loadJson(retrofitBaselineLockPath);
    const mutated = JSON.parse(JSON.stringify(baselineLock));
    mutated.route_contract_freeze.workflow_routes = [];

    const result = validateRetrofitBaselineLock(mutated);
    const codes = new Set((result.errors || []).map((entry) => entry.code));
    expect(result.ok).toBe(false);
    expect(codes.has("RETROFIT_BASELINE_ROUTE_FREEZE_EMPTY")).toBe(true);
  });
});
