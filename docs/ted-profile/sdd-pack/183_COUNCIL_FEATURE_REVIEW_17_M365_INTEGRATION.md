# SDD 183 - Council Feature Review 17: `m365_integration`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `m365_integration`

Current registry posture:

1. Plane: `connector`
2. Lifecycle: `graduated`
3. Maturity: `3`
4. Fragility: `60`
5. Dependencies: `governance_choke_point`
6. Usage telemetry gap: `invocation_count_30d`, `adoption_ratio_30d`, and `success_rate_30d` are `null`

## 2. Internal implementation evidence reviewed

Council reviewed connector breadth, resilience, and governance boundaries:

1. Route surface includes auth, mail, calendar, planner, todo, sync, and sharepoint paths under `/graph/*` normalization (`server.mjs`).
2. Connector paths consistently call `ensureValidToken` before Graph operations (`server.mjs`).
3. `graphFetchWithRetry` handles transient network failures, retry, and rate-limit behavior with event emission (`server.mjs`).
4. Delta sync controls exist with `graph_sync_strategy` (`mode: delta_preferred`, fallback polling, webhook toggle) and `/ops/graph/delta/*` routes (`config/graph_sync_strategy.json`, `server.mjs`).
5. Planner and To Do routes emit task and plan discovery/list events and write connector ledgers (`server.mjs`).
6. Execution boundaries classify connector routes and enforce mode constraints (`server.mjs` boundary policy).

Internal strengths confirmed:

1. Connector coverage is broad enough for modern co-work core surfaces.
2. Token validation and retry controls are embedded in major workflows.
3. Event taxonomy for connector observability is explicit and extensive.

Observed implementation gaps:

1. Webhook mode is currently disabled in sync strategy.
2. Some Graph flows still use direct `fetch` paths instead of shared retry wrapper.
3. Registry usage signals remain null, limiting adoption and reliability trend analysis.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked M365 integration posture against primary connector standards:

1. Microsoft Graph overview confirms broad workload parity requirements for mail/calendar/tasks/documents.
2. Microsoft Graph throttling guidance reinforces mandatory retry/backoff normalization.
3. Microsoft Graph change-notification patterns reinforce webhook plus delta dual-mode strategies.
4. Microsoft Graph delta-query guidance reinforces cursor-based incremental sync for scale.

Council inference:

1. Integration scope is competitive.
2. Highest-risk gap is resilience consistency and webhook readiness, not missing endpoint breadth.

## 4. Overlap and missing-capability assessment

Keep:

1. `m365_integration` remains the primary connector-plane feature; do not split by workload at this stage.

Avoid-overlap rule:

1. `sharepoint_integration` owns document workflow behavior; `m365_integration` owns shared auth, transport, and cross-workload orchestration.

Missing capability:

1. Uniform retry/resilience policy enforcement across all connector code paths.

## 5. Council actions (prioritized)

1. Enforce shared retry wrapper across all Graph calls.
   - Owner: `council.connector`
   - Acceptance: planner/todo/mail/calendar/sharepoint calls route through consistent retry policy and emit uniform failure events.
2. Stage webhook enablement with fallback safety.
   - Owner: `council.connector`
   - Acceptance: webhook mode enabled in one cohort with documented fallback to polling and drift checks.
3. Add connector SLO panel.
   - Owner: `council.state`
   - Acceptance: per-workload auth-failure, retry, and rate-limit metrics are surfaced.
4. Add connector chaos drills.
   - Owner: `council.qa`
   - Acceptance: replay includes token expiry, 429 bursts, and partial API outage scenarios.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `microsoft_graph_webhooks_plus_delta_sync`
   - `cross_surface_workload_partitioning`
   - `least_privilege_delegated_scopes`
   - `graph_webhooks_and_delta_sync_for_productivity_surfaces`
   - `least_privilege_connector_scopes`
   - `webhook_plus_delta_sync_patterns`
   - `connector_health_retry_observability`
   - `provider_volatility_circuit_breakers`
3. `source_refs.notes` should be updated to mark deep re-review pass.

## 7. Disposition

1. Keep feature active.
2. Prioritize resilience normalization and webhook staged activation.
3. Continue recursive loop to feature 18.

## External references

1. Microsoft Graph overview: https://learn.microsoft.com/en-us/graph/overview
2. Microsoft Graph throttling guidance: https://learn.microsoft.com/en-us/graph/throttling
3. Microsoft Graph change notifications: https://learn.microsoft.com/en-us/graph/change-notifications-overview
4. Microsoft Graph delta query: https://learn.microsoft.com/en-us/graph/delta-query-overview
