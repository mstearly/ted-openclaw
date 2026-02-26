# SDD 103 - Council Critical Review: Clint Email Ask 5 (Monday.com + RightSignature)

Date: 2026-02-26  
Status: Council recommendation package (decision-ready)

## 1. Council understanding of Clint's ask

Clint asked to include Monday.com and RightSignature and wants clarity on ownership: "Do you need to activate those or me?"

Council interpretation:

1. This is both a product capability question and an activation-ownership question.
2. Clint is asking for practical go-live mechanics, not only architecture intent.

## 2. Platform capability assessment (code and SDD verified)

### 2.1 Current connector state in Ted

1. Monday.com and DocuSign are explicitly tracked as planned/pending integrations, not implemented connectors.
   - Evidence: `docs/ted-profile/sdd-pack/40_INTAKE_CONFIG_TRACEABILITY.md`, `sidecars/ted-engine/config/ted_technology_radar.json`.
2. Blueprint events include future integration signals (`monday.item.updated`, `docusign.status.changed`) but no production module is wired yet.
   - Evidence: `docs/ted-profile/sdd-pack/42_TED_SYSTEM_BLUEPRINT.md`.
3. RightSignature is not currently represented as a first-class connector in sidecar/runtime code.
   - Evidence: codebase search across `sidecars/ted-engine`, `extensions`, `src`, `ui/src/ui`.

Council assessment: neither Monday.com nor RightSignature is currently active as a native Ted connector.

### 2.2 Existing fast path already available

Ted now has a governed external MCP connection surface with add/edit/test/admission/revalidate support:

1. External MCP server registry and admission APIs exist.
2. Operator UI support exists to manage these connections.

Evidence: `sidecars/ted-engine/server.mjs` (`/ops/mcp/external/servers*`), `ui/src/ui/views/ted.ts`, `extensions/ted-sidecar/index.ts`, `docs/ted-profile/sdd-pack/85_COUNCIL_MCP_MSP_CONNECTION_DECISION.md`.

Council assessment: if a usable Monday MCP server is acceptable, Monday can start as a governance-controlled MCP connection before a full native connector.

### 2.3 Scope note: RightSignature changes intake baseline

Current intake names DocuSign specifically. RightSignature adds a new e-sign provider scope.

Evidence: `docs/ted-profile/client_intake_COMPLETED.md` (DocuSign called out in systems list).

Council assessment: this is a scope expansion, not just a credential handoff.

## 3. External research digest (trusted primary sources)

### 3.1 Monday.com

1. Monday API is GraphQL with token-based auth; OAuth is recommended for server-side/background calls.
2. Integration runtime can issue short-lived tokens (about 5 minutes), but those are not a substitute for long-running background jobs.
3. Monday recommends using webhooks to reduce polling load and API waste.
4. Monday API is versioned on a predictable cadence; version headers should be pinned.
5. Monday documents MCP connectivity guidance (currently marked beta).

Council inference: production Ted integration should be webhook-driven + version-pinned + OAuth-based for durable automation. MCP is valid as a controlled acceleration path.

### 3.2 RightSignature

1. API access requires the right ShareFile plan (or API-enabled trial path) and approved API credentials.
2. Authentication supports both private API token model and OAuth 2.0.
3. OAuth access tokens expire (2-hour window) and support refresh.
4. API v2 supports higher send throughput; documented send limits exist.
5. Sending request callbacks provide lifecycle events, but callback ordering is explicitly not guaranteed.

Council inference: RightSignature is integration-feasible, but requires explicit async-event handling, retries, idempotency, and provider-side entitlement setup before coding.

## 4. Direct answer to Clint's activation question

Answer: **both sides must activate different parts.**

### Clint (operator/account owner) activates vendor-side prerequisites

1. Monday:
   - Create/authorize app or token model in Monday admin/developer center.
   - Approve scopes and provide tenant/account context.
2. RightSignature:
   - Confirm plan/API entitlement.
   - Request and approve API key/client credentials.
   - Approve OAuth redirect/callback settings if OAuth path is used.

### Council/platform team activates Ted-side integration

1. Add connector/admission policy entries and secret references.
2. Implement or configure connector runtime (MCP-first or native).
3. Add route/tool contracts, tests, replay fixtures, and audit telemetry.
4. Enable only after governance gates pass.

## 5. Requirement decision

Council decision: treat this as a formal requirement with two tracks:

1. Monday.com: **execute MR-0 now** (high value, high confidence path).
2. RightSignature: **execute after entitlement confirmation** and align it to an e-sign provider abstraction (to avoid one-off coupling).

## 6. Architecture impact by plane (required mapping)

1. Control plane
   - Extend connector admission policy with `monday` and `rightsignature` capability records, scope gates, and write-tier controls.
2. Connector plane
   - Add Monday connector path (MCP fast path and/or native GraphQL connector).
   - Add RightSignature connector path (REST + callback receiver + token refresh handling).
3. State plane
   - Add provider ledgers/events (`monday_sync_*`, `esign_status_*`) with idempotency keys and retry traces.
