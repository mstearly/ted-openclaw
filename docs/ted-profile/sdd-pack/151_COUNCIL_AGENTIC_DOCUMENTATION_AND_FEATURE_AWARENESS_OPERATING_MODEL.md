# SDD 151 - Council Research and Operating Model: Dynamic Feature Awareness for Agentic Systems

Date: 2026-02-27  
Status: Research + implementation plan (decision-ready)

## 1. Council understanding of your ask

You asked the council to design a best-practice system so AI contributors (and human operators) stay continuously aware of:

1. What features exist, how they work, and where they are fragile.
2. Which QA and security controls must update when features change.
3. Which features are underused and where external examples can unlock value.
4. When additional deep research is required before changes are made.

You also asked for this to be dynamic, not static documentation.

## 2. Platform capability assessment (code-verified)

### 2.1 What already exists and is strong

1. Feature maturity artifact exists today.
   - Evidence: `sidecars/ted-engine/config/feature_maturity.json`
2. Capability maturity artifact exists today.
   - Evidence: `sidecars/ted-engine/config/capability_maturity.json`
3. Research debt tracking exists today.
   - Evidence: `sidecars/ted-engine/config/research_debt_scores.json`
4. Governance and policy validation framework is already implemented.
   - Evidence: `sidecars/ted-engine/modules/roadmap_governance.mjs`
5. Replay + rollout evidence gates are implemented.
   - Evidence: `sidecars/ted-engine/server.mjs` (`/ops/replay/*`, `/ops/rollout-policy`)
6. Friction and outcomes telemetry is implemented.
   - Evidence: `sidecars/ted-engine/server.mjs` (`/ops/friction/*`, `friction_rollups`)

### 2.2 Gaps relative to your target state

1. No single machine-readable feature registry linking feature -> owner -> contracts -> tests -> security controls -> usage telemetry.
2. Maturity is tracked, but fragility is not quantitatively and continuously scored from runtime evidence.
3. QA/security updates are not auto-derived from feature changes.
4. Underused-feature discovery exists only partially (no explicit opportunity queue and board-ready narrative loop).
5. Research triggers are not codified (when to pause and benchmark external patterns).

Council conclusion: foundations are strong; missing layer is a unifying dynamic feature-awareness operating model.

## 3. External best-practice research digest (trusted sources)

### 3.1 AI engineering and reasoning-system operations

1. OpenAI recommends eval-driven development and trace grading as release controls.
2. OpenAI supports prompt template/version workflows, which provides versioned prompt governance.
3. Anthropic recommends explicit subagent boundaries and persistent memory files for durable team context.
4. Anthropic long-context guidance emphasizes context curation rather than unlimited raw history.
5. LangGraph and LangSmith emphasize durable execution, memory/state modeling, and observability/evaluation loops.

Council inference:

A high-performing agentic stack treats capability docs, evaluation traces, and prompt/policy versions as one lifecycle.

### 3.2 Documentation and architecture governance patterns

1. Backstage catalog descriptors standardize owner/lifecycle/system metadata for software components.
2. Microsoft Well-Architected guidance recommends Architecture Decision Records (ADRs) for durable decision memory.
3. GitHub protected branches and code ownership patterns provide enforcement points so governance is executable.
4. GitLab docs architecture reinforces docs-as-code and source-controlled documentation evolution.

Council inference:

Best systems keep metadata close to code, enforce ownership at merge time, and treat docs as first-class production assets.

### 3.3 Security and AI governance standards

1. NIST AI RMF and NIST Generative AI profile define measure/manage controls across AI lifecycle risk.
2. OWASP Top 10 for LLM Applications provides concrete threat classes to map per feature.
3. OpenTelemetry semantic conventions provide shared telemetry contracts for consistent observability.

Council inference:

Maturity grading without risk/control mapping is insufficient; each feature needs explicit security and observability contracts.

## 4. Council recommendation: adopt the Dynamic Feature Awareness Operating System (DFA-OS)

### 4.1 Core artifact model

Create a unified registry artifact:

1. `sidecars/ted-engine/config/feature_registry.json`

Each feature record must include:

1. `feature_id`, `name`, `plane` (`control|connector|state|contract|experience`)
2. `owner` (human + council role), `backup_owner`
3. `lifecycle_state` (`proposed|incubating|graduated|mature|retiring`)
4. `maturity_score` (0-5) and `fragility_score` (0-100)
5. `qa_contracts` (tests, replay scenarios, browser gates)
6. `security_controls` (policy refs + OWASP LLM mapping)
7. `runtime_signals` (event names, SLO metrics, alert thresholds)
8. `usage_signals` (invocation count, operator adoption ratio, success rate)
9. `dependencies` (feature and connector IDs)
10. `research_profile` (`last_benchmark_date`, `trigger_conditions`, `external_patterns`)

