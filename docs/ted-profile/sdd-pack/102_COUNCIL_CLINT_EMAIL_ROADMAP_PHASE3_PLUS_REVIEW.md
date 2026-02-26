# SDD 102 - Council Critical Review: Clint Email Ask 4 (Roadmap Beyond Phase 3)

Date: 2026-02-26  
Status: Council recommendation package (decision-ready)

## 1. Council understanding of Clint's ask

Clint asked for a clear long-term growth view of Ted beyond current operational phases, specifically:

1. Is there a rollout schedule beyond the initial Olumie/Everest operational modules, including personal-life modules?
2. How are new modules added over time (request + configure vs full build cycle)?
3. Can the architecture absorb new capability areas indefinitely, or is there a natural ceiling?

## 2. Platform capability assessment (code and SDD verified)

### 2.1 Current roadmap structure exists, but is fragmented

Evidence of roadmap constructs is present in multiple artifacts:

1. Day-1 to full-feature onboarding rollout by day windows and feature unlocks.
   - Evidence: `sidecars/ted-engine/config/onboarding_ramp.json`.
2. Phase 6-8 capability families with explicit module/program structure.
   - Evidence: `docs/ted-profile/sdd-pack/44_OPERATOR_COMMAND_CENTER_ARCHITECTURE.md`.
3. P0/P1/P2 execution ordering and wave sequencing.
   - Evidence: `docs/ted-profile/sdd-pack/76_COUNCIL_PROJECT_REVIEW_NEXT_STEPS.md`, `77_COUNCIL_CRITICAL_EVALUATION_TASK_BREAKDOWN.md`, `78_COUNCIL_EXECUTION_READINESS_PLAN.md`.
4. V1-V6 wave program and deltas (F0-F6 + D1-D8).
   - Evidence: `docs/ted-profile/sdd-pack/89_COUNCIL_V1_V6_INCORPORATION_PLAN_WITH_FRICTION_CORE.md`, `90_COUNCIL_LEADING_MINDS_CRITICAL_REVIEW_AND_PLAN_DELTAS.md`.

Council assessment: a rollout schedule exists, but there is no single consolidated "Phase 3+ master roadmap" with one owner, one dependency graph, and one release calendar.

### 2.2 Current ability to add capabilities without code

There are real "configure/operate" paths available today:

1. Workflow creation/upsert/lint/run via sidecar APIs and Ted UI surface.
   - Evidence: `sidecars/ted-engine/server.mjs` (`/ops/workflows*`), `ui/src/ui/views/ted.ts`, `extensions/ted-sidecar/index.ts`.
2. External MCP server add/edit/test/admission/revalidation from UI/API.
   - Evidence: `sidecars/ted-engine/server.mjs` (`/ops/mcp/external/servers*`), `ui/src/ui/views/ted.ts`, `extensions/ted-sidecar/index.ts`.
3. Memory preference policy operations through UI/API (list/upsert/forget/export).
   - Evidence: `sidecars/ted-engine/server.mjs` (`/ops/memory/preferences*`), `ui/src/ui/views/ted.ts`, `extensions/ted-sidecar/index.ts`.
4. Per-intent provider routing policy configuration.
   - Evidence: `sidecars/ted-engine/config/llm_routing_policy.json`.

Council assessment: a meaningful subset of growth is already request-and-configure, not full-code-change.

### 2.3 Capabilities that still require a build cycle

Material module additions still require engineering implementation:

1. Deal workflow engine, Everest monitoring, compliance checks, and several integrations are explicitly tracked as "not yet placed/connected".
   - Evidence: `docs/ted-profile/sdd-pack/40_INTAKE_CONFIG_TRACEABILITY.md`.
2. New domain modules and connector deep integrations (for example Monday/DocuSign/PACER/CMS) require sidecar routes, contracts, tests, and governance mappings.
3. Large-scale maintainability work still depends on continued monolith decomposition discipline.
   - Evidence: `docs/ted-profile/sdd-pack/72_COUNCIL_IMPROVEMENT_PLAN_6LAYER_EVOLUTION.md`, `76_COUNCIL_PROJECT_REVIEW_NEXT_STEPS.md`.

