# JC-033 — Core Task Flow Redesign

## Outcome

Top operator workflows (inspect card, decide recommendation, run proof, create intake draft) are streamlined and measurable.

## Promotion State

- Current: DONE
- Promotion rule:
  - Requires `JC-032` PASS.

## Non-negotiables

- Click-depth reduction must not remove governance checkpoints.
- Every flow ends with clear next action.

## Deliverables

- updated operator flow with measurable friction reduction.
- explicit empty/loading/error states for each core task.

## Proof Script

- `scripts/ted-profile/proof_jc033.sh`

## Friction KPI Evidence

- connector success rate
- ingestion lag
- classification accuracy
- retry/backoff rate
