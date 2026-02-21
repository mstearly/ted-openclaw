# JC-022 — Job Card Board and Proof Runner

## Outcome

Operator can manage job cards in dependency order, run proofs, and view promotion readiness from Ted UI.

## Promotion State

- Current: DONE
- Promotion rule:
  - Requires `JC-021` PASS.

## Non-negotiables

- Dependency ordering must be explicit.
- Promotion blocked on failed/missing proofs.

## Deliverables

- Job-card board with status + dependency graph.
- Proof execution hooks + pass/fail evidence links.
- Promotion gate indicator.

## Proof Script

- `scripts/ted-profile/proof_jc022.sh`

## Proof Evidence (Executed)

- Date: 2026-02-20
- Result: PASS
- Evidence:
  - Dependency-aware job-card board is live in Ted UI.
  - Governed proof execution hook (`ted.jobcards.proof.run`) is wired with allowlisted script paths.

## Friction KPI Evidence

- connector success rate
- ingestion lag
- classification accuracy
- retry/backoff rate
