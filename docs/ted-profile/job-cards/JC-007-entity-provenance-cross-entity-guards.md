# JC-007 — Entity/Provenance + Cross-Entity Guards

## Outcome

All candidate outputs carry entity + provenance context, and cross-entity rendering is blocked by default with explicit violation reasons.

## Promotion State

- Current: SHADOW
- Promotion rule:
  - Requires JC-006 PASS first.

## Non-negotiables

- Missing entity/provenance fails closed.
- Cross-entity render is blocked unless explicitly approved in future scope.
- Violations include machine-readable reason codes.

## Deliverables

- Entity/provenance validator for governed output paths.
- Cross-entity guard check before output release.

## Operator Loop Impact

- Keeps morning brief and draft queue trustworthy by preventing entity leakage.

## Friction KPI Evidence

- Track unresolved triage impact and explainability completeness for blocked outputs.

## Proof

- Untagged objects are blocked.
- Cross-entity output request is blocked with offending object ids.
- Same-entity output passes.

## Proof Evidence (Executed)

- Date: 2026-02-20
- Proof Script: `scripts/ted-profile/proof_jc007.sh`
- Result: PASS
