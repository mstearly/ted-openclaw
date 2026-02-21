# JC-049 - Approval Ledger Correlation View

## Outcome

From Clint's seat, Ted shows a decision-impact ledger that connects recommendation decisions to linked job cards and current promotion confidence so approvals are explainable end-to-end.

## Promotion State

- Current: DONE
- Promotion rule:
  - Workbench payload includes correlated approval ledger entries and Ted UI renders them with linked card drill-in.

## Non-negotiables

- Every recommendation decision remains traceable to linked cards where possible.
- Ledger entries include reason code, decision state, and next safe step.
- Ledger is advisory and never overrides governance policy.

## Deliverables

- Workbench payload `approval_ledger.recent` correlation model.
- Ted govern view panel showing decision -> linked card -> confidence chain.
- Card drill-in from ledger entries.

## Friction KPI Evidence

- approval explainability completeness rate
- time-to-understand decision impact
- promotion reversals after approval decisions

## Proof Evidence (Executed)

- `scripts/ted-profile/proof_jc049.sh`
