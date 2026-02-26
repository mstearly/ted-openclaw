# SDD 89: Council Incorporation Plan — V1-V6 With Friction Core

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent:** SDD 88  
**Mandate:** Save recommendations from SDD 88 and define a detailed execution plan for V1-V6, with outcome analytics centered on measured execution friction.

---

## 1. Recommendation Register (Saved)

From SDD 88 Section 6, council confirms six high-value additions:

1. V1: Visual Workflow Composer
2. V2: Memory-to-Execution Bridge
3. V3: Unified Retrieval Layer
4. V4: Trust Center UI
5. V5: Closed-loop Healing Actions
6. V6: Outcome Analytics

Council reaffirmation:

1. V1-V6 are approved for execution.
2. V6 must prioritize **friction measurement in real job execution** as a first-class signal.
3. Friction telemetry must feed Builder Lane and self-healing, not only dashboard reporting.

---

## 2. Design Laws For This Program

1. Governance-first: no change weakens approval boundaries.
2. Non-destructive evolution: additive routes/configs/ledgers only.
3. Operator-first UX: no-curl operation for Clint.
4. Traceability by default: every major action emits event + audit evidence.
5. Friction intelligence: each job run must produce measurable friction vectors.

## 2.1 Incorporation Map For "#5 Recommended Next Steps"

Council maps the earlier `#5 Recommended Next Steps` into this V1-V6 program as follows:

1. Merge branch to main:
   - Incorporated as a precondition and already completed in prior council waves.
   - Program expectation: all V1-V6 work lands incrementally on main with scoped commits.
2. Azure AD app registration:
   - Remains an operator-owned blocker for live Graph proof.
   - Incorporated as readiness gate before production confidence sign-off.
3. Monolith decomposition:
   - Incorporated as parallel maintainability track with no-regression extraction waves.
   - V5 self-healing expansion must use extracted module seams, not server-level sprawl.
4. CI pipeline:
   - Elevated as hard gate for all waves.
   - Required checks: build, test, and route-contract validation per wave merge.
5. End-to-end live Graph smoke tests:
   - Incorporated as mandatory evidence checkpoint before declaring V3/V4/V6 production-ready.
   - Friction telemetry from live smoke runs becomes baseline dataset for outcome analytics.

---

## 3. Friction-First Outcome Model (Program Core)

### 3.1 Friction taxonomy (required)

Every job/workflow run must measure and log:

1. **Wait friction**: time waiting on approvals, external responses, queue delays.
2. **Rework friction**: draft edits, retries, reruns, rejected steps.
3. **Tool friction**: tool call failures, timeouts, degraded latency.
4. **Context friction**: missing context, retrieval misses, low-grounded outputs.
5. **Governance friction**: policy blocks, denied tools, required manual interventions.
6. **Handoff friction**: escalations and human takeover points.

### 3.2 Core derived metrics

1. `job_friction_score` (0-100 normalized weighted sum).
2. `productive_friction_ratio` vs `harmful_friction_ratio`.
3. `time_to_value_minutes` per job family.
4. `automation_recovery_rate` (self-healed failures / total failures).
5. `operator_load_index` (manual decisions per completed outcome).

### 3.3 Why this matters

Council position: friction is the highest-signal proxy for where Clint is losing time, trust, and momentum. If captured and fed into learning loops, it becomes a reliable engine for system improvement.

---

## 4. Execution Waves (Detailed)

## Wave F0 — Instrumentation Foundation (prerequisite for all V1-V6)

### Scope

1. Add friction event schema and append-only ledgers.
2. Add runtime instrumentation hooks in workflow, LLM, MCP, Graph, and draft queue flows.
3. Add friction aggregation endpoints.

### Primary files

1. `sidecars/ted-engine/server.mjs`
2. `sidecars/ted-engine/config/event_schema.json`
3. `sidecars/ted-engine/config/route_contracts.json`
4. `extensions/ted-sidecar/index.ts`
5. `ui/src/ui/types.ts`

### Tasks

1. Add `friction.event.logged` + category-specific event types.
2. Create `artifacts/friction/job_friction.jsonl` and `artifacts/friction/friction_rollups.jsonl`.
3. Emit friction points from:
   - workflow step execution
   - route retries/backoff
   - policy-denied tool calls
   - draft rejection/edit deltas
   - approval wait windows
4. Add `GET /ops/friction/summary` and `GET /ops/friction/runs`.

### Acceptance

1. Every workflow run returns a friction summary block.
2. Friction events are queryable by `job_id`, `workflow_id`, and `entity`.

---

## Wave F1 — V1 Visual Workflow Composer

### Scope

1. Replace JSON-first authoring with visual/no-code builder.
2. Preserve deterministic backend execution semantics.

### Primary files

1. `ui/src/ui/views/ted.ts`
2. `ui/src/ui/controllers/ted.ts`
3. `ui/src/ui/app.ts`
4. `ui/src/ui/app-render.ts`
5. `sidecars/ted-engine/server.mjs`

### Tasks

1. Add canvas editor with step palette:
   - route call
   - approval gate
   - condition branch
   - schedule trigger
2. Add validation panel: unreachable node, missing route, cycle risk, missing approval gate for risky actions.
3. Add simulation mode that outputs:
   - projected route sequence
   - approval checkpoints
   - predicted friction hotspots
4. Keep registry contract backward-compatible with existing JSON workflows.

### Acceptance

1. Clint can create, edit, and run workflows without editing JSON directly.
2. Simulation shows policy and friction preview before run.

---

## Wave F2 — V2 Memory-to-Execution Bridge

### Scope

1. Convert memory records into deterministic runtime context.
2. Provide provenance visibility in generated outputs.

### Primary files

