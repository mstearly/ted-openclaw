# Recommendation Attribution + Promotion Confidence (Council Decision)

## Decision

Council approved a governed learning-loop hardening update:

1. Recommendation decisions must be automatically attributed to affected job cards.
2. Every job card must expose a promotion-confidence score with plain-English drivers.
3. Policy saves must produce impact attribution events tied to likely affected work and KPI effects.

## Why

- Clint needs measurable guidance, not static status labels.
- Ted needs explicit outcome feedback loops to improve recommendation quality over time.
- Promotion decisions should be evidence-weighted and auditable.

## Runtime Contract

- Recommendation decision event writes both:
  - decision state (`approved` or `dismissed`)
  - attribution event (`id`, `decision`, `decided_at`, `linked_cards`, `rationale`)
- Workbench payload includes:
  - `recommendation_outcomes.totals`
  - `recommendation_outcomes.recent`
  - `job_cards.cards[].promotion_confidence`
  - `policy_impacts.totals_by_policy`
  - `policy_impacts.recent`

## Confidence Inputs

- Job-card status
- KPI signal coverage
- Dependency readiness
- Latest proof run result
- Recommendation attribution outcomes

## SDD Wiring

- User stories:
  - `TED-US-091` Recommendation outcome attribution
  - `TED-US-092` Per-card promotion confidence
- `TED-US-093` Policy change impact attribution
- Execution slices:
  - `EXECUTION_SLICE_091_092.md`
  - `EXECUTION_SLICE_093.md`
- Job cards:
  - `JC-041`
  - `JC-042`
  - `JC-043`
- Proofs:
  - `scripts/ted-profile/proof_jc041.sh`
  - `scripts/ted-profile/proof_jc042.sh`
  - `scripts/ted-profile/proof_jc043.sh`

## Governance Constraint

Learning signals are advisory only. They can never bypass approval-first, draft-only, or fail-closed controls.
