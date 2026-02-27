#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const DEFAULT_FEATURE_MATURITY = path.join(
  repoRoot,
  "sidecars/ted-engine/config/feature_maturity.json",
);
const DEFAULT_CAPABILITY_MATURITY = path.join(
  repoRoot,
  "sidecars/ted-engine/config/capability_maturity.json",
);
const DEFAULT_RESEARCH_DEBT = path.join(
  repoRoot,
  "sidecars/ted-engine/config/research_debt_scores.json",
);
const DEFAULT_MODULE_POLICY = path.join(
  repoRoot,
  "sidecars/ted-engine/config/module_lifecycle_policy.json",
);
const DEFAULT_OUTPUT = path.join(repoRoot, "sidecars/ted-engine/config/feature_registry.json");

const LIFECYCLE_TO_MATURITY = new Map([
  ["proposed", 1],
  ["incubating", 2],
  ["graduated", 3],
  ["mature", 4],
  ["retiring", 2],
]);

const CAPABILITY_LEVEL_TO_LIFECYCLE = new Map([
  [0, "proposed"],
  [1, "incubating"],
  [2, "graduated"],
  [3, "mature"],
  [4, "mature"],
]);

const DEBT_BASE_SCORE = new Map([
  ["low", 25],
  ["medium", 50],
  ["high", 75],
]);

const FEATURE_PLANE_OVERRIDES = {
  event_sourcing: "state",
  draft_state_machine: "state",
  governance_choke_point: "control",
  builder_lane: "control",
  self_healing: "control",
  m365_integration: "connector",
  scheduler: "control",
  hipaa_compliance: "control",
  ingestion_pipeline: "state",
  discovery_pipeline: "state",
  sharepoint_integration: "connector",
  reconciliation_engine: "state",
  schema_versioning: "contract",
  config_migration: "control",
  prompt_registry: "contract",
  content_isolation: "control",
  evaluation_pipeline: "control",
  email_handling: "experience",
  calendar_awareness: "experience",
  task_management: "experience",
  deal_tracking: "experience",
  document_management: "experience",
  governance_safety: "control",
  personalization: "experience",
  knowledge_retrieval: "state",
  multi_user: "experience",
  non_destructive_evolution: "contract",
};

const FEATURE_DEPENDENCIES = {
  draft_state_machine: ["event_sourcing"],
  builder_lane: ["governance_choke_point", "event_sourcing"],
  self_healing: ["event_sourcing", "governance_choke_point"],
  m365_integration: ["governance_choke_point"],
  scheduler: ["draft_state_machine", "self_healing"],
  reconciliation_engine: ["m365_integration"],
  sharepoint_integration: ["m365_integration"],
  config_migration: ["schema_versioning"],
  evaluation_pipeline: ["event_sourcing", "governance_choke_point"],
  non_destructive_evolution: ["schema_versioning", "config_migration"],
};

const FEATURE_EVENT_PATTERNS = {
  builder_lane: ["improvement.*", "governance.rubber_stamping.detected"],
  calendar_awareness: ["calendar.*", "meeting.*"],
  config_migration: ["config.migration.*"],
  content_isolation: ["governance.hard_ban.*", "governance.output_contract.*"],
  deal_tracking: ["deal.*"],
  discovery_pipeline: ["discovery.*"],
  document_management: ["filing.*", "sharepoint.*"],
  draft_state_machine: ["draft.*"],
  email_handling: ["mail.*", "draft.*"],
  evaluation_pipeline: ["evaluation.*"],
  event_sourcing: ["audit.action", "policy.config.changed", "system.startup_validation"],
  governance_choke_point: ["governance.*"],
  governance_safety: ["governance.*", "trust.validation.*"],
  hipaa_compliance: ["governance.entity_check.*", "governance.output_contract.*"],
  ingestion_pipeline: ["ingestion.*"],
  knowledge_retrieval: ["extraction.*", "memory.preference.*"],
  m365_integration: ["graph.*", "planner.*", "todo.*"],
  multi_user: ["memory.preference.*", "workflow.registry.*"],
  non_destructive_evolution: ["policy.deprecation.notice_served", "config.migrated"],
  personalization: ["memory.preference.*", "improvement.calibration.response"],
  prompt_registry: ["prompt.registry.*"],
  reconciliation_engine: ["sync.*"],
  scheduler: ["scheduler.*"],
  schema_versioning: ["config.migrated", "contracts.startup_validation"],
  self_healing: ["self_healing.*"],
  sharepoint_integration: ["sharepoint.*"],
  task_management: ["planner.task.*", "todo.task.*", "commitment.*", "gtd.*"],
};