1. `sidecars/ted-engine/server.mjs`
2. `sidecars/ted-engine/config/memory_policy.json`
3. `ui/src/ui/views/ted.ts`

### Tasks

1. Add `resolveMemoryContext(intent, entity, job)` helper.
2. Inject memory context into selected intent pipelines (`draft_email`, `morning_brief`, `meeting_prep`, `commitment_extract`).
3. Add conflict resolution policy:
   - recency
   - confidence
   - pinned preference precedence
4. Add response metadata block:
   - memory keys used
   - provenance/source
   - confidence contribution
5. Log `memory.applied_to_execution` events.

### Acceptance

1. Runtime behavior demonstrably changes when relevant memory is updated.
2. Operator can inspect exactly which memory influenced output.

---

## Wave F3 — V3 Unified Retrieval Layer

### Scope

1. Cross-source retrieval in one governed query surface.
2. Read-only connectors first.

### Primary files

1. `sidecars/ted-engine/server.mjs`
2. `sidecars/ted-engine/config/external_mcp_servers.json`
3. `sidecars/ted-engine/config/mcp_trust_policy.json`
4. `extensions/ted-sidecar/index.ts`
5. `ui/src/ui/views/ted.ts`

### Tasks

1. Add unified retrieval endpoint:
   - `POST /ops/retrieval/unified/query`
2. Add source adapters:
   - M365 native
   - external MCP read connectors
3. Add retrieval quality telemetry:
   - source coverage
   - retrieval latency
   - context relevance score
   - groundedness attribution rate
4. Add operator source-policy controls (entity-scoped).

### Acceptance

1. Single query returns merged, attributed results across enabled sources.
2. Permission and trust policies are enforced per source/tool.

---

## Wave F4 — V4 Trust Center UI

### Scope

1. Single surface for trust, policy, and readiness.

### Primary files

1. `ui/src/ui/views/ted.ts`
2. `ui/src/ui/controllers/ted.ts`
3. `sidecars/ted-engine/server.mjs`

### Tasks

1. Add Trust Center card with sections:
   - model routing map by job
   - active memory policy + retention
   - MCP trust map + tool actions
   - last smoke/eval/canary/drift outcomes
2. Add policy explainability panel for blocked actions.
3. Add readiness banner showing Graph live-validation state.

### Acceptance

1. Clint can answer "what policy made this happen?" in one screen.
2. Trust center displays latest health and governance state without curl.

---

## Wave F5 — V5 Closed-loop Healing Actions

### Scope

1. Controlled remediation suggestions and one-click operator actions.

### Primary files

1. `sidecars/ted-engine/modules/self_healing.mjs`
2. `sidecars/ted-engine/server.mjs`
3. `ui/src/ui/views/ted.ts`

### Tasks

1. Add healing playbook registry:
   - connector retry ladder
   - provider failover/cooldown tuning
   - queue decongestion actions
2. Add `POST /ops/self-healing/playbook/run` with approval checks.
3. Link playbook suggestions to measured friction and failure reasons.
4. Add rollback snapshots for healing config mutations.

### Acceptance

1. Top recurring failure classes have bounded remediation playbooks.
2. All playbook actions are auditable and reversible.

---

## Wave F6 — V6 Outcome Analytics (Friction-Centric)

### Scope

1. Deliver business-value analytics anchored to friction.

### Primary files

1. `sidecars/ted-engine/server.mjs`
2. `sidecars/ted-engine/config/eval_matrix.json`
3. `ui/src/ui/views/ted.ts`
4. `ui/src/ui/types.ts`

### Tasks

1. Add analytics endpoints:
   - `GET /ops/outcomes/dashboard`
   - `GET /ops/outcomes/friction-trends`
   - `GET /ops/outcomes/job/{id}`
2. Compute and persist:
   - job friction score
   - time-to-value
   - acceptance/rework trend
   - SLA adherence
   - model cost/value by job
3. Add friction-to-learning bridge:
   - high-friction episodes auto-create Builder Lane candidate signals.
4. Add "friction decomposition" UI panel per run.

### Acceptance

1. Clint can see where time is lost by job, not just where errors occurred.
2. Analytics outputs include recommended next optimization with evidence.

---

## 5. Program Dependencies

1. F0 is mandatory before all other waves.
2. F1 and F2 can run in parallel after F0.
3. F3 depends on MCP trust policy enforcement already in place.
4. F4 depends on data surfaces from F0-F3.
5. F5 depends on friction and failure telemetry from F0/F6.
6. F6 depends on F0 and should evolve continuously across all waves.

---

## 6. Debatable Tradeoffs (Council Position)

1. **Autonomy vs safety:** maintain approval gates; optimize friction by better routing/context, not by bypassing governance.
2. **Speed vs observability:** do not ship new automation without trace-level telemetry.
3. **Feature breadth vs operator clarity:** prioritize coherent UX over adding connectors without policy visibility.

---

## 7. Definition of Done (Program)

Program is complete when:

1. Clint can run core workflows visually with no JSON editing.
2. Friction is measured per run and drives concrete optimization actions.
3. Retrieval and memory are operationally integrated and explainable.
4. Trust center gives a single-pane view of policy/health/readiness.
5. Healing actions reduce repeated incidents with auditable remediation.

---

## 8. Risks and Mitigations

1. Risk: instrumentation overhead adds latency.  
   Mitigation: async append, bounded payloads, sampled debug fields.
2. Risk: friction score gaming.  
   Mitigation: split productive vs harmful friction and preserve governance events as non-removable signals.
3. Risk: visual composer introduces hidden complexity.  
   Mitigation: deterministic validation and simulation gates before publish.
4. Risk: retrieval sprawl increases noise.  
   Mitigation: per-source trust + relevance thresholds + scoped retrieval contracts.
