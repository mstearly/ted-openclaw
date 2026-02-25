# JC-015 — Offline Evals and Regression Gates

## Outcome

A reusable eval corpus and regression harness validates drafting, extraction, contradiction detection, and escalation routing quality before promotion.

## Promotion State

- Current: DONE
- Promotion rule:
  - Requires `JC-014` PASS.

## Non-negotiables

- Eval corpus is versioned and reproducible.
- Regression gate is mandatory for promotion.
- Quality regressions block feature unlocks.

## Deliverables

- Gold eval fixtures for drafts/extraction/contradictions/escalations.
- Eval runner script and scoring output.
- Gate threshold policy wired into release checks.

## Operator Loop Impact

- Increases trust in draft queue and daily decision quality.

## Friction KPI Evidence

- Correction rate trend improves or remains stable.
- False positive escalation rate stays within gate threshold.

## Proof

- Eval runner executes and emits deterministic scorecard.
- Regression below threshold fails gate.
- Passing run is attached as release evidence.

## Proof Script

- `scripts/ted-profile/proof_jc015.sh`

## Proof Evidence (Executed)

- Date: 2026-02-20
- Result: PASS
