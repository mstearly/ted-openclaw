# SDD 105 - Council Targeted Deep Research Round (SDD 99-103 Follow-up)

Date: 2026-02-26  
Status: Targeted research completed (decision-ready)

## 1. Scope and objective

This round executed the four targeted research tracks from SDD 104:

1. OpenAI transport/context compatibility.
2. Monday production constraints.
3. RightSignature production constraints.
4. Mobile reliability (channel vs native push, including Android parity).

Required outputs:

1. Supported/unsupported/fallback matrix.
2. Conflict check for SDD 99/100/103.
3. Explicit value-left-behind list with defer rationale.

## 2. Immediate change execution status (from SDD 104)

Completed:

1. SDD 99 now gates WebSocket Wave B behind SDD 100 Wave A.
   - Evidence: `docs/ted-profile/sdd-pack/99_COUNCIL_CLINT_EMAIL_WEBSOCKET_PERSISTENCE_REVIEW.md:86`
   - Evidence: `docs/ted-profile/sdd-pack/99_COUNCIL_CLINT_EMAIL_WEBSOCKET_PERSISTENCE_REVIEW.md:113`
2. SDD 103 now limits "execute now" to MR-0 and gates MR-1/MR-2 production activation behind P0-4 signoff.
   - Evidence: `docs/ted-profile/sdd-pack/103_COUNCIL_CLINT_EMAIL_MONDAY_RIGHTSIGNATURE_INTEGRATION_REVIEW.md:94`
   - Evidence: `docs/ted-profile/sdd-pack/103_COUNCIL_CLINT_EMAIL_MONDAY_RIGHTSIGNATURE_INTEGRATION_REVIEW.md:127`
   - Evidence: `docs/ted-profile/sdd-pack/103_COUNCIL_CLINT_EMAIL_MONDAY_RIGHTSIGNATURE_INTEGRATION_REVIEW.md:140`
   - Evidence: `docs/ted-profile/sdd-pack/103_COUNCIL_CLINT_EMAIL_MONDAY_RIGHTSIGNATURE_INTEGRATION_REVIEW.md:179`

## 3. Targeted compatibility matrix

### 3.1 OpenAI transport/context matrix

| Capability                                                              | Status                     | Evidence                                                                                                                      | Required fallback                                                         |
| ----------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Responses WebSocket mode (`wss://api.openai.com/v1/realtime/responses`) | Supported at API level     | OpenAI docs describe low-latency streaming transport and same Responses API semantics                                         | Fallback to SSE `POST /v1/responses` path                                 |
| `previous_response_id` state chaining                                   | Supported with constraints | OpenAI docs show linked-state chain; `store: true` required for easy follow-up                                                | On `previous_response_not_found`, resend required context as full input   |
| Automatic compaction (`context_management.compaction`)                  | Supported                  | OpenAI docs include `auto`/`disabled`, `compact_threshold` behavior                                                           | Use local compaction path and explicit truncation policy                  |
| Explicit `POST /v1/responses/compact`                                   | Supported                  | OpenAI docs: returns compacted input window without response id                                                               | Continue as new call with returned compacted context as input             |
| Model support for streaming path                                        | Conditional                | OpenAI models page shows examples where streaming is supported (for example `gpt-5.2`) and unsupported (for example `o3-pro`) | Per-model transport policy: force SSE/non-streaming on unsupported models |

Council inference:

1. SDD 99 transport optimization is valid, but only after SDD 100 truthfulness fix and with per-model gates.

### 3.2 Monday production constraints matrix

| Capability / constraint                 | Status                  | Evidence                                                                                      | Required fallback                                                    |
| --------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| OAuth for durable background automation | Supported and preferred | Monday auth guidance distinguishes OAuth/public app flows                                     | Use token model only for controlled internal/single-tenant scenarios |
| Integration short-lived tokens          | Supported but limited   | Monday integration auth docs indicate short-lived integration runtime token (about 5 minutes) | Do not use short-lived runtime tokens for long-running sync workers  |
| OAuth token lifecycle                   | Stable                  | Monday docs: OAuth access token does not expire unless uninstall/reauthorization              | Add reconnect flow + token rotation detection                        |
| Webhook handshake/response latency      | Required                | Monday webhook docs require challenge response and fast acknowledgement                       | Queue-first async processing; never do heavy work inline             |
| API version cadence and deprecation     | Strict                  | Monday versioning docs: quarterly versions with migration/deprecation schedule                | Pin API version and run scheduled upgrade rehearsals                 |
| Rate and complexity limits              | Enforced                | Monday limits docs define per-minute calls, concurrency, and complexity budgets               | Add connector throttling, backoff, and budget-aware query shaping    |

Council inference:

1. Monday read path is execution-ready after MR-0, but must ship with version pinning + queue-first webhook design + throttling controls.

### 3.3 RightSignature production constraints matrix

| Capability / constraint           | Status                | Evidence                                                                                 | Required fallback                                           |
| --------------------------------- | --------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| API access entitlement            | Required              | RightSignature docs require API-enabled ShareFile plan/trial                             | Block connector activation until entitlement confirmed      |
| Auth models (API token and OAuth) | Supported             | RightSignature auth docs list both models                                                | Prefer OAuth for production with refresh handling           |
| OAuth token lifetime and refresh  | Supported with expiry | RightSignature OAuth docs indicate 2-hour token window and refresh pattern               | Pre-expiry refresh + retry on auth failures                 |
| Callback lifecycle ordering       | Not guaranteed        | RightSignature sending request docs explicitly state callback ordering is not guaranteed | Idempotent state machine keyed by request/document identity |
| Send throughput limits (v2 vs v1) | Enforced              | RightSignature docs define v2 and v1 send caps                                           | Queue + token bucket rate control; batch non-urgent sends   |

