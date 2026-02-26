# SDD 87: Council Co-Work Execution Tasks

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent:** SDD 86

---

## 1. Task Board Summary

Total tasks: 54  
Execution mode: dependency-ordered waves with scoped commits.

---

## 2. Wave 0 Tasks (Foundation)

### W0-001 Config contracts and defaults

1. Add new config files for routing, workflows, memory, MCP trust, eval matrix.
2. Add startup-safe defaults and schema comments.
3. Add validation checks in sidecar startup integrity.

Acceptance:

1. Sidecar boot passes with default config set.
2. Missing config files are auto-created or safely handled.

### W0-002 API contract map

1. Add route contracts for all new `/ops/*` endpoints.
2. Ensure status codes and required fields match implementation.

Acceptance:

1. Contract checks pass for new routes.

### W0-003 UI scaffolding

1. Add Ted UI card placeholders for all 6 additions.
2. Add controller state placeholders and loading/error state support.

Acceptance:

1. All cards render and show empty state without runtime errors.

---

## 3. Wave 1 Tasks (Provider Routing)

### W1-001 Provider adapter implementation

1. Implement `anthropic_direct` sidecar call path.
2. Implement `openai_compatible` call path for local endpoints.
3. Keep existing OpenAI and Azure adapters.

Acceptance:

1. Route call supports all enabled providers and returns model/usage metadata.

### W1-002 Routing policy engine

1. Add routing policy resolver from new config.
2. Enforce precedence: per-job, per-intent, entity, default.
3. Enforce governance constraints (entity HIPAA rule, disabled providers).

Acceptance:

1. Selection reason appears in audit events.
2. Policy resolution is deterministic and testable.

### W1-003 Provider health and fallback policy integration

1. Reuse circuit breaker health state in final provider pick.
2. Enforce allowed fallback list from policy config.

Acceptance:

1. Primary provider failure triggers policy-valid fallback.

### W1-004 Routing APIs

1. Add `GET/POST /ops/llm-routing-policy`.
2. Add `POST /ops/llm-provider/test` for provider readiness checks.

Acceptance:

1. UI can load/save policy and run test action successfully.

### W1-005 Ted UI matrix

1. Add provider/model matrix table for per-job settings.
2. Add provider test UI with response panel.
3. Add validation and save feedback.

Acceptance:

1. Operator can map jobs to provider/model from UI.

---

## 4. Wave 2 Tasks (No-Code Workflows)

### W2-001 Workflow registry backend

1. Add workflow registry CRUD routes.
2. Persist workflow definitions in config.

Acceptance:

1. CRUD operations work and are auditable.

### W2-002 Workflow runtime and ledger

1. Add deterministic workflow executor with run IDs.
2. Add retries and idempotency semantics.
3. Persist run results and step transitions.

Acceptance:

1. Failed run retains step-level diagnostics.

### W2-003 Workflow UI

1. Add workflow list and editor card.
2. Add run-now and dry-run controls.
3. Add run history inspector.

Acceptance:

1. Operator can create and execute workflow end-to-end from UI.

---

## 5. Wave 3 Tasks (Governed Memory)

### W3-001 Memory store and APIs

1. Add memory ledger and list/upsert/forget/export endpoints.
2. Include provenance fields and expiry metadata.

Acceptance:

1. Memory records are queryable and editable by scope/entity.

### W3-002 Memory runtime usage

1. Add helper to inject relevant preferences into supported intents.
2. Add no-policy-override protection markers.

Acceptance:

1. Preferences affect behavior only within governance boundaries.

### W3-003 Memory UI

1. Add memory center card with filter/edit/forget/export.
2. Add confidence and provenance display.

Acceptance:

1. Operator can govern memory lifecycle from UI.

---

## 6. Wave 4 Tasks (MCP Trust Tiers)

### W4-001 Trust tier model

1. Extend external MCP server config with `trust_tier`.
2. Add normalized defaults for existing servers.

Acceptance:

1. Existing servers migrate safely with default trust tier.

### W4-002 Tool action policy

1. Add per-tool action map (`read_only`, `approval_required`, `deny`).
2. Enforce policy during external tool invocation.

Acceptance:

1. Denied tools always blocked with reason code.
2. Approval-required tools enforce operator confirmation path.

### W4-003 MCP governance UI

1. Add trust tier selector in External MCP card.
2. Add tool policy editor and simulator.

Acceptance:

1. Operator can tune server/tool policy from UI and validate behavior.

---

## 7. Wave 5 Tasks (Graph Delta Strategy)

### W5-001 Delta cursor persistence

1. Add delta cursor ledger per profile/workload.
2. Add cursor load/store utilities with integrity checks.

Acceptance:

1. Cursor state survives restart.

### W5-002 Delta sync route and scheduler binding

1. Add delta sync route(s) and schedule hooks.
2. Add fallback to polling mode on failure.

Acceptance:

1. Delta mode can be run manually and by scheduler.

### W5-003 Sync strategy UI

1. Add delta status, last cursor, and fallback mode card.
2. Add manual delta run button.

Acceptance:

1. Operator sees active sync strategy and can force run.

---

## 8. Wave 6 Tasks (Eval Matrix)

### W6-001 Eval matrix config + APIs

1. Add matrix config read/update routes.
2. Add matrix run route with result summary.

Acceptance:

1. Matrix can express provider/job/model combinations.

### W6-002 Comparative evaluator

1. Extend evaluation pipeline to run matrix slices.
2. Aggregate quality/safety/latency/cost summary per slice.

Acceptance:

1. Result is returned and persisted with trace IDs.

### W6-003 Eval matrix UI

1. Add matrix editor and run controls.
2. Add comparison table and failure highlights.

Acceptance:

1. Operator can run and inspect comparative provider results from UI.

---

## 9. Commit Strategy

1. Commit A: W0 foundations + SDD docs
2. Commit B: W1 provider routing + UI matrix
3. Commit C: W2 workflow registry/runtime + UI
4. Commit D: W3 memory APIs + UI
5. Commit E: W4 MCP trust-tier policy + UI
6. Commit F: W5 delta sync scaffolding + UI
7. Commit G: W6 eval matrix + UI/dashboard
8. Commit H: route contracts + QA proof updates

---

## 10. QA Gates

1. `pnpm build`
2. `pnpm test`
3. targeted proof scripts for new ops routes
4. manual Ted UI walkthrough on mobile-width and desktop-width

---

## 11. Risk Register

1. Provider API schema drift risk  
   Mitigation: provider-specific contract guards + test endpoint.

2. Workflow complexity overgrowth  
   Mitigation: start with deterministic primitives only.

3. MCP trust misconfiguration risk  
   Mitigation: deny-by-default policy and simulation preview.

4. Graph delta operational risk  
   Mitigation: polling fallback preserved.

5. UI state complexity risk  
   Mitigation: controller-scoped loading/error states and small reusable card patterns.
