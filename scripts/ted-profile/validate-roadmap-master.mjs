#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateConnectorCertificationMatrix,
  validateContextPolicy,
  validateDiscoveryIngestionQualityPolicy,
  validateEvaluationPipelinePolicy,
  validateFeatureActivationCatalog,
  validateFeatureDecisionPolicy,
  validateFeatureOperatingCadencePolicy,
  validateFeatureReleaseGatePolicy,
  validateKnowledgeRetrievalPolicy,
  validateMcpTrustPolicy,
  validateTransportPolicy,
} from "../../sidecars/ted-engine/modules/feature_governance.mjs";
import {
  validateFeatureFragilityPolicy,
  validateFeatureUsagePolicy,
  validateResearchTriggerPolicy,
} from "../../sidecars/ted-engine/modules/feature_health.mjs";
import {
  validateFeatureCoverage,
  validateFeatureRegistry,
  validateFeatureRegistrySchema,
} from "../../sidecars/ted-engine/modules/feature_registry.mjs";
import { validateMigrationManifest } from "../../sidecars/ted-engine/modules/migration_registry.mjs";
import { validateReplayGateContract } from "../../sidecars/ted-engine/modules/replay_gate_contract.mjs";
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
} from "../../sidecars/ted-engine/modules/roadmap_governance.mjs";
import { validateRolloutPolicy } from "../../sidecars/ted-engine/modules/rollout_policy.mjs";

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
    featureRegistry: path.join(repoRoot, "sidecars/ted-engine/config/feature_registry.json"),
    featureRegistrySchema: path.join(
      repoRoot,
      "sidecars/ted-engine/config/feature_registry_schema.json",
    ),
    featureFragilityPolicy: path.join(
      repoRoot,
      "sidecars/ted-engine/config/feature_fragility_policy.json",
    ),
    featureUsagePolicy: path.join(repoRoot, "sidecars/ted-engine/config/feature_usage_policy.json"),
    researchTriggerPolicy: path.join(
      repoRoot,
      "sidecars/ted-engine/config/research_trigger_policy.json",
    ),
    replayGateContract: path.join(repoRoot, "sidecars/ted-engine/config/replay_gate_contract.json"),
    rolloutPolicy: path.join(repoRoot, "sidecars/ted-engine/config/rollout_policy.json"),
    migrationManifest: path.join(repoRoot, "sidecars/ted-engine/config/migration_manifest.json"),
    retrofitBaselineLock: path.join(
      repoRoot,
      "sidecars/ted-engine/config/retrofit_rf0_baseline_lock.json",
    ),
    featureOperatingCadencePolicy: path.join(
      repoRoot,
      "sidecars/ted-engine/config/feature_operating_cadence_policy.json",
    ),
    featureReleaseGatePolicy: path.join(
      repoRoot,
      "sidecars/ted-engine/config/feature_release_gate_policy.json",
    ),
    featureDecisionPolicy: path.join(
      repoRoot,
      "sidecars/ted-engine/config/feature_decision_policy.json",
    ),
    featureActivationCatalog: path.join(
      repoRoot,
      "sidecars/ted-engine/config/feature_activation_catalog.json",
    ),
    connectorCertificationMatrix: path.join(
      repoRoot,
      "sidecars/ted-engine/config/connector_certification_matrix.json",
    ),
    transportPolicy: path.join(repoRoot, "sidecars/ted-engine/config/transport_policy.json"),
    contextPolicy: path.join(repoRoot, "sidecars/ted-engine/config/context_policy.json"),
    knowledgeRetrievalPolicy: path.join(
      repoRoot,
      "sidecars/ted-engine/config/knowledge_retrieval_policy.json",
    ),
    discoveryIngestionQualityPolicy: path.join(
      repoRoot,
      "sidecars/ted-engine/config/discovery_ingestion_quality_policy.json",
    ),
    evaluationPipelinePolicy: path.join(
      repoRoot,
      "sidecars/ted-engine/config/evaluation_pipeline_policy.json",
    ),
    mcpTrustPolicy: path.join(repoRoot, "sidecars/ted-engine/config/mcp_trust_policy.json"),
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
    if (arg === "--feature-registry") {
      out.featureRegistry = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--feature-registry-schema") {
      out.featureRegistrySchema = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--feature-fragility-policy") {
      out.featureFragilityPolicy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--feature-usage-policy") {
      out.featureUsagePolicy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--research-trigger-policy") {
      out.researchTriggerPolicy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--replay-gate-contract") {
      out.replayGateContract = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--rollout-policy") {
      out.rolloutPolicy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--migration-manifest") {
      out.migrationManifest = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--retrofit-baseline-lock") {
      out.retrofitBaselineLock = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--feature-operating-cadence-policy") {
      out.featureOperatingCadencePolicy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--feature-release-gate-policy") {
      out.featureReleaseGatePolicy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--feature-decision-policy") {
      out.featureDecisionPolicy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--feature-activation-catalog") {
      out.featureActivationCatalog = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--connector-certification-matrix") {
      out.connectorCertificationMatrix = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--transport-policy") {
      out.transportPolicy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--context-policy") {
      out.contextPolicy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--knowledge-retrieval-policy") {
      out.knowledgeRetrievalPolicy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--discovery-ingestion-quality-policy") {
      out.discoveryIngestionQualityPolicy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--evaluation-pipeline-policy") {
      out.evaluationPipelinePolicy = path.resolve(repoRoot, argv[++i] || "");
      continue;
    }
    if (arg === "--mcp-trust-policy") {
      out.mcpTrustPolicy = path.resolve(repoRoot, argv[++i] || "");
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
    {
      kind: "feature registry",
      path: args.featureRegistry,
      validator: validateFeatureRegistry,
    },
    {
      kind: "feature coverage",
      path: args.featureRegistry,
      validator: validateFeatureCoverage,
    },
    {
      kind: "feature registry schema",
      path: args.featureRegistrySchema,
      validator: validateFeatureRegistrySchema,
    },
    {
      kind: "feature fragility policy",
      path: args.featureFragilityPolicy,
      validator: validateFeatureFragilityPolicy,
    },
    {
      kind: "feature usage policy",
      path: args.featureUsagePolicy,
      validator: validateFeatureUsagePolicy,
    },
    {
      kind: "research trigger policy",
      path: args.researchTriggerPolicy,
      validator: validateResearchTriggerPolicy,
    },
    {
      kind: "replay gate contract",
      path: args.replayGateContract,
      validator: validateReplayGateContract,
    },
    {
      kind: "rollout policy",
      path: args.rolloutPolicy,
      validator: validateRolloutPolicy,
    },
    {
      kind: "migration manifest",
      path: args.migrationManifest,
      validator: validateMigrationManifest,
    },
    {
      kind: "retrofit baseline lock",
      path: args.retrofitBaselineLock,
      validator: validateRetrofitBaselineLock,
    },
    {
      kind: "feature operating cadence policy",
      path: args.featureOperatingCadencePolicy,
      validator: validateFeatureOperatingCadencePolicy,
    },
    {
      kind: "feature release gate policy",
      path: args.featureReleaseGatePolicy,
      validator: validateFeatureReleaseGatePolicy,
    },
    {
      kind: "feature decision policy",
      path: args.featureDecisionPolicy,
      validator: validateFeatureDecisionPolicy,
    },
    {
      kind: "feature activation catalog",
      path: args.featureActivationCatalog,
      validator: validateFeatureActivationCatalog,
    },
    {
      kind: "connector certification matrix",
      path: args.connectorCertificationMatrix,
      validator: validateConnectorCertificationMatrix,
    },
    {
      kind: "transport policy",
      path: args.transportPolicy,
      validator: validateTransportPolicy,
    },
    {
      kind: "context policy",
      path: args.contextPolicy,
      validator: validateContextPolicy,
    },
    {
      kind: "knowledge retrieval policy",
      path: args.knowledgeRetrievalPolicy,
      validator: validateKnowledgeRetrievalPolicy,
    },
    {
      kind: "discovery ingestion quality policy",
      path: args.discoveryIngestionQualityPolicy,
      validator: validateDiscoveryIngestionQualityPolicy,
    },
    {
      kind: "evaluation pipeline policy",
      path: args.evaluationPipelinePolicy,
      validator: validateEvaluationPipelinePolicy,
    },
    {
      kind: "mcp trust policy",
      path: args.mcpTrustPolicy,
      validator: validateMcpTrustPolicy,
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
