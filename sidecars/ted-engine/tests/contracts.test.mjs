/**
 * QA-007 — Contract Validation Tests
 *
 * Two-section test suite:
 *  1. Static validation of route_contracts.json structure (always runs)
 *  2. Live contract testing against running sidecar (skipped if sidecar not available)
 *
 * Dynamically generates one test per route from the contract registry.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import {
  getTestBaseUrl,
  getTestRuntimeDir,
  mintTestAuthToken,
  startTestSidecar,
  stopTestSidecar,
} from "./helpers/test-server.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contractsPath = resolve(__dirname, "../config/route_contracts.json");
const retrofitBaselineLockPath = resolve(__dirname, "../config/retrofit_rf0_baseline_lock.json");

let contracts;
try {
  contracts = JSON.parse(readFileSync(contractsPath, "utf-8"));
} catch {
  throw new Error(`Cannot load route_contracts.json from ${contractsPath}`);
}

let retrofitBaselineLock;
try {
  retrofitBaselineLock = JSON.parse(readFileSync(retrofitBaselineLockPath, "utf-8"));
} catch {
  throw new Error(`Cannot load retrofit_rf0_baseline_lock.json from ${retrofitBaselineLockPath}`);
}

const routeEntries = Object.entries(contracts.routes);
let baseUrl = "";
let authHeaders = {};

// ─────────────────────────────────────────────────────────
// Section 1: Static Contract Registry Validation
// ─────────────────────────────────────────────────────────

describe("Contract Registry — structure", () => {
  test("has _config_version", () => {
    expect(contracts._config_version).toBe(1);
  });

  test("has description", () => {
    expect(typeof contracts.description).toBe("string");
    expect(contracts.description.length).toBeGreaterThan(0);
  });

  test("has routes object with entries", () => {
    expect(typeof contracts.routes).toBe("object");
    expect(routeEntries.length).toBeGreaterThan(100);
  });

  test("route count matches expected range (155-230)", () => {
    expect(routeEntries.length).toBeGreaterThanOrEqual(155);
    expect(routeEntries.length).toBeLessThanOrEqual(230);
  });
});

describe("Contract Registry — per-route shape", () => {
  test.each(routeEntries)("%s has valid status_codes array", (routeKey, contract) => {
    expect(Array.isArray(contract.status_codes)).toBe(true);
    expect(contract.status_codes.length).toBeGreaterThan(0);
    for (const code of contract.status_codes) {
      expect(typeof code).toBe("number");
      expect(code).toBeGreaterThanOrEqual(200);
      expect(code).toBeLessThan(600);
    }
  });

  test.each(routeEntries)("%s has required_fields array", (routeKey, contract) => {
    expect(Array.isArray(contract.required_fields)).toBe(true);
    for (const field of contract.required_fields) {
      expect(typeof field).toBe("string");
      expect(field.length).toBeGreaterThan(0);
    }
  });

  test.each(routeEntries)("%s has content_type application/json", (routeKey, contract) => {
    expect(contract.content_type).toBe("application/json");
  });

  test.each(routeEntries)("%s route key matches METHOD /path pattern", (routeKey) => {
    expect(routeKey).toMatch(/^(GET|POST|PUT|PATCH|DELETE)\s+\//);
  });
});

describe("Contract Registry — method coverage", () => {
  const methods = routeEntries.map(([key]) => key.split(" ")[0]);

  test("includes GET routes", () => {
    expect(methods.filter((m) => m === "GET").length).toBeGreaterThan(20);
  });

  test("includes POST routes", () => {
    expect(methods.filter((m) => m === "POST").length).toBeGreaterThan(40);
  });
});

describe("Contract Registry — path namespace coverage", () => {
  const paths = routeEntries.map(([key]) => key.split(" ")[1]);

  const requiredPrefixes = [
    "/status",
    "/doctor",
    "/ops/",
    "/triage/",
    "/deals/",
    "/graph/",
    "/drafts/",
    "/commitments/",
    "/gtd/",
    "/meeting/",
    "/filing/",
    "/improvement/",
    "/reporting/",
    "/governance/",
    "/events/",
  ];

  test.each(requiredPrefixes)("has routes under %s", (prefix) => {
    const matching = paths.filter((p) => p.startsWith(prefix) || p === prefix);
    expect(matching.length).toBeGreaterThan(0);
  });

  test("covers builder-lane routes", () => {
    const bl = paths.filter((p) => p.includes("builder-lane"));
    expect(bl.length).toBeGreaterThanOrEqual(6);
  });

  test("covers self-healing routes", () => {
    const sh = paths.filter((p) => p.includes("self-healing"));
    expect(sh.length).toBeGreaterThanOrEqual(6);
  });

  test("covers evaluation routes", () => {
    const ev = paths.filter((p) => p.includes("evaluation"));
    expect(ev.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Contract Registry — field uniqueness", () => {
  test("no duplicate route keys", () => {
    const keys = routeEntries.map(([k]) => k);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });
});

describe("Contract Registry — critical routes have required_fields", () => {
  const criticalRoutes = [
    "GET /status",
    "GET /doctor",
    "GET /triage/list",
    "GET /deals/list",
    "GET /commitments/list",
    "GET /gtd/actions/list",
    "GET /reporting/morning-brief",
    "GET /reporting/eod-digest",
    "GET /ops/builder-lane/status",
    "GET /ops/self-healing/status",
  ];

  test.each(criticalRoutes)("%s has non-empty required_fields", (routeKey) => {
    const contract = contracts.routes[routeKey];
    expect(contract).toBeDefined();
    expect(contract.required_fields.length).toBeGreaterThan(0);
  });
});

describe("RF0 baseline lock — frozen route parity", () => {
  const workflowRoutes = Array.isArray(retrofitBaselineLock?.route_contract_freeze?.workflow_routes)
    ? retrofitBaselineLock.route_contract_freeze.workflow_routes
    : [];
  const migrationRoutes = Array.isArray(
    retrofitBaselineLock?.route_contract_freeze?.migration_routes,
  )
    ? retrofitBaselineLock.route_contract_freeze.migration_routes
    : [];
  const frozenRoutes = [...workflowRoutes, ...migrationRoutes];

  test("has frozen workflow and migration route entries", () => {
    expect(workflowRoutes.length).toBeGreaterThan(0);
    expect(migrationRoutes.length).toBeGreaterThan(0);
  });

  test.each(frozenRoutes)("$route_key matches current route_contracts entry", (entry) => {
    const liveContract = contracts.routes[entry.route_key];
    expect(liveContract).toBeDefined();
    expect(entry.contract).toEqual(liveContract);
  });
});

// ─────────────────────────────────────────────────────────
// Section 2: Live Contract Testing Against Running Sidecar
// ─────────────────────────────────────────────────────────

// Routes that are safe to call without authentication or external deps.
// Only GET routes that read from local ledgers (no Graph API, no LLM calls).
const SAFE_GET_ROUTES = [
  "GET /status",
  "GET /doctor",
  "GET /triage/list",
  "GET /triage/patterns",
  "GET /deals/list",
  "GET /deals/stale-owners",
  "GET /commitments/list",
  "GET /gtd/actions/list",
  "GET /gtd/waiting-for/list",
  "GET /drafts/queue",
  "GET /filing/suggestions/list",
  "GET /filing/para/structure",
  "GET /facility/alerts/list",
  "GET /improvement/proposals",
  "GET /improvement/failure-aggregation",
  "GET /ops/scheduler",
  "GET /ops/pending-deliveries",
  "GET /ops/notification-budget",
  "GET /ops/tool-usage",
  "GET /ops/workflows",
  "GET /ops/llm-provider",
  "GET /ops/compatibility-policy",
  "GET /ops/ingestion/status",
  "GET /ops/onboarding/discovery-status",
  "GET /ops/rollout-policy",
  "GET /ops/builder-lane/patterns",
  "GET /ops/builder-lane/status",
  "GET /ops/builder-lane/improvement-metrics",
  "GET /ops/self-healing/status",
  "GET /ops/self-healing/circuit-breakers",
  "GET /ops/self-healing/provider-health",
  "GET /ops/self-healing/correction-taxonomy",
  "GET /ops/self-healing/engagement-insights",
  "GET /ops/self-healing/noise-level",
  "GET /ops/self-healing/autonomy-status",
  "GET /ops/evaluation/status",
  "GET /events/stats",
  "GET /events/recent",
  "GET /meeting/upcoming",
  "GET /reporting/deep-work-metrics",
  "GET /reporting/trust-metrics",
  "GET /trust/autonomy/evaluate",
];

/**
 * Start an isolated test sidecar so live contract tests do not mutate local working data.
 */
