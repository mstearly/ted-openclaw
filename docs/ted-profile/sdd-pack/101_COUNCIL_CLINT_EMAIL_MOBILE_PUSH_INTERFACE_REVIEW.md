# SDD 101 - Council Critical Review: Clint Email Ask 3 (Mobile Push Interface)

Date: 2026-02-26  
Status: Council recommendation package (decision-ready)

## 1. Council understanding of Clint's ask

Clint asked whether Ted currently supports mobile push workflows beyond Telegram for real operational alerts (approval queue, deal deadlines, compliance reminders), and what the architecture and roadmap should be.

## 2. Platform capability assessment (code-verified)

### 2.1 Ted sidecar notification flow today

1. Scheduler jobs are gated by onboarding policy and notification budget checks before execution.
   - Evidence: `sidecars/ted-engine/modules/scheduler.mjs` (`isFeatureEnabledByOnboarding`, `checkNotificationBudget`).
2. Completed scheduled outputs are written to a pending delivery ledger as `delivery_pending` records with a `channel` field.
   - Evidence: `sidecars/ted-engine/modules/scheduler.mjs` (`pending_delivery.jsonl`, `channel: job.delivery_channel || "imessage"`).
3. Notification throttling and quiet-hours governance exists (`daily_push_max`, quiet hours, crisis override).
   - Evidence: `sidecars/ted-engine/server.mjs` (`checkNotificationBudget`, `recordNotificationSent`), `sidecars/ted-engine/config/notification_budget.json`.
4. Current Ted cron config routes major briefs to `imessage` in config.
   - Evidence: `sidecars/ted-engine/config/ted_agent.json`.

Council assessment: Ted has governance-aware notification production, but this sidecar path is ledger-first. It does not itself implement direct APNs/FCM provider delivery.

### 2.2 OpenClaw multi-channel delivery plane

1. Cron delivery contract supports `delivery.mode` (`none | announce | webhook`) with channel/target routing.
   - Evidence: `src/cron/types.ts`, `src/cron/delivery.ts`.
2. Isolated cron runs can deliver to outbound channels through resolved targets and announce flow.
   - Evidence: `src/cron/isolated-agent/run.ts`, `src/cron/isolated-agent/delivery-target.ts`.
3. OpenClaw supports many chat channels with mobile clients beyond Telegram.
   - Evidence: `src/channels/registry.ts`, `docs/channels/index.md`.

Council assessment: Beyond-Telegram mobile reach exists at the channel delivery layer (Slack/Discord/Signal/WhatsApp/iMessage and plugin channels like Teams/Matrix), not as a single dedicated mobile push subsystem.

### 2.3 Native node push primitives

1. iOS node supports local push-style notifications via `system.notify` and `chat.push` with permission and priority handling.
   - Evidence: `apps/ios/Sources/Model/NodeAppModel.swift`, `apps/shared/OpenClawKit/Sources/OpenClawKit/SystemCommands.swift`, `apps/shared/OpenClawKit/Sources/OpenClawKit/ChatCommands.swift`.
2. Gateway default node command policy includes `system.notify` on iOS.
   - Evidence: `src/gateway/node-command-policy.ts`.
3. Android node command set currently does not advertise `system.notify` or `chat.push`.
   - Evidence: `apps/android/app/src/main/java/ai/openclaw/android/node/ConnectionManager.kt`, `apps/android/app/src/main/java/ai/openclaw/android/node/InvokeDispatcher.kt`.

Council assessment: iOS has native local-notification command support; Android parity is currently missing.

### 2.4 Approval-related mobile delivery support

1. Exec approvals can be forwarded to chat channels (including plugin channels), enabling mobile approval actions through existing chat apps.
   - Evidence: `docs/tools/exec-approvals.md`.
2. Discord includes button-based exec approval UX with approver restrictions.
   - Evidence: `docs/channels/discord.md`, `src/config/types.discord.ts`.

Council assessment: mobile approval workflows are supported via chat-channel routing, but not yet normalized as a Ted-specific "approval queue mobile push" product surface.

## 3. Gap analysis against Clint's requirement

1. No unified mobile alert policy model that maps Ted event severity to channel, fallback order, and escalation windows.
2. Ted sidecar pending delivery ledger is not a complete end-to-end mobile dispatcher by itself.
3. Android lacks native `system.notify`/`chat.push` parity with iOS node behavior.
4. There is no single operator-facing "mobile push control center" for alert class routing, quiet-hours overrides, and delivery-health telemetry.
5. Delivery acknowledgement exists in Ted pending-delivery records, but cross-channel receipt/latency/SLA instrumentation is not yet unified.

## 4. External research digest (trusted sources)

1. Apple APNs model uses persistent HTTP/2 provider connections and supports notification interruption levels and actionable notifications.
2. Apple guidance emphasizes asking for notification permission contextually, not at first launch.
3. Android guidance requires notification channels and Android 13+ runtime notification permission.
4. FCM guidance differentiates high vs normal priority behavior, supports message lifespan controls (`ttl`) and collapse semantics for stale-notification reduction, and stresses token lifecycle hygiene.
5. Microsoft Teams guidance supports proactive bot messaging and activity-feed notifications for targeted attention events.
6. Slack guidance emphasizes reducing notification fatigue through batching and user control over notification scope.
7. Telegram Bot API supports controllable notification behavior (for example silent sends) and reply/interaction primitives.

Inference from sources: Leading collaboration systems converge on the same pattern:

1. event-driven alert generation,
2. channel-aware escalation,
3. strict anti-fatigue controls,
4. actionable notifications where possible,
5. measurable delivery outcomes.

