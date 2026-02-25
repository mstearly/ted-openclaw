# JC-037 - Structured Job Card Editor

## Outcome

Provide a guided editor for job cards so Clint can change outcomes, dependencies, KPI targets, and proof linkage without editing markdown directly.

## Non-negotiables

- Preview required before save when risky fields change.
- Missing proof/KPI emits blocking warning.

## Deliverables

- Structured editor mode + advanced markdown mode toggle.
- Field-level help text and validation.
- Preview and save flows with audit events.

## Friction KPI Evidence

- edit success rate
- preview-before-save compliance
- risky edit blocked count

## Proof Evidence (Executed)

- scripts/ted-profile/proof_jc037.sh
