# SDD 99 - Council Critical Review: Clint Email Ask 1 (WebSockets and Persistent Connections)

Date: 2026-02-26  
Status: Council recommendation package (decision-ready)

## 1. Council understanding of Clint's ask

Clint asked whether Ted already uses persistent connections for tool-heavy and connector-heavy execution (example connectors: Monday and DocuSign), and whether OpenAI Responses WebSocket mode should be on the roadmap or is irrelevant to Ted's architecture.

## 2. Platform capability assessment (code-verified)

### 2.1 Ted/OpenClaw runtime transport today

1. Gateway client connections are persistent WebSocket connections.
   - Evidence: `src/gateway/server-runtime-state.ts` creates a shared `WebSocketServer` for gateway runtime.
2. Gateway OpenResponses route is HTTP `POST /v1/responses` with SSE stream responses.
   - Evidence: `src/gateway/openresponses-http.ts` binds `pathname: "/v1/responses"` and uses `setSseHeaders(...)`.
   - Evidence: `src/gateway/http-common.ts` sets `Content-Type: text/event-stream` and `Connection: keep-alive`.
3. Embedded agent runtime uses `streamSimple` from `@mariozechner/pi-ai`.
   - Evidence: `src/agents/pi-embedded-runner/run/attempt.ts` sets `activeSession.agent.streamFn = streamSimple`.

### 2.2 LLM provider transport behavior today

1. OpenAI Responses path in installed runtime library currently calls `client.responses.create(...)` (HTTP streaming path), not WebSocket mode.
   - Evidence: `node_modules/@mariozechner/pi-ai/dist/providers/openai-responses.js`.
2. OpenAI Codex Responses supports `transport` with optional WebSocket in the library, but default is SSE and no Ted/OpenClaw code sets transport.
   - Evidence: `node_modules/@mariozechner/pi-ai/dist/providers/openai-codex-responses.js` (`transport = options?.transport || "sse"`).
   - Evidence: no `setTransport(...)` use in `src/agents/pi-embedded-runner`.

### 2.3 Connector layer behavior today

1. Ted sidecar connector and internal tool routing are request-cycle HTTP calls.
   - Evidence: `sidecars/ted-engine/server.mjs` `mcpCallInternal(...)` calls loopback `fetch(...)` per tool invocation.
2. External service operations are request-cycle `fetch(...)` calls with retry/circuit breaker logic.
   - Evidence: `sidecars/ted-engine/server.mjs` Graph requests and `graphFetchWithRetry(...)`.
3. Monday and DocuSign are not yet implemented as first-class live connectors in current Ted execution path.
   - Evidence: `docs/ted-profile/sdd-pack/40_INTAKE_CONFIG_TRACEABILITY.md` marks both "Not yet connected".
   - Evidence: `docs/ted-profile/sdd-pack/45_COUNCIL_CRITICAL_REVIEW_CYCLE_007.md` lists external connectors as a gap.

## 3. External research digest (trusted sources)

1. OpenAI documents a Responses WebSocket mode at `wss://api.openai.com/v1/realtime/responses`, with stateful mode and a cited "up to 40%" performance gain for tool-heavy workflows.
2. OpenAI also documents HTTP streaming via SSE for API responses.
3. monday.com API is GraphQL over HTTP `POST` to `https://api.monday.com/v2` (request/response model).
4. Microsoft Graph recommends webhook/event subscriptions for change delivery with retry/backoff semantics.
5. DocuSign Connect is webhook-based and recommends asynchronous processing/queue-backed listeners instead of polling-style loops.

Inference: persistent WebSocket transport is most relevant for LLM roundtrip/tool-loop latency; for external SaaS connectors, webhook plus queue is the higher-value reliability pattern versus long-lived outbound sockets.

## 4. Council verdict

1. Ted is not currently using OpenAI Responses WebSocket mode in its main runtime path.
2. This is relevant (not irrelevant) for tool-heavy LLM turns and should be added to roadmap as a controlled optimization.
3. For connector integrations (Monday/DocuSign/Graph), persistent WebSocket sessions are not the primary architecture win; webhook/event-driven ingestion with durable queueing should remain the default connector strategy.

## 5. Architecture impact by plane (required mapping)

1. Control plane
   - Add transport policy (`sse|websocket|auto`) and per-provider rollout guards.
2. Connector plane
   - Keep connector execution request/response for actions; add webhook ingress for event streams.
3. State plane
   - Add transport and latency telemetry events to `event_log`; append run-level transport stats to ops ledgers.
4. Contract plane
   - Extend sidecar/gateway contracts for transport status and operator-visible fallback reason.
5. Experience plane
   - Add operator-facing transport status card (active mode, fallback count, latency delta).

## 6. Recommended execution plan

### Wave A - Baseline and observability (execute first)

1. Capture current latency/cost/tool-loop baseline for SSE path.
2. Emit transport telemetry events:
   - `llm.transport.selected`
   - `llm.transport.fallback`
   - `llm.transport.latency.sample`
3. Add regression guardrails so transport changes cannot bypass policy gates.

Acceptance:

1. Baseline report generated for identical replay corpus before transport changes.
2. No behavior drift in reply/tool correctness for baseline test set.

### Wave B - Controlled WebSocket enablement for OpenAI/Codex

**Dependency gate:** Execute only after SDD 100 Wave A (context semantics truthfulness) is complete.

1. Add policy-controlled transport selection (default `sse`, opt-in by provider/model).
2. Enable WebSocket where library/provider support is confirmed.
3. Enforce automatic fallback to SSE on connection error, auth mismatch, or runtime incompatibility.
4. Add tests for:
   - websocket selected
   - websocket fallback to sse
   - parity of outputs and tool sequencing

Acceptance:

1. No test regressions.
2. Transport fallback is deterministic and logged.
3. Measured improvement on tool-heavy replay set.

### Wave C - Connector strategy alignment (non-WebSocket)

1. Keep connector actions as standard request-cycle APIs.
2. Prioritize webhook/event ingestion for connector change streams (Graph/Monday/DocuSign pattern).
3. Queue-first processing for reliability and retry isolation.

Acceptance:

1. Event ingress survives listener latency and retries without data loss in test harness.
2. Connector sync logic remains deterministic and replayable.

## 7. Council recommendation (decision)

Proceed with Wave A now, then Wave B only after SDD 100 Wave A completes.  
Do not prioritize persistent WebSocket sessions for connector action APIs; prioritize webhook + queue connector ingestion strategy instead.

## References

1. OpenAI - WebSocket mode: https://developers.openai.com/api/docs/guides/websocket-mode
2. OpenAI - Responses API and streaming guidance: https://platform.openai.com/docs/guides/streaming-responses?api-mode=responses
3. OpenAI - Compaction guidance (related long-context capability): https://developers.openai.com/topics/text
4. monday.com API (GraphQL endpoint): https://developer.monday.com/api-reference/docs/getting-started
5. monday.com GraphQL overview: https://developer.monday.com/api-reference/docs/introduction-to-graphql
6. Microsoft Graph webhook delivery: https://learn.microsoft.com/en-us/graph/change-notifications-delivery-webhooks
7. DocuSign Connect webhook overview and best-practice guidance: https://www.docusign.com/blog/developers/using-connects-send-individual-messages-feature
8. DocuSign webhook listener async processing guidance: https://www.docusign.com/blog/dsdev-webhook-listeners-part-2