function owaspByPlane(plane) {
  if (plane === "control") {
    return ["LLM01", "LLM06"];
  }
  if (plane === "connector") {
    return ["LLM07", "LLM10"];
  }
  if (plane === "state") {
    return ["LLM03", "LLM08"];
  }
  if (plane === "contract") {
    return ["LLM05", "LLM09"];
  }
  return ["LLM02", "LLM04"];
}

function defaultPolicyRefs(plane) {
  const shared = ["sidecars/ted-engine/config/hard_bans.json"];
  if (plane === "control") {
    return [...shared, "sidecars/ted-engine/config/module_lifecycle_policy.json"];
  }
  if (plane === "connector") {
    return [...shared, "sidecars/ted-engine/config/connector_admission_policy.json"];
  }
  if (plane === "state") {
    return [...shared, "sidecars/ted-engine/config/rollout_policy.json"];
  }
  if (plane === "contract") {
    return [...shared, "sidecars/ted-engine/config/output_contracts.json"];
  }
  return [...shared, "sidecars/ted-engine/config/operator_profile.json"];
}

function defaultQaContracts(featureId) {
  return {
    test_suites: [
      "sidecars/ted-engine/tests/config-schemas.test.mjs",
      "sidecars/ted-engine/tests/contracts.test.mjs",
      `feature:${featureId}:unit`,
    ],
    replay_scenarios: [`replay:${featureId}:baseline`],
    browser_gates: ["ui/src/ui/views/ted.workflow.browser.test.ts"],
  };
}

function defaultRuntimeSignals(featureId, plane) {
  return {
    events: FEATURE_EVENT_PATTERNS[featureId] || [`feature.${featureId}.*`],
    slos:
      plane === "connector"
        ? ["connector.auth_failure_rate<=0.02", "connector.retry_recovery_rate>=0.9"]
        : ["error_rate<=0.05", "p95_latency_ms<=2500"],
    alerts:
      plane === "control"
        ? ["governance_block_spike", "override_rate_spike"]
        : ["latency_breach", "failure_ratio_breach"],
  };
}

