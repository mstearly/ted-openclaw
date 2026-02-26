#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateCompatibilityPolicy,
  validateConnectorAdmissionPolicy,
  validateConnectorAuthModePolicy,
  validateEsignProviderPolicy,
  validateMobileAlertPolicy,
  validateModuleRequestIntakeTemplate,
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
    intakeTemplate: path.join(
      repoRoot,
      "sidecars/ted-engine/config/module_request_intake_template.json",
    ),
    connectorAuthPolicy: path.join(
      repoRoot,
      "sidecars/ted-engine/config/connector_auth_mode_policy.json",
    ),
    connectorAdmissionPolicy: path.join(
      repoRoot,
      "sidecars/ted-engine/config/connector_admission_policy.json",
    ),
    esignPolicy: path.join(repoRoot, "sidecars/ted-engine/config/esign_provider_policy.json"),
    mobileAlertPolicy: path.join(repoRoot, "sidecars/ted-engine/config/mobile_alert_policy.json"),
    compatibilityPolicy: path.join(
      repoRoot,
      "sidecars/ted-engine/config/compatibility_policy.json",
    ),
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
    if (arg === "--intake-template") {
      out.intakeTemplate = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--connector-auth-policy") {
      out.connectorAuthPolicy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--connector-admission-policy") {
      out.connectorAdmissionPolicy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--esign-policy") {
      out.esignPolicy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--mobile-alert-policy") {
      out.mobileAlertPolicy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--compatibility-policy") {
      out.compatibilityPolicy = path.resolve(repoRoot, argv[++i] || "");
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
    } else if (kind === "module lifecycle") {
      console.log("[OK] module_lifecycle_policy valid");
    } else {
      console.log(`[OK] ${kind} valid`);
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
  const files = [
    { kind: "roadmap", path: args.roadmap, validator: validateRoadmapMaster },
    { kind: "module lifecycle", path: args.policy, validator: validateModuleLifecyclePolicy },
    {
      kind: "module request intake template",
      path: args.intakeTemplate,
      validator: validateModuleRequestIntakeTemplate,
    },
    {
      kind: "connector auth mode policy",
      path: args.connectorAuthPolicy,
      validator: validateConnectorAuthModePolicy,
    },
    {
      kind: "connector admission policy",
      path: args.connectorAdmissionPolicy,
      validator: validateConnectorAdmissionPolicy,
    },
    {
      kind: "e-sign provider policy",
      path: args.esignPolicy,
      validator: validateEsignProviderPolicy,
    },
    {
      kind: "mobile alert policy",
      path: args.mobileAlertPolicy,
      validator: validateMobileAlertPolicy,
    },
    {
      kind: "compatibility policy",
      path: args.compatibilityPolicy,
      validator: validateCompatibilityPolicy,
    },
  ];

  const results = [];
  for (const file of files) {
    let parsed;
    try {
      parsed = readJson(file.path);
    } catch (err) {
      console.error(
        `[FAIL] could not read ${file.kind} JSON at ${file.path}: ${err?.message || String(err)}`,
      );
      process.exit(1);
    }
    const result = file.validator(parsed);
    results.push({ kind: file.kind, result });
  }

  for (const item of results) {
    printFindings(item.kind, item.result);
  }

  const roadmapResult = results.find((entry) => entry.kind === "roadmap")?.result;

  if (roadmapResult && Array.isArray(roadmapResult.warnings) && roadmapResult.warnings.length > 0) {
    console.log("[WARN] roadmap non-fatal findings:");
    for (const warning of roadmapResult.warnings) {
      console.log(`  - ${warning.code}: ${warning.message}`);
    }
  }

  if (results.some((entry) => !entry.result.ok)) {
    process.exit(1);
  }
}

main();
