# JC-014 — Orchestration Idempotency, Retry, and Resume Integrity

## Outcome

Long-running and retryable jobs are idempotent, deduplicated, and resume safely after interruption.

## Promotion State

- Current: DONE
- Promotion rule:
  - Requires `JC-013` PASS.

## Non-negotiables

- Duplicate requests do not duplicate side effects.
- Retry policy is bounded and priority-aware.
- Resume after restart preserves intent and queue invariants.

## Deliverables

- Idempotency key contract for write-like operations.
- Dedupe ledger and bounded retry/backoff policy.
- Resume consistency checks for queued work.

## Operator Loop Impact

- Stabilizes queue behavior and prevents surprise duplicate work.

## Friction KPI Evidence

- No growth in unresolved triage from duplicate processing.
- Recovery after interruption remains within existing queue-age budget.

## Proof

- Replayed request with same idempotency key is handled exactly once.
- Retry backoff follows policy and stops at configured limits.
- Restart/resume returns deterministic catch-up output.

## Proof Script

- `scripts/ted-profile/proof_jc014.sh`

## Proof Evidence (Executed)

- Date: 2026-02-20
- Result: PASS
