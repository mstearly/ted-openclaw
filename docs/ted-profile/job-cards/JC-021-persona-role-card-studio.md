# JC-021 — Persona and Role Card Studio

## Outcome

Operator can define, load, validate, and promote personas/role cards from Ted UI using governed contracts.

## Promotion State

- Current: DONE
- Promotion rule:
  - Requires `JC-020` PASS.

## Non-negotiables

- Validation fails closed via governance route.
- No publish/apply without explicit operator certification.

## Deliverables

- Persona list/create/edit UI.
- Role-card validate flow (`/governance/role-cards/validate`).
- Promotion state and audit trace surfaced.

## Proof Script

- `scripts/ted-profile/proof_jc021.sh`

## Proof Evidence (Executed)

- Date: 2026-02-20
- Result: PASS

## Friction KPI Evidence

- connector success rate
- ingestion lag
- classification accuracy
- retry/backoff rate
