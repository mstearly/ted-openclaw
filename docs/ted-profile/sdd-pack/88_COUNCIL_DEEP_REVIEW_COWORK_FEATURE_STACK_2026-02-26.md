# SDD 88: Council Deep Review — Co-Work Feature Stack vs Leading Platforms

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Mandate:** Deep reassessment of TED feature completeness, operator flow/UI, end-to-end capability for Clint's target jobs, and competitive positioning against leading co-work platforms using trusted primary sources.

---

## 1. Council Questions

1. Do we have the tools Clint needs for the jobs he wants to manage?
2. Will TED auto-learn, improve, and self-heal in production?
3. How does TED compare with leading co-work products?
4. What high-value capability is still left on the table?

---

## 2. Internal Evidence Baseline (Code Verified)

Primary internal evidence reviewed:

1. `sidecars/ted-engine/server.mjs`
2. `sidecars/ted-engine/modules/self_healing.mjs`
3. `extensions/ted-sidecar/index.ts`
4. `ui/src/ui/views/ted.ts`
5. `sidecars/ted-engine/config/*.json` (including `llm_routing_policy.json`, `workflow_registry.json`, `memory_policy.json`, `mcp_trust_policy.json`, `eval_matrix.json`, `graph_sync_strategy.json`, `graph.profiles.json`)
6. SDDs 76/77/84/85/86/87

Observed implementation anchors:

1. Multi-provider LLM routing + fallback + provider health circuit breaker are implemented (`selectLlmProviderWithFallback`, `invokeLlmProvider`, `runLlmProviderSmokeTest`).
2. Workflow registry and deterministic runtime exist (`/ops/workflows*`), with route-call execution, retries, run ledger, dry-run/live modes.
3. Memory policy and CRUD/export APIs exist (`/ops/memory/preferences*`) with audit/event logging.
4. External MCP connections + trust tiers + tool policy gates exist (`/ops/mcp/external/*`, `/ops/mcp/trust-policy`, `/ops/mcp/tool-policy`) with approval-required enforcement.
5. Graph delta cursor/status/run exists (`/ops/graph/delta/*`) with persisted cursor ledger.
6. Evaluation matrix config/run exists (`/ops/evaluation/matrix*`) with persisted run history.
7. Self-healing stack exists: provider health, circuit breaker behavior, config drift reconcile, canary and drift routes, engagement/noise/autonomy analytics.
8. TED UI includes a dedicated `Execution Waves Control Plane` surface with controls for all six wave capabilities.
9. Graph production validation remains blocked: `tenant_id` and `client_id` are still empty in `graph.profiles.json`.

---

## 3. Clint Job Readiness (Operator Reality)

### 3.1 What Clint can run today without coding

1. Inbox + drafts + commitment extraction + draft queue approvals.
2. Meetings prep/debrief + commitment/GTD ledgers.
3. Planner/To Do/SharePoint operations (governed) once Graph auth is configured.
4. Provider-by-job routing updates from TED UI.
5. External MCP server add/edit/test and trust-tier management from TED UI.
6. Workflow creation/execution from TED UI (currently JSON-authored).
7. Memory preference control (upsert/forget/export) from TED UI.
8. Graph delta run/status and eval matrix run from TED UI.

### 3.2 Walls still visible to operator

1. **Live Graph wall (critical):** real tenant auth still not configured; end-to-end production proof is still blocked.
2. **Workflow UX wall:** workflow authoring is available but still JSON-centric rather than visual/no-code composition.
3. **Memory runtime wall:** memory records are governable, but automatic retrieval/injection into all relevant LLM paths is still partial.
4. **Autonomous execution wall:** approvals are deliberately strict; this is a safety strength, but it limits "hands-off" operation.

---

## 4. Auto-Learning, Improvement, Dynamic Healing

### 4.1 Auto-learning and improvement status

**Implemented and active:**

1. Correction signal capture across triage/draft/commitment paths.
2. Style-delta and correction ledgers feeding Builder Lane pattern detection.
3. Proposal generation from observed patterns and failure data.
4. Proposal review/apply/revert lifecycle with constitution-bound constraints.

**Not fully autonomous (by design):**

1. Builder Lane does not silently rewrite protected governance configs.
2. High-impact changes remain human-reviewed.

**Gap to close:**

1. Memory layer is controllable, but automatic memory-to-routing/prompt enrichment is not yet broadly pervasive across all intent pipelines.

### 4.2 Dynamic healing status

**Implemented:**

1. LLM provider circuit breaker + fallback routing.
2. Config drift monitoring/reconciliation patterns.
3. Canary checks + drift detection + QA dashboard endpoints.
4. Engagement/noise/autonomy diagnostics in self-healing module.

**Still maturing:**

1. Most healing actions are detection/fallback/reporting oriented; fewer closed-loop self-remediation actions for external system incidents.
2. Live production resilience confidence is constrained until Graph live-smoke evidence is completed.

---

## 5. Competitive Benchmark (Trusted Primary Sources)

### 5.1 Where TED is stronger

1. Governance-first design (approval gates, policy boundaries, event/audit depth) is stricter than typical co-work defaults.
2. Explicit trust/risk controls for external MCP tool execution (trust tier + per-tool action) are ahead of many mainstream workflow surfaces.
3. Multi-provider routing with policy + fallback + health is architecturally strong for operator-controlled AI usage.