beforeAll(async () => {
  await startTestSidecar();
  baseUrl = getTestBaseUrl();
  const token = await mintTestAuthToken();
  authHeaders = { authorization: `Bearer ${token}` };
});

afterAll(async () => {
  await stopTestSidecar();
});

describe("Live Contract Tests — safe GET routes", () => {
  // Build the test entries only for routes that exist in the contracts
  const testableRoutes = SAFE_GET_ROUTES.filter((r) => contracts.routes[r]).map((routeKey) => {
    const contract = contracts.routes[routeKey];
    const path = routeKey.replace(/^GET\s+/, "");
    return [routeKey, path, contract];
  });

  test.each(testableRoutes)(
    "%s — status code matches contract",
    async (routeKey, path, contract) => {
      const resp = await fetch(`${baseUrl}${path}`, { headers: authHeaders });
      expect(contract.status_codes).toContain(resp.status);
    },
  );

  test.each(testableRoutes)("%s — content-type is application/json", async (_routeKey, path) => {
    const resp = await fetch(`${baseUrl}${path}`, { headers: authHeaders });
    const ct = resp.headers.get("content-type") || "";
    expect(ct).toContain("application/json");
  });

  test.each(testableRoutes)("%s — x-ted-api-version header present", async (_routeKey, path) => {
    const resp = await fetch(`${baseUrl}${path}`, { headers: authHeaders });
    const version = resp.headers.get("x-ted-api-version");
    expect(version).toBeTruthy();
  });

  test.each(testableRoutes)(
    "%s — response contains all required_fields",
    async (_routeKey, path, contract) => {
      const resp = await fetch(`${baseUrl}${path}`, { headers: authHeaders });
      const body = await resp.json();
      for (const field of contract.required_fields) {
        expect(body).toHaveProperty(field);
      }
    },
  );
});