### 4.2 Dynamic propagation rules

When feature metadata changes or feature code changes:

1. Auto-check required QA coverage entries exist and pass.
2. Auto-check mapped security controls exist and are current.
3. Auto-check observability events are emitted and schema-valid.
4. Auto-check maturity/fragility scores are updated if failure evidence changed.
5. Auto-open "research required" flag when trigger conditions fire.

### 4.3 Feature maturity and fragility model

Use two axes:

1. Maturity (build completeness):
   - `M0` Not present
   - `M1` Experimental
   - `M2` Functional
   - `M3` Governed
   - `M4` Production hardened
   - `M5` Self-optimizing
2. Fragility (operational risk): 0-100 weighted from:
   - replay regressions,
   - recent incidents,
   - override rate,
   - dependency volatility,
   - low test depth,
   - unresolved security findings.

Decision rule:

1. If `fragility_score >= 70`, feature is change-frozen except fixes.
2. If `maturity_score <= 2` and user-impacting roadmap work is requested, external benchmark research is mandatory before implementation.
3. If maturity rises but usage remains low, route to value activation loop (Section 4.4).

### 4.4 Low-usage feature creative loop (human awareness)

Create a monthly board-ready artifact:

1. `docs/ted-profile/sdd-pack/LOW_USAGE_FEATURE_OPPORTUNITY_BRIEF.md`

For each low-usage/high-value feature:

1. Current usage and observed friction.
2. Comparable external usage patterns (with sources).
3. Proposed activation experiments (UX copy, workflow templates, onboarding nudges).
4. Expected operator value and measurable target delta.

This ensures you stay aware of "value left on the table" and converts research into execution.

## 5. Plane and ledger impact (required mapping)

### 5.1 Control plane

1. New policy artifacts:
   - `feature_registry.json`
   - `feature_fragility_policy.json`
   - `research_trigger_policy.json`
2. Read/write:
   - reads `feature_maturity.json`, `capability_maturity.json`, `research_debt_scores.json`
   - writes derived governance snapshots to `artifacts/governance/feature_health.jsonl`

### 5.2 Contract plane

1. Add feature-to-test and feature-to-contract mappings.
2. Enforce pre-merge validation that changed feature files are mapped to tests/contracts.

### 5.3 State plane

1. Add canonical event types:
   - `feature.maturity.evaluated`
   - `feature.fragility.evaluated`
   - `feature.research.triggered`
   - `feature.usage.low_detected`
2. Append to event log and governance ledgers.

### 5.4 Connector plane

1. Connector features receive explicit lifecycle and fragility tracking.
2. Provider volatility and callback/retry defects feed fragility score.

### 5.5 Experience plane

1. Add UI card for feature health board (maturity, fragility, usage, research flags).
2. Add operator digest section: "underused features with highest value opportunity".

## 6. Task-level implementation plan (wave-by-wave)

## Wave A - Registry foundation (DFA baseline)

Dependencies: none.

Tasks:

1. Define JSON schema for `feature_registry.json`.
2. Seed registry from:
   - `feature_maturity.json`
   - `capability_maturity.json`
   - `module_lifecycle_policy.json`
3. Add registry validator script (`scripts/ted-profile/validate-feature-registry.mjs`).
4. Add startup validation hook in sidecar for registry schema.
5. Add CI gate command to run registry validator.

Acceptance:

1. Registry exists, validates, and fails closed on malformed entries.
2. Every tracked feature has owner + plane + maturity.

## Wave B - Dynamic QA and security propagation

Dependencies: Wave A.

Tasks:

1. Add `qa_contracts` and `security_controls` sections per feature.
2. Implement script to verify each feature has mapped tests and policy controls.
3. Map OWASP LLM categories per feature where applicable.
4. Fail CI if changed feature lacks updated QA/security mappings.
5. Emit `feature.maturity.evaluated` event after validation pass.

Acceptance:

1. Feature changes cannot merge without QA/security mapping completeness.
2. Missing mappings are surfaced as deterministic CI failures.

## Wave C - Fragility scoring engine

Dependencies: Wave B.

Tasks:

