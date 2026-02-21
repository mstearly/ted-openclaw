# JC-012 — Workflow vs Agent Boundary Contract

## Outcome

Each promoted slice explicitly declares deterministic workflow steps versus adaptive agent behavior, with fail-closed handling for undefined execution paths.

## Promotion State

- Current: DONE
- Promotion rule:
  - Requires `JC-011` preflight posture retained and existing proofs (`JC-006..010`) still green.

## Non-negotiables

- Deterministic path is default.
- Agentic branch is opt-in and bounded.
- Undefined execution path is denied with explainability.

## Deliverables

- Boundary contract artifact per slice (workflow-only vs adaptive steps).
- Runtime enforcement map for route/action families.
- Fail-closed response for out-of-contract execution attempts.

## Operator Loop Impact

- Reduces unpredictable behavior and keeps approval queue legible.

## Friction KPI Evidence

- Blocked action explainability remains 100% complete.
- No increase in manual handling minutes/day from boundary checks.

## Proof

- Contract lint fails on missing boundary declaration.
- Out-of-contract call returns deterministic deny with `reason_code` and `next_safe_step`.
- In-contract call behavior remains unchanged from prior slice proofs.

## Proof Script

- `scripts/ted-profile/proof_jc012.sh`

## Proof Evidence (Executed)

- Date: 2026-02-20
- Result: PASS
