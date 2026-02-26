# SDD 86: Council Co-Work Best Practice Execution Plan

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Mandate:** Execute six best-practice capability additions for Ted so Clint can operate with multi-provider AI routing, governed flexibility, and full operator UI surfaces without coding.

---

## 1. Objective

Deliver six capability tracks end-to-end:

1. Policy-based model router (provider/model by job, entity, and governance constraints)
2. No-code workflow builder and deterministic runtime
3. Governed memory layer (preferences, provenance, TTL, export/forget)
4. MCP trust tiers and tool risk policy enforcement
5. Graph delta + notification-oriented sync strategy
6. Continuous evaluation matrix across providers/jobs/tools

Primary operator requirement:

- Clint must be able to select provider and model by job from Ted UI.
- Providers must include OpenAI, Anthropic, Azure OpenAI, and local OpenAI-compatible endpoints.

---

## 2. Current-State Constraints (Verified)

1. Per-job LLM override structure already exists in sidecar config and UI transport.
2. Runtime provider execution path currently only executes `openai_direct` and `azure_openai`.
3. Ted UI already has an LLM Provider card and external MCP management card.
4. Governance approval hard-gates are enforced on sensitive operations.
5. Entity separation currently supports `olumie` and `everest` only.

---

## 3. Program Principles

1. Non-destructive evolution only (additive config and routes, migration-safe defaults).
2. Governance-first: deny by default, explicit approval for high-risk actions.
3. Operator-first UX: all new capabilities manageable from Ted UI, no curl required.
4. Plane mapping required for each addition:
   - Plane 1: UI/Experience
   - Plane 2: Control/runtime policy
   - Plane 3: Contract/validation
   - Plane 4: Connector integration
   - Plane 5: State/ledger evidence

---

## 4. Wave Plan

### Wave 0: Foundation and Schema (Week 1)

Deliverables:

1. New config contracts:
   - `llm_routing_policy.json`
   - `workflow_registry.json`
   - `memory_policy.json`
   - `mcp_trust_policy.json`
   - `eval_matrix.json`
2. Route contract additions for all new ops endpoints.
3. Startup validation and migration-safe defaults.
4. Baseline UI sections scaffolded for each capability.

Exit criteria:

1. Sidecar starts clean with default configs.
2. All new routes return schema-valid payloads.
3. UI sections render and load/empty-state correctly.

### Wave 1: Multi-Provider Routing (Week 1-2)

Deliverables:

1. Provider adapters:
   - `openai_direct`
   - `azure_openai`
   - `anthropic_direct`
   - `openai_compatible` (local endpoints)
2. Routing policy precedence:
   - per-job override
   - per-intent policy
   - entity override
   - default provider/model
3. Provider health + fallback integration with policy constraints.
4. Ted UI route matrix editor:
   - job -> provider -> model
   - policy preview
   - provider self-test

Exit criteria:

1. Clint can set provider/model by job from UI and execute without restart.
2. Unsupported provider path removed for enabled/implemented providers.
3. Audit/event traces include provider selection reason.

### Wave 2: No-Code Workflow Builder (Week 2-3)

Deliverables:

1. Workflow registry APIs (create/update/list/delete).
2. Deterministic workflow runtime:
   - idempotency keys
   - retry policies
   - failure state capture
3. Step primitives:
   - sidecar route call
   - approval gate
   - condition branch
   - schedule trigger binding
4. Ted UI workflow designer:
   - flow list
   - step editor
   - dry-run executor
   - run history

Exit criteria:

1. Operator can create and run workflows from UI.
2. Runs are persisted in workflow-run ledger.
3. Governance approval steps enforce operator confirmation.

### Wave 3: Governed Memory Layer (Week 3)

Deliverables:

1. Memory object model:
   - key, value, scope, entity, confidence, source, timestamps, expiry
2. API operations:
   - list/search
   - upsert
   - pin/unpin
   - forget
   - export
3. Memory retrieval helpers for routing and drafting contexts.
4. Ted UI memory center:
   - filters
   - edit
   - forget/export controls

Exit criteria:

1. Operator can inspect and control learned preferences.
2. Memory read/write actions are auditable.
3. Forget/export functions work per entity.

### Wave 4: MCP Trust Tier Governance (Week 3-4)

Deliverables:

1. Trust tier model for external MCP servers:
   - `sandboxed`
   - `trusted_read`
   - `trusted_write`
2. Per-tool risk policy:
   - `read_only`
   - `approval_required`
   - `deny`
3. Policy-aware invocation gate for external MCP tools.
4. Ted UI trust governance surface:
   - set trust tier
   - set per-tool action policy
   - test with policy simulation

Exit criteria:

1. External MCP write-capable tools cannot run without required approval policy.
2. Denied tools are blocked with explainable reason codes.
3. Governance events captured for blocked/allowed calls.

### Wave 5: Graph Delta Sync Strategy (Week 4)

Deliverables:

1. Delta token ledger and sync cursor tracking.
2. Delta sync endpoints and schedule integration.
3. Notification/webhook readiness state model (registration metadata, health).
4. Ted UI sync strategy section:
   - delta status
   - cursor health
   - fallback mode visibility

Exit criteria:

1. Delta sync state is persisted and visible.
2. Fallback polling remains available and controllable.
3. Sync errors emit actionable reason codes.

### Wave 6: Continuous Evaluation Matrix (Week 4-5)

Deliverables:

1. Eval matrix config:
   - jobs/intents
   - providers/models
   - grader thresholds
2. API for matrix read/update/run.
3. Dashboard enhancements:
   - pass/fail by provider-job pair
   - latency/cost trend
   - regression alerts
4. Ted UI eval matrix manager + run trigger.

Exit criteria:

1. Operator can run comparative evals across providers per job.
2. Matrix output includes quality and safety metrics.
3. Failures are visible with remediation hints.

---

## 5. Dependency Order

1. Wave 0 is required for all later waves.
2. Wave 1 required before full Wave 6 comparisons.
3. Wave 2/3 can run in parallel once Wave 0 is complete.
4. Wave 4 depends on existing external MCP management and governance events.
5. Wave 5 should complete before production-grade automation scale-up.

---

## 6. Second-Pass Research Revalidation

External best-practice re-check confirms plan remains directionally correct and adds these refinements:

1. Strengthen MCP authorization posture and per-tool risk controls.
2. Prioritize Graph delta and notification-oriented sync for throttling resilience.
3. Include formal eval best-practice structure (quality + safety + cost + latency).
4. Maintain governance function and human override as first-class controls.

No structural change to the 6-wave plan was required; refinements were incorporated into wave acceptance criteria.

---

## 7. Success Definition

Program is complete when:

1. Clint can assign provider/model by job in UI with no code edits.
2. Clint can define workflows and memory behavior from UI.
3. MCP connections and tool policies are governed and testable from UI.
4. Sync strategy and eval outcomes are observable and operator-actionable.
5. All changes are traceable in ledgers/events with no governance regressions.
