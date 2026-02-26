# SDD 109: Plan 3 - Mobile Alert Governance Task Breakdown (SDD 101)

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parents:** SDD 101, SDD 104, SDD 105  
**Mandate:** Productize governed mobile alerting beyond Telegram with deterministic routing, escalation, and measurable outcomes.

---

## 1. Program Goal

Create an operator-trustworthy mobile alert system that routes the right alerts to the right channel at the right time with full auditability.

Success criteria:

1. Alert taxonomy and policy are explicit and startup-validated.
2. Routing and fallback are deterministic and auditable.
3. Operator can configure/test routing from UI without source edits.

---

## 2. Wave Order

1. Wave M0: Taxonomy and policy contract
2. Wave M1: Routing engine and fallback executor
3. Wave M2: Delivery telemetry and acknowledgement normalization
4. Wave M3: UX surfaces and Android parity decision
5. Wave M4: Reliability hardening and release gates

---

## 3. Task Board

## Wave M0: Taxonomy and Policy Contract

### M0-001 Define canonical alert classes and severity ladder

1. Define classes (`approval_required`, `deadline_risk`, `compliance_risk`, `critical_incident`).
2. Define severity scale and escalation defaults.

Acceptance:

1. Policy schema captures class and severity deterministically.

Dependencies:

1. None

### M0-002 Define policy schema for channel routing and quiet-hours

1. Add primary and fallback channels per class/severity.
2. Add quiet-hours behavior and override rules.
3. Add escalation delay and retry limits.

Acceptance:

1. Invalid policies fail schema validation.

Dependencies:

1. M0-001

### M0-003 Add startup validation and fail-closed behavior

1. Validate policy on startup.
2. Block startup on invalid mappings or circular fallback chains.

Acceptance:

1. Policy misconfiguration is blocked with explicit errors.

Dependencies:

1. M0-002

## Wave M1: Routing Engine and Fallback Executor

### M1-001 Implement alert classification mapper

1. Map runtime events to alert class and severity.
2. Preserve classification reason in event metadata.

Acceptance:

1. Every emitted alert includes class, severity, and classification reason.

Dependencies:

1. M0-003

### M1-002 Implement routing decision engine

1. Resolve target channel from policy.
2. Resolve fallback chain with bounded retries.

Acceptance:

1. Routing decision is deterministic for identical inputs.

Dependencies:

1. M1-001

### M1-003 Implement bounded fallback runner

1. Attempt primary delivery.
2. Trigger fallback chain by reason code.
3. Stop at policy-defined retry/max-depth limits.

Acceptance:

1. No infinite fallback loops.

Dependencies:

1. M1-002

### M1-004 Integrate crisis override behavior

1. Bypass quiet-hours for approved incident classes/severity.
2. Preserve override reason in audit trail.

Acceptance:

1. Override paths are explicit and audited.

Dependencies:

1. M1-003

## Wave M2: Telemetry and Acknowledgement Normalization

### M2-001 Add delivery attempt/outcome event taxonomy

1. Emit `alert.delivery.attempted`.
2. Emit `alert.delivery.succeeded`.
3. Emit `alert.delivery.failed`.
4. Emit `alert.delivery.escalated`.

Acceptance:

1. Every delivery path is represented in event stream.

Dependencies:

1. M1-003

### M2-002 Normalize acknowledgement model across channels

1. Define ack contract (`ack_source`, `ack_time`, `ack_actor`, `ack_channel`).
2. Map channel-specific signals into unified contract.

Acceptance:

1. Ack SLA can be computed consistently across channels.

Dependencies:

1. M2-001

### M2-003 Add alert fatigue and SLA projections

1. Add suppressed/delivered/acked counters.
2. Add ack-lag and escalation-lag metrics.

Acceptance:

1. Metrics are queryable by class, channel, and time window.

Dependencies:

1. M2-002

## Wave M3: UX Surfaces and Android Parity Decision

### M3-001 Add operator routing policy UI

1. Create editable routing matrix UI.
2. Add policy validation feedback before save.

Acceptance:

1. Operator can configure routing without file edits.

Dependencies:

1. M0-003
2. M1-002

### M3-002 Add test-send and dry-run UI actions

1. Add per-class test-send.
2. Add dry-run preview showing planned routing chain.

Acceptance:

1. Operator can verify policy behavior without real incidents.

Dependencies:

1. M3-001

### M3-003 Add delivery health dashboard panel

1. Show success rate, ack SLA, fallback frequency, and fatigue score.
2. Show top failure reasons and impacted channels.

Acceptance:

1. Dashboard supports operational review without log spelunking.

Dependencies:

1. M2-003

### M3-004 Decide Android native parity path

1. Decide one of:
   - implement native parity now,
   - ratify channel-first Android model as temporary non-goal.
2. Document decision, rationale, and revisit trigger.

Acceptance:

1. Android posture is explicit and approved.

Dependencies:

1. M3-001
2. M3-003

## Wave M4: Reliability Hardening and Release Gates

### M4-001 Add replay tests for alert routing determinism

1. Build scenario pack with policy/routing edge cases.
2. Assert deterministic routing and escalation outputs.

Acceptance:

1. Replay pass is required for release.

Dependencies:

1. M1-004
2. M2-003

### M4-002 Add channel outage simulation tests

1. Simulate channel errors/timeouts.
2. Verify fallback chain, bounded retries, and escalation behavior.

Acceptance:

1. Outage tests pass with no dropped critical incidents.

Dependencies:

1. M4-001

### M4-003 Define release gates and runbook

1. Set minimum success and SLA thresholds.
2. Add incident runbook for alerting degradation.

Acceptance:

1. Mobile alert release gate is objective and enforceable.

Dependencies:

1. M4-002

---

## 4. Dependency Summary

1. M0 must complete before M1/M3.
2. M1 must complete before M2.
3. M2 outputs feed M3 dashboard and M4 gate thresholds.
4. M3-004 Android decision must be ratified before production cut.

---

## 5. Ready-to-Execute Checklist

1. Alert taxonomy owners assigned.
2. Channel capability inventory completed.
3. SLA thresholds approved.
4. On-call escalation owner assigned.