Council assessment: Clint can request many new behaviors now, but some categories remain engineering-led until module templates and connector admissions are further productized.

### 2.4 Where personal modules currently sit

Current policy position is explicit:

1. Personal context is in scope as a context domain.
2. Personal email/calendar direct access is explicitly restricted.
3. Personal calendar management is modeled through work-calendar mediated patterns and governance gates.
4. Investment operations are analysis/alert only; no autonomous execution.

Evidence: `docs/ted-profile/client_intake_COMPLETED.md` (entity boundaries, autonomy table, hard restrictions).

Council assessment: personal-life modules are partially represented (calendar coordination, finance monitoring), but broad personal-module rollout beyond those guardrails is not yet a consolidated program plan.

### 2.5 Scaling posture and practical ceiling today

Designed-for-growth signals:

1. 5-plane architecture with explicit control/state/contract separation.
   - Evidence: `docs/architecture/Future-State-Framing.md`, `docs/council/Planes-Artifacts-Owners.md`, `docs/ted-profile/sdd-pack/42_TED_SYSTEM_BLUEPRINT.md`.
2. Event-sourced ledgers, workflow registry, and plugin/channel ecosystem support expansion.
3. Capability and feature maturity tracking exists for progressive evolution.
   - Evidence: `sidecars/ted-engine/config/capability_maturity.json`, `feature_maturity.json`, `ted_technology_radar.json`.

Current limiting factors:

1. Core sidecar remains large and still in decomposition progression.
2. Multi-user maturity is explicitly low (`multi_user` level 0 -> target 1).
3. Some foundation work is still in trial/proposed state (schema evolution, broader evaluation pipeline).
4. Core real-world Graph validation is still an external readiness dependency.

Council assessment: the architecture is intended to absorb more capability areas, but there is a practical near-term ceiling until decomposition, live integration evidence, and operating model hardening complete.

## 3. External research digest (trusted sources)

### 3.1 How leading platforms handle roadmap growth and module expansion

1. Microsoft Copilot Studio recommends narrow-scoped autonomous domains, staged rollout, explicit guardrails, and analytics-driven iteration.
2. Microsoft Copilot Studio provides no-code creation plus governance and analytics surfaces, including autonomous-session health tracking.
3. OpenAI Agent Builder/AgentKit and eval stack emphasize versioned workflows, node contracts, trace-level evaluation, and continuous improvement loops.
4. Anthropic guidance recommends simple composable workflow patterns first, increasing agentic complexity only when needed.
5. Atlassian Rovo positioning emphasizes out-of-box agents + custom agents (Rovo Studio) + expanding third-party/MCP integrations.
6. Asana AI Studio and workflow automation positioning emphasize no-code builder patterns, templates, connectors, and process standardization at scale.
7. Slack workflow surfaces emphasize AI-assisted no-code workflow creation with connectors and conditional logic.
8. Notion integration model distinguishes internal/public integrations and now includes Notion MCP for agentic workflows.
9. monday app framework emphasizes extensible building blocks (views, integrations, automations, templates) for incremental capability growth.
10. AWS SaaS Lens guidance highlights no one-size architecture, decomposition by tenant load/isolation profile, and single-pane operational control.

Inference from sources: leading systems use a dual-track growth model:

1. **Configurable extension track** (no-code/low-code templates, connectors, policies), and
2. **Engineering module track** (new domain services with stronger governance, eval, and operations gates).

## 4. Council answers to Clint's specific questions

### Q1. Is there a rollout schedule beyond initial Olumie/Everest modules?

Answer: **Partially yes, but fragmented.**

1. Multiple schedules exist (onboarding phases, P0/P1/P2 waves, V1-V6 waves).
2. There is not yet one unified Phase 3+ roadmap artifact combining:
   - module catalog,
   - owner,
   - dependencies,
   - target release windows,
   - confidence gates.

### Q2. Can Clint request and configure modules, or does each require a build cycle?

