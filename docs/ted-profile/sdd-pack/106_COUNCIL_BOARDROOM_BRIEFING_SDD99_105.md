# SDD 106 - Council Boardroom Briefing (SDD 99-105)

Date: 2026-02-26  
Audience: Board / executive review  
Status: Decision package

## 1. Executive position

The council recommends proceeding with the combined SDD 99-105 program.  
The program is high-value and coherent after two sequencing corrections already applied:

1. WebSocket optimization is gated behind context truthfulness hardening.
2. Monday/RightSignature production rollout is gated behind P0-4 live Graph signoff (MR-0 can proceed now).

Net: move forward, but in governed phases.

## 2. What changes/additions are being proposed

### A. Runtime performance and context stability

1. Add policy-controlled OpenAI transport optimization (`sse|websocket|auto`) with hard fallback.
2. Enforce strict behavior for compaction/state fields (no silent acceptance of unsupported semantics).
3. Add per-model compatibility matrix and transport telemetry.

Why it matters:

1. Improves tool-heavy run latency while preventing correctness drift.
2. Reduces risk of brittle long-context failures.

### B. Mobile operator alerting beyond Telegram

1. Introduce a governed mobile alert taxonomy (approval, deadline, compliance, incident).
2. Add deterministic channel fallback and escalation policy.
3. Add delivery reliability and acknowledgement telemetry.

Why it matters:

1. Moves Ted from "notification-capable" to "operationally reliable mobile response system."
2. Directly supports Clint's off-desk decision loops.

### C. Roadmap and module lifecycle governance (Phase 3+)

1. Create one master roadmap artifact with owners, dependencies, and release gates.
2. Formalize module admission model (`configure_only` vs `build_cycle`) and policy precedence.
3. Promote friction/outcome metrics from reporting into release criteria.

Why it matters:

1. Eliminates roadmap fragmentation.
2. Increases delivery velocity without governance erosion.

### D. Monday + RightSignature integration track

1. Execute MR-0 now: ownership, credentials, entitlement, policy lock.
2. Execute MR-1+ after P0-4 signoff for production activation.
3. Use queue-first, webhook-first, idempotent connector architecture from first implementation commit.
4. Add e-sign provider policy (`docusign_only`, `rightsignature_only`, `dual_provider`).

Why it matters:

1. Adds high-value system coverage for Clint's operational workflow.
2. Avoids one-off integration debt and sequencing risk.

## 3. Board-level value case

### Value delivered

1. Faster tool-heavy execution path with controlled fallback.
2. Higher reliability of long-running agent sessions.
3. Mobile decision velocity improvement (approval/deadline/compliance incidents).
4. Clear growth framework for adding modules without ad-hoc build churn.
5. Connector expansion aligned to real operator demand (Monday, RightSignature).

### Value protection

1. No preemption of critical live Graph validation gates.
2. No production connector activation without entitlement, policy, and replay evidence.
3. No transport optimization without context semantics correctness.

## 4. Blockers and dependencies

### External/operator blockers

1. P0-2/P0-4 completion (live Graph validation gate).
2. Monday tenant authorization and scope approval.
3. RightSignature API entitlement and credential issuance.

### Internal blockers

1. Missing unified policy precedence contract (must be added in roadmap lifecycle work).
2. Missing unified KPI roll-up schema across SDD 99-105 tracks.
3. Need explicit model transport capability artifact before broad WebSocket rollout.

## 5. Work to be done (execution view)

### Stage 0 - Immediate (can start now)

1. Complete context truthfulness fix (SDD 100 Wave A).
2. Complete WebSocket baseline telemetry (SDD 99 Wave A).
3. Execute MR-0 for Monday/RightSignature (ownership + entitlement + credential package).
4. Ratify `esign_provider_policy`.

### Stage 1 - Controlled optimization

1. Enable WebSocket per supported model with strict fallback and telemetry.
2. Implement mobile alert policy schema and startup validation.
3. Publish master roadmap artifact and module lifecycle contract.

### Stage 2 - Connector onboarding (post P0-4 production gate)

1. Monday read-only path + webhook ingestion + throttling controls.
2. RightSignature read-only + callback authenticity + idempotent event processing.
3. Connector replay fixtures and promotion evidence.

### Stage 3 - Productization

1. Governed write actions for Monday/RightSignature.
2. Operator UX surfaces for setup/testing/health.
3. Cross-program KPI dashboard and promotion gates.

## 6. Risk and mitigation summary

1. Risk: context-state ambiguity under transport change.
   - Mitigation: enforce SDD 100 Wave A before SDD 99 Wave B.
2. Risk: connector rollout dilutes core readiness.
   - Mitigation: gate MR-1+ behind P0-4 signoff for production activation.
3. Risk: webhook/event inconsistency.
   - Mitigation: queue-first processors, idempotency keys, replay tests.
4. Risk: policy sprawl.
   - Mitigation: precedence contract and unified lifecycle governance.

## 7. Board decisions requested

1. Approve harmonized sequence (SDD 104 + SDD 105).
2. Approve production gating policy:
   - no MR-1+ activation before P0-4 signoff,
   - no WebSocket Wave B before SDD 100 Wave A complete.
3. Approve e-sign provider strategy decision window (`docusign_only` vs `rightsignature_only` vs `dual_provider`).
4. Approve KPI set as release gate criteria:
   - `latency_p95`,
   - `context_overflow_rate`,
   - `alert_ack_sla`,
   - `auth_failure_rate`,
   - `operator_override_rate`,
   - `time_to_first_value`.

## 8. Council recommendation to the board

Approve execution with gates.  
The council does not recommend pausing the program; it recommends disciplined sequencing with explicit production activation controls.
