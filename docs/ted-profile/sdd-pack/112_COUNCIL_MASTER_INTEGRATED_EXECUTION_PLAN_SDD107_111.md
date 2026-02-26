# SDD 112: Council Master Integrated Execution Plan (SDD 107-111)

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parents:** SDD 104, SDD 105, SDD 106, SDD 107, SDD 108, SDD 109, SDD 110, SDD 111  
**Mandate:** Sequence all detailed plans into one dependency-safe execution order with smallest-task wave control.

---

## 1. Included Plans

1. SDD 107 - Context Truthfulness (Plan 1)
2. SDD 108 - Transport Optimization (Plan 2)
3. SDD 109 - Mobile Alert Governance (Plan 3)
4. SDD 110 - Roadmap and Module Lifecycle (Plan 4)
5. SDD 111 - Monday and RightSignature (Plan 5)

---

## 2. Global Program Rules

1. No SDD 108 Wave T2/T3 before SDD 107 completion checkpoint C3-003.
2. No SDD 111 MR-1/MR-2 production activation before P0-4 signoff.
3. No connector promotion without replay evidence + KPI gate pass.
4. No policy activation without startup validation and fail-closed behavior.

---

## 3. Integrated Wave Queue (Smallest Task Order)

## Wave I0 - Program Mobilization (Immediate)

Tasks:

1. SDD 110 R0-001
2. SDD 111 MR0-001
3. SDD 111 MR0-002

Exit criteria:

1. Plan inventory complete.
2. Provider ownership and credential checklist confirmed.

Dependencies:

1. None

## Wave I1 - Core Truthfulness Foundation

Tasks:

1. SDD 107 C0-001
2. SDD 107 C0-002
3. SDD 107 C0-003
4. SDD 110 R0-002

Exit criteria:

1. Context semantics policy decisions signed.
2. Master roadmap artifact initial version produced.

Dependencies:

1. I0

## Wave I2 - Context Semantics Implementation

Tasks:

1. SDD 107 C1-001
2. SDD 107 C1-002
3. SDD 107 C1-003
4. SDD 107 C1-004
5. SDD 110 R0-003

Exit criteria:

1. Gateway semantics explicit and deterministic.
2. Roadmap dependency validator in place.

Dependencies:

1. I1

## Wave I3 - Context Validation and Release Gate

Tasks:

1. SDD 107 C2-001
2. SDD 107 C2-002
3. SDD 107 C2-003
4. SDD 107 C2-004
5. SDD 107 C3-001
6. SDD 107 C3-002
7. SDD 107 C3-003

Exit criteria:

1. Context truthfulness release gate passed.
2. Transport plan dependency unblocked.

Dependencies:

1. I2

## Wave I4 - Transport Baseline + Governance Lifecycle Foundations

Tasks:

1. SDD 108 T0-001
2. SDD 108 T0-002
3. SDD 108 T0-003
4. SDD 110 R1-001
5. SDD 110 R1-002
6. SDD 110 R1-003
7. SDD 110 R1-004
8. SDD 111 MR0-003
9. SDD 111 MR0-004
10. SDD 111 MR0-005

Exit criteria:

1. Transport baseline captured.
2. Module lifecycle + policy precedence contract ratified.
3. Connector admission + e-sign provider policy ratified.

Dependencies:

1. I3

## Wave I5 - Transport Policy and Mobile Policy Foundation

Tasks:

1. SDD 108 T1-001
2. SDD 108 T1-002
3. SDD 108 T1-003
4. SDD 109 M0-001
5. SDD 109 M0-002
6. SDD 109 M0-003

Exit criteria:

1. Transport capability matrix active.
2. Mobile alert policy schema validated at startup.

Dependencies:

1. I4

## Wave I6 - Controlled Transport Enablement + Mobile Routing Core

Tasks:

1. SDD 108 T2-001
2. SDD 108 T2-002
3. SDD 108 T2-003
4. SDD 108 T2-004
5. SDD 109 M1-001
6. SDD 109 M1-002
7. SDD 109 M1-003
8. SDD 109 M1-004

Exit criteria:

