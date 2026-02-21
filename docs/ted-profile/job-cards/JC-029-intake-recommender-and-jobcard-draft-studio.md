# JC-029 — Intake Recommender and Job-Card Draft Studio

## Outcome

Operator can submit a new work intake in Ted UI and receive council-aligned job-card settings, KPIs, hard bans, and a draft markdown scaffold.

## Promotion State

- Current: DONE
- Promotion rule:
  - Requires `JC-022` PASS.

## Non-negotiables

- Intake output remains draft-only (no autonomous writes to governance docs).
- Recommendations must preserve Day-1 ceilings and approval-first policy.
- Generated settings include explicit governance tier and KPI suggestions.

## Deliverables

- Ted UI intake form (title, outcome, job family, risk, automation mode).
- Sidecar method `ted.intake.recommend` for structured recommendation output.
- Draft job-card markdown preview rendered inline for operator review.
- Recommendation decision actions (approve/dismiss) on council recommendation cards.

## Proof Script

- `scripts/ted-profile/proof_jc029.sh`

## Proof Evidence (Executed)

- Date: 2026-02-20
- Result: PASS

## Friction KPI Evidence

- connector success rate
- ingestion lag
- classification accuracy
- retry/backoff rate
