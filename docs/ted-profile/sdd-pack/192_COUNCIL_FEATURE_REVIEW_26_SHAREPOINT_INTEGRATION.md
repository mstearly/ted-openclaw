# SDD 192 - Council Feature Review 26: `sharepoint_integration`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `sharepoint_integration`

Current registry posture:

1. Plane: `connector`
2. Lifecycle: `graduated`
3. Maturity: `3`
4. Fragility: `60`
5. Dependencies: `m365_integration`
6. Usage telemetry gap: `invocation_count_30d`, `adoption_ratio_30d`, and `success_rate_30d` are `null`

## 2. Internal implementation evidence reviewed

Council reviewed SharePoint route surface, controls, and friction handling:

1. SharePoint module handles sites, drives, item browse/metadata, search, upload, and folder create routes (`modules/sharepoint.mjs`).
2. Every route applies execution boundary checks and profile token validation before Graph access (`modules/sharepoint.mjs`).
3. Upload and folder-create operations require explicit operator approval headers and fail closed otherwise (`modules/sharepoint.mjs`).
4. Document quality policy defines friction status classes, severity mapping, and required reason codes (`config/document_management_quality_policy.json`).
5. Module maps Graph/auth/rate-limit failures into connector friction events with normalized reason codes (`modules/sharepoint.mjs`).
6. Event taxonomy includes `sharepoint.*` activity events for telemetry and governance (`config/event_schema.json`).

Internal strengths confirmed:

1. SharePoint connector includes explicit safety gates for mutating operations.
2. Friction and reliability telemetry are policy-driven.
3. Route-level validation and error mapping are concrete and auditable.

Observed implementation gaps:

1. Document content extraction and semantic indexing are not yet part of connector flow.
2. Sync strategy still relies on polling fallback with webhook disabled globally.
3. Usage telemetry fields in registry remain null.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked SharePoint connector posture against modern document-integration standards:

1. Microsoft Graph overview reinforces integrated workload parity and common auth/retry behavior.
2. DriveItem search API guidance reinforces scoped, query-based document retrieval patterns.
3. Microsoft Graph throttling guidance reinforces robust retry and backoff handling under load.
4. Microsoft Graph best practices reinforce conservative write semantics and defensive error handling.

Council inference:

1. Connector safety baseline is good.
2. Main value gap is document intelligence depth, not CRUD surface.

## 4. Overlap and missing-capability assessment

Keep:

1. `sharepoint_integration` should remain connector-specific and separate from `document_management` experience orchestration.

Avoid-overlap rule:

1. SharePoint connector owns transport and API correctness; document-management features own filing and user workflow semantics.

Missing capability:

1. Governed document-content extraction and classification path with privacy redaction coverage.

## 5. Council actions (prioritized)

1. Add document extraction pipeline stage.
   - Owner: `council.connector`
   - Acceptance: connector can extract text/metadata safely and emit extraction-quality metrics.
2. Add privacy-safe document redaction pass.
   - Owner: `council.security`
   - Acceptance: extracted content is redacted before model-facing usage and emits redaction coverage events.
3. Enable delta-plus-webhook strategy in staged rollout.
   - Owner: `council.state`
   - Acceptance: webhook canary cohort passes reliability gates with automatic fallback.
4. Populate usage telemetry fields.
   - Owner: `council.experience`
   - Acceptance: sharepoint usage_signals are sourced from connector events each cycle.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `ms_graph_change_notifications_for_incremental_sync`
   - `document_connector_retry_with_idempotency_keys`
   - `least_privilege_scoped_document_access`
   - `enterprise_document_connector_with_least_privilege_access`
   - `least_privilege_connector_scopes`
   - `webhook_plus_delta_sync_patterns`
   - `connector_health_retry_observability`
   - `provider_volatility_circuit_breakers`
3. `source_refs.notes` should be updated to mark deep re-review pass.

## 7. Disposition

1. Keep feature active.
2. Prioritize document extraction and privacy-safe intelligence layer.
3. Continue recursive loop to feature 27.

## External references

1. Microsoft Graph overview: https://learn.microsoft.com/en-us/graph/overview
2. Microsoft Graph DriveItem search: https://learn.microsoft.com/en-us/graph/api/driveitem-search?view=graph-rest-1.0
3. Microsoft Graph throttling guidance: https://learn.microsoft.com/en-us/graph/throttling
4. Microsoft Graph best practices: https://learn.microsoft.com/en-us/graph/best-practices-concept