1. Define fragility formula weights in `feature_fragility_policy.json`.
2. Build scorer script reading replay/friction/outcome signals.
3. Persist score snapshots to `artifacts/governance/feature_health.jsonl`.
4. Add thresholds for freeze/research/escalation triggers.
5. Emit `feature.fragility.evaluated` and `feature.research.triggered` events.

Acceptance:

1. Every feature has current fragility score.
2. Trigger behavior is automatic and auditable.

## Wave D - Underused feature opportunity loop

Dependencies: Wave C.

Tasks:

1. Define low-usage detection rules (`feature_usage_policy.json`).
2. Instrument usage counters by feature ID in sidecar/gateway.
3. Generate monthly opportunity brief from usage + fragility + maturity data.
4. Add external benchmark section template with required source links.
5. Add operator dashboard card for "underused high-value features".

Acceptance:

1. Underused features are surfaced automatically with suggested activation experiments.
2. Human operator receives regular, actionable value briefs.

## Wave E - Research-integrated operating cadence

Dependencies: Waves A-D.

Tasks:

1. Define "research required" triggers (high fragility, low maturity, high strategic impact).
2. Create council research runbook with source-quality rules.
3. Add quarterly "best minds" comparative review against leading agent platforms.
4. Link research deltas directly to roadmap and QA/security tasks.
5. Publish board-ready summary artifact each cycle.

Acceptance:

1. Research is no longer ad-hoc; it is policy-driven and traceable.
2. Feature roadmap reflects external best practice changes within one review cycle.

## 7. Prioritized immediate actions

Execute now (next 1-2 cycles):

1. Wave A Task 1-3 (schema + seed registry + validator).
2. Wave B Task 1-2 (mandatory QA/security mapping fields).
3. Wave C Task 1 (fragility policy definition).

Reason: these three establish the minimum dynamic awareness loop without waiting for UI expansion.

## 8. Risks and mitigations

1. Risk: metadata overhead slows contributors.
   - Mitigation: auto-seed from existing artifacts + fail only on changed features.
2. Risk: scoring noise causes false alarms.
   - Mitigation: start with advisory mode for one cycle before hard gates.
3. Risk: docs drift from code.
   - Mitigation: registry validation in CI + startup checks + ownership enforcement.
4. Risk: research becomes performative.
   - Mitigation: require explicit "design delta" mapping from each research round to tasks/tests.

## 9. Council verdict

Proceed. This is a high-leverage control-system upgrade, not bureaucracy.

The platform already has most ingredients; the council should now unify them into a single dynamic operating model so feature knowledge, QA, security, and value discovery evolve together.

## References

### Internal evidence

1. `sidecars/ted-engine/config/feature_maturity.json`
2. `sidecars/ted-engine/config/capability_maturity.json`
3. `sidecars/ted-engine/config/research_debt_scores.json`
4. `sidecars/ted-engine/modules/roadmap_governance.mjs`
5. `sidecars/ted-engine/server.mjs`

### External sources (primary)

1. OpenAI evals guide: https://platform.openai.com/docs/guides/evals
2. OpenAI trace grading: https://platform.openai.com/docs/guides/trace-grading
3. OpenAI prompt template/version guidance: https://platform.openai.com/docs/guides/text?api-mode=responses#prompting-with-a-prompt-template-and-version
4. Anthropic Claude Code subagents: https://docs.anthropic.com/en/docs/claude-code/sub-agents
5. Anthropic long context tips: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/long-context-tips
6. Anthropic guardrails (prompt leak reduction): https://docs.anthropic.com/en/docs/test-and-evaluate/strengthen-guardrails/reduce-prompt-leak
7. LangGraph overview (durable execution): https://docs.langchain.com/oss/python/langgraph/overview
8. LangGraph memory: https://docs.langchain.com/oss/python/langgraph/memory
9. LangSmith observability/evaluation docs: https://docs.langchain.com/langsmith/home
10. OpenTelemetry semantic conventions: https://opentelemetry.io/docs/specs/semconv/general/events/
11. NIST AI RMF 1.0: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
12. NIST Generative AI profile: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence-profile
13. OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
14. Backstage descriptor format (owner/lifecycle catalog model): https://backstage.io/docs/features/software-catalog/descriptor-format
15. Microsoft ADR guidance: https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-records
16. GitHub code owners: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
17. GitHub protected branches: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
18. GitLab documentation site architecture (docs-as-code practices): https://docs.gitlab.com/development/documentation/site_architecture/
