# SDD 114: R0-001 Active Plan and Wave Inventory

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Task:** SDD 110 `R0-001`

---

## 1. Inventory Scope

This inventory captures the currently active council execution package from SDD 99 through SDD 113 and the new task-level execution plans (SDD 107-112).

---

## 2. Active Plan Inventory

| SDD | Plan / Artifact                            | Type                      | Current Status  | Next Action                                      |
| --- | ------------------------------------------ | ------------------------- | --------------- | ------------------------------------------------ |
| 99  | WebSocket and persistent connection review | Council decision package  | Active baseline | Execute via SDD 108 (T0-T3)                      |
| 100 | Compaction and long-context review         | Council decision package  | Active baseline | Execute via SDD 107 (C0-C3)                      |
| 101 | Mobile push interface review               | Council decision package  | Active baseline | Execute via SDD 109 (M0-M4)                      |
| 102 | Roadmap beyond phase 3 review              | Council decision package  | Active baseline | Execute via SDD 110 (R0-R4)                      |
| 103 | Monday + RightSignature review             | Council decision package  | Active baseline | Execute via SDD 111 (MR-0-MR-4)                  |
| 104 | Collective critical review (99-103)        | Reconciliation package    | Applied         | Keep as alignment reference                      |
| 105 | Targeted deep research round               | Research package          | Completed       | Use compatibility matrix in implementation gates |
| 106 | Boardroom briefing                         | Executive package         | Completed       | Use as steering/approval narrative               |
| 107 | Plan 1 context truthfulness                | Task-level execution plan | Completed       | Closed at C3-003 handoff checkpoint              |
| 108 | Plan 2 transport optimization              | Task-level execution plan | In execution    | Start T2-001 transport selector precedence logic |
| 109 | Plan 3 mobile governance                   | Task-level execution plan | Ready           | Start at integrated Wave I5                      |
| 110 | Plan 4 roadmap/module lifecycle            | Task-level execution plan | In execution    | Start R2 KPI schema and release gate evaluator   |
| 111 | Plan 5 Monday/RightSignature               | Task-level execution plan | In execution    | Close MR0-001 operator ids, then start MR1/MR2   |
| 112 | Master integrated execution plan           | Master wave plan          | Active          | Execute waves I0-I11                             |
| 113 | Wave I0 execution log                      | Execution log             | Active          | Update with I0 outcomes                          |
| 128 | Future-proofing retrofit assessment        | Council decision package  | Active baseline | Convert to task-level execution package          |
| 129 | Future-proofing retrofit task-level plan   | Task-level execution plan | In execution    | Start RF1-002 immutable publish behavior         |
| 130 | RF0-002 baseline freeze execution log      | Execution log             | Completed       | Use as RF1 baseline evidence                     |
| 131 | RF1-001 workflow schema evolution log      | Execution log             | Completed       | Use as RF1-002 handoff context                   |

---

## 3. Integrated Wave Inventory (from SDD 112)

| Integrated Wave | Focus                                           | Upstream Dependencies | Primary Plans |
| --------------- | ----------------------------------------------- | --------------------- | ------------- |
| I0              | Program mobilization                            | None                  | 110, 111      |
| I1              | Core truthfulness foundation                    | I0                    | 107, 110      |
| I2              | Context semantics implementation                | I1                    | 107, 110      |
| I3              | Context validation and release gate             | I2                    | 107           |
| I4              | Transport baseline + governance foundations     | I3                    | 108, 110, 111 |
| I5              | Transport policy + mobile policy foundation     | I4                    | 108, 109      |
| I6              | Transport enablement + mobile routing core      | I5                    | 108, 109      |
| I7              | KPI/evidence gate infrastructure                | I6                    | 109, 110      |
| I8              | Validation and UX readiness                     | I7                    | 108, 109      |
| I9              | Connector read-track build (prod-gated)         | I4, I7                | 111           |
| I10             | Personal/scale governance operations            | I7                    | 110           |
| I11             | Connector write/productization (post P0-4 gate) | I9, I10, P0-4         | 109, 111      |

---

## 4. Immediate Execution Position

1. Wave I0 completion checkpoint is satisfied.
2. SDD 107 C3 gate is complete and Wave I4 T0/T1 + R1/MR0 policy lock are executed (SDD 125/126/127 evidence).
3. SDD 128 retrofit direction is ratified as active baseline; SDD 129 provides task-level execution waves RF0-RF5.
4. RF0-001, RF0-002, and RF1-001 are complete with evidence in SDD 130/131; execution handoff is RF1-002.
5. Production gates remain unchanged:
   - no transport Wave T2/T3 before completing T0/T1 prerequisites,
   - no connector MR-1/MR-2 production activation before P0-4 signoff.