describe("Workflow registry metadata contract", () => {
  test("POST /ops/workflows backfills metadata for legacy-shaped payloads", async () => {
    const legacyWorkflowId = `rf1-legacy-${Date.now().toString(36)}`;
    const payload = {
      workflow_id: legacyWorkflowId,
      name: "RF1 Legacy Compatibility Workflow",
      steps: [
        {
          step_id: "inspect-llm",
          kind: "route_call",
          method: "GET",
          route: "/ops/llm-provider",
        },
      ],
    };
    const resp = await fetch(`${baseUrl}/ops/workflows`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.workflow.workflow_id).toBe(legacyWorkflowId);
    expect(Number.isInteger(body.workflow.workflow_version)).toBe(true);
    expect(body.workflow.workflow_version).toBeGreaterThanOrEqual(1);
    expect(typeof body.workflow.definition_hash).toBe("string");
    expect(body.workflow.definition_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(typeof body.workflow.published_at).toBe("string");
    expect(body.workflow.published_at.length).toBeGreaterThan(0);
    expect(body.workflow).toHaveProperty("supersedes_version");
    expect(body.version_published).toBe(true);
  });

  test("workflow upsert publishes immutable versions with lineage and events", async () => {
    const workflowId = `rf1-version-${Date.now().toString(36)}`;
    const v1Payload = {
      workflow_id: workflowId,
      name: "RF1 Version Publish Test",
      steps: [
        {
          step_id: "inspect-llm",
          kind: "route_call",
          method: "GET",
          route: "/ops/llm-provider",
        },
      ],
    };
    const v1Resp = await fetch(`${baseUrl}/ops/workflows`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "content-type": "application/json",
      },
      body: JSON.stringify(v1Payload),
    });
    expect(v1Resp.status).toBe(200);
    const v1Body = await v1Resp.json();
    expect(v1Body.workflow.workflow_version).toBe(1);
    expect(v1Body.workflow.supersedes_version).toBeNull();
    const v1Hash = v1Body.workflow.definition_hash;

    const v2Payload = {
      ...v1Payload,
      steps: [
        {
          step_id: "inspect-tools",
          kind: "route_call",
          method: "GET",
          route: "/ops/tool-usage",
        },
      ],
    };
    const v2Resp = await fetch(`${baseUrl}/ops/workflows`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "content-type": "application/json",
      },
      body: JSON.stringify(v2Payload),
    });
    expect(v2Resp.status).toBe(200);
    const v2Body = await v2Resp.json();
    expect(v2Body.workflow.workflow_version).toBe(2);
    expect(v2Body.workflow.supersedes_version).toBe(1);
    expect(v2Body.workflow.definition_hash).not.toBe(v1Hash);
    expect(v2Body.version_published).toBe(true);

    const registryResp = await fetch(`${baseUrl}/ops/workflows`, { headers: authHeaders });
    expect(registryResp.status).toBe(200);
    const registryBody = await registryResp.json();
    const active = registryBody.workflows.find((workflow) => workflow.workflow_id === workflowId);
    expect(active).toBeDefined();
    expect(active.workflow_version).toBe(2);
    const lineage = (registryBody.version_lineage || []).find(
      (entry) => entry.workflow_id === workflowId,
    );
    expect(lineage).toBeDefined();
    expect(lineage.active_version).toBe(2);
    expect(lineage.version_count).toBeGreaterThanOrEqual(2);

    const eventsResp = await fetch(
      `${baseUrl}/events/recent?event_type=workflow.registry.version_published&limit=50`,
      { headers: authHeaders },
    );
    expect(eventsResp.status).toBe(200);
    const eventsBody = await eventsResp.json();
    const publishedEvent = (eventsBody.events || []).find(
      (event) =>
        event?.payload?.workflow_id === workflowId && event?.payload?.workflow_version === 2,
    );
    expect(publishedEvent).toBeDefined();
  });

  test("POST /ops/workflows/run pins workflow version metadata and snapshot reference", async () => {
    const workflowId = `rf1-run-pin-${Date.now().toString(36)}`;
    const publishPayload = {
      workflow_id: workflowId,
      name: "RF1 Run Pin Test",
      steps: [
        {
          step_id: "inspect-llm",
          kind: "route_call",
          method: "GET",
          route: "/ops/llm-provider",
        },
      ],
    };
    const publishResp = await fetch(`${baseUrl}/ops/workflows`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "content-type": "application/json",
      },
      body: JSON.stringify(publishPayload),
    });
    expect(publishResp.status).toBe(200);
    const publishBody = await publishResp.json();
    const publishedVersion = publishBody.workflow.workflow_version;

    const runResp = await fetch(`${baseUrl}/ops/workflows/run`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "content-type": "application/json",
      },
      body: JSON.stringify({ workflow_id: workflowId }),
    });
    expect(runResp.status).toBe(200);
    const runBody = await runResp.json();
    expect(runBody.workflow_id).toBe(workflowId);
    expect(runBody.workflow_version).toBe(publishedVersion);
    expect(typeof runBody.definition_hash).toBe("string");
    expect(runBody.definition_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(typeof runBody.workflow_snapshot_ref).toBe("string");
    expect(runBody.workflow_snapshot_ref).toContain(`${workflowId}@v${publishedVersion}:`);

    const runsResp = await fetch(`${baseUrl}/ops/workflows/runs?workflow_id=${workflowId}`, {
      headers: authHeaders,
    });
    expect(runsResp.status).toBe(200);
    const runsBody = await runsResp.json();
    expect(Array.isArray(runsBody.runs)).toBe(true);
    expect(runsBody.runs.length).toBeGreaterThan(0);
    const latestRun = runsBody.runs[0];
    expect(latestRun.workflow_version).toBe(publishedVersion);
    expect(typeof latestRun.definition_hash).toBe("string");
    expect(typeof latestRun.workflow_snapshot_ref).toBe("string");

    const frictionResp = await fetch(`${baseUrl}/ops/friction/summary?workflow_id=${workflowId}`, {
      headers: authHeaders,
    });
    expect(frictionResp.status).toBe(200);
    const frictionBody = await frictionResp.json();
    expect(Array.isArray(frictionBody.recent_runs)).toBe(true);
    if (frictionBody.recent_runs.length > 0) {
      const latestRollup = frictionBody.recent_runs[0];
      expect(latestRollup.workflow_version).toBe(publishedVersion);
      expect(typeof latestRollup.definition_hash).toBe("string");
      expect(typeof latestRollup.workflow_snapshot_ref).toBe("string");
    }
  });

  test("legacy run records without version metadata remain queryable via fallback", async () => {
    const workflowId = `rf1-legacy-run-${Date.now().toString(36)}`;
    const runId = `wfr-legacy-${Date.now().toString(36)}`;
    const startedAt = new Date(Date.now() - 5000).toISOString();
    const completedAt = new Date().toISOString();
    const runtimeDir = getTestRuntimeDir();
    const workflowRunsLedgerPath = resolve(
      runtimeDir,
      "artifacts",
      "workflows",
      "workflow_runs.jsonl",
    );
    const frictionRollupsLedgerPath = resolve(
      runtimeDir,
      "artifacts",
      "friction",
      "friction_rollups.jsonl",
    );

    mkdirSync(dirname(workflowRunsLedgerPath), { recursive: true });
    appendFileSync(
      workflowRunsLedgerPath,
      JSON.stringify({
        kind: "workflow_run",
        run_id: runId,
        trace_id: `trace-${runId}`,
        workflow_id: workflowId,
        workflow_name: "Legacy Run Metadata Compatibility",
        status: "completed",
        dry_run: false,
        started_at: startedAt,
        completed_at: completedAt,
        step_count: 1,
        steps: [],
      }) + "\n",
      "utf8",
    );

    mkdirSync(dirname(frictionRollupsLedgerPath), { recursive: true });
    appendFileSync(
      frictionRollupsLedgerPath,
      JSON.stringify({
        kind: "friction_rollup",
        run_id: runId,
        trace_id: `trace-${runId}`,
        workflow_id: workflowId,
        workflow_name: "Legacy Run Metadata Compatibility",
        status: "completed",
        dry_run: false,
        started_at: startedAt,
        completed_at: completedAt,
        step_count: 1,
        job_friction_score: 0,
        harmful_friction_ratio: 0,
        productive_friction_ratio: 1,
        friction_totals: {
          wait_ms: 0,
          rework_count: 0,
          tool_failures: 0,
          governance_blocks: 0,
          handoff_count: 0,
          context_misses: 0,
          retry_attempts: 0,
          recovered_retries: 0,
        },
        top_harmful_drivers: [],
      }) + "\n",
      "utf8",
    );

    const runsResp = await fetch(`${baseUrl}/ops/workflows/runs?workflow_id=${workflowId}`, {
      headers: authHeaders,
    });
    expect(runsResp.status).toBe(200);
    const runsBody = await runsResp.json();
    const run = (runsBody.runs || []).find((entry) => entry.run_id === runId);
    expect(run).toBeDefined();
    expect(run.workflow_version).toBeGreaterThanOrEqual(1);
    expect(typeof run.workflow_snapshot_ref).toBe("string");
    expect(run.workflow_snapshot_ref.length).toBeGreaterThan(0);

    const frictionResp = await fetch(`${baseUrl}/ops/friction/summary?workflow_id=${workflowId}`, {
      headers: authHeaders,
    });
    expect(frictionResp.status).toBe(200);
    const frictionBody = await frictionResp.json();
    const rollup = (frictionBody.recent_runs || []).find((entry) => entry.run_id === runId);
    expect(rollup).toBeDefined();
    expect(rollup.workflow_version).toBeGreaterThanOrEqual(1);
    expect(typeof rollup.workflow_snapshot_ref).toBe("string");
    expect(rollup.workflow_snapshot_ref.length).toBeGreaterThan(0);
  });

  test("GET /ops/workflows returns versioned workflow metadata", async () => {
    const resp = await fetch(`${baseUrl}/ops/workflows`, { headers: authHeaders });
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body.workflows)).toBe(true);
    for (const workflow of body.workflows) {
      expect(Number.isInteger(workflow.workflow_version)).toBe(true);
      expect(workflow.workflow_version).toBeGreaterThanOrEqual(1);
      expect(typeof workflow.definition_hash).toBe("string");
      expect(workflow.definition_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(typeof workflow.published_at).toBe("string");
      expect(workflow.published_at.length).toBeGreaterThan(0);
      if (workflow.supersedes_version !== null && workflow.supersedes_version !== undefined) {
        expect(Number.isInteger(workflow.supersedes_version)).toBe(true);
        expect(workflow.supersedes_version).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe("Replay gate contract integration", () => {
  test("POST /ops/replay/run exposes contract metadata and persists release evidence", async () => {
    const runResp = await fetch(`${baseUrl}/ops/replay/run`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "content-type": "application/json",
      },
      body: JSON.stringify({ include: "all" }),
    });
    expect(runResp.status).toBe(200);
    const runBody = await runResp.json();
    expect(typeof runBody.replay_gate_contract_version).toBe("string");
    expect(runBody.replay_gate_contract_version.length).toBeGreaterThan(0);
    expect(runBody.release_gate?.contract_version).toBe(runBody.replay_gate_contract_version);
    expect(Array.isArray(runBody.release_gate?.missing_required_scenarios)).toBe(true);
    expect(runBody.release_gate?.missing_required_scenarios.length).toBe(0);

    const runtimeDir = getTestRuntimeDir();
    const evidencePath = resolve(runtimeDir, "artifacts", "replay", "release_evidence.jsonl");
    expect(existsSync(evidencePath)).toBe(true);

    const evidenceLines = readFileSync(evidencePath, "utf8")
      .split("\n")
      .filter((line) => line.trim().length > 0);
    const evidenceRecords = evidenceLines.map((line) => JSON.parse(line));
    const evidence = evidenceRecords.find((entry) => entry.run_id === runBody.run_id);
    expect(evidence).toBeDefined();
    expect(evidence.kind).toBe("replay_release_evidence");
    expect(evidence.replay_gate_contract_version).toBe(runBody.replay_gate_contract_version);
  });

  test("POST /ops/replay/run includes connector drills with reason codes and escalation traces", async () => {
    const runResp = await fetch(`${baseUrl}/ops/replay/run`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "content-type": "application/json",
      },
      body: JSON.stringify({ include: "all" }),
    });
    expect(runResp.status).toBe(200);
    const runBody = await runResp.json();
    expect(runBody.summary?.connector_failures).toBe(0);

    const duplicateDrill = (runBody.results || []).find(
      (entry) => entry?.scenario_id === "connector_duplicate_webhook_delivery",
    );
    expect(duplicateDrill).toBeDefined();
    expect(duplicateDrill.status).toBe("pass");
    expect(duplicateDrill.connector?.assertions?.duplicate_delivery_detected).toBe(true);
    expect(duplicateDrill.connector?.assertions?.duplicate_mutation_blocked).toBe(true);
    expect(duplicateDrill.connector?.metrics?.duplicate_deliveries).toBeGreaterThan(0);
    expect(duplicateDrill.connector?.metrics?.state_mutations).toBe(
      duplicateDrill.connector?.metrics?.unique_deliveries,
    );

    const callbackDrill = (runBody.results || []).find(
      (entry) => entry?.scenario_id === "connector_callback_auth_failure",
    );
    expect(callbackDrill).toBeDefined();
    expect(callbackDrill.status).toBe("pass");
    expect(callbackDrill.connector?.assertions?.invalid_callback_rejected).toBe(true);
    expect(callbackDrill.connector_reason_codes).toContain("CALLBACK_AUTH_SIGNATURE_INVALID");
    expect(Array.isArray(callbackDrill.connector_escalation_trace)).toBe(true);
    expect(callbackDrill.connector_escalation_trace.length).toBeGreaterThan(0);

    const runtimeDir = getTestRuntimeDir();
    const eventLogPath = resolve(runtimeDir, "artifacts", "event_log", "event_log.jsonl");
    expect(existsSync(eventLogPath)).toBe(true);
    const events = readFileSync(eventLogPath, "utf8")
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line));
    const completedEvents = events.filter(
      (entry) =>
        entry?.event_type === "evaluation.connector.drill.completed" &&
        entry?.payload?.run_id === runBody.run_id,
    );
    expect(completedEvents.length).toBeGreaterThanOrEqual(2);
    const escalationEvent = events.find(
      (entry) =>
        entry?.event_type === "evaluation.connector.drill.escalated" &&
        entry?.payload?.run_id === runBody.run_id &&
        entry?.payload?.scenario_id === "connector_callback_auth_failure",
    );
    expect(escalationEvent).toBeDefined();
    expect(escalationEvent.payload?.reason_codes).toContain("CALLBACK_AUTH_SIGNATURE_INVALID");
  });
});