Answer: **Both paths exist.**

1. **Configure-first path (available now):** workflow registry, MCP server connections, memory/routing policy tuning.
2. **Build-cycle path (still required):** new domain engines, deep connector modules, and novel high-risk behaviors.

### Q3. Is there a natural ceiling?

Answer: **Architecturally high ceiling, operationally staged ceiling.**

1. The design can keep absorbing capability areas (planes + ledgers + policy choke-point).
2. Near-term ceiling is set by current operational realities: monolith decomposition progress, live connector validation, and single-operator maturity model.

## 5. Requirement decision

Council decision: treat "Phase 3+ roadmap and module growth model" as a formal requirement.

### Required outcome

Create a single authoritative **Roadmap and Module Lifecycle Contract** for Phase 3+ that answers Clint's three questions with operational precision.

## 6. Recommended implementation plan

### Wave R0 - Consolidated roadmap artifact (immediate)

1. Create one master roadmap document for Phase 3+ with release windows, owners, dependency graph, and readiness gates.
2. Merge existing scheduling artifacts (onboarding, P0/P1/P2, V1-V6) into a unified matrix.
3. Tag each roadmap item as `configure_only` or `build_cycle`.
4. Add friction and outcome baselines per roadmap item (`time_to_first_value`, `operator_override_rate`, `retry_rate`, `time_to_recovery`).

Acceptance:

1. One document can answer "what ships when, by whom, and gated by what" in one pass.
2. Every module line item has explicit success and friction thresholds before execution begins.

### Wave R1 - Module lifecycle framework

1. Define module classes:
   - `policy module`,
   - `workflow module`,
   - `connector module`,
   - `domain engine module`.
2. Define request intake template from Clint:
   - JTBD,
   - entities affected,
   - permissions,
   - data sensitivity,
   - success metrics.
3. Define admission gates:
   - plane mapping,
   - ledger read/write map,
   - threat review,
   - eval/replay requirements,
   - rollout/rollback plan.

Acceptance:

1. Every new module request follows one repeatable intake and admission path.

### Wave R2 - Personal-life module program (guarded)

1. Formalize a personal-module subset roadmap:
   - work-calendar mediated personal planning,
   - investment monitoring and alerts (no trade execution),
   - personal reminder/workflow surfaces that preserve entity separation.
2. Keep existing hard boundaries unchanged unless explicitly re-approved by governance.

Acceptance:

1. Personal-module roadmap exists with explicit allowed/disallowed capability list and policy rationale.

### Wave R3 - Scale hardening and ceiling lift

1. Continue decomposition and module seam hardening.
2. Expand replay/eval gates for new module families.
3. Add multi-operator readiness plan (currently low maturity) before broadening collaboration scope.
4. Promote friction telemetry from reporting-only to release-gating evidence for module promotion.

Acceptance:

1. New module velocity increases without governance erosion or reliability regressions.

## 7. Architecture impact by plane (required mapping)

1. Control plane
   - Add `roadmap_master.json` and `module_lifecycle_policy.json` artifacts.
2. Contract plane
   - Add module admission and promotion contract (gates + evidence requirements).
3. Connector plane
   - Standardize connector admission/revalidation lifecycle in roadmap governance.
4. State plane
   - Add roadmap/module telemetry events and module maturity rollups.
5. Experience plane
   - Add roadmap dashboard card and module request intake UI surface.

## 8. Council recommendation

1. Publish SDD 102 as the official response package for Clint item #4.
2. Execute Wave R0 first so Clint gets one coherent roadmap view immediately.
3. Adopt module lifecycle gates before taking on broad personal-life expansion.
4. Use dual-track expansion by default:
   - configure-first for low-risk/high-speed value,
   - build-cycle for high-impact new domain modules.

## References

### Internal evidence

