# SDD 100 - Council Critical Review: Clint Email Ask 2 (Compaction and Long-Context Management)

Date: 2026-02-26  
Status: Council recommendation package (decision-ready)

## 1. Council understanding of Clint's ask

Clint asked whether Ted already solves long-running context drift and memory pressure ("automatic compaction" style behavior), or whether this should be added as a formal requirement in the roadmap.

## 2. Platform capability assessment (code-verified)

### 2.1 Ted sidecar context handling today

1. Ted sidecar already applies route-specific context budgets, section priority, truncation, and omission metadata.
   - Evidence: `sidecars/ted-engine/server.mjs` (`CONTEXT_BUDGETS`, `assembleContext`).
2. Pure/testable context assembly exists with parity metadata (`sections_included`, `sections_truncated`, `sections_omitted`).
   - Evidence: `sidecars/ted-engine/server-utils.mjs` (`assembleContextPure`).

Council assessment: Ted has deterministic prompt shaping at the sidecar layer before model invocation.

### 2.2 OpenClaw runtime compaction and overflow recovery

1. Runtime detects likely context overflow and retries with explicit compaction.
   - Evidence: `src/agents/pi-embedded-runner/run.ts` (`isLikelyContextOverflowError`, `compactEmbeddedPiSessionDirect`).
2. If compaction cannot recover, runtime attempts oversized tool-result truncation and retries again.
   - Evidence: `src/agents/pi-embedded-runner/run.ts`; `src/agents/pi-embedded-runner/tool-result-truncation.ts`.
3. Compaction path has lock discipline, transcript repair, before/after hooks, diagnostics, and safety timeout.
   - Evidence: `src/agents/pi-embedded-runner/compact.ts`; `src/agents/pi-embedded-runner/compaction-safety-timeout.ts`.
4. Core compaction algorithm includes adaptive chunking, staged summarization, oversized-message fallbacks, and repair of tool-use/tool-result pairing.
   - Evidence: `src/agents/compaction.ts`.

Council assessment: OpenClaw runtime already implements mature local compaction controls and guarded recovery loops.

### 2.3 Configurable long-context controls

1. Context window guard + cap exists (`agents.defaults.contextTokens`).
   - Evidence: `src/agents/context-window-guard.ts`.
2. History can be bounded per provider/session (`historyLimit`, `dmHistoryLimit`).
   - Evidence: `src/agents/pi-embedded-runner/history.ts`.
3. Context pruning extension supports `cache-ttl`, soft trim, and hard clear policies.
   - Evidence: `src/agents/pi-embedded-runner/extensions.ts`; `src/agents/pi-extensions/context-pruning/*`.
4. Compaction safeguard mode is defaulted at config level.
   - Evidence: `src/config/defaults.ts` (`applyCompactionDefaults`).

Council assessment: platform has policy knobs, but operator visibility and unified governance reporting are still limited.

### 2.4 Pre-compaction memory flush behavior

1. Pre-compaction memory flush settings exist and default on.
   - Evidence: `src/auto-reply/reply/memory-flush.ts`.
2. Flush executes before main follow-up turn when thresholds indicate near-compaction risk.
   - Evidence: `src/auto-reply/reply/agent-runner-memory.ts`; `src/auto-reply/reply/agent-runner.ts`.

Council assessment: this is a meaningful "do not lose durable memory" safeguard for long sessions.

### 2.5 Current gap versus new OpenAI primitives

1. Gateway schema accepts `previous_response_id`, `truncation`, `reasoning`, but runtime path does not actively use `previous_response_id` or expose compaction controls.
   - Evidence: `src/gateway/open-responses.schema.ts`; `src/gateway/openresponses-http.ts`.
2. No explicit `/v1/responses/compact` compatibility route exists.
   - Evidence: no compact route implementation under `src/gateway/*`.

Council assessment: Ted/OpenClaw already solves context management locally, but OpenAI-native compaction controls are not yet first-class in gateway compatibility mode.

### 2.6 Important distinction: prompt compaction vs ledger compaction

1. Ted also has ledger compaction for historical JSONL retention/archival under self-healing.
   - Evidence: `sidecars/ted-engine/server.mjs` (`compactLedger`, `_runLedgerCompaction`), `sidecars/ted-engine/modules/self_healing.mjs`.

Council assessment: this is data retention/ops compaction, not LLM prompt-context compaction.

## 3. External research digest (official sources)

1. OpenAI now documents response-state compaction and context management controls:
   - `previous_response_id` for linked state,
   - `context_management.compaction` with `auto` / `disabled`,
   - `compact_threshold` for proactive compaction,
   - explicit `POST /v1/responses/compact` endpoint,
   - `response.compacted` event for stream telemetry.