4. Contract plane
   - Add contracts for item/document lifecycle operations and callback payload validation.
5. Experience plane
   - Add setup/testing UI cards so Clint can validate credentials and run test calls without curl.

## 7. Recommended execution waves

### Wave MR-0 - Activation and ownership lock (immediate)

1. Confirm provider ownership and exact tenant/accounts.
2. Publish required credential checklist and redirect/callback URLs.
3. Decide Monday auth mode (OAuth preferred for background automation).
4. Confirm RightSignature API entitlement is active.

Acceptance:

1. Credential package complete and validated.
2. No hardcoded secrets or tenant IDs in source.

### Wave MR-1 - Monday read-only integration (fast path)

**Dependency gate:** Start after P0-4 live Graph signoff, or in isolated branch without production activation before P0-4 closure.

1. Start with MCP connection if acceptable, else native read-only GraphQL path.
2. Implement board/item/project read models into Ted connector events.
3. Add webhook ingestion (or event trigger equivalent) and retry-safe processing.

Acceptance:

1. Ted can fetch and reconcile Monday state with auditable events.
2. Replay tests show deterministic outcomes for read/update deltas.

### Wave MR-2 - RightSignature read-only + callback ingestion

**Dependency gate:** Start after P0-4 live Graph signoff, or in isolated branch without production activation before P0-4 closure.

1. Implement document/template status reads.
2. Implement callback receiver with signature/auth checks and idempotent processing.
3. Emit normalized `esign.status.changed` events in Ted state model.

Acceptance:

1. Ted receives and records RightSignature lifecycle updates reliably.
2. Out-of-order callback deliveries do not corrupt state.

### Wave MR-3 - Governed write capabilities

1. Monday write actions (create/update items) under confirmation tier by default.
2. RightSignature send/share actions under confirmation tier by default.
3. Add dry-run, explainability, and rollback controls.

Acceptance:

1. All write paths are approval-gated and auditable.
2. No regression in existing governance guarantees.

### Wave MR-4 - Operator UX and friction outcomes

1. Add setup wizard cards for Monday and RightSignature credentials, test calls, and health.
2. Add friction/outcome metrics per connector:
   - `time_to_first_success`,
   - `auth_failure_rate`,
   - `retry_rate`,
   - `operator_override_rate`.
3. Promote connector readiness to release gates.

Acceptance:

1. Clint can onboard/test both connectors from Ted UI.
2. Connector promotion is evidence-based, not subjective.

## 8. Council recommendation

1. Proceed with Monday MR-0 now; gate MR-1+ behind P0-4 signoff for production activation.
2. Proceed with RightSignature after Clint confirms API entitlement and desired e-sign operating model (replace DocuSign vs dual-provider), with MR-2+ also gated behind P0-4 for production activation.
3. Keep strict split of responsibilities: Clint activates vendor accounts/consent; council activates Ted integration/governance.
4. Do not bypass connector admission, replay, or approval gates to accelerate rollout.

## References

### Internal evidence

1. `docs/ted-profile/sdd-pack/40_INTAKE_CONFIG_TRACEABILITY.md`
2. `docs/ted-profile/sdd-pack/42_TED_SYSTEM_BLUEPRINT.md`
3. `docs/ted-profile/sdd-pack/85_COUNCIL_MCP_MSP_CONNECTION_DECISION.md`
4. `docs/ted-profile/client_intake_COMPLETED.md`
5. `sidecars/ted-engine/config/ted_technology_radar.json`
6. `sidecars/ted-engine/server.mjs`
7. `ui/src/ui/views/ted.ts`
8. `extensions/ted-sidecar/index.ts`

### External sources

1. Monday API authentication: https://developer.monday.com/api-reference/docs/authentication
2. Monday choosing auth method (OAuth/background guidance): https://developer.monday.com/apps/docs/choosing-auth
3. Monday integration authorization and short-lived tokens: https://developer.monday.com/apps/docs/integration-authorization
4. Monday API versioning: https://developer.monday.com/api-reference/docs/api-versioning
5. Monday optimizing API usage (webhooks/retry guidance): https://developer.monday.com/api-reference/docs/optimizing-api-usage
6. Monday workflow action runtime contract: https://developer.monday.com/apps/docs/workflows-actions
7. Monday MCP guide: https://developer.monday.com/api-reference/docs/connect-claude-for-desktop-to-mondaycom-mcp
8. RightSignature getting started (plan + API access + rate limits): https://api.rightsignature.com/documentation/getting_started
9. RightSignature authentication models: https://api.rightsignature.com/documentation/authentication
10. RightSignature OAuth authorize: https://api.rightsignature.com/documentation/resources/v2/oauth_authorizations.en.html
11. RightSignature OAuth token: https://api.rightsignature.com/documentation/resources/v2/oauth_tokens.en.html
12. RightSignature document workflows: https://api.rightsignature.com/documentation/document_workflows
13. RightSignature sending request callbacks/events: https://api.rightsignature.com/documentation/resources/v2/sending_requests.en.html
14. RightSignature API v2 notes and limits: https://api.rightsignature.com/documentation/new
