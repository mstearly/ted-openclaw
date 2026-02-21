# Ted UI Governed Execution Plan

**Generated:** 2026-02-20

## Program Decision

- Freeze ad hoc UI additions.
- Execute UI work only through dependency-ordered governance slices (`JC-031..035`).
- Promote by proof, not by visual completion.

## Dependency Order

1. `JC-031` UI surface inventory + gap acceptance
2. `JC-032` IA + interaction contract
3. `JC-033` core task flow redesign
4. `JC-034` governance and approval UX hardening
5. `JC-035` KPI/evals observability cockpit

## Proof Gate Expectations

- Each JC has a dedicated proof script.
- Proof must assert:
  - route wiring
  - UI control presence
  - governance constraint not regressed

## Stop-the-Line Rules

- Any risky action without explicit approval path.
- Any threshold relaxation without risk-acknowledgment prompt.
- Any UI action returning unstructured “unknown error” without next safe step.

## Release Readiness for UI Program

- All `JC-031..035` marked DONE.
- `pnpm check` and `pnpm check:docs` pass.
- Council interrogation cycle updated with executed evidence.
