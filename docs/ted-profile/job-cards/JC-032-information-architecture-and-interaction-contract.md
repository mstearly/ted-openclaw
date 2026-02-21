# JC-032 — Information Architecture and Interaction Contract

## Outcome

Ted UI is reorganized around operator tasks (`Operate`, `Build`, `Govern`, `Intake`, `Evals`) with a documented interaction contract.

## Promotion State

- Current: DONE
- Promotion rule:
  - Requires `JC-031` PASS.

## Non-negotiables

- Governance constraints remain visible in each interaction.
- No hidden destructive actions.

## Deliverables

- `25_TED_UI_STRATEGY.md` IA sections accepted.
- interaction contract with failure-state UX requirements.

## Proof Script

- `scripts/ted-profile/proof_jc032.sh`

## Friction KPI Evidence

- connector success rate
- ingestion lag
- classification accuracy
- retry/backoff rate
