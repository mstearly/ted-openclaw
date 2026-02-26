# SDD 104 - Council Collective Critical Review (SDD 99-103)

Date: 2026-02-26  
Status: Consolidated alignment review (decision-ready)

## 1. Scope

This review re-evaluates SDD 99 through SDD 103 as a combined package to answer:

1. Do any recommendations conflict?
2. Does sequencing need to change?
3. Is another deep-research cycle required to avoid hidden risk or missed value?

## 2. Findings (ordered by severity)

### HIGH - Sequencing conflict on connector rollout timing

1. SDD 103 says Monday should "execute now".
2. SDD 85 and prior P0 decisions state external connector rollout must not preempt P0-2/P0-4 Graph validation.

Evidence:

1. `docs/ted-profile/sdd-pack/103_COUNCIL_CLINT_EMAIL_MONDAY_RIGHTSIGNATURE_INTEGRATION_REVIEW.md:94`
2. `docs/ted-profile/sdd-pack/103_COUNCIL_CLINT_EMAIL_MONDAY_RIGHTSIGNATURE_INTEGRATION_REVIEW.md:175`
3. `docs/ted-profile/sdd-pack/85_COUNCIL_MCP_MSP_CONNECTION_DECISION.md:81`
4. `docs/ted-profile/sdd-pack/85_COUNCIL_MCP_MSP_CONNECTION_DECISION.md:174`
5. `docs/ted-profile/sdd-pack/85_COUNCIL_MCP_MSP_CONNECTION_DECISION.md:175`

Council correction:

1. "Execute now" should mean MR-0 only (credentials, ownership, entitlement, policy design).
2. MR-1+ implementation should start after P0-4 closes (or in isolated branch with no production activation before P0-4 signoff).

### HIGH - Missing dependency between SDD 99 transport rollout and SDD 100 context-truthfulness fix

1. SDD 99 recommends immediate Wave B WebSocket rollout.
2. SDD 100 requires immediate P0 fix for accepted-but-not-implemented context semantics.

Evidence:

1. `docs/ted-profile/sdd-pack/99_COUNCIL_CLINT_EMAIL_WEBSOCKET_PERSISTENCE_REVIEW.md:111`
2. `docs/ted-profile/sdd-pack/100_COUNCIL_CLINT_EMAIL_COMPACTION_LONG_CONTEXT_REVIEW.md:97`
3. `docs/ted-profile/sdd-pack/100_COUNCIL_CLINT_EMAIL_COMPACTION_LONG_CONTEXT_REVIEW.md:128`

Council correction:

1. Gate SDD 99 Wave B behind SDD 100 Wave A completion to keep transport changes from amplifying context-state ambiguity.

### MEDIUM - E-sign provider model is not fully normalized

1. Intake and existing roadmap references are DocuSign-centric.
2. SDD 103 introduces RightSignature and notes possible dual-provider or replacement, but no canonical provider model is mandated.

Evidence:

1. `docs/ted-profile/client_intake_COMPLETED.md:303`
2. `docs/ted-profile/sdd-pack/40_INTAKE_CONFIG_TRACEABILITY.md:43`
3. `docs/ted-profile/sdd-pack/103_COUNCIL_CLINT_EMAIL_MONDAY_RIGHTSIGNATURE_INTEGRATION_REVIEW.md:176`

Council correction:

1. Create an explicit `esign_provider_policy` with a decision:
   - `docusign_only`,
   - `rightsignature_only`,
   - `dual_provider`.
2. Require common lifecycle contracts (`document.created`, `recipient.viewed`, `recipient.signed`, `envelope.completed`, `error`) before provider-specific code.

### MEDIUM - Policy artifacts risk fragmentation across SDDs

1. SDD 99/100/101/102/103 each introduces separate policy artifacts.
2. There is no defined precedence model across transport, context lifecycle, mobile alerts, roadmap lifecycle, and connector admission.

Evidence:

1. `docs/ted-profile/sdd-pack/99_COUNCIL_CLINT_EMAIL_WEBSOCKET_PERSISTENCE_REVIEW.md:61`
2. `docs/ted-profile/sdd-pack/100_COUNCIL_CLINT_EMAIL_COMPACTION_LONG_CONTEXT_REVIEW.md:116`
3. `docs/ted-profile/sdd-pack/101_COUNCIL_CLINT_EMAIL_MOBILE_PUSH_INTERFACE_REVIEW.md:105`
4. `docs/ted-profile/sdd-pack/102_COUNCIL_CLINT_EMAIL_ROADMAP_PHASE3_PLUS_REVIEW.md:206`
5. `docs/ted-profile/sdd-pack/103_COUNCIL_CLINT_EMAIL_MONDAY_RIGHTSIGNATURE_INTEGRATION_REVIEW.md:100`