### 5.2 Where leaders are currently ahead

1. **No-code automation ergonomics:** Asana AI Studio, monday AI blocks, ClickUp automation/agents emphasize visual authoring and lower operator friction.
2. **Cross-tool retrieval breadth:** Notion enterprise search, Slack enterprise search/AI, Atlassian Rovo graph/search patterns show broader native multi-system retrieval UX.
3. **Turnkey operator experience:** leading products reduce JSON/policy editing burden with stronger guided builders, templates, and opinionated flows.
4. **Enterprise transparency surfaces:** trust/admin centers are productized and operator-friendly, not only configuration endpoints.

### 5.3 Competitive stack rating (Council)

1. Governance and safety: **Exceeds**
2. Provider flexibility: **Strong / above average**
3. Workflow UX: **Partial**
4. Memory intelligence: **Partial**
5. Cross-app retrieval and connective tissue: **Partial**
6. Production readiness confidence: **Conditional** (blocked on live Graph validation)

---

## 6. Value Left on the Table (Highest ROI)

### V1. Visual Workflow Composer (highest)

Replace JSON-first workflow authoring with a true no-code graph editor:

1. drag/drop steps
2. branch conditions
3. approval nodes
4. retries/timeouts
5. run simulation with policy explanation

### V2. Memory-to-Execution Bridge (highest)

Promote memory from managed storage to operational intelligence:

1. deterministic memory retrieval per intent
2. memory conflict/recency weighting
3. explicit memory provenance cards in generated outputs

### V3. Unified Retrieval Layer (high)

Elevate beyond M365-centric context with governed multi-system retrieval:

1. Slack/Jira/Google Drive/Notion read connectors (or MCP equivalents)
2. one query surface for cross-source context
3. policy-filtered retrieval by entity and risk

### V4. Trust Center UI (high)

Single operator page that shows:

1. active model routes per job
2. memory policy and retention status
3. external MCP trust map
4. live proof run/smoke status and last failure reasons

### V5. Closed-loop Healing Actions (medium-high)

Add controlled auto-remediation playbooks:

1. automatic failover and cooldown per connector class
2. policy-approved retry escalation ladders
3. self-healing recommendations with one-click operator consent

### V6. Outcome Analytics (medium)

Measure business value, not only technical health:

1. time saved by workflow/agent
2. commitment SLA adherence
3. draft acceptance trend by context
4. model-cost/value per job

---

## 7. Council Verdict (2026-02-26)

1. **Clint can run real operational work without coding today**, especially once Graph credentials are configured.
2. **TED does auto-learn and improve**, but in a governed human-reviewed loop, not unconstrained autonomous mutation.
3. **TED does dynamic healing**, with strong fallback/detection posture; fully closed-loop production healing is still an expansion area.
4. Against leaders, TED is **strong on governance and controllability**, but still leaves value on the table in **workflow UX, memory operationalization, and cross-system retrieval ergonomics**.

---

## 8. Council Next-Step Recommendation

Priority sequence:

1. Close live Graph validation blocker (P0-2/P0-4 evidence).
2. Build Visual Workflow Composer (V1).
3. Implement Memory-to-Execution Bridge (V2).
4. Deliver Unified Retrieval Layer via governed connectors/MCP (V3).
5. Add Trust Center UI and healing playbooks (V4/V5).

---

## 9. Trusted Source Set (External)

1. Microsoft 365 Copilot overview: https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-page
2. Microsoft 365 Copilot privacy/security: https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-privacy
3. Google Workspace with Gemini: https://workspace.google.com/products/gemini/
4. Google Gemini data governance/admin controls: https://support.google.com/a/answer/15719511
5. Google Workspace Flows (user/admin surface): https://support.google.com/a/users/answer/16430812
6. Asana AI overview: https://asana.com/product/ai
7. Asana AI Studio: https://asana.com/product/ai/asana-ai-studio
8. Asana AI Teammates: https://asana.com/product/ai/teammates
9. Asana Trust Center: https://asana.com/trust
10. ClickUp AI overview: https://clickup.com/features/ai
11. ClickUp Trust: https://trust.clickup.com/
12. monday.com AI overview: https://monday.com/ai
13. monday.com AI FAQs/governance: https://support.monday.com/hc/en-us/articles/18445748790290-Monday-AI-FAQs
14. Atlassian Rovo features: https://www.atlassian.com/software/rovo/features
15. Atlassian Intelligence trust: https://www.atlassian.com/trust/atlassian-intelligence
16. Notion AI overview: https://www.notion.com/product/ai
17. Notion Enterprise Search (connectors): https://www.notion.com/help/guides/enterprise-search
18. Notion AI security practices: https://www.notion.com/help/notion-ai-security-practices
19. Slack AI feature overview: https://slack.com/features/ai
20. Slack Workflow automation overview: https://slack.com/features/workflow-automation
21. Slack enterprise search in AI: https://slack.com/help/articles/35379415518611-Search-in-Slack-AI
22. NIST AI RMF 1.0: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
23. OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
24. Model Context Protocol Authorization Spec: https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization
25. Model Context Protocol Security Best Practices: https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices
