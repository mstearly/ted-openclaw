# JC-048 - Connector Auth Controls in Ted UI

## Outcome

From Clint's seat, Ted exposes clear profile auth controls (start sign-in, check sign-in, revoke) so connector recovery happens inside Ted without shell work.

## Promotion State

- Current: DONE
- Promotion rule:
  - Connector auth actions execute via governed sidecar routes and refresh integration health.

## Non-negotiables

- Profile scope is restricted to approved business profiles only.
- Auth actions remain approval-safe and do not bypass sidecar auth contracts.
- UI must return plain-language remediation when auth actions fail.

## Deliverables

- Sidecar gateway methods for Graph auth start/poll/revoke.
- Ted Integration Health panel actions for each profile.
- Connector auth result/error surfaces in Ted UI.

## Friction KPI Evidence

- connector auth recovery time
- connector auth failure retry rate
- shell-only connector remediation incidents

## Proof Evidence (Executed)

- `scripts/ted-profile/proof_jc048.sh`
