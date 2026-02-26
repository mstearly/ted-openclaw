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

| SDD | Plan / Artifact                             | Type                      | Current Status  | Next Action                                      |
| --- | ------------------------------------------- | ------------------------- | --------------- | ------------------------------------------------ |
| 99  | WebSocket and persistent connection review  | Council decision package  | Active baseline | Execute via SDD 108 (T0-T3)                      |
| 100 | Compaction and long-context review          | Council decision package  | Active baseline | Execute via SDD 107 (C0-C3)                      |
| 101 | Mobile push interface review                | Council decision package  | Active baseline | Execute via SDD 109 (M0-M4)                      |
| 102 | Roadmap beyond phase 3 review               | Council decision package  | Active baseline | Execute via SDD 110 (R0-R4)                      |
| 103 | Monday + RightSignature review              | Council decision package  | Active baseline | Execute via SDD 111 (MR-0-MR-4)                  |
| 104 | Collective critical review (99-103)         | Reconciliation package    | Applied         | Keep as alignment reference                      |
| 105 | Targeted deep research round                | Research package          | Completed       | Use compatibility matrix in implementation gates |
| 106 | Boardroom briefing                          | Executive package         | Completed       | Use as steering/approval narrative               |
| 107 | Plan 1 context truthfulness                 | Task-level execution plan | Completed       | Closed at C3-003 handoff checkpoint              |
| 108 | Plan 2 transport optimization               | Task-level execution plan | In execution    | Start T2-001 transport selector precedence logic |
| 109 | Plan 3 mobile governance                    | Task-level execution plan | Ready           | Start at integrated Wave I5                      |
| 110 | Plan 4 roadmap/module lifecycle             | Task-level execution plan | In execution    | Start R2 KPI schema and release gate evaluator   |
| 111 | Plan 5 Monday/RightSignature                | Task-level execution plan | In execution    | Close MR0-001 operator ids, then start MR1/MR2   |
| 112 | Master integrated execution plan            | Master wave plan          | Active          | Execute waves I0-I11                             |
| 113 | Wave I0 execution log                       | Execution log             | Active          | Update with I0 outcomes                          |
| 128 | Future-proofing retrofit assessment         | Council decision package  | Active baseline | Convert to task-level execution package          |
| 129 | Future-proofing retrofit task-level plan    | Task-level execution plan | In execution    | Start RF5-001 integrated certification matrix    |
| 130 | RF0-002 baseline freeze execution log       | Execution log             | Completed       | Use as RF1 baseline evidence                     |
| 131 | RF1-001 workflow schema evolution log       | Execution log             | Completed       | Use as RF1-002 handoff context                   |
| 132 | RF1-002 immutable publish execution log     | Execution log             | Completed       | Use as RF1-003 handoff context                   |
| 133 | RF1-003 run pinning execution log           | Execution log             | Completed       | Use as RF1-004 handoff context                   |
| 134 | RF1-004 upcaster and backfill execution log | Execution log             | Completed       | Use as RF2-001 handoff context                   |
| 135 | RF2-001 migration registry execution log    | Execution log             | Completed       | Use as RF2-002 handoff context                   |
| 136 | RF2-002 migration dry-run execution log     | Execution log             | Completed       | Use as RF2-003 handoff context                   |
| 137 | RF2-003 partial-failure execution log       | Execution log             | Completed       | Use as RF3-001 handoff context                   |
| 138 | RF3-001 replay gate execution log           | Execution log             | Completed       | Use as RF3-002 handoff context                   |
| 139 | RF3-002 rollout policy execution log        | Execution log             | Completed       | Use as RF3-003 handoff context                   |
| 140 | RF3-003 CI release gate execution log       | Execution log             | Completed       | Use as RF4-001 handoff context                   |
| 141 | RF4-001 connector reliability execution log | Execution log             | Completed       | Use as RF4-002 handoff context                   |
| 142 | RF4-002 deprecation surface execution log   | Execution log             | Completed       | Use as RF4-003 handoff context                   |
| 143 | RF4-003 connector replay execution log      | Execution log             | Completed       | Use as RF5-001 handoff context                   |

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
4. RF0-001, RF0-002, RF1-001, RF1-002, RF1-003, RF1-004, RF2-001, RF2-002, RF2-003, RF3-001, RF3-002, RF3-003, RF4-001, RF4-002, and RF4-003 are complete with evidence in SDD 130-143; execution handoff is RF5-001.
5. Production gates remain unchanged:
   - no transport Wave T2/T3 before completing T0/T1 prerequisites,
   - no connector MR-1/MR-2 production activation before P0-4 signoff.