Council inference:

1. RightSignature is feasible but must be event-driven and idempotent from day one.

### 3.4 Mobile reliability matrix (channel vs native push)

| Delivery path                      | Status                          | Evidence                                                                                            | Required fallback                                                            |
| ---------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Native iOS push (APNs)             | Supported                       | Apple docs describe APNs provider delivery classes and interruption levels                          | Channel escalation when native token/permission unavailable                  |
| Native Android push (FCM)          | Supported with platform caveats | Android + Firebase docs emphasize permission/channel setup, priority behavior, and Doze constraints | Fallback to channel notifications for non-critical alerts                    |
| Channel-based mobile (Teams/Slack) | Supported for actionability     | Teams proactive messaging/activity feed and Slack notification controls are documented              | Use as primary for approvals; escalate to native for urgent incident classes |

Council inference:

1. The right pattern remains policy-driven escalation: channel-first for interactive approvals, native escalation for critical deadline/compliance incidents.

## 4. Conflict check after updates

Result: **No unresolved execution contradiction remains between SDD 99, 100, and 103.**

1. Transport sequencing conflict is resolved by explicit dependency gate in SDD 99.
2. Connector preemption conflict is resolved by MR-1/MR-2 production gating in SDD 103.
3. Remaining risk is implementation discipline, not strategy contradiction.

## 5. Value-left-behind register (defer/accept rationale)

1. Full provider-native compaction parity across all providers.
   - Decision: defer.
   - Rationale: complete OpenAI path first, then adapterize Anthropic/Google under shared policy.
2. Unified e-sign abstraction before first RightSignature read-only pilot.
   - Decision: partial defer.
   - Rationale: mandate `esign_provider_policy` now, but allow read-only pilot while abstraction hardens.
3. Direct APNs/FCM end-to-end orchestration in first mobile wave.
   - Decision: defer.
   - Rationale: ship policy + channel routing first; add native escalation adapters in next wave.
4. Automated version-upgrade rehearsal harness for Monday API quarter bumps.
   - Decision: defer but schedule.
   - Rationale: implement after first stable connector release to avoid slowing initial delivery.
5. Callback authenticity hardening profile for RightSignature.
   - Decision: do now.
   - Rationale: no production webhook ingest without strict authenticity and replay protection.

## 6. Council recommendations after research

1. Keep current harmonized order from SDD 104.
2. Add explicit `model_transport_capability_matrix` artifact before SDD 99 Wave B rollout.
3. Add `esign_provider_policy` artifact before SDD 103 MR-2 starts.
4. Require queue-first webhook processors for Monday and RightSignature from first implementation commit.
5. Keep mobile delivery as policy-tiered escalation, not single-channel or single-provider design.

## References (primary sources)

1. OpenAI WebSocket mode guide: https://developers.openai.com/api/docs/guides/websocket-mode
2. OpenAI conversation state and compaction: https://platform.openai.com/docs/guides/conversation-state?api-mode=responses
3. OpenAI models page (streaming support visibility): https://platform.openai.com/docs/models
4. Monday authentication: https://developer.monday.com/api-reference/docs/authentication
5. Monday choose auth strategy: https://developer.monday.com/apps/docs/choosing-auth
6. Monday integration authorization: https://developer.monday.com/apps/docs/integration-authorization
7. Monday webhooks: https://developer.monday.com/api-reference/reference/webhooks
8. Monday API versioning: https://developer.monday.com/api-reference/docs/api-versioning
9. Monday rate and complexity limits: https://developer.monday.com/api-reference/docs/rate-limits
10. RightSignature getting started: https://api.rightsignature.com/documentation/getting_started
11. RightSignature authentication: https://api.rightsignature.com/documentation/authentication
12. RightSignature OAuth authorizations: https://api.rightsignature.com/documentation/resources/v2/oauth_authorizations.en.html
13. RightSignature OAuth tokens: https://api.rightsignature.com/documentation/resources/v2/oauth_tokens.en.html
14. RightSignature sending requests/callback behavior: https://api.rightsignature.com/documentation/resources/v2/sending_requests.en.html
15. RightSignature v2 notes and limits: https://api.rightsignature.com/documentation/new
16. Android notification channels: https://developer.android.com/develop/ui/views/notifications/channels
17. Android 13 notification permission: https://developer.android.com/develop/ui/views/notifications/notification-permission
18. Firebase message priority: https://firebase.google.com/docs/cloud-messaging/android/message-priority
19. Firebase message lifespan: https://firebase.google.com/docs/cloud-messaging/customize-messages/setting-message-lifespan
20. Microsoft Teams activity feed notifications: https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/design/activity-feed-notifications
21. Microsoft Teams proactive messaging: https://learn.microsoft.com/en-us/microsoftteams/platform/resources/bot-v3/bot-conversations/bots-conv-proactive
22. Slack notification controls: https://slack.com/help/articles/201355156-Configure-your-Slack-notifications
23. Apple APNs provider guidance: https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/CommunicatingwithAPNs.html
