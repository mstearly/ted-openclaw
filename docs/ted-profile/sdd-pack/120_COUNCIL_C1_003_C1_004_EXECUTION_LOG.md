# SDD 120: C1-003 and C1-004 Execution Log (Context Compatibility and Fallback)

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Tasks:** SDD 107 `C1-003`, `C1-004`

---

## 1. Scope

Execute the next dependency-safe context semantics tasks:

1. `C1-003` compatibility guard for model/path mismatch.
2. `C1-004` deterministic runtime fallback for missing continuation context.

---

## 2. Implemented Changes

1. Added model compatibility guard for `previous_response_id`:
   - only `openclaw` model family is eligible,
   - non-eligible models receive explicit `invalid_request_error`.
2. Implemented tracked continuation map for previous responses:
   - bounded in-memory index,
   - TTL cleanup,
   - deterministic lookup by `previous_response_id`.
3. Implemented fallback policy when continuation lookup misses:
   - request continues with current resolved session,
   - response metadata includes `continuation_status=fallback` and reason code `previous_response_not_found`.
4. Added response metadata surfacing for context semantics branch visibility.
5. Added request-correlated context semantics telemetry events:
   - `context.semantics.selected`,
   - `context.semantics.rejected`,
   - `context.semantics.fallback`.

---

## 3. Acceptance Evidence

1. `src/gateway/openresponses-http.e2e.test.ts` verifies:
   - model mismatch rejection for `previous_response_id`,
   - fallback metadata on missing previous response,
   - continuation path reuses prior session key when prior response exists.
2. `src/gateway/openresponses-parity.e2e.test.ts` remains green.

---

## 4. Files Updated

1. `src/gateway/openresponses-http.ts`
2. `src/gateway/open-responses.schema.ts`
3. `src/gateway/openresponses-http.e2e.test.ts`
4. `docs/ted-profile/sdd-pack/117_COUNCIL_C0_CONTEXT_SEMANTICS_FIELD_INVENTORY_POLICY.md`
5. `docs/ted-profile/sdd-pack/113_COUNCIL_WAVE_I0_EXECUTION_LOG.md`

---

## 5. Next Dependency-Safe Tasks

1. `C2-001` branch/unit tests for full context semantics surface.
2. `C2-003` context semantics telemetry events.
3. `C2-004` operator/developer docs update for continuation/fallback usage.
