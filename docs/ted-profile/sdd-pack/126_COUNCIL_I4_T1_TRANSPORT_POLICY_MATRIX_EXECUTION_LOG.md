# SDD 126: Wave I4 T1 - Transport Capability Matrix and Policy Contract Execution Log

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Tasks:** SDD 108 `T1-001`, `T1-002`, `T1-003`

---

## 1. Scope

Execute Plan 2 Wave T1 tasks:

1. `T1-001` capability matrix artifact.
2. `T1-002` transport policy schema + startup validator.
3. `T1-003` operator-visible transport status contract.

---

## 2. Execution Outcomes

### T1-001 Capability matrix artifact

Added config contract for `transportCapabilityMatrix` under
`gateway.http.endpoints.responses` with matrix entries:

1. `provider`
2. `model`
3. `websocketMode`
4. `streaming`
5. `continuationSemantics`
6. `knownFallbackTriggers`

Evidence:

1. `src/config/types.gateway.ts`
2. `src/config/zod-schema.ts`
3. `src/gateway/openresponses-transport-config.ts`

### T1-002 Policy schema + validator

Added transport policy contract and fail-closed startup validation:

1. Policy fields:
   - `mode` (`sse|websocket|auto`)
   - `canaryPercent`
   - `forceSseOnErrorCode`
   - `maxWsRetries`
2. Runtime validation blocks startup on invalid matrix/policy consistency.
3. Selection contract resolves deterministic SSE fallback reasons until T2 websocket runtime path lands.

Evidence:

1. `src/config/types.gateway.ts`
2. `src/config/zod-schema.ts`
3. `src/gateway/openresponses-transport-config.ts`
4. `src/gateway/server-runtime-config.ts`
5. `src/gateway/server-runtime-config.test.ts`

### T1-003 Operator visibility endpoint

Added read endpoint:

1. `GET /v1/responses/transport`

Contract includes:

1. Active policy.
2. Capability matrix status.
3. Per-model selection decision (`requested_mode`, `selected_transport`, `fallback_reason`).
4. Explicit fallback reason catalog.

Evidence:

1. `src/gateway/http-endpoint-helpers.ts`
2. `src/gateway/openresponses-http.ts`
3. `src/gateway/server-http.ts`
4. `src/gateway/openresponses-http.e2e.test.ts`
5. `docs/gateway/openresponses-http-api.md`

---

## 3. Validation

Executed:

```bash
pnpm vitest run src/gateway/openresponses-transport-config.test.ts src/gateway/openresponses-transport.test.ts src/gateway/openresponses-http.context-semantics.test.ts src/gateway/server-runtime-config.test.ts
pnpm vitest run --config vitest.e2e.config.ts src/gateway/openresponses-http.e2e.test.ts src/gateway/openresponses-parity.e2e.test.ts
```

Result:

1. Unit/runtime suites passed (16/16 tests).
2. OpenResponses e2e/parity suites passed (20/20 tests).

---

## 4. Exit Decision for Wave T1

`T1-001`, `T1-002`, and `T1-003` are satisfied.

Next actionable item:

1. Start `T2-001` transport selector precedence and controlled websocket path implementation.
