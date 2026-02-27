# SDD 170 - Council Feature Review 04: `content_isolation`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `content_isolation`

Current registry posture:

1. Plane: `control`
2. Lifecycle: `graduated`
3. Maturity: `3`
4. Fragility: `46`
5. Runtime signals: `governance.hard_ban.*`, `governance.output_contract.*`
6. Usage telemetry gap: all `usage_signals` fields are `null`

## 2. Internal implementation evidence reviewed

Council validated isolation behavior in runtime, governance, and replay controls:

1. Prompt assembly injects explicit warning that content inside `<untrusted_content>` tags is adversarial and must never drive instructions (`server.mjs`, untrusted-content intent branch).
2. Hard bans from `hard_bans.json` are injected into constraint layer for prompt-time policy reinforcement.
3. Output contract validator blocks forbidden patterns and emits `governance.output_contract.blocked` trust events.
4. Constitution logic blocks Builder Lane from modifying protected governance files (`hard_bans` and autonomy constraints) and fail-closes if constitution read fails.
5. Replay gate contract requires adversarial scenarios (`adversarial_prompt_injection`, `adversarial_tool_contamination`) and schema tests enforce required scenario presence.
6. Replay corpus contains explicit assertions for `untrusted_content_isolated` and `prompt_injection_blocked`.

Internal strengths confirmed:

1. Isolation is enforced at multiple layers (prompt constraints, output validation, replay coverage, and governance mutation controls).
2. Evented trust telemetry exists for blocked outputs.

Observed implementation gaps:

1. Output filtering is primarily deterministic pattern and section checks; no secondary model-based exfiltration classifier is enforced.
2. No explicit per-route isolation effectiveness metric is published (for example blocked-per-intent rates with confidence buckets).
3. There is no dedicated operator dashboard artifact summarizing prompt-injection catch rate trends by connector.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked against current primary-source guidance:

1. OWASP LLM Top 10 identifies prompt injection and sensitive information disclosure as distinct risks that need layered controls.
2. Anthropic guardrail guidance emphasizes segmentation of untrusted content, post-generation filtering, and hardened system rules.
3. Microsoft Copilot security guidance describes jailbreak detection and prompt-shielding layers across retrieval and generation.
4. NIST AI RMF Generative AI profile emphasizes measurable manage-and-monitor controls instead of static policy text only.

Council inference:

1. Current feature already aligns with layered-control direction.
2. Main gap is measurement depth and continuously scored guardrail performance.

## 4. Overlap and missing-capability assessment

Keep:

1. `content_isolation` remains its own control-plane feature and should not be merged into generic `governance_safety`.

Avoid-overlap rule:

1. `governance_safety` should own policy authoring; `content_isolation` should own untrusted-content handling and injection defense execution.

Missing capability:

1. No dedicated isolation performance scorecard by intent, connector, and attack class.

## 5. Council actions (prioritized)

1. Add isolation scorecard pipeline.
   - Owner: `council.control`
   - Acceptance: monthly artifact reports `prompt_injection_block_rate`, `false_block_rate`, and `time_to_policy_update`.
2. Add secondary exfiltration/jailbreak classifier gate for high-risk intents.
   - Owner: `council.security`
   - Acceptance: high-risk intents run deterministic plus classifier checks before output release.
3. Add connector-specific adversarial replay expansions.
   - Owner: `council.connector`
   - Acceptance: replay corpus adds at least one prompt-injection scenario per high-risk connector surface.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `untrusted_content_isolation_and_prompt_injection_resilience`
   - `policy_as_code_fail_closed_defaults`
   - `eval_driven_release_controls`
   - `human_approval_for_high_impact_changes`
   - `audit_reason_codes_and_traceability`
3. `source_refs.notes` should remain completed with this deep re-review as the canonical evidence.

## 7. Disposition

1. Keep feature active.
2. Prioritize measurement and classifier depth expansion over structural redesign.
3. Continue recursive loop to feature 05.

## External references

1. OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
2. Anthropic guardrails (prompt leak reduction): https://docs.anthropic.com/en/docs/test-and-evaluate/strengthen-guardrails/reduce-prompt-leak
3. Microsoft prompt shields for Copilot and AI apps: https://learn.microsoft.com/en-us/copilot/security/prompt-shields
4. NIST AI RMF Generative AI Profile: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence-profile
