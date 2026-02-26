/**
 * QA-007 — Contract Validation Tests
 *
 * Two-section test suite:
 *  1. Static validation of route_contracts.json structure (always runs)
 *  2. Live contract testing against running sidecar (skipped if sidecar not available)
 *
 * Dynamically generates one test per route from the contract registry.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import {
  getTestBaseUrl,
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
  "GET /ops/ingestion/status",
  "GET /ops/onboarding/discovery-status",
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
