# JC-046 - Integration Health and Readiness Plane

## Outcome

Clint can see connector readiness (especially M365 profile state) without leaving Ted.

## Promotion State

- Current: DONE
- Promotion rule:
  - Workbench must expose profile status + next steps and pass proof gate.

## Non-negotiables

- Connector status must include plain-English remediation guidance.
- Failures must be visible in operator surface, not hidden in logs.

## Deliverables

- Integration health section in Ted UI.
- Runtime integration snapshot in workbench payload.

## Friction KPI Evidence

- time-to-diagnose connector auth failure
- % of sessions with visible integration status
- connector-related blocked actions/day

## Proof Evidence (Executed)

- `scripts/ted-profile/proof_jc046.sh`
