# JC-019 — Ted Workbench Dashboard Surface

## Outcome

Operator can use a first-class Ted dashboard tab in OpenClaw Control UI to see job-card progression, friction KPI gates, sidecar health, and council recommendations without switching to chat commands.

## Promotion State

- Current: DONE
- Promotion rule:
  - Requires `JC-018` PASS and no auth-boundary regression from `JC-013`.

## Non-negotiables

- Dashboard is read-only and informational for Day-1.
- No expansion of risky-write capabilities through dashboard actions.
- Day-1 ceilings remain unchanged (draft-only, approval-first, no send/invite).

## Deliverables

- Gateway method `ted.workbench` exposed by `ted-sidecar` plugin.
- Control UI `Ted` tab rendering sidecar health, job-card status, friction KPI thresholds, and recommendations.
- SDD traceability updates linking story, slice, and proof.

## Operator Loop Impact

- Reduces friction by eliminating context switching between chat diagnostics and operational dashboard checks.

## Friction KPI Evidence

- Faster diagnosis for unhealthy sidecar and blocked cards.
- Lower manual orchestration overhead for day-start operational check.

## Proof

- `ted.workbench` method returns a valid snapshot payload from control UI client.
- `Ted` tab appears in navigation and renders recommendation + KPI surfaces.
- Existing `/ted` command path remains functional and unchanged.

## Proof Script

- `scripts/ted-profile/proof_jc019.sh`

## Proof Evidence (Executed)

- Date: 2026-02-20
- Result: PASS