Council correction:

1. Add one policy-precedence contract in Wave R1 (SDD 102):
   - `safety/compliance` > `connector admission` > `context lifecycle` > `transport optimization` > `experience routing`.

### LOW - KPI schema is not yet unified across the package

1. Each SDD defines success metrics locally.
2. There is no single roll-up scoreboard for cross-wave tradeoffs.

Evidence:

1. `docs/ted-profile/sdd-pack/99_COUNCIL_CLINT_EMAIL_WEBSOCKET_PERSISTENCE_REVIEW.md:77`
2. `docs/ted-profile/sdd-pack/100_COUNCIL_CLINT_EMAIL_COMPACTION_LONG_CONTEXT_REVIEW.md:141`
3. `docs/ted-profile/sdd-pack/101_COUNCIL_CLINT_EMAIL_MOBILE_PUSH_INTERFACE_REVIEW.md:99`
4. `docs/ted-profile/sdd-pack/102_COUNCIL_CLINT_EMAIL_ROADMAP_PHASE3_PLUS_REVIEW.md:153`
5. `docs/ted-profile/sdd-pack/103_COUNCIL_CLINT_EMAIL_MONDAY_RIGHTSIGNATURE_INTEGRATION_REVIEW.md:161`

Council correction:

1. Create a shared KPI ledger namespace with required fields:
   - `latency_p95`,
   - `context_overflow_rate`,
   - `alert_ack_sla`,
   - `auth_failure_rate`,
   - `operator_override_rate`,
   - `time_to_first_value`.

## 3. What remains aligned (no change)

1. Governance-first posture is consistent across all five SDDs.
2. Replay/audit/telemetry is consistently treated as non-optional.
3. Dual-track evolution (configure-first + build-cycle) remains the right growth model.
4. No recommendation in 99-103 requires abandoning current 5-plane architecture.

## 4. Harmonized execution order (updated)

### Stage H0 - Alignment patch (immediate)

1. Ratify corrections from this SDD.
2. Mark MR-1+ as post-P0-4 implementation-gated.
3. Add cross-policy precedence and unified KPI schema to Wave R1 scope.

### Stage H1 - Truthfulness and baselines

1. Execute SDD 100 Wave A (context semantics truthfulness).
2. Execute SDD 99 Wave A (transport baseline telemetry).

### Stage H2 - Controlled optimizations

1. Execute SDD 99 Wave B (WebSocket where supported).
2. Execute SDD 101 Wave A (mobile alert policy).

### Stage H3 - Connector onboarding

1. Execute SDD 103 MR-0 now (activation/ownership/entitlement lock).
2. Execute MR-1+ after P0-4 signoff (or isolated branch without production activation).

### Stage H4 - Productized operations

1. Execute SDD 101 Wave B/C with connector-aware alert routing.
2. Execute SDD 103 MR-3/MR-4.
3. Use SDD 102 roadmap master artifact as promotion gate.

## 5. Do we need another deep-research round?

Council answer: **Yes, but targeted, not broad.**

Recommended one focused research cycle before MR-1/MR-2 + SDD 99 Wave B production rollout:

1. OpenAI transport/context compatibility matrix:
   - WebSocket + compaction + `previous_response_id` behavior by model and SDK path.
2. Monday production constraints:
   - webhook limits, retry semantics, OAuth token lifecycle, API-version pinning strategy.
3. RightSignature production constraints:
   - callback authenticity, ordering/idempotency patterns, throughput/rate windows, retention/audit expectations.
4. Mobile reliability:
   - channel-vs-native push escalation patterns and Android parity decision economics.

Exit criteria for this research cycle:

1. Updated capability matrix with "supported/unsupported/fallback" for each provider.
2. No unresolved contradiction between SDD 99, 100, and 103 execution paths.
3. Explicit "value-left-behind" list with defer/accept rationale.

## 6. Final council verdict

1. The package is directionally strong and internally coherent on architecture.
2. Two high-severity sequencing corrections are required before execution.
3. Another deep research pass is recommended, but tightly scoped to unresolved integration and runtime-compatibility risk.
4. After those corrections, proceed with the harmonized order in Section 4.