1. `docs/architecture/Future-State-Framing.md`
2. `docs/council/Planes-Artifacts-Owners.md`
3. `docs/ted-profile/sdd-pack/42_TED_SYSTEM_BLUEPRINT.md`
4. `docs/ted-profile/sdd-pack/44_OPERATOR_COMMAND_CENTER_ARCHITECTURE.md`
5. `docs/ted-profile/sdd-pack/76_COUNCIL_PROJECT_REVIEW_NEXT_STEPS.md`
6. `docs/ted-profile/sdd-pack/77_COUNCIL_CRITICAL_EVALUATION_TASK_BREAKDOWN.md`
7. `docs/ted-profile/sdd-pack/78_COUNCIL_EXECUTION_READINESS_PLAN.md`
8. `docs/ted-profile/sdd-pack/89_COUNCIL_V1_V6_INCORPORATION_PLAN_WITH_FRICTION_CORE.md`
9. `docs/ted-profile/sdd-pack/90_COUNCIL_LEADING_MINDS_CRITICAL_REVIEW_AND_PLAN_DELTAS.md`
10. `docs/ted-profile/sdd-pack/40_INTAKE_CONFIG_TRACEABILITY.md`
11. `docs/ted-profile/client_intake_COMPLETED.md`
12. `sidecars/ted-engine/config/onboarding_ramp.json`
13. `sidecars/ted-engine/config/workflow_registry.json`
14. `sidecars/ted-engine/config/external_mcp_servers.json`
15. `sidecars/ted-engine/config/llm_routing_policy.json`
16. `sidecars/ted-engine/config/capability_maturity.json`
17. `sidecars/ted-engine/config/feature_maturity.json`
18. `sidecars/ted-engine/config/ted_technology_radar.json`
19. `sidecars/ted-engine/server.mjs`
20. `extensions/ted-sidecar/index.ts`
21. `ui/src/ui/views/ted.ts`

### External sources

1. Microsoft Copilot Studio - Design autonomous agent capabilities: https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/autonomous-agents
2. Microsoft Copilot Studio - Analytics overview: https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-overview
3. Microsoft Copilot Studio - Quickstart create and deploy an agent: https://learn.microsoft.com/en-us/microsoft-copilot-studio/nlu-gpt-quickstart
4. Microsoft Copilot Studio - Extend Microsoft 365 Copilot with agents: https://learn.microsoft.com/en-us/microsoft-copilot-studio/microsoft-copilot-extend-copilot-extensions
5. OpenAI - Agent Builder: https://platform.openai.com/docs/guides/agent-builder
6. OpenAI - Agents best practices / AgentKit: https://platform.openai.com/docs/guides/agents/best-practices
7. OpenAI - Agent evals: https://platform.openai.com/docs/guides/agent-evals
8. OpenAI - Trace grading: https://platform.openai.com/docs/guides/trace-grading
9. OpenAI - Safety in building agents: https://platform.openai.com/docs/guides/agent-builder-safety
10. Anthropic - Building effective agents: https://www.anthropic.com/research/building-effective-agents
11. Atlassian - Rovo overview: https://www.atlassian.com/rovo
12. Atlassian - Rovo guide (what is Rovo): https://support.atlassian.com/rovo/docs/what-is-rovo/
13. Atlassian Developer - Forge platform: https://developer.atlassian.com/cloud/jira/platform/forge/
14. Atlassian announcement - Rovo MCP gallery: https://www.atlassian.com/blog/announcements/rovo-mcp-gallery
15. Asana - Workflow automation: https://asana.com/features/workflow-automation
16. Asana - AI Studio: https://asana.com/product/ai/ai-studio
17. Slack - Workflow automation: https://slack.com/features/workflow-automation
18. Slack Help - Use AI to build workflows: https://slack.com/help/articles/32843655109395-Use-AI-to-build-Slack-workflows
19. Notion API docs: https://developers.notion.com/docs
20. Notion - Build your first integration: https://developers.notion.com/docs/create-a-notion-integration
21. monday developer docs - What is a monday app?: https://developer.monday.com/apps/docs
22. AWS SaaS Lens overview: https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/saas-lens.html
23. AWS SaaS Lens general design principles: https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/general-design-principles.html
24. Model Context Protocol authorization spec: https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization
25. Model Context Protocol security best practices: https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices
