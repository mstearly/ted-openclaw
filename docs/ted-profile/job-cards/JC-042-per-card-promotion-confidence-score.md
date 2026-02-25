# JC-042 - Per-card Promotion Confidence Score

## Outcome

Each job card gets a measurable promotion-confidence score so Clint can see readiness, risk, and what to improve before promotion.

## Promotion State

- Current: DONE
- Promotion rule:
  - Requires confidence model fields present on all cards and proof gate PASS.

## Non-negotiables

- Confidence score must be computed for every discovered job card.
- Score must include plain-English drivers and confidence band.
- Confidence model must include recommendation outcomes, proof history, dependencies, status, and KPI coverage.

## Deliverables

- Sidecar confidence scoring model with bounded 0-100 score and readiness band.
- UI rendering of confidence per card and in card detail.
- SDD proof gate for confidence fields and learning loop wiring.

## Friction KPI Evidence

- promotion confidence coverage rate
- confidence-to-promotion agreement rate
- cards blocked by low confidence

## Proof Evidence (Executed)

- `scripts/ted-profile/proof_jc042.sh`
