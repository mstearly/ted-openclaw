# Ted UI Governance Audit

**Generated:** 2026-02-20  
**Scope:** operator-facing Ted UI actions and their policy controls.

## Governance Checklist

| Control                                      | Required | Current                          | Result  |
| -------------------------------------------- | -------- | -------------------------------- | ------- |
| Draft-only boundary for risky outbound       | yes      | preserved                        | PASS    |
| Approval-first for risky writes              | yes      | partial in Ted UI (not unified)  | PARTIAL |
| Fail-closed behavior on invalid actions      | yes      | present in sidecar methods       | PASS    |
| Explainability fields on deny/block          | yes      | present on major governed routes | PASS    |
| Risk acknowledgment for threshold relaxation | yes      | implemented (`ted.gates.set`)    | PASS    |
| Audit trace for recommendation decisions     | yes      | stored in runtime decisions file | PASS    |
| Role-card policy validation before promotion | yes      | implemented                      | PASS    |
| Unified approval timeline for operator       | yes      | missing                          | GAP     |

## Findings

1. Governance mechanics are largely present in backend contracts.
2. UX presentation of governance is fragmented (especially approvals).
3. Threshold relaxation is now controlled correctly (warning + explicit acknowledgment).

## Council Constraints for Next Slice

- No UI feature may bypass approval-first rules.
- No “quick apply” affordance without visible policy reason codes.
- Every operator action must show next safe step on failure.

## Execution Mapping

- `JC-034` must close unified approval and governance timeline gap.
