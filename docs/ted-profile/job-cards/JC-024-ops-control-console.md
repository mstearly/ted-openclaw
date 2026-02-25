# JC-024 — Ops Control Console

## Outcome

Ted UI exposes pause/resume, dispatch, rate, retry, and repair simulation controls with fail-closed behavior.

## Promotion State

- Current: TODO
- Promotion rule:
  - Requires `JC-023` PASS.

## Proof Script

- `scripts/ted-profile/proof_jc024.sh`

## Friction KPI Evidence

- connector success rate
- ingestion lag
- classification accuracy
- retry/backoff rate
