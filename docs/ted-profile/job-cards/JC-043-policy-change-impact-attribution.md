# JC-043 - Policy Change Impact Attribution

## Outcome

When Clint updates policy configuration, Ted automatically attributes likely impact to affected job-card groups and expected KPI effects.

## Promotion State

- Current: DONE
- Promotion rule:
  - Requires policy-attribution event persistence and proof gate PASS.

## Non-negotiables

- Every policy update writes a policy impact attribution event.
- Attribution includes changed fields, risk direction, linked cards, and expected KPI effects.
- Policy attribution remains advisory and never bypasses governance controls.

## Deliverables

- Runtime policy impact store with bounded retention.
- Workbench payload policy impact summary and recent events.
- Govern UI section rendering policy impact attribution in plain language.

## Friction KPI Evidence

- policy change attribution coverage rate
- policy change to impact visibility latency
- promotion regressions after policy changes

## Proof Evidence (Executed)

- `scripts/ted-profile/proof_jc043.sh`
