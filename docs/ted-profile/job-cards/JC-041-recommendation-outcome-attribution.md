# JC-041 - Recommendation Outcome Attribution

## Outcome

When Clint approves or dismisses a recommendation, Ted automatically attributes that decision to affected work items so learning signals are explicit and auditable.

## Promotion State

- Current: DONE
- Promotion rule:
  - Requires proof gate PASS and no recommendation-decision audit regressions.

## Non-negotiables

- Outcome attribution must be automatic on every recommendation decision.
- Attribution must include timestamp, decision, rationale, and linked job-card IDs.
- Attribution persistence must remain local-first and auditable.

## Deliverables

- Runtime persistence for recommendation outcome attribution events.
- Workbench surface showing approved/dismissed/pending totals and recent attributed outcomes.
- Governance trace events for recommendation decisions.

## Friction KPI Evidence

- recommendation decision-to-attribution latency
- attributed recommendation coverage rate
- unresolved recommendation rate

## Proof Evidence (Executed)

- `scripts/ted-profile/proof_jc041.sh`
