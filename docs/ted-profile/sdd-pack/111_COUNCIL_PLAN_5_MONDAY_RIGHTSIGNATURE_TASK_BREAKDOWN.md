# SDD 111: Plan 5 - Monday and RightSignature Task Breakdown (SDD 103)

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parents:** SDD 103, SDD 104, SDD 105  
**Mandate:** Deliver governed Monday and RightSignature capability with MR-0 immediate and MR-1+ production-gated after P0-4 signoff.

---

## 1. Program Goal

Integrate Monday and RightSignature safely with clear owner responsibilities, queue-first/event-driven reliability, and governance-first promotion.

Success criteria:

1. MR-0 completed immediately (ownership, entitlement, credentials, policy lock).
2. MR-1/MR-2 implementation complete with production activation only after P0-4 signoff.
3. No connector promotion without replay evidence, admission controls, and KPI thresholds.

---

## 2. Wave Order

1. Wave MR-0: Activation and ownership lock (start now)
2. Wave MR-1: Monday read-only integration (build allowed; prod gated)
3. Wave MR-2: RightSignature read-only + callback ingestion (build allowed; prod gated)
4. Wave MR-3: Governed write capabilities
5. Wave MR-4: Operator UX, health, and promotion gates

---

## 3. Task Board

## Wave MR-0: Activation and Ownership Lock (Immediate)

### MR0-001 Confirm provider ownership and tenant/account ids

1. Confirm Monday workspace/account scope.
2. Confirm RightSignature account and environment scope.

Acceptance:

1. Owner and tenant/account mapping doc is signed.

Dependencies:

1. None

### MR0-002 Finalize vendor-side credential checklist

1. Monday checklist (app auth mode, scopes, webhook endpoint info).
2. RightSignature checklist (plan entitlement, API/OAuth credentials, callback settings).

Acceptance:

1. Credential checklist approved by operator and platform owner.

Dependencies:

1. MR0-001

### MR0-003 Decide Monday auth mode and RightSignature auth mode

1. Monday: OAuth preferred for durable automation.
2. RightSignature: OAuth preferred; token model only if explicitly approved.

Acceptance:

1. Auth mode decision recorded in policy artifact.

Dependencies:

1. MR0-002

### MR0-004 Define connector admission policies for both providers

1. Set trust tier and allowed operations by phase.
2. Set initial read-only restrictions.

Acceptance:

1. Admission policy file validated and versioned.

Dependencies:

1. MR0-003

### MR0-005 Define `esign_provider_policy`

1. Decide one of:
   - `docusign_only`,
   - `rightsignature_only`,
   - `dual_provider`.
2. Define migration behavior for existing DocuSign assumptions.

Acceptance:

1. E-sign provider policy approved and linked to roadmap.

Dependencies:

1. MR0-001

## Wave MR-1: Monday Read-Only Integration (Production-Gated)

### MR1-001 Implement Monday connector auth bootstrap

1. Implement token/session initialization per chosen auth model.
2. Implement secure secret/reference retrieval.

Acceptance:

1. Auth bootstrap succeeds in test environment.

Dependencies:

1. MR0-004
2. MR0-003

### MR1-002 Implement Monday read models

1. Add board/item/project read operations.
2. Normalize external payloads into Ted connector events.

Acceptance:

1. Read operations produce deterministic normalized events.

Dependencies:

1. MR1-001

### MR1-003 Implement Monday webhook handler (queue-first)

1. Handle challenge/verification handshake.
2. Acknowledge quickly and enqueue processing.
3. Process events asynchronously with idempotency keys.

Acceptance:

1. No heavy inline webhook processing.
2. Duplicate events are handled idempotently.

Dependencies:

1. MR1-002

### MR1-004 Add Monday throttling/backoff/version controls

1. Add rate-limit-aware request controller.
2. Add API version pin and upgrade check hooks.

Acceptance:

1. Connector handles limit pressure without hard failure cascades.

Dependencies:

1. MR1-003

