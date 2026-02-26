# SDD 90: Council Critical Review With Leading AI Guidance and Plan Deltas

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent:** SDD 89  
**Mandate:** Critically review the V1-V6 incorporation plan against primary guidance from leading AI organizations, identify what is missing, and define required plan changes that materially improve Clint's daily outcomes.

---

## 1. Review Questions

1. What in the current plan is still missing?
2. What must change before execution is considered robust?
3. Will the plan deliver the features and functionality that reduce Clint's day-to-day friction?
4. Are friction signals strong enough to produce measurable learning and improvement loops?

---

## 2. Inputs and Method

Internal documents reviewed:

1. SDD 76
2. SDD 77
3. SDD 88
4. SDD 89

External method:

1. Source only primary documentation from platform vendors/standards bodies.
2. Compare SDD 89 wave-by-wave against external guidance.
3. Produce a strict delta list (add/change/sequence), not broad commentary.

---

## 3. Leading-Minds Debate (Primary-Source Anchors)

## 3.1 OpenAI Lens

Source signal:

1. OpenAI guidance emphasizes trajectory-aware evaluation (not just final output) and repeatable eval loops integrated into development/runtime.
2. OpenAI safety guidance emphasizes guardrails, least-privilege tool access, and rigorous treatment of untrusted tool output.

Council conclusion:

1. SDD 89 is directionally correct but under-specifies trajectory-level graders and adversarial safety tests.

Council inference from source:

1. Friction telemetry must include per-step trajectory data so failures can be graded and corrected at the decision-path level.

## 3.2 Anthropic Lens

Source signal:

1. Anthropic guidance recommends starting with simple workflows and using agentic loops only where needed.
2. Human checkpoints remain important when uncertainty or risk rises.

Council conclusion:

1. SDD 89 aligns with workflow-first principles, but needs explicit "workflow-first gate" criteria before additional autonomy is enabled.

Council inference from source:

1. A friction drop is not sufficient by itself; autonomy can only expand when both friction and risk signals improve.

## 3.3 Microsoft Lens

Source signal:

1. Microsoft guidance for autonomous agents and Copilot Studio highlights explicit goals/triggers/knowledge/actions plus robust monitoring.
2. Monitoring guidance emphasizes transcript replay, activity maps, and test-set execution to detect regressions.

Council conclusion:

1. SDD 89 needs a formal test-set replay lane and runbook-level operational monitors as a non-optional gate.

Council inference from source:

1. Outcome analytics must include replayable scenario evidence, not only aggregate dashboards.

## 3.4 Google Lens

Source signal:

1. Google agent evaluation guidance explicitly distinguishes final response quality from trajectory quality.
2. Google observability guidance emphasizes traces, metrics, logs, and GenAI semantic events for debugging agent behavior.

Council conclusion:

1. SDD 89 needs a stronger observability contract for cross-surface correlation (UI action -> sidecar step -> tool call -> outcome).

Council inference from source:

1. Friction must be correlated to trace spans and semantic events to be actionable for learning loops.

## 3.5 NIST and MCP Lens

Source signal:

1. NIST AI RMF core functions require continuous governance, mapping, measurement, and management.
2. MCP authorization/security guidance emphasizes explicit authorization, scoped trust, and secure handling of tool interactions.

Council conclusion:

1. SDD 89 governance direction is strong, but connector admission and ongoing security checks need a stricter lifecycle.

Council inference from source:

1. Every MCP connection should have admission controls, trust attestation, and periodic revalidation tied to friction/risk outcomes.

---

## 4. Gaps Found In SDD 89

1. No explicit trajectory-grade schema (step quality, policy adherence, tool-grounding confidence).
2. No golden task suite with replay against fixed expected outcomes.
3. Friction metrics exist, but there are no release SLO gates for acceptable friction levels.
4. No explicit adversarial/prompt-injection test lane for external MCP-connected retrieval.
5. No explicit "user-entered post-install secret onboarding" runbook tied to Trust Center readiness.
6. No clearly defined ROI thresholds that determine whether Clint's life is measurably improved.
7. No explicit blast-radius cap policy for auto-remediation playbooks.

---

## 5. Required Plan Deltas (Adopt Now)

## D1. Add Wave F0a: Telemetry Contract and Trace Correlation

1. Define canonical trace ID propagation across UI, extension, and sidecar.
2. Extend friction events with `trace_id`, `step_id`, `decision_reason`, `policy_reason`, `recovery_action`.
3. Require each job run to produce a trajectory timeline artifact.

Acceptance:

1. One-click drilldown from dashboard metric to run timeline and root-cause step.

## D2. Add Wave F0b: Evaluation Harness and Replay

1. Create a golden task corpus for Clint's top jobs (email draft, morning brief, meeting prep, commitments).
2. Add deterministic replay runner with expected-output and expected-trajectory checks.
3. Add adversarial scenario pack (prompt injection, tool output contamination, connector timeout cascades).

Acceptance:

1. New wave merges require passing replay set and safety scenarios.

