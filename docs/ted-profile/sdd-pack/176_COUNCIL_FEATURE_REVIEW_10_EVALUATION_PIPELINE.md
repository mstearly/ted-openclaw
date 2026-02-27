# SDD 176 - Council Feature Review 10: `evaluation_pipeline`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `evaluation_pipeline`

Current registry posture:

1. Plane: `control`
2. Lifecycle: `graduated`
3. Maturity: `3`
4. Fragility: `52`
5. Dependencies: `event_sourcing`, `governance_choke_point`
6. Usage telemetry gap: all `usage_signals` fields are `null`

## 2. Internal implementation evidence reviewed

Council reviewed evaluation controls across policy, runtime, replay, and operator routes:

1. Multi-grader engine is implemented in runtime (`schema`, `keyword`, `constraint`, `pattern`) with intent-specific thresholds loaded from `evaluation_graders.json`.
2. Evaluation pipeline combines legacy output-contract validation with multi-grader scoring and includes correction-derived fixtures from `evaluation_corrections.jsonl`.
3. Pipeline emits `evaluation.pipeline.completed` and emits `evaluation.quality.degraded` when pass rate falls below 80%.
4. Synthetic canary runner executes bounded canary sets each cycle, tracks consecutive failures, and emits `evaluation.canary.completed` / `evaluation.canary.failed`.
5. Drift detection tracks per-intent score history over a rolling window and emits `evaluation.drift.detected` on significant negative deltas.
6. Replay harness is policy-gated with required scenarios and release thresholds from `replay_gate_contract.json`, and emits replay/adversarial/connector drill events.
7. Operator endpoints exist for evaluation run/status, canary run/status, drift run/status, replay corpus/run/history, and QA dashboard views.
8. `evaluation_pipeline_policy.json` defines min pass rate, canary budget, drift constraints, required reason codes, and is validated during startup config checks.

Internal strengths confirmed:

1. Evaluation is not a single metric; it is layered (fixtures, canaries, drift, replay release gate).
2. Release gate requirements are explicit and auditable.
3. Correction signals are looped back into evaluation artifacts.

Observed implementation gaps:

1. Core histories (`_evaluationHistory`, `_canaryHistory`, `_intentScoreHistory`) are in-memory and reset on process restart.
2. Evaluation/canary/drift execution is currently route-triggered only; no internal scheduler invocation path calls these functions automatically.
3. Event provenance labels use `scheduler` in several places even when runs are manually triggered, reducing trace precision.
4. Grader config declares `semantic` and `llm_judge`, but runtime evaluator currently implements only deterministic grader functions.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked against modern AI evaluation and governance patterns:

1. Anthropic evaluation guidance emphasizes continuous test/evaluate loops with explicit failure analysis and guardrail hardening.
2. LangSmith emphasizes trace-linked observability and evaluation workflows over static score snapshots.
3. NIST AI RMF emphasizes lifecycle measure/manage controls with documented thresholds and response actions.
4. OWASP LLM Top 10 reinforces adversarial and policy-failure testing as mandatory release hygiene.

Council inference:

1. Current architecture is directionally strong and already aligns with multi-loop eval discipline.
2. Highest-value gap is persistence + automation depth, not lack of evaluation surface area.

## 4. Overlap and missing-capability assessment

Keep:

1. `evaluation_pipeline` should remain the control-plane quality gate feature.

Avoid-overlap rule:

1. `governance_choke_point` decides whether actions execute; `evaluation_pipeline` supplies quality evidence and release-grade signals, not runtime execution policy decisions.

Missing capability:

1. Persistent longitudinal evaluation warehouse with automatic scheduled runs and model-slice drill-down.

## 5. Council actions (prioritized)

1. Persist evaluation/canary/drift history to ledgers.
   - Owner: `council.state`
   - Acceptance: restart-safe history is queryable across runs and reflected in `/ops/qa/dashboard`.
2. Add scheduler-managed execution cadence.
   - Owner: `council.control`
   - Acceptance: periodic evaluation/canary/drift runs execute automatically with unambiguous run provenance fields (`manual|scheduled`).
3. Extend grader runtime to configured advanced graders.
   - Owner: `council.governance`
   - Acceptance: selected intents can opt into `semantic` and/or `llm_judge` grading with cost ceilings and deterministic fallback behavior.
4. Expand evaluation matrix coverage by feature-critical intents.
   - Owner: `council.contract`
   - Acceptance: matrix slices cover all high-risk intents and are tied to release-gate policy checks.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `trace_grading_and_eval_gate_before_release`
   - `policy_as_code_fail_closed_defaults`
   - `eval_driven_release_controls`
   - `human_approval_for_high_impact_changes`
   - `audit_reason_codes_and_traceability`
3. `source_refs.notes` should be updated to mark this deep re-review as passed.

## 7. Disposition

1. Keep feature active.
2. Prioritize persistence + scheduling + advanced grader wiring before expanding new evaluation surfaces.
3. Continue recursive loop to feature 11.

## External references

1. Anthropic test and evaluate overview: https://docs.anthropic.com/en/docs/test-and-evaluate/overview
2. Anthropic guardrail strengthening: https://docs.anthropic.com/en/docs/test-and-evaluate/strengthen-guardrails/reduce-prompt-leak
3. LangSmith observability and evaluation: https://docs.langchain.com/langsmith/home
4. NIST AI RMF 1.0: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
5. OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
