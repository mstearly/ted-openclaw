# JC-035 — KPI and Evals Observability Cockpit

## Outcome

Ted UI exposes KPI and eval trends over time so operator can detect drift and decide promotion readiness confidently.

## Promotion State

- Current: DONE
- Promotion rule:
  - Requires `JC-034` PASS.

## Non-negotiables

- Trend views must reference source artifacts and timestamps.
- No promotion recommendation without gate evidence.

## Deliverables

- KPI trend strips and gate trajectory panels.
- eval pass/fail history with linked evidence.

## Proof Script

- `scripts/ted-profile/proof_jc035.sh`

## Friction KPI Evidence

- connector success rate
- ingestion lag
- classification accuracy
- retry/backoff rate
