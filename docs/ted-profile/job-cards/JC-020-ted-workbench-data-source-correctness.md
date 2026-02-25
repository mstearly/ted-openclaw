# JC-020 — Ted Workbench Data-Source Correctness

## Outcome

Ted workbench reliably discovers job cards across runtime environments and exposes source diagnostics so operators trust dashboard totals.

## Promotion State

- Current: DONE
- Promotion rule:
  - Must pass before any new Ted UI operability surfaces are promoted.

## Non-negotiables

- No silent fallback to zero when source exists.
- Data-source status must be visible in UI.

## Deliverables

- Robust job-card directory discovery (repo/runtime-safe).
- Workbench payload includes source diagnostics.
- UI shows source path/discovery state.

## Proof Script

- `scripts/ted-profile/proof_jc020.sh`

## Proof Evidence (Executed)

- Date: 2026-02-20
- Result: PASS

## Friction KPI Evidence

- connector success rate
- ingestion lag
- classification accuracy
- retry/backoff rate