1. WebSocket path implemented with deterministic fallback.
2. Mobile routing and fallback engine implemented.

Dependencies:

1. I5

## Wave I7 - KPI and Evidence Gate Infrastructure

Tasks:

1. SDD 110 R2-001
2. SDD 110 R2-002
3. SDD 110 R2-003
4. SDD 109 M2-001
5. SDD 109 M2-002
6. SDD 109 M2-003

Exit criteria:

1. Unified KPI schema adopted.
2. Mobile telemetry and ack normalization available.

Dependencies:

1. I6

## Wave I8 - Validation and UX Readiness

Tasks:

1. SDD 108 T3-001
2. SDD 108 T3-002
3. SDD 108 T3-003
4. SDD 109 M3-001
5. SDD 109 M3-002
6. SDD 109 M3-003
7. SDD 109 M3-004

Exit criteria:

1. Transport canary decision complete.
2. Mobile UI surfaces complete.
3. Android parity decision ratified.

Dependencies:

1. I7

## Wave I9 - Connector Build Track (Implementation Allowed, Production Gated)

Tasks:

1. SDD 111 MR1-001
2. SDD 111 MR1-002
3. SDD 111 MR1-003
4. SDD 111 MR1-004
5. SDD 111 MR1-005
6. SDD 111 MR2-001
7. SDD 111 MR2-002
8. SDD 111 MR2-003
9. SDD 111 MR2-004
10. SDD 111 MR2-005

Exit criteria:

1. Monday and RightSignature read-only connector tracks pass replay.
2. Production activation remains blocked pending P0-4 signoff.

Dependencies:

1. I4
2. I7

## Wave I10 - Scale and Personal-Module Governance

Tasks:

1. SDD 110 R3-001
2. SDD 110 R3-002
3. SDD 110 R3-003
4. SDD 110 R4-001
5. SDD 110 R4-002
6. SDD 110 R4-003

Exit criteria:

1. Personal-module policy and scale readiness model operational.
2. Governance runbook and ownership handoff complete.

Dependencies:

1. I7

## Wave I11 - Connector Write Capabilities and Productization (Post P0-4 Activation Gate)

Tasks:

1. Verify P0-4 production activation gate signed.
2. SDD 111 MR3-001
3. SDD 111 MR3-002
4. SDD 111 MR3-003
5. SDD 111 MR4-001
6. SDD 111 MR4-002
7. SDD 111 MR4-003
8. SDD 109 M4-001
9. SDD 109 M4-002
10. SDD 109 M4-003

Exit criteria:

1. Connectors promoted with gates passed.
2. Mobile reliability release gates passed.

Dependencies:

1. I9
2. I10
3. P0-4 signoff checkpoint

---

## 4. Critical Path

1. I1 -> I2 -> I3 (context truthfulness)
2. I3 -> I4 -> I5 -> I6 -> I7 -> I8 (transport + mobile core)
3. I4 + I7 -> I9 -> I11 (connector activation path)
4. I7 -> I10 -> I11 (governance and promotion path)

---

## 5. Readiness to Start Executing

Current readiness verdict: **Execution active (I4 closeout and I5 prep).**

Immediate executable tasks:

1. I4 closeout:
   - close MR0-001 operator account identifiers (SDD 115 open items),
   - sign I4 exit criteria.
2. I5 executable tasks:
   - SDD 109 M0-001/M0-002/M0-003.
3. T2 transport runtime path remains queued for I6 sequencing.

Preconditions already satisfied:

1. Detailed task-level plans exist for all workstreams (SDD 107-111).
2. Cross-plan dependency conflicts resolved in SDD 104/105.
3. Boardroom sequence and gates documented in SDD 106.
4. Plan 1 C3 handoff is complete (SDD 124); transport T0/T1 and R1/MR0 policy evidence is captured (SDD 125/126/127).

---

## 6. Governance Notes for Execution

1. Execute one integrated wave at a time; do not start a downstream wave before upstream exit criteria are signed.
2. Each wave must end with: completed task ids, evidence links, unresolved blockers.
3. If any gate fails, hold wave progression and issue council decision note before continuing.
