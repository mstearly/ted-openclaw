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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function printResult(kind, result) {
  if (result.ok) {
    console.log(`[OK] ${kind} valid`);
    return true;
  }
  console.error(`[FAIL] ${kind} validation failed:`);
  for (const error of result.errors || []) {
    console.error(`  - ${error.code}: ${error.message}`);
  }
  return false;
}

function main() {
  const targets = [
    {
      kind: "feature operating cadence policy",
      path: path.join(repoRoot, "sidecars/ted-engine/config/feature_operating_cadence_policy.json"),
      validator: validateFeatureOperatingCadencePolicy,
    },
    {
      kind: "feature release gate policy",
      path: path.join(repoRoot, "sidecars/ted-engine/config/feature_release_gate_policy.json"),
      validator: validateFeatureReleaseGatePolicy,
    },
    {
      kind: "feature decision policy",
      path: path.join(repoRoot, "sidecars/ted-engine/config/feature_decision_policy.json"),
      validator: validateFeatureDecisionPolicy,
    },
    {
      kind: "feature activation catalog",
      path: path.join(repoRoot, "sidecars/ted-engine/config/feature_activation_catalog.json"),
      validator: validateFeatureActivationCatalog,
    },
    {
      kind: "connector certification matrix",
      path: path.join(repoRoot, "sidecars/ted-engine/config/connector_certification_matrix.json"),
      validator: validateConnectorCertificationMatrix,
    },
    {
      kind: "transport policy",
      path: path.join(repoRoot, "sidecars/ted-engine/config/transport_policy.json"),
      validator: validateTransportPolicy,
    },
    {
      kind: "context policy",
      path: path.join(repoRoot, "sidecars/ted-engine/config/context_policy.json"),
      validator: validateContextPolicy,
    },
    {
      kind: "knowledge retrieval policy",
      path: path.join(repoRoot, "sidecars/ted-engine/config/knowledge_retrieval_policy.json"),
      validator: validateKnowledgeRetrievalPolicy,
    },
    {
      kind: "discovery ingestion quality policy",
      path: path.join(
        repoRoot,
        "sidecars/ted-engine/config/discovery_ingestion_quality_policy.json",
      ),
      validator: validateDiscoveryIngestionQualityPolicy,
    },
    {
      kind: "evaluation pipeline policy",
      path: path.join(repoRoot, "sidecars/ted-engine/config/evaluation_pipeline_policy.json"),
      validator: validateEvaluationPipelinePolicy,
    },
    {
      kind: "mcp trust policy",
      path: path.join(repoRoot, "sidecars/ted-engine/config/mcp_trust_policy.json"),
      validator: validateMcpTrustPolicy,
    },
  ];

  let allOk = true;
  for (const target of targets) {
    const parsed = readJson(target.path);
    const result = target.validator(parsed);
    if (!printResult(target.kind, result)) {
      allOk = false;
    }
  }

  if (!allOk) {
    process.exitCode = 1;
  }
}

main();
