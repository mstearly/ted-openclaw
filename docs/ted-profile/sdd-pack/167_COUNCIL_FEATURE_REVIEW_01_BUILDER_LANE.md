# SDD 167 - Council Feature Review 01: `builder_lane`

Date: 2026-02-27
Status: Completed (deep review + benchmark refresh)
Parents: SDD 151, SDD 166

## 1. Feature scope and current state

Feature: `builder_lane`

Current registry posture:

1. Plane: `control`
2. Lifecycle: `graduated`
3. Maturity: `3`
4. Fragility: `40` (registry), `20` (latest feature-health snapshot)
5. Dependencies: `governance_choke_point`, `event_sourcing`

Latest health snapshot (governance ledger):

1. `freeze=false`
2. `escalation=false`
3. `research_required=false`
4. `low_usage=true`

## 2. Internal implementation evidence reviewed

Council reviewed runtime/control evidence for this feature:

1. Approval-first guardrails on proposal apply/revert routes.
2. Constitution scope enforcement for Builder Lane config changes.
3. Rubber-stamping detection and event emission.
4. Status and metrics endpoints for proposal activity, confidence, fatigue, and proposal history.
5. Revert/shadow endpoints and proposal lifecycle tracking.

Primary code evidence:

1. `sidecars/ted-engine/server.mjs`
2. `sidecars/ted-engine/config/builder_lane_config.json`
3. `sidecars/ted-engine/config/ted_constitution.json`
4. `sidecars/ted-engine/config/event_schema.json`

## 3. External benchmark pass (modern co-work leaders)

Research date: 2026-02-27.

Council benchmarked this feature against current co-work AI patterns:

1. Asana AI teammates and AI Studio emphasize configurable teammates for complex work.
2. Atlassian Rovo Agents emphasize specialized skills with permissioned execution.
3. Microsoft Copilot Studio and Copilot control docs emphasize agent creation plus admin governance controls.
4. Slack AI emphasizes enterprise search context and agent-assisted workflow execution.
5. Notion AI emphasizes meeting-note/action-item conversion and operational summaries.
6. Google Workspace Gemini emphasizes cross-surface assistive workflows embedded in daily tools.

## 4. Overlap and gap assessment for `builder_lane`

Overlap (already covered well):

1. Safe-change proposal flow with explicit apply gates.
2. Permissioned/autonomy-constrained change path.
3. Observable learning loop (corrections -> pattern detection -> proposals).
4. Reversible changes (revert path) and governance eventing.

Missing or underdeveloped value opportunities:

1. No dedicated "improvement template catalog" for repeatable proposal playbooks.
2. No first-class enterprise-context grounding pass before proposal generation.
3. No operator digest optimized for quick triage of top proposal actions by business value.

Feature-overlap finding:

1. No direct destructive overlap detected with other DFA-OS features.
2. `builder_lane` remains a distinct control-plane capability and should stay separate.

## 5. Council recommendations (prioritized)

1. Add Builder Lane template catalog for common governance improvements.
   - Outcome: faster, safer proposal creation and higher feature adoption.
2. Add context-grounded proposal hints from retrieval/connectors before proposal drafting.
   - Outcome: fewer low-value proposals and better relevance.
3. Add weekly operator digest that ranks proposals by expected value and risk.
   - Outcome: faster human review throughput without rubber-stamping.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` confirmed for this cycle.
2. `research_profile.external_patterns` expanded to include:
   - `permission_scoped_agent_skills`
   - `template_driven_automation_builder`
   - `enterprise_context_grounded_proposals`
   - `operator_digest_ranked_actions`
3. Source notes updated to mark this feature review as completed.

## 7. Disposition

1. Keep feature as-is structurally (`no merge` / `no deprecate`).
2. Advance to targeted value expansion work (adoption and operator UX).
3. Continue recursive loop on next pending feature: `calendar_awareness`.

## External references

1. Asana AI teammates: https://asana.com/product/ai/teammates
2. Asana AI Studio: https://asana.com/product/ai/ai-studio
3. Atlassian Rovo agents: https://www.atlassian.com/software/rovo/guided-tour/agents
4. Microsoft Copilot Studio custom engine agents: https://learn.microsoft.com/en-us/copilot-studio/nlu-overview
5. Microsoft Copilot agent lifecycle and controls: https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/agents-life-cycle
6. Slack AI + Agentforce context/search: https://slack.com/help/articles/25076892548883-Guide-to-AI-features-in-Slack
7. Notion AI workspace docs and summaries: https://www.notion.com/help/notion-ai-faqs
8. Notion AI meeting notes/action items: https://www.notion.com/help/ai-meeting-notes
9. Google Workspace Gemini side panel: https://support.google.com/a/answer/14093801?hl=en