describe("Rollout policy contract integration", () => {
  test("GET /ops/rollout-policy returns deterministic decisions for identical context", async () => {
    const query = new URLSearchParams({
      operator_id: "operator-rf3",
      workflow_id: "wf-risk-lint",
      route_key: "/ops/replay/run",
      mode: "transport_canary",
    }).toString();

    const firstResp = await fetch(`${baseUrl}/ops/rollout-policy?${query}`, {
      headers: authHeaders,
    });
    const secondResp = await fetch(`${baseUrl}/ops/rollout-policy?${query}`, {
      headers: authHeaders,
    });
    expect(firstResp.status).toBe(200);
    expect(secondResp.status).toBe(200);

    const firstBody = await firstResp.json();
    const secondBody = await secondResp.json();
    expect(firstBody.decision).toEqual(secondBody.decision);
    expect(firstBody.decision.mode).toBe("transport_canary");
    expect(typeof firstBody.decision.bucket).toBe("number");
    expect(firstBody.decision.bucket).toBeGreaterThanOrEqual(0);
    expect(firstBody.decision.bucket).toBeLessThan(100);
  });

  test("GET /ops/rollout-policy returns auditable rollback triggers and emits policy event", async () => {
    const query = new URLSearchParams({
      operator_id: "operator-rf3",
      workflow_id: "wf-risk-lint",
      route_key: "/ops/replay/run",
      mode: "general_rollout",
      active_reason_codes: "transport_guardrail_breach,replay_gate_failed,unknown_reason",
    }).toString();
    const resp = await fetch(`${baseUrl}/ops/rollout-policy?${query}`, { headers: authHeaders });
    expect(resp.status).toBe(200);
    const body = await resp.json();

    expect(body.rollback.triggered).toBe(true);
    expect(body.rollback.reason_codes).toContain("transport_guardrail_breach");
    expect(body.rollback.reason_codes).toContain("replay_gate_failed");
    expect(body.rollback.reason_codes).not.toContain("unknown_reason");
    expect(Array.isArray(body.rollback.triggers)).toBe(true);
    expect(body.rollback.triggers.length).toBeGreaterThanOrEqual(2);

    const runtimeDir = getTestRuntimeDir();
    const eventLogPath = resolve(runtimeDir, "artifacts", "event_log", "event_log.jsonl");
    expect(existsSync(eventLogPath)).toBe(true);
    const events = readFileSync(eventLogPath, "utf8")
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line));
    const rolloutEvent = events
      .toReversed()
      .find(
        (entry) =>
          entry?.event_type === "policy.rollout.queried" && entry?.source === "/ops/rollout-policy",
      );
    expect(rolloutEvent).toBeDefined();
    expect(rolloutEvent.payload?.mode).toBeDefined();
    expect(typeof rolloutEvent.payload?.selected).toBe("boolean");
    expect(Array.isArray(rolloutEvent.payload?.rollback_reason_codes)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────
// Section 3: Contract Consistency Checks
// ─────────────────────────────────────────────────────────

describe("Contract Registry — consistency", () => {
  test("every route with path params uses {param} syntax", () => {
    for (const [routeKey] of routeEntries) {
      const path = routeKey.split(" ")[1];
      // If the path has a segment starting with colon, it should use braces instead
      const segments = path.split("/");
      for (const seg of segments) {
        expect(seg.startsWith(":")).toBe(false);
      }
    }
  });

  test("every 200-only route has no error codes", () => {
    for (const [_routeKey, contract] of routeEntries) {
      if (contract.status_codes.length === 1 && contract.status_codes[0] === 200) {
        for (const code of contract.status_codes) {
          expect(code).toBeLessThan(400);
        }
      }
    }
  });

  test("POST routes that create resources include 200 or 201", () => {
    const createRoutes = routeEntries.filter(
      ([key]) => key.startsWith("POST") && (key.includes("/create") || key.includes("/ingest")),
    );
    for (const [_routeKey, contract] of createRoutes) {
      const hasSuccessCode = contract.status_codes.some((c) => c === 200 || c === 201);
      expect(hasSuccessCode).toBe(true);
    }
  });

  test("all profile-scoped graph routes include 400 status code for invalid profile", () => {
    const graphRoutes = routeEntries.filter(([key]) => key.split(" ")[1].startsWith("/graph/"));
    for (const [_routeKey, contract] of graphRoutes) {
      expect(contract.status_codes).toContain(400);
    }
  });

  test("auth routes include 401 or 400", () => {
    const authRoutes = routeEntries.filter(([key]) => key.includes("/auth/"));
    for (const [_routeKey, contract] of authRoutes) {
      const hasAuthCode = contract.status_codes.some((c) => c === 400 || c === 401);
      expect(hasAuthCode).toBe(true);
    }
  });
});
