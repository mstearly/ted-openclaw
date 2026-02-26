# SDD 107: Plan 1 - Context Truthfulness Task Breakdown (SDD 100 Wave A-first)

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parents:** SDD 100, SDD 104, SDD 105  
**Mandate:** Deliver explicit, testable gateway context semantics before any transport optimization.

---

## 1. Program Goal

Remove ambiguity in OpenResponses context behavior by making `previous_response_id` and compaction semantics explicit, deterministic, and audited.

Success criteria:

1. No accepted-but-unimplemented context fields.
2. Clear supported/unsupported responses with deterministic fallback.
3. Full test coverage for supported, unsupported, and fallback branches.

---

## 2. Wave Order

1. Wave C0: Contract decision + schema audit
2. Wave C1: Gateway strict semantics implementation
3. Wave C2: Tests, telemetry, and docs
4. Wave C3: Release gating and handoff

---

## 3. Task Board

## Wave C0: Contract Decision and Schema Audit

### C0-001 Enumerate all context-related request fields accepted today

1. Inspect OpenResponses schema and route parsing paths.
2. List field-level behavior as `implemented`, `ignored`, or `ambiguous`.

Acceptance:

1. Field inventory document produced with explicit status per field.

Dependencies:

1. None

### C0-002 Decide strict behavior policy per field

1. For each ambiguous field, decide one policy:
   - `implement_now`,
   - `reject_explicitly`,
   - `accept_with_noop_disclosure` (avoid unless required).
2. Ratify this policy with council owners.

Acceptance:

1. Signed policy map exists and is versioned.

Dependencies:

1. C0-001

### C0-003 Define response error contract for unsupported semantics

1. Add canonical error type/code/message template.
2. Include actionable remediation text in error details.

Acceptance:

1. Error contract is stable and referenced by tests.

Dependencies:

1. C0-002

## Wave C1: Gateway Strict Semantics Implementation

### C1-001 Implement explicit `previous_response_id` handling path

1. Route requests with `previous_response_id` through implemented continuation behavior where supported.
2. If unsupported in current runtime path, return explicit unsupported error contract.

Acceptance:

1. No silent ignore of `previous_response_id`.

Dependencies:

1. C0-003

### C1-002 Implement explicit `context_management.compaction` handling path

1. Parse compaction policy fields.
2. Apply supported behaviors only.
3. Emit unsupported error contract for unsupported modes/values.

Acceptance:

1. Compaction field behavior is deterministic and documented.

Dependencies:

1. C0-003

### C1-003 Add compatibility guard for model/path capability mismatch

1. Validate whether requested semantics are compatible with selected model/path.
2. Fail fast with explicit reason when incompatible.

Acceptance:

1. Incompatible requests fail predictably before execution.

Dependencies:

1. C1-001
2. C1-002

### C1-004 Add runtime fallback policy hook

1. Define fallback behavior when continuation lookup fails (for example `previous_response_not_found`).
2. Ensure fallback path is visible in response metadata.

Acceptance:

1. Fallback branch runs deterministically and is auditable.

Dependencies:

1. C1-001

## Wave C2: Tests, Telemetry, and Documentation

### C2-001 Add unit tests for all context field branches

1. Supported semantics tests.
2. Unsupported semantics tests.
3. Fallback branch tests.

Acceptance:

1. Branch coverage for context handling logic meets agreed threshold.

Dependencies:

1. C1-001
2. C1-002
3. C1-003
4. C1-004

### C2-002 Add integration tests for gateway OpenResponses contract

1. Validate response payloads and error payloads against contract.
2. Validate no regression for existing clients not sending these fields.

Acceptance:

1. Compatibility tests pass across legacy and new behavior paths.

Dependencies:

1. C2-001

### C2-003 Emit context-semantics telemetry events

1. Add `context.semantics.selected`.
2. Add `context.semantics.rejected`.
3. Add `context.semantics.fallback`.

Acceptance:

1. Events appear in logs/ledgers with request correlation ids.

Dependencies:

1. C1-001
2. C1-002
3. C1-004

### C2-004 Update operator/developer docs

1. Document supported fields and unsupported behavior.
2. Add examples for continuation and fallback usage.

Acceptance:

1. Docs match runtime behavior exactly.

Dependencies:

1. C2-001
2. C2-002

## Wave C3: Release Gating and Handoff

### C3-001 Define release gate checks for context truthfulness

1. Add required CI checks for context semantics tests.
2. Add contract check step in release checklist.

Acceptance:

1. Release cannot proceed with context-semantics regressions.

Dependencies:

1. C2-001
2. C2-002

### C3-002 Execute replay validation on golden corpus

1. Run baseline corpus before and after changes.
2. Verify no material behavior drift outside intended semantics changes.

Acceptance:

1. Replay diff report is approved.

Dependencies:

1. C3-001

### C3-003 Handoff package to Plan 2 owner (transport)

1. Publish completion report.
2. Confirm Plan 2 dependency (SDD 107 completion) is satisfied.

Acceptance:

1. Plan 2 unblocked with signed dependency checkpoint.

Dependencies:

1. C3-002

---

## 4. Dependency Summary

1. C0-001 -> C0-002 -> C0-003
2. C0-003 -> C1-001/C1-002 -> C1-003/C1-004
3. C1-_ -> C2-_ -> C3-\*
4. C3-003 is mandatory predecessor for SDD 108 Wave T1/T2.

---

## 5. Ready-to-Execute Checklist

1. Owners assigned for every task id.
2. Context-semantics policy approved.
3. CI test slot reserved.
4. Replay corpus and baseline snapshot available.
