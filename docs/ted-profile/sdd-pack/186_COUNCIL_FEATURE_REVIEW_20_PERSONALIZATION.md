# SDD 186 - Council Feature Review 20: `personalization`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `personalization`

Current registry posture:

1. Plane: `experience`
2. Lifecycle: `mature`
3. Maturity: `3`
4. Fragility: `58`
5. Dependencies: none
6. Usage telemetry gap: `invocation_count_30d`, `adoption_ratio_30d`, and `success_rate_30d` are `null`

## 2. Internal implementation evidence reviewed

Council reviewed operator preference, style, and learning loops:

1. `style_guide.json` and `draft_style.json` codify tone rules, signature conventions, words-to-avoid, and voice training metadata.
2. Memory preference routes support list/upsert/forget/export with policy-bound scope and event emission (`memory.preference.upserted|forgotten`).
3. Builder Lane records calibration responses and emits `improvement.calibration.response` (`server.mjs`).
4. Onboarding archetype selection applies cold-start style presets and emits `improvement.archetype.applied` (`server.mjs`).
5. Voice extraction pipeline from sent items emits `improvement.voice_extraction.started|completed|failed` with status endpoints (`server.mjs`).
6. Improvement proposal flows snapshot and update style-related configs under governance checks (`server.mjs`).

Internal strengths confirmed:

1. Personalization has explicit config artifacts and runtime learning hooks.
2. Operator corrections are captured as structured signals.
3. Cold-start and ongoing refinement loops are both present.

Observed implementation gaps:

1. Audience/context-specific style variants are not yet first-class.
2. No dedicated style-regression eval suite gates personalization changes.
3. Registry usage telemetry remains null.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked personalization against modern assistant patterns:

1. Anthropic long-context guidance reinforces selective memory and context curation over unconstrained accumulation.
2. LangSmith guidance reinforces traceable evaluation of quality drift for personalized outputs.
3. Atlassian Rovo product direction reinforces role-in-context assistance and workflow-aware personalization.

Council inference:

1. Personalization foundation is strong and governed.
2. Highest-value gap is context-aware adaptation with explicit evaluation gates.

## 4. Overlap and missing-capability assessment

Keep:

1. `personalization` remains an experience-plane feature distinct from `prompt_registry` and `knowledge_retrieval`.

Avoid-overlap rule:

1. Prompt templates define instruction scaffolding; personalization defines operator-specific behavior within those templates.

Missing capability:

1. Per-context style policies (for audience, channel, and urgency) with regression-safe promotion.

## 5. Council actions (prioritized)

1. Add context-aware style profiles.
   - Owner: `council.experience`
   - Acceptance: style rules can vary by audience/channel while preserving constitutional constraints.
2. Add style regression eval set.
   - Owner: `council.qa`
   - Acceptance: personalization changes must pass style/tone consistency and factuality replay gates.
3. Add personalization observability slice.
   - Owner: `council.state`
   - Acceptance: dashboard shows calibration response trends, voice extraction freshness, and correction-rate drift.
4. Populate usage telemetry fields.
   - Owner: `council.control`
   - Acceptance: personalization usage_signals auto-update each cycle.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `adaptive_operator_preferences_with_controlled_memory`
   - `assistant_in_context_user_workflows`
   - `meeting_and_task_summary_assistance`
   - `template_driven_onboarding_and_activation`
   - `operator_digest_with_actionable_next_steps`
3. `source_refs.notes` should be updated to mark deep re-review pass.

## 7. Disposition

1. Keep feature active.
2. Prioritize context-aware style profiling with evaluation gates.
3. Continue recursive loop to feature 21.

## External references

1. Anthropic long-context guidance: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/long-context-tips
2. LangSmith observability and evaluation docs: https://docs.langchain.com/langsmith/home
3. Atlassian Rovo: https://www.atlassian.com/software/rovo
