# Ted UI Surface Inventory

**Generated:** 2026-02-20  
**Purpose:** canonical inventory of Ted UI surfaces, actions, and governance state before redesign.

## Inventory Rubric

- `Surface`: panel/page visible to operator
- `Primary JTBD`: user task it supports
- `Actionability`: read-only vs actionable
- `Governance`: whether approvals/explainability are wired
- `Status`: `ACTIVE`, `PARTIAL`, `GAP`

## Surface Matrix

| Surface                             | Primary JTBD               | Actionability             | Governance                                      | Status  |
| ----------------------------------- | -------------------------- | ------------------------- | ----------------------------------------------- | ------- |
| Ted Workbench header + health stats | situational awareness      | read-only                 | n/a                                             | ACTIVE  |
| Friction KPI cards                  | monitor release blockers   | editable via thresholds   | warning + risk-ack now wired                    | PARTIAL |
| Threshold and unlock controls       | tune promotion gates       | actionable                | risk acknowledgement required for relaxed gates | ACTIVE  |
| Council recommendations list        | identify blockers          | approve/dismiss decisions | decision persistence wired                      | ACTIVE  |
| Job Card Board list                 | pick next dependency slice | open details + run proof  | proof scripts allowlisted                       | PARTIAL |
| Job Card Detail panel               | inspect card attributes    | actionable read           | explainability context visible                  | ACTIVE  |
| Persona role-card validator         | validate role constraints  | actionable                | governed sidecar validation route               | ACTIVE  |
| New Job Intake recommender          | onboard new work           | actionable                | returns draft-only recommendations              | ACTIVE  |
| Approval queue operator surface     | certify risky actions      | missing                   | no unified action queue in Ted tab              | GAP     |
| KPI trend analytics (time series)   | measure quality drift      | missing                   | no trend view for release gates                 | GAP     |
| Queue/dispatch console              | run ops controls           | missing                   | ops control methods not in main Ted UX          | GAP     |

## Gap Summary

1. No single approval queue for all risky decisions (`GAP`).
2. No trend view for KPI/eval drift (`GAP`).
3. Job card list is usable but not yet full edit/create studio (`PARTIAL`).
4. Governance explainability is present per action but not aggregated in an operator audit timeline (`PARTIAL`).

## Hand-off to Execution

- `JC-031` inventory + gap acceptance gate.
- `JC-032` IA + interaction contract.
- `JC-033` core flow redesign (open -> decide -> act).
- `JC-034` governance + approval UX hardening.
- `JC-035` KPI/evals observability UX.
