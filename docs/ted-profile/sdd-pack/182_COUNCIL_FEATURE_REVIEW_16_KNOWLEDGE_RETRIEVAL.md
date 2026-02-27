# SDD 182 - Council Feature Review 16: `knowledge_retrieval`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `knowledge_retrieval`

Current registry posture:

1. Plane: `state`
2. Lifecycle: `graduated`
3. Maturity: `3`
4. Fragility: `56`
5. Dependencies: none
6. Usage telemetry gap: `invocation_count_30d`, `adoption_ratio_30d`, and `success_rate_30d` are `null`

## 2. Internal implementation evidence reviewed

Council reviewed retrieval policy, replay coverage, and contract checks:

1. Retrieval policy defines allowed modes and keeps `structured_ledger` as active default while `keyword_index` and `vector_rag` remain disabled (`config/knowledge_retrieval_policy.json`).
2. Query constraints enforce max query length, max top-k, context token ceiling, minimum similarity, and minimum citation count (`config/knowledge_retrieval_policy.json`).
3. Security controls require scope filters, citation offsets, and sensitive-pattern redaction references (`config/knowledge_retrieval_policy.json`).
4. Replay gate requires both grounded retrieval and adversarial policy-block scenarios (`config/replay_gate_contract.json`, `config/replay_corpus.json`).
5. Output validation enforces citation array shape on governed synthesis outputs (`server.mjs` output contract checks).
6. Startup validation fails closed on malformed retrieval policy (`server.mjs`).

Internal strengths confirmed:

1. Retrieval behavior is policy-first with explicit safety and citation requirements.
2. Adversarial replay coverage exists for policy-block paths.
3. Governance events for query executed, policy blocked, and no-results are codified.

Observed implementation gaps:

1. Advanced retrieval modes are declared but not enabled, limiting recall depth.
2. Registry usage metrics are still null, limiting value measurement.
3. Retrieval quality scoring is not yet surfaced as a dedicated operator KPI.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked against current retrieval and reasoning-system best practice:

1. Anthropic long-context guidance emphasizes curated context and scoped retrieval over raw long-history stuffing.
2. LangSmith guidance emphasizes trace-level observability and evaluation loops for retrieval quality.
3. OWASP LLM Top 10 emphasizes policy-block controls for sensitive-query and prompt-injection scenarios.
4. OpenTelemetry event conventions reinforce consistent retrieval event semantics across systems.

Council inference:

1. Current retrieval baseline is governance-safe.
2. Highest leverage is enabling richer retrieval modes only after evaluation-backed safety gates.

## 4. Overlap and missing-capability assessment

Keep:

1. `knowledge_retrieval` should remain distinct from `prompt_registry`; retrieval decides evidence selection, prompt registry decides instruction templates.

Avoid-overlap rule:

1. Retrieval must own evidence grounding and citation policy; prompt layer must not bypass retrieval-scope controls.

Missing capability:

1. Controlled rollout path for enabling `keyword_index` and `vector_rag` with eval-gated promotion.

## 5. Council actions (prioritized)

1. Add retrieval-mode promotion gate.
   - Owner: `council.control`
   - Acceptance: `keyword_index` or `vector_rag` can only be enabled when replay and evaluator thresholds pass.
2. Add retrieval quality scorecard.
   - Owner: `council.state`
   - Acceptance: dashboard includes grounded citation rate, no-result rate, and policy-block rate by entity.
3. Add explicit retrieval route contract for governed query endpoint.
   - Owner: `council.contract`
   - Acceptance: request/response contract includes scope filters and citation offsets as required fields.
4. Expand adversarial retrieval corpus.
   - Owner: `council.qa`
   - Acceptance: replay adds cross-entity leakage and citation-fabrication attack cases.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `grounded_retrieval_with_citation_and_safety_controls`
   - `durable_execution_and_memory_state`
   - `event_sourced_traceability`
   - `idempotent_reconciliation_patterns`
   - `state_quality_feedback_loops`
3. `source_refs.notes` should be updated to mark deep re-review pass.

## 7. Disposition

1. Keep feature active.
2. Promote richer retrieval only via eval-gated governance.
3. Continue recursive loop to feature 17.

## External references

1. Anthropic long-context guidance: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/long-context-tips
2. LangSmith observability and evaluation docs: https://docs.langchain.com/langsmith/home
3. OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
4. OpenTelemetry semantic events: https://opentelemetry.io/docs/specs/semconv/general/events/
