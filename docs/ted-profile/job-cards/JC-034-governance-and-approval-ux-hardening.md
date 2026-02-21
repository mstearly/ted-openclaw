# JC-034 — Governance and Approval UX Hardening

## Outcome

Operator has a unified approval surface and governance timeline with structured reason codes and next-safe-step guidance.

## Promotion State

- Current: DONE
- Promotion rule:
  - Requires `JC-033` PASS.

## Non-negotiables

- Approval-first remains mandatory for risky actions.
- Deny paths must be explainable and actionable.

## Deliverables

- unified approval queue panel.
- governance event timeline for operator-visible actions.

## Proof Script

- `scripts/ted-profile/proof_jc034.sh`

## Friction KPI Evidence

- connector success rate
- ingestion lag
- classification accuracy
- retry/backoff rate