function parseArgs(argv) {
  const out = {
    featureMaturity: DEFAULT_FEATURE_MATURITY,
    capabilityMaturity: DEFAULT_CAPABILITY_MATURITY,
    researchDebt: DEFAULT_RESEARCH_DEBT,
    modulePolicy: DEFAULT_MODULE_POLICY,
    output: DEFAULT_OUTPUT,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--feature-maturity") {
      out.featureMaturity = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--capability-maturity") {
      out.capabilityMaturity = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--research-debt") {
      out.researchDebt = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--module-policy") {
      out.modulePolicy = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (arg === "--output") {
      out.output = path.resolve(repoRoot, argv[i + 1] || "");
      i += 1;
      continue;
    }
  }

  return out;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function inferPlane(featureId) {
  if (FEATURE_PLANE_OVERRIDES[featureId]) {
    return FEATURE_PLANE_OVERRIDES[featureId];
  }
  if (featureId.includes("integration")) {
    return "connector";
  }
  if (featureId.includes("policy") || featureId.includes("governance")) {
    return "control";
  }
  if (featureId.includes("schema") || featureId.includes("state")) {
    return "contract";
  }
  return "experience";
}

function inferModuleClass(plane) {
  if (plane === "connector") {
    return "connector";
  }
  if (plane === "experience") {
    return "workflow";
  }
  if (plane === "state") {
    return "domain_engine";
  }
  return "policy";
}

function inferOwners(plane) {
  const ownerByPlane = {
    control: "council.governance",
    connector: "council.connectors",
    state: "council.state",
    contract: "council.contracts",
    experience: "council.experience",
  };
  return {
    owner: ownerByPlane[plane] || "council.core",
    backup_owner: "operator.primary",
  };
}

function deriveFragility(options) {
  const {
    lifecycleState,
    maturityScore,
    lastFindingCycle,
    researchDebtScore,
    capabilityLevel,
    capabilityTarget,
  } = options;
  const debtBase = DEBT_BASE_SCORE.get(researchDebtScore) ?? 45;
  const findingPenalty = lastFindingCycle ? 10 : 0;
  const maturityPenalty =
    Math.max(0, 4 - (Number.isInteger(maturityScore) ? maturityScore : 0)) * 5;
  const lifecyclePenalty =
    lifecycleState === "proposed" ? 10 : lifecycleState === "incubating" ? 6 : 0;
  const capabilityGap =
    Number.isInteger(capabilityTarget) && Number.isInteger(capabilityLevel)
      ? Math.max(0, capabilityTarget - capabilityLevel)
      : 0;
  const gapPenalty = capabilityGap * 8;
  return Math.max(
    0,
    Math.min(100, debtBase + findingPenalty + maturityPenalty + lifecyclePenalty + gapPenalty),
  );
}

function createDefaultEntry(options) {
  const {
    featureId,
    lifecycleState,
    maturityScore,
    notes,
    lastFindingCycle = null,
    researchDebtScore = null,
    capabilityLevel = null,
    capabilityTarget = null,
  } = options;
  const plane = inferPlane(featureId);
  const owners = inferOwners(plane);
  return {
    feature_id: featureId,
    name: featureId,
    plane,
    owner: owners.owner,
    backup_owner: owners.backup_owner,
    module_class: inferModuleClass(plane),
    lifecycle_state: lifecycleState,
    maturity_score: maturityScore,
    fragility_score: deriveFragility({
      lifecycleState,
      maturityScore,
      lastFindingCycle,
      researchDebtScore,
      capabilityLevel,
      capabilityTarget,
    }),
    qa_contracts: defaultQaContracts(featureId),
    security_controls: {
      policy_refs: defaultPolicyRefs(plane),
      owasp_llm_top10: owaspByPlane(plane),
    },
    runtime_signals: defaultRuntimeSignals(featureId, plane),
    usage_signals: {
      invocation_count_30d: null,
      adoption_ratio_30d: null,
      success_rate_30d: null,
    },
    dependencies: FEATURE_DEPENDENCIES[featureId] || [],
    research_profile: {
      last_benchmark_date: null,
      trigger_conditions: ["fragility_ge_70", "maturity_le_2_with_user_impact"],
      external_patterns: [],
    },
    source_refs: {
      feature_maturity_level: null,
      capability_level: capabilityLevel,
      capability_target: capabilityTarget,
      research_debt_score: researchDebtScore,
      notes: notes || null,
    },
  };
}

function applyCapabilityDetails(entry, capability) {
  const level = Number.isInteger(capability.level) ? capability.level : null;
  const target = Number.isInteger(capability.target) ? capability.target : null;
  const lifecycleState = CAPABILITY_LEVEL_TO_LIFECYCLE.get(level) || "incubating";
  const maturityScore = Number.isInteger(level) ? Math.max(0, Math.min(5, level)) : 1;
  entry.lifecycle_state = entry.lifecycle_state || lifecycleState;
  entry.maturity_score = Math.max(entry.maturity_score || 0, maturityScore);
  entry.source_refs.capability_level = level;
  entry.source_refs.capability_target = target;
  entry.source_refs.notes = capability.notes || entry.source_refs.notes;
}

function normalizeDependencies(entries) {
  const featureIds = new Set(entries.map((entry) => entry.feature_id));
  for (const entry of entries) {
    const deps = Array.isArray(entry.dependencies) ? entry.dependencies : [];
    const cleaned = [];
    const seen = new Set();
    for (const dep of deps) {
      if (typeof dep !== "string") {
        continue;
      }
      const depId = dep.trim();
      if (!depId || depId === entry.feature_id || seen.has(depId) || !featureIds.has(depId)) {
        continue;
      }
      seen.add(depId);
      cleaned.push(depId);
    }
    entry.dependencies = cleaned;
  }
}

function seedRegistry(options) {
  const featureMaturity = readJson(options.featureMaturity);
  const capabilityMaturity = readJson(options.capabilityMaturity);
  const researchDebt = readJson(options.researchDebt);
  const modulePolicy = readJson(options.modulePolicy);

  const debtByArea = new Map();
  for (const area of Array.isArray(researchDebt.areas) ? researchDebt.areas : []) {
    if (typeof area?.name !== "string" || area.name.trim().length === 0) {
      continue;
    }
    debtByArea.set(area.name.trim(), {
      score: typeof area.debt_score === "string" ? area.debt_score.trim() : null,
      lastReviewed: typeof area.last_reviewed === "string" ? area.last_reviewed.trim() : null,
    });
  }

  const entries = new Map();
  const featureRows = Array.isArray(featureMaturity.features) ? featureMaturity.features : [];
  for (const feature of featureRows) {
    const featureId = typeof feature?.name === "string" ? feature.name.trim() : "";
    if (!featureId) {
      continue;
    }
    const lifecycleState =
      typeof feature.level === "string" && feature.level.trim().length > 0
        ? feature.level.trim()
        : "incubating";
    const maturityScore = LIFECYCLE_TO_MATURITY.get(lifecycleState) ?? 1;
    const debt = debtByArea.get(featureId);
    const entry = createDefaultEntry({
      featureId,
      lifecycleState,
      maturityScore,
      notes: feature.notes || null,
      lastFindingCycle: feature.last_finding_cycle || null,
      researchDebtScore: debt?.score || null,
    });
    entry.source_refs.feature_maturity_level = lifecycleState;
    entries.set(featureId, entry);
  }

  const capabilityRows = Array.isArray(capabilityMaturity.dimensions)
    ? capabilityMaturity.dimensions
    : [];
  for (const capability of capabilityRows) {
    const featureId = typeof capability?.name === "string" ? capability.name.trim() : "";
    if (!featureId) {
      continue;
    }
    const existing = entries.get(featureId);
    if (existing) {
      applyCapabilityDetails(existing, capability);
      continue;
    }
    const level = Number.isInteger(capability.level) ? capability.level : 1;
    const lifecycleState = CAPABILITY_LEVEL_TO_LIFECYCLE.get(level) || "incubating";
    const debt = debtByArea.get(featureId);
    const entry = createDefaultEntry({
      featureId,
      lifecycleState,
      maturityScore: Math.max(0, Math.min(5, level)),
      notes: capability.notes || null,
      researchDebtScore: debt?.score || null,
      capabilityLevel: level,
      capabilityTarget: Number.isInteger(capability.target) ? capability.target : null,
    });
    applyCapabilityDetails(entry, capability);
    entries.set(featureId, entry);
  }

  const rows = Array.from(entries.values()).toSorted((a, b) =>
    a.feature_id.localeCompare(b.feature_id),
  );
  normalizeDependencies(rows);

  const output = {
    _config_version: 1,
    _artifact: "feature_registry",
    _description:
      "Unified council feature registry linking maturity, fragility, governance policy context, and feature-level QA/security placeholders.",
    _generated_by: "scripts/ted-profile/seed-feature-registry.mjs",
    _generated_at: new Date().toISOString(),
    policy_context: {
      policy_precedence: Array.isArray(modulePolicy.policy_precedence)
        ? modulePolicy.policy_precedence
        : [],
      release_gate_kpis: Array.isArray(modulePolicy?.release_gate?.kpis)
        ? modulePolicy.release_gate.kpis
        : [],
      module_classes: Object.keys(modulePolicy.module_classes || {}),
    },
    features: rows,
  };

  return output;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const registry = seedRegistry(args);
  fs.writeFileSync(args.output, JSON.stringify(registry, null, 2) + "\n", "utf8");
  console.log(
    `[seed-feature-registry] wrote ${registry.features.length} features to ${args.output}`,
  );
}

main();
