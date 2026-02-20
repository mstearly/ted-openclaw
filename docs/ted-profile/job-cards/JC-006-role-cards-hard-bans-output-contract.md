# JC-006 — Role Cards + Hard Bans + Output Contract

## Outcome

Ted Engine exposes governance validators for role cards, hard-ban checks, and output contract conformance so downstream features can fail closed before any risky action.

## Promotion State

- Current: SHADOW
- Promotion rule:
  - SHADOW -> PREVIEW after deterministic validator proofs pass for two consecutive runs.
  - PREVIEW -> GA only after slices 2-4 prove no governance regressions.

## Non-negotiables

- Validation endpoints are deterministic and side-effect free.
- Any invalid payload or governance violation fails closed.
- All validation outcomes are audit logged.
- No permission expansion and no outbound side effects.

## Deliverables

- POST `/governance/role-cards/validate`
- POST `/governance/hard-bans/check`
- POST `/governance/output/validate`

## Operator Loop Impact

- Improves draft queue quality before human review.
- Reduces avoidable approval churn by rejecting malformed outputs early.

## Friction KPI Evidence

- Show impact on manual handling minutes and approval queue age.
- Confirm blocked responses include what/why/next-safe-step.

## Proof

- Role card missing required sections is rejected.
- Hard-ban violation in candidate output is blocked with explicit reasons.
- Output payload missing contract fields is rejected.
- Valid output contract payload passes.

## Proof Evidence (Executed)

- Date: 2026-02-20
- Proof Script: `scripts/ted-profile/proof_jc006.sh`
- Result: PASS
