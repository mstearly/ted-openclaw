# SDD 125: Wave I4 T0 - Transport Baseline and Telemetry Execution Log

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Tasks:** SDD 108 `T0-001`, `T0-002`, `T0-003`

---

## 1. Scope

Execute Plan 2 Wave T0 transport groundwork:

1. `T0-001` baseline replay set for tool-heavy scenarios.
2. `T0-002` transport telemetry primitives.
3. `T0-003` run-level transport summary projection.

---

## 2. Council Recommendation for Next Action

1. Start with T0 evidence and instrumentation (no transport behavior change).
2. Keep execution on SSE while adding explicit telemetry and summary visibility.
3. Move to `T1-001` capability matrix only after T0 pass evidence is recorded.

---

## 3. Execution Outcomes

### T0-001 Baseline replay set captured

Baseline corpus is versioned and reproducible from existing gateway replay/contract suites:

1. `src/gateway/openresponses-http.e2e.test.ts`
2. `src/gateway/openresponses-parity.e2e.test.ts`

Baseline execution command:

```bash
pnpm vitest run --config vitest.e2e.config.ts \
  src/gateway/openresponses-http.e2e.test.ts \
  src/gateway/openresponses-parity.e2e.test.ts
```

Observed baseline result:

1. 19/19 tests passed.
2. No contract drift detected.

### T0-002 Transport telemetry primitives implemented

Implemented telemetry events in gateway OpenResponses transport helper:

1. `llm.transport.selected`
2. `llm.transport.fallback`
3. `llm.transport.latency.sample`

Evidence:

1. `src/gateway/openresponses-transport.ts`
2. `src/gateway/openresponses-http.ts`

### T0-003 Run-level transport summary projection implemented

Added run summary and per-provider/model aggregate projection:

1. Run summary fields:
   - `selected_transport`
   - `latency_ms`
   - `fallback_count`
   - `status`
2. Aggregate fields:
   - `run_count`
   - `fallback_ratio`
   - `latency_p50_ms`
   - `latency_p95_ms`
3. Exposed in response metadata at `metadata.transport`.

Evidence:

1. `src/gateway/openresponses-transport.ts`
2. `src/gateway/openresponses-http.ts`
3. `docs/gateway/openresponses-http-api.md`

---

## 4. Validation

Executed:

```bash
pnpm vitest run src/gateway/openresponses-transport.test.ts src/gateway/openresponses-http.context-semantics.test.ts
pnpm vitest run --config vitest.e2e.config.ts src/gateway/openresponses-http.e2e.test.ts src/gateway/openresponses-parity.e2e.test.ts
```

Result:

1. Unit suites passed (6/6 tests).
2. Gateway OpenResponses suites passed (19/19 tests).

---

## 5. Exit Decision for Wave T0

`T0-001`, `T0-002`, and `T0-003` are satisfied.

Next actionable item:

1. Start `T1-001` (`model_transport_capability_matrix` artifact + startup validation).