2. Anthropic guidance emphasizes:
   - long context windows,
   - prompt caching (cache hits discount repeated context cost),
   - context editing strategies to clear tool payloads or old thinking while preserving useful state.
3. Google Gemini guidance emphasizes:
   - context caching for repeated long prefixes,
   - structuring large context with explicit instructions and ordering discipline.

Inference: leading providers are converging on three shared best practices:

1. deterministic context shaping,
2. explicit compaction/caching controls,
3. observability around what was retained vs compacted.

## 4. Requirement decision

Council decision: Treat this as a formal requirement (P1 priority, with one P0 policy fix).

### P0 policy fix (now)

1. Avoid silent field acceptance for unsupported compaction semantics.
   - Either implement `previous_response_id` behavior in gateway compatibility mode, or reject with explicit unsupported error.

### P1 feature requirements

1. Unified Context Lifecycle Policy
   - Standardize one policy object controlling: history limits, pruning mode, compaction mode, reserve floor, soft thresholds, provider-specific behavior.
2. Compaction Observability
   - Emit canonical events and ledger entries for compaction trigger, outcome, token delta, and fallback branch.
3. Provider-aware Context Adapter
   - Support provider-native capabilities where available (OpenAI compaction APIs, Anthropic context editing/caching, Google context caching) behind policy gates.
4. Operator UX controls
   - Add explicit UI surface for context health: window pressure, compaction count, dropped/truncated sections, and recommended actions.

## 5. Architecture impact by plane (required mapping)

1. Control plane
   - Add `context_lifecycle_policy` configuration and validation.
2. Contract plane
   - Define deterministic retention and summarization contract for compaction outputs.
3. Connector plane
   - No primary transport change required; this is model/context lifecycle scope.
4. State plane
   - Add compaction telemetry events and materialized metrics ledger (or extension of existing ops metrics).
5. Experience plane
   - Add operator visibility/control for context pressure and compaction decisions.

## 6. Recommended execution waves and task list

### Wave A - Governance and truthfulness (P0)

1. Decide strict behavior for currently accepted-but-not-implemented compaction fields.
2. Implement chosen behavior and tests in gateway OpenResponses path.
3. Add release note entry in SDD changelog trail.

Acceptance:

1. Gateway behavior is explicit and non-ambiguous.
2. No regression in `/v1/responses` compatibility tests.

### Wave B - Unified policy and telemetry (P1)

1. Introduce `context_lifecycle_policy` model and defaults.
2. Emit events:
   - `context.compaction.started`
   - `context.compaction.completed`
   - `context.compaction.failed`
   - `context.overflow.recovery`
3. Record token deltas and retention decisions in metrics ledger.

Acceptance:

1. Policy is validated and documented.
2. Compaction events visible in telemetry and replay.

### Wave C - Provider-aware adapters (P1)

1. OpenAI: add optional native compaction adapter support (including proactive threshold mode).
2. Anthropic: formalize context-editing/caching profile in policy templates.
3. Google: formalize context caching profile and large-context instruction template.

Acceptance:

1. Capability matrix documented by provider/model.
2. Automated tests prove fallback when provider feature is unavailable.

### Wave D - Operator controls and runbooks (P1)

1. Add UI card for context pressure + compaction status.
2. Add runbook for "context overflow incident" handling.
3. Add replay checks proving no decision-loss across compaction cycles.

Acceptance:

1. Operator can see and act on context health without code changes.
2. Replay corpus shows no material instruction-loss regressions.

## 7. Council recommendation

Ted already has substantial context management depth and is not missing the core capability category.  
However, to align with current provider-native best practice and reduce governance ambiguity, execute Wave A immediately and schedule Waves B-D as the next long-context hardening track.

## References

1. OpenAI - Conversation state guide: https://platform.openai.com/docs/guides/conversation-state?api-mode=responses
2. OpenAI - Context management and compaction guide: https://platform.openai.com/docs/guides/conversation-state?api-mode=responses#context-management
3. OpenAI - Responses API reference (`compact` endpoint): https://platform.openai.com/docs/api-reference/responses/compact
4. OpenAI - Responses object (`response.compacted` event): https://platform.openai.com/docs/api-reference/responses/object
5. Anthropic - Context windows: https://docs.anthropic.com/en/docs/build-with-claude/context-windows
6. Anthropic - Prompt caching: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
7. Anthropic - Context editing: https://docs.anthropic.com/en/docs/build-with-claude/context-windows#context-editing
8. Anthropic - Long context tips: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/long-context-tips
9. Google - Context caching (Gemini API): https://ai.google.dev/gemini-api/docs/context-caching
10. Google - Prompting strategies for long context: https://ai.google.dev/gemini-api/docs/prompting-strategies