### MR1-005 Add Monday replay fixture pack

1. Capture representative read and webhook payload fixtures.
2. Add replay tests for normalization and idempotency.

Acceptance:

1. Replay tests pass with deterministic outputs.

Dependencies:

1. MR1-004

## Wave MR-2: RightSignature Read-Only + Callback Ingestion (Production-Gated)

### MR2-001 Implement RightSignature auth bootstrap + token lifecycle

1. Add OAuth/token initialization path.
2. Add token refresh handling and expiry recovery.

Acceptance:

1. Auth path remains stable across token expiry cycles.

Dependencies:

1. MR0-004
2. MR0-003

### MR2-002 Implement RightSignature read/status operations

1. Add template/document/request status read operations.
2. Normalize provider payloads into e-sign event model.

Acceptance:

1. Read/status events map into unified e-sign lifecycle contract.

Dependencies:

1. MR2-001
2. MR0-005

### MR2-003 Implement callback receiver authenticity and replay protection

1. Validate callback authenticity per provider guidance.
2. Add idempotency and ordering-safe state transitions.

Acceptance:

1. Out-of-order callbacks do not corrupt lifecycle state.

Dependencies:

1. MR2-002

### MR2-004 Add send throughput guardrails

1. Add queue + token bucket controls for send-related operations.
2. Add safety bounds aligned with provider throughput limits.

Acceptance:

1. Connector respects provider limits under load.

Dependencies:

1. MR2-003

### MR2-005 Add RightSignature replay fixture pack

1. Capture callback and status payload fixtures.
2. Add replay tests for idempotency and ordering behavior.

Acceptance:

1. Replay tests prove lifecycle stability under disorder/duplicates.

Dependencies:

1. MR2-004

## Wave MR-3: Governed Write Capabilities

### MR3-001 Implement Monday write operations (confirmation-required)

1. Add write actions under confirmation tier.
2. Add dry-run preview and explainability details.

Acceptance:

1. No write execution without confirmation path.

Dependencies:

1. MR1-005

### MR3-002 Implement RightSignature send/share operations (confirmation-required)

1. Add send/share paths under confirmation tier.
2. Add policy checks and explainability output.

Acceptance:

1. All write/send paths are approval-gated.

Dependencies:

1. MR2-005
2. MR0-005

### MR3-003 Implement rollback and kill-switch controls

1. Add per-connector disable switch.
2. Add per-operation rollback/disable path where supported.

Acceptance:

1. Operator can disable connector safely in one action.

Dependencies:

1. MR3-001
2. MR3-002

## Wave MR-4: Operator UX, Health, and Promotion Gates

### MR4-001 Build setup and test UI for both connectors

1. Add credential status panel.
2. Add connectivity test action and error diagnostics.

Acceptance:

1. Operator can onboard and validate connectors without curl.

Dependencies:

1. MR1-001
2. MR2-001

### MR4-002 Build connector health and outcome dashboard

1. Add metrics for auth failures, retries, override rate, and time-to-first-success.
2. Add per-connector readiness indicator.

Acceptance:

1. Readiness decision is evidence-backed from dashboard data.

Dependencies:

1. MR1-005
2. MR2-005

### MR4-003 Define connector promotion gate checks

1. Require replay pass, admission pass, KPI threshold pass.
2. Require P0-4 signoff checkpoint for production activation.

Acceptance:

1. No production activation without gate pass.

Dependencies:

1. MR4-002

---

## 4. Dependency Summary

1. MR-0 must complete before MR-1/MR-2 execution.
2. MR-1 and MR-2 can develop in parallel.
3. Production activation for MR-1/MR-2 requires P0-4 signoff checkpoint.
4. MR-3 depends on MR-1 and MR-2 stability evidence.
5. MR-4 defines promotion evidence and activation gates.

---

## 5. Ready-to-Execute Checklist

1. P0-4 gate owner identified.
2. Provider entitlement proof collected.
3. Admission policy and e-sign provider policy ratified.
4. Replay fixture owners assigned.
