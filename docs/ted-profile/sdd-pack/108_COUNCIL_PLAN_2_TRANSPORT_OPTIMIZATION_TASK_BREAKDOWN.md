# SDD 108: Plan 2 - Transport Optimization Task Breakdown (SDD 99)

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parents:** SDD 99, SDD 104, SDD 105  
**Mandate:** Improve tool-heavy run latency with controlled WebSocket enablement and deterministic SSE fallback.

---

## 1. Program Goal

Ship transport optimization safely by proving latency gains while preserving correctness and governance behavior.

Success criteria:

1. WebSocket only enabled for verified capability matrix entries.
2. Fallback to SSE is deterministic and observable.
3. No regression in tool sequencing, output contracts, or policy gates.

---

## 2. Wave Order

1. Wave T0: Baseline and instrumentation
2. Wave T1: Capability matrix and transport policy
3. Wave T2: Controlled WebSocket implementation
4. Wave T3: Validation, canary, and rollout guardrails

---

## 3. Task Board

## Wave T0: Baseline and Instrumentation

### T0-001 Capture baseline replay set for tool-heavy scenarios

1. Select representative tool-heavy corpus.
2. Execute baseline runs on current SSE path.
3. Record latency, retries, fallback counts, and correctness markers.

Acceptance:

1. Baseline dataset is versioned and reproducible.

Dependencies:

1. SDD 107 C3-003

### T0-002 Add transport telemetry event primitives

1. Emit `llm.transport.selected`.
2. Emit `llm.transport.fallback`.
3. Emit `llm.transport.latency.sample`.

Acceptance:

1. Events appear with run id, model id, and provider metadata.

Dependencies:

1. T0-001

### T0-003 Add run-level transport summary ledger projection

1. Persist per-run transport stats.
2. Expose derived p50/p95 latency and fallback ratio.

Acceptance:

1. Transport summary is queryable per run and per provider/model.

Dependencies:

1. T0-002

## Wave T1: Capability Matrix and Transport Policy

### T1-001 Create `model_transport_capability_matrix` artifact

1. Include provider/model entries.
2. Track support flags for:
   - websocket_mode,
   - streaming,
   - continuation semantics,
   - known fallback triggers.

Acceptance:

1. Matrix is validated at startup.

Dependencies:

1. T0-003

### T1-002 Add transport policy schema and validator

1. Add policy fields (`mode`, `canary_percent`, `force_sse_on_error_code`, `max_ws_retries`).
2. Validate matrix-policy consistency.

Acceptance:

1. Invalid policy or unsupported model mapping blocks startup.

Dependencies:

1. T1-001

### T1-003 Add admin/operator transport visibility surface contract

1. Define read endpoint for active policy and capability status.
2. Include explicit fallback reasons in response contract.

Acceptance:

1. Operator can inspect active transport decisions without logs.

Dependencies:

1. T1-002

## Wave T2: Controlled WebSocket Implementation

### T2-001 Implement transport selector with explicit precedence

1. Resolve transport by policy and capability matrix.
2. Default to SSE unless explicit WebSocket eligibility is satisfied.

Acceptance:

1. Transport selection is deterministic and testable.

Dependencies:

1. T1-002

### T2-002 Implement WebSocket execution path wrapper

1. Add provider-specific WebSocket call path where supported.
2. Preserve identical tool/event sequencing contracts.

Acceptance:

1. WebSocket runs execute end-to-end on supported matrix entries.

Dependencies:

1. T2-001

### T2-003 Implement deterministic SSE fallback controller

1. Trigger fallback on connectivity/auth/runtime incompatibility conditions.
2. Emit reason-coded fallback events.
3. Continue run through SSE path without task loss.

Acceptance:

1. All fallback triggers map to explicit reason codes.
2. No dropped run when fallback occurs.

Dependencies:

1. T2-002

### T2-004 Add retry and circuit-breaker safety bounds

1. Add max retry guard.
2. Add provider/model temporary disable after repeated failures.

Acceptance:

1. Repeated transport failures cannot cause infinite retry loops.

Dependencies:

1. T2-003

## Wave T3: Validation and Rollout Guardrails

### T3-001 Add parity tests for SSE vs WebSocket outputs

1. Validate output contract equivalence.
2. Validate tool-call ordering equivalence.
3. Validate policy gate equivalence.

Acceptance:

1. Parity tests pass for all supported matrix entries.

Dependencies:

1. T2-004

### T3-002 Run canary rollout by model/provider cohort

1. Start with smallest cohort.
2. Compare latency and correctness against baseline.
3. Auto-revert cohort to SSE if thresholds fail.

Acceptance:

1. Canary report includes pass/fail decision by cohort.

Dependencies:

1. T3-001

### T3-003 Publish rollout recommendation

1. Document net latency gain and reliability impact.
2. Approve expand/hold/revert decision.

Acceptance:

1. Board-ready summary generated with evidence links.

Dependencies:

1. T3-002

---

## 4. Dependency Summary

1. SDD 107 completion gate -> T0 start.
2. T0 -> T1 -> T2 -> T3 strict sequence.
3. T3-003 is prerequisite for broad production enablement.

---

## 5. Ready-to-Execute Checklist

1. SDD 107 C3-003 completed and signed.
2. Baseline corpus available.
3. Transport policy owner assigned.
4. Canary rollback authority assigned.