## 5. Requirement decision

Council decision: treat "mobile push interface beyond Telegram" as a formal requirement.

Priority:

1. P0 policy hardening
2. P1 implementation waves

### P0 policy hardening (now)

1. Define a canonical mobile alert taxonomy (`approval_required`, `deadline_risk`, `compliance_risk`, `critical_incident`) and severity ladder.
2. Define channel fallback policy per alert class (primary channel, backup channel, escalation delay, quiet-hour exception rule).
3. Make Android parity explicit: implement `system.notify`/`chat.push` equivalent or formally declare chat-only model for Android.

### P1 implementation scope

1. Build unified mobile alert orchestration in Ted/OpenClaw with per-class routing and retry policy.
2. Add operator controls for per-alert-class channel mapping and escalation rules.
3. Add delivery telemetry (attempts, success/failure, latency, ack SLA).
4. Add periodic review reports for alert fatigue (suppressed vs delivered vs acknowledged).

## 6. Architecture impact by plane (required mapping)

1. Control plane
   - Add `mobile_alert_policy` artifact with alert classes, severity rules, quiet-hours behavior, and fallback chains.
2. Connector plane
   - Route via existing channel adapters first; optionally add direct APNs/FCM adapter later if needed.
3. State plane
   - Extend ledgers/events for delivery attempts, retries, acknowledgements, and escalation transitions.
4. Contract plane
   - Define deterministic contract for `alert -> routing decision -> delivery result` with fail-closed behavior.
5. Experience plane
   - Add Ted operator surface for mobile routing setup, test-send, and delivery health.

## 7. Recommended execution waves

### Wave A - Governance and contract (P0)

1. Introduce alert taxonomy and routing policy schema.
2. Add validation and startup guardrails.
3. Emit policy decision events for every produced alert.

Acceptance:

1. Every alert has a class, severity, and resolved routing plan.
2. Invalid routing policy blocks startup with explicit error.

### Wave B - Delivery orchestration (P1)

1. Implement channel fallback runner (primary -> secondary with bounded retries).
2. Integrate quiet-hours and crisis override consistently across Ted scheduler + cron announce paths.
3. Add acknowledgement capture normalization.

Acceptance:

1. Fallback chain executes deterministically.
2. Alert retries and outcomes are fully auditable.

### Wave C - Mobile parity + UX (P1)

1. Implement Android native notification command parity (or ratified non-goal).
2. Add operator UI panel for routing/test-send/health.
3. Add dashboard counters for alert fatigue and acknowledgement lag.

Acceptance:

1. Operator can configure and test mobile routing without code edits.
2. Android and iOS behavior is explicit and documented.

## 8. Council recommendation

1. Ted already has partial beyond-Telegram mobile capability through OpenClaw's multi-channel delivery and iOS local notify primitives.
2. It is not yet a fully unified mobile push product capability for Clint's approval/deadline/compliance use case.
3. Execute Wave A immediately, then Wave B/C to close the architecture gap with a governance-first rollout.

## References

### Internal evidence

1. `sidecars/ted-engine/modules/scheduler.mjs`
2. `sidecars/ted-engine/server.mjs`
3. `sidecars/ted-engine/config/notification_budget.json`
4. `sidecars/ted-engine/config/ted_agent.json`
5. `src/cron/types.ts`
6. `src/cron/delivery.ts`
7. `src/cron/isolated-agent/run.ts`
8. `src/cron/isolated-agent/delivery-target.ts`
9. `src/channels/registry.ts`
10. `docs/channels/index.md`
11. `apps/ios/Sources/Model/NodeAppModel.swift`
12. `apps/shared/OpenClawKit/Sources/OpenClawKit/SystemCommands.swift`
13. `apps/shared/OpenClawKit/Sources/OpenClawKit/ChatCommands.swift`
14. `src/gateway/node-command-policy.ts`
15. `apps/android/app/src/main/java/ai/openclaw/android/node/ConnectionManager.kt`
16. `apps/android/app/src/main/java/ai/openclaw/android/node/InvokeDispatcher.kt`
17. `docs/tools/exec-approvals.md`
18. `docs/channels/discord.md`
19. `src/config/types.discord.ts`

### External sources

1. Apple - Sending notification requests to APNs: https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns
2. Apple - Asking permission to use notifications: https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications
3. Apple - Actionable notifications: https://developer.apple.com/documentation/usernotifications/declaring-your-actionable-notification-types
4. Android - Notification channels: https://developer.android.com/develop/ui/views/notifications/channels
5. Android - Designing notifications: https://developer.android.com/design/ui/mobile/guides/home-screen/notifications
6. Firebase - Message lifespan and delivery controls: https://firebase.google.com/docs/cloud-messaging/customize-messages/setting-message-lifespan
7. Firebase - Message priority: https://firebase.google.com/docs/cloud-messaging/android/message-priority
8. Firebase - Manage registration tokens: https://firebase.google.com/docs/cloud-messaging/manage-tokens
9. Microsoft Teams - Proactive bot messaging: https://learn.microsoft.com/en-us/microsoftteams/platform/resources/bot-v3/bot-conversations/bots-conv-proactive
10. Microsoft Teams - Activity feed notifications: https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-notifications?tabs=dotnet
11. Slack - Designing notifications: https://api.slack.com/surfaces/design/notifications
12. Telegram Bot API: https://core.telegram.org/bots/api
13. Notion - Notification settings: https://www.notion.com/help/notification-settings
14. Todoist - Notifications and reminders: https://www.todoist.com/help/articles/introduction-to-notifications-and-reminders-Atbfh
