# SDD 179 - Council Feature Review 13: `governance_safety`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `governance_safety`

Current registry posture:

1. Plane: `control`
2. Lifecycle: `mature`
3. Maturity: `4`
4. Fragility: `45`
5. Dependencies: none
6. Usage telemetry gap: all `usage_signals` fields are `null`

## 2. Internal implementation evidence reviewed

Council reviewed the concrete safety-control stack in runtime and policy artifacts:

1. `hard_bans.json` codifies non-negotiable controls (`never_without_approval`, `never_do`, hard-ban strings, pause conditions) across risky workflows.
2. Governance endpoints enforce role-card validation, hard-ban scanning, output contract checks, entity provenance checks, contradiction checks, and escalation routing with blocked explainability payloads.
3. Output validation path writes trust evidence (`trust_validation` ledger entries + `trust.validation.passed|failed` events) for every validated synthesis.
4. High-risk actions emit `governance.operator_required.blocked` when operator confirmation headers are missing (for example draft approve/execute, sync approvals, trust reset).
5. Trust autonomy evaluation computes promotion eligibility from validation pass rate + draft approval rate + consecutive passes and writes auditable evaluation records.
6. Trust reset path is explicitly approval-gated and audited (`/ops/trust/reset` requires operator confirmation).
7. Governance event taxonomy includes hard-ban/output/entity/contradiction/escalation/operator-required controls in canonical schema.

Internal strengths confirmed:

1. Multi-layer safety checks (policy config + runtime checks + trust telemetry).
2. Deterministic block responses with actionable next-safe-step guidance.
3. Audit and trust ledgers provide post-incident traceability.

Observed implementation gaps:

1. Some governance route contracts still have empty `required_fields` (for example confidence/repair endpoints), reducing deterministic client-side safety guarantees.
2. Trust promotion thresholds are hardcoded in runtime function logic instead of policy-as-code artifact.
3. `never_without_approval` policy text and route-level `APPROVAL_FIRST` mappings are not yet validated by a single startup parity check.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked against current guardrail and safety standards:

1. OWASP LLM Top 10 emphasizes prompt injection, data leakage, and output-control threats requiring layered mitigations.
2. Anthropic guardrail guidance reinforces separation of untrusted content, leakage prevention, and continuous safety testing.
3. Azure OpenAI prompt-shields guidance reinforces explicit jailbreak/prompt-attack defenses before model output release.
4. NIST AI RMF playbook reinforces govern/map/measure/manage safety operations as repeatable control loops.

Council inference:

1. Existing safety posture is strong and operationally integrated.
2. Main gap is policy codification completeness and contract strictness, not absence of core controls.

## 4. Overlap and missing-capability assessment

Keep:

1. `governance_safety` remains the feature defining what is safe and blocked.

Avoid-overlap rule:

1. `governance_choke_point` enforces execution boundaries; `governance_safety` provides the substantive safety criteria and trust signals consumed by that chokepoint.

Missing capability:

1. Unified machine-check proving policy intent (`never_without_approval`) and route enforcement (`APPROVAL_FIRST`) remain aligned at all times.

## 5. Council actions (prioritized)

1. Externalize trust thresholds into policy artifact.
   - Owner: `council.governance`
   - Acceptance: promotion thresholds move from code constants to config with startup validation and change audit.
2. Tighten governance route contracts.
   - Owner: `council.contract`
   - Acceptance: confidence/repair/safety routes define explicit required response fields and contract tests enforce them.
3. Add policy-to-route approval parity checker.
   - Owner: `council.control`
   - Acceptance: startup/CI fails when `never_without_approval` actions are not mapped to `APPROVAL_FIRST` boundaries.
4. Expand adversarial safety replay coverage.
   - Owner: `council.qa`
   - Acceptance: replay corpus includes explicit cross-entity leakage and prompt-injection bypass attempts tied to governance reason codes.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `fail_closed_safety_and_escalation_controls`
   - `policy_as_code_fail_closed_defaults`
   - `eval_driven_release_controls`
   - `human_approval_for_high_impact_changes`
   - `audit_reason_codes_and_traceability`
3. `source_refs.notes` should be updated to mark this deep re-review as passed.

## 7. Disposition

1. Keep feature active.
2. Prioritize policy codification and parity validation before expanding new autonomous behaviors.
3. Continue recursive loop to feature 14.

## External references

1. OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
2. Anthropic guardrails (prompt leak reduction): https://docs.anthropic.com/en/docs/test-and-evaluate/strengthen-guardrails/reduce-prompt-leak
3. Azure OpenAI prompt shields: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/content-filter-prompt-shields
4. NIST AI RMF playbook: https://airc.nist.gov/AI_RMF_Knowledge_Base/Playbook