## D3. Update F1 (Visual Workflow Composer) With Risk Guardrails

1. Add mandatory risk linting before publish.
2. Add policy explainability preview for each node.
3. Add "human checkpoint required" auto-insertion for high-risk actions.

Acceptance:

1. No risky workflow can be published without explicit checkpoints and policy rationale.

## D4. Update F2 (Memory Bridge) With Confidence and Harm Controls

1. Add confidence threshold + decay rules for memory use in runtime prompts.
2. Add memory conflict resolver outcomes to audit events.
3. Add a memory harm-review queue when contradictory or low-confidence memory influences output.

Acceptance:

1. Operator can inspect and override memory-influence decisions on any run.

## D5. Update F3 (Unified Retrieval) With Connector Admission Lifecycle

1. Add connector admission checklist: auth scope, trust tier, least privilege, test evidence.
2. Add periodic connector revalidation job.
3. Add retrieval contamination checks and source-quality scoring.

Acceptance:

1. MCP connectors without current attestation cannot run in production mode.

## D6. Update F5 (Closed-Loop Healing) With Blast-Radius Boundaries

1. Add per-playbook blast-radius policy (max entities, max runs, max config drift).
2. Require shadow/simulated run before live auto-remediation for new playbooks.
3. Add automatic rollback trigger when friction worsens beyond threshold after remediation.

Acceptance:

1. No playbook can perform unbounded changes.

## D7. Update F6 (Outcome Analytics) With Friction SLOs and ROI Targets

1. Add SLO thresholds by job family:
   - `job_friction_score` target band
   - `time_to_value_minutes` target band
   - `operator_load_index` target band
2. Add weekly "Friction to Value" report with top 5 harmful-friction drivers.
3. Auto-generate Builder Lane candidate improvements from persistent high-friction clusters.

Acceptance:

1. Weekly report recommends actions tied to measured evidence and trend direction.

## D8. Add Trust Center Setup Wizard For Post-Install Secrets

1. Add first-run setup flow for tenant/client/provider credentials entered by operator, never hardcoded.
2. Add readiness checks and redaction-safe diagnostics.
3. Add explicit "ready for live Graph smoke" status gate in UI.

Acceptance:

1. Clint can safely complete credential setup from UI without source edits or curl.

---

## 6. Will This Improve Clint's Life?

Council answer: **Yes, conditionally**.

It improves Clint's life only if D1-D8 are treated as mandatory and not optional enhancements.

Expected practical impact if fully executed:

1. Fewer manual interventions per completed job.
2. Faster diagnosis when jobs fail or degrade.
3. Clearer trust and policy visibility for decisions and blocks.
4. Lower rework due to better memory and retrieval grounding.
5. Measurable time savings through friction-driven optimization loops.

---

## 7. Updated Execution Order

1. F0a Telemetry contract
2. F0b Replay and adversarial eval harness
3. F1 Visual composer with risk lint
4. F2 Memory bridge with confidence controls
5. F3 Unified retrieval with connector admission lifecycle
6. F4 Trust Center UI
7. F5 Closed-loop healing with blast-radius caps
8. F6 Friction-centric outcomes and ROI SLO reporting
9. Live Graph smoke evidence and production confidence sign-off

---

## 8. Recommendation

1. Proceed with SDD 89 only after incorporating D1-D8.
2. Treat friction metrics as first-class production gates, not post-hoc dashboards.
3. Require replay/safety passes before each wave merge.
4. Tie every autonomy increase to measured risk reduction plus friction reduction.

---

## 9. Primary Source Set

1. OpenAI, Agents guide: https://platform.openai.com/docs/guides/agents
2. OpenAI, Building effective agents: https://platform.openai.com/docs/guides/agents#building-effective-agents
3. OpenAI, Agent evals: https://platform.openai.com/docs/guides/agents#agent-evals
4. OpenAI, Trace grading: https://platform.openai.com/docs/guides/evals#trace-grading
5. OpenAI, Safety in building agents: https://platform.openai.com/docs/guides/safety-in-building-agents
6. Anthropic, Building effective agents: https://www.anthropic.com/engineering/building-effective-agents
7. Microsoft, Build autonomous agents with Copilot Studio: https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/build-autonomous-agents
8. Microsoft, Overview of analytics in Copilot Studio: https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-overview
9. Microsoft, Monitor and improve your agent: https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/monitor-and-improve-copilot
10. Microsoft, Secure custom agents in M365 Copilot: https://learn.microsoft.com/en-us/copilot/microsoft-365/extensibility/secure-custom-agents
11. Google Cloud, Evaluate agents: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/eval-agents
12. Google Cloud, Instrument ADK app with observability: https://docs.cloud.google.com/agent-assist/docs/adk-observability
13. NIST AI RMF resource center: https://airc.nist.gov/airmf-resources/playbook
14. Model Context Protocol specification: https://modelcontextprotocol.io/specification/2025-11-05
15. Model Context Protocol authorization: https://modelcontextprotocol.io/specification/2025-11-05/basic/authorization
16. Model Context Protocol security best practices: https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices
