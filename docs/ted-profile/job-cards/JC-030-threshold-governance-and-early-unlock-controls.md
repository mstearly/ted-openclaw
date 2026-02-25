# JC-030 — Threshold Governance and Early Unlock Controls

## Outcome

Operator can tune friction thresholds to unlock value sooner, with explicit risk acknowledgement and warnings preserved in the governed Ted surface.

## Promotion State

- Current: DONE
- Promotion rule:
  - Requires `JC-029` PASS.

## Non-negotiables

- Relaxing thresholds requires explicit risk acknowledgement.
- Defaults are resettable and auditable.
- Threshold tuning does not bypass draft-only or approval-first boundaries.

## Deliverables

- Sidecar method `ted.gates.set` with risk-acknowledgement enforcement.
- Ted UI threshold panel with editable gates and warning callouts.
- Runtime persistence for threshold overrides.

## Proof Script

- `scripts/ted-profile/proof_jc030.sh`

## Proof Evidence (Executed)

- Date: 2026-02-20
- Result: PASS

## Friction KPI Evidence

- connector success rate
- ingestion lag
- classification accuracy
- retry/backoff rate
