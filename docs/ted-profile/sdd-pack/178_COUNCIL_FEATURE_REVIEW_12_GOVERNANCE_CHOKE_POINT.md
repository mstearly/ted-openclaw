# SDD 178 - Council Feature Review 12: `governance_choke_point`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `governance_choke_point`

Current registry posture:

1. Plane: `control`
2. Lifecycle: `mature`
3. Maturity: `4`
4. Fragility: `45`
5. Dependencies: none
6. Usage telemetry gap: all `usage_signals` fields are `null`

## 2. Internal implementation evidence reviewed

Council reviewed policy-enforcement flow from request ingress through release controls:

1. Route normalization layer maps dynamic URLs to canonical route keys (`normalizeRoutePolicyKey`) before policy evaluation.
2. Execution boundary policy centralizes per-route mode controls (`WORKFLOW_ONLY`, `APPROVAL_FIRST`) across operational, connector, and governance endpoints.
3. Request ingress enforces bearer auth, execution-mode validation, and boundary checks; failed checks emit deterministic `AUTH_BLOCK`/`BOUNDARY_BLOCK` audit records.
4. Boundary checker emits fail-closed reason codes (`UNDECLARED_EXECUTION_BOUNDARY`, `OUT_OF_CONTRACT_EXECUTION_MODE`) with operator-readable remediation text.
5. Feature release-gate path (`/ops/feature-release-gate/evaluate`) evaluates changed features against hard/advisory rules and records violations/warnings with optional override reason + ticket.
6. Rollout and compatibility surfaces expose rollback triggers, deprecation windows, and compatibility class requirements for controlled policy evolution.

Internal strengths confirmed:

1. Enforcement is centralized at the server ingress path, not scattered per-route.
2. Explainable reason codes are returned for blocked execution paths.
3. Release/rollout/compatibility governance is codified as machine-readable policy artifacts.

Observed implementation gaps:

1. Enforcement checks run only for routes present in `executionBoundaryPolicy`; a newly added route can bypass choke-point controls if policy mapping is forgotten.
2. Canonical route map, route contracts, and boundary policy are maintained separately and can drift without a strict parity gate.
3. Feature release gate policy is currently `mode: advisory`, so blocking violations are reported but not hard-enforced.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked against mature governance enforcement patterns:

1. GitHub CODEOWNERS and protected-branch controls show merge-time enforcement as executable governance.
2. Open Policy Agent guidance reinforces policy-as-code with explicit decision points and auditable deny reasons.
3. NIST AI RMF emphasizes lifecycle governance where controls must be measurable and continuously enforced.
4. OWASP LLM Top 10 reinforces default-deny treatment for high-risk AI behaviors and policy bypass risks.

Council inference:

1. Current architecture strongly matches policy-as-code enforcement patterns.
2. Primary gap is governance coverage assurance (no route left unmanaged), not missing control primitives.

## 4. Overlap and missing-capability assessment

Keep:

1. `governance_choke_point` remains the runtime policy-enforcement nexus.

Avoid-overlap rule:

1. `governance_safety` defines safety criteria; `governance_choke_point` enforces those criteria at ingress and release boundaries.

Missing capability:

1. Automatic parity gate proving every routable endpoint has synchronized route-contract and execution-boundary declarations.

## 5. Council actions (prioritized)

1. Add route governance parity validator.
   - Owner: `council.contract`
   - Acceptance: CI fails if any executable route lacks boundary policy or route-contract entry.
2. Promote release gate from advisory to hard mode after one burn-in cycle.
   - Owner: `council.governance`
   - Acceptance: policy mode set to `hard` with controlled override pathway and audited reason/ticket enforcement.
3. Add startup coverage report for governance map completeness.
   - Owner: `council.control`
   - Acceptance: startup emits coverage metrics (`routes_total`, `routes_governed`, `routes_missing`) and blocks when missing > 0 in hardened mode.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `centralized_policy_enforcement_and_override_accountability`
   - `policy_as_code_fail_closed_defaults`
   - `eval_driven_release_controls`
   - `human_approval_for_high_impact_changes`
   - `audit_reason_codes_and_traceability`
3. `source_refs.notes` should be updated to mark this deep re-review as passed.

## 7. Disposition

1. Keep feature active.
2. Prioritize parity enforcement and hard-mode rollout before introducing additional governance endpoints.
3. Continue recursive loop to feature 13.

## External references

1. GitHub CODEOWNERS: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
2. GitHub protected branches: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
3. Open Policy Agent docs: https://www.openpolicyagent.org/docs/latest/
4. NIST AI RMF 1.0: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
5. OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
