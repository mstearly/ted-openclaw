# SDD 187 - Council Feature Review 21: `prompt_registry`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `prompt_registry`

Current registry posture:

1. Plane: `contract`
2. Lifecycle: `graduated`
3. Maturity: `3`
4. Fragility: `52`
5. Dependencies: none
6. Usage telemetry gap: `invocation_count_30d`, `adoption_ratio_30d`, and `success_rate_30d` are `null`

## 2. Internal implementation evidence reviewed

Council reviewed prompt versioning and runtime fallback behavior:

1. `prompt_registry.json` maps intents to production versions and template files for core workloads.
2. Runtime loader caches registry for 60 seconds and resolves template metadata (model, temperature, max tokens) (`server.mjs`).
3. Runtime emits `prompt.registry.loaded` on successful resolution and `prompt.registry.fallback` when template files are unavailable.
4. LLM call path logs registry-backed prompt usage (`LLM_CALL ... prompt_registry=loaded`) (`server.mjs`).
5. Migration state includes prompt registry in baseline schema migration coverage (`config/migration_state.json`).
6. Config schema validation fails closed on malformed prompt registry config (`server.mjs` startup validator set).

Internal strengths confirmed:

1. Prompt definitions are externalized from code and versionable.
2. Missing template paths degrade safely via fallback instead of hard outage.
3. Prompt loading is observable via dedicated events.

Observed implementation gaps:

1. No formal promotion workflow beyond setting `production` pointer in config.
2. No integrity checksum/signature for template file tamper detection.
3. Usage telemetry fields remain null.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked prompt-governance posture against current AI engineering guidance:

1. OpenAI prompt template/version guidance reinforces explicit version pointers and stable template reuse.
2. OpenAI eval guidance reinforces eval-gated promotion for prompt changes that alter behavior.
3. LangSmith guidance reinforces prompt-level observability and trace comparison over releases.

Council inference:

1. Registry architecture is correct.
2. Next gap is governance process depth: promotion gates and provenance hardening.

## 4. Overlap and missing-capability assessment

Keep:

1. `prompt_registry` remains a contract-plane source of truth for intent templates.

Avoid-overlap rule:

1. `personalization` may influence style variables but should not directly mutate registry production pointers without governance.

Missing capability:

1. Eval-backed, auditable prompt promotion workflow with rollback proofs.

## 5. Council actions (prioritized)

1. Add prompt promotion gate workflow.
   - Owner: `council.contract`
   - Acceptance: production pointer change requires linked eval report and approval record.
2. Add template integrity hashing.
   - Owner: `council.security`
   - Acceptance: loader verifies template hash and emits block event on mismatch.
3. Add prompt regression panel.
   - Owner: `council.state`
   - Acceptance: dashboard shows intent-level score deltas across prompt versions.
4. Populate usage telemetry fields.
   - Owner: `council.control`
   - Acceptance: usage_signals are sourced from prompt registry load events.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `versioned_prompt_catalog_with_rollback_and_approval`
   - `versioned_contract_registry`
   - `schema_compatibility_with_upcasters`
   - `ownership_enforced_at_merge`
   - `adr_backed_change_history`
3. `source_refs.notes` should be updated to mark deep re-review pass.

## 7. Disposition

1. Keep feature active.
2. Prioritize promotion workflow and template integrity.
3. Continue recursive loop to feature 22.

## External references

1. OpenAI prompt template/version guidance: https://platform.openai.com/docs/guides/text?api-mode=responses#prompting-with-a-prompt-template-and-version
2. OpenAI evals guide: https://platform.openai.com/docs/guides/evals
3. LangSmith observability and evaluation docs: https://docs.langchain.com/langsmith/home
