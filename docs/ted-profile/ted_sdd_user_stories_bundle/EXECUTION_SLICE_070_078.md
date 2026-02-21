# Execution Slice: TED-US-070..078 (Ted UI Operability Expansion)

## SDD Method

- Dependency-ordered and governance-preserving.
- Day-1 ceilings remain fixed (draft-only, approval-first, fail-closed).
- Promotion is proof-driven per JC card.

## Slice Order

1. `TED-US-070` workbench data-source correctness.
2. `TED-US-071` persona and role-card studio.
3. `TED-US-072` job-card board and proof runner.
4. `TED-US-073` governance console.
5. `TED-US-074` ops control console.
6. `TED-US-075` triage and filing console.
7. `TED-US-076` Graph profile manager and diagnostics.
8. `TED-US-077` unified approval surface.
9. `TED-US-078` KPI and evals dashboard.

## Proof Mapping

- `JC-020` -> `scripts/ted-profile/proof_jc020.sh`
- `JC-021` -> `scripts/ted-profile/proof_jc021.sh`
- `JC-022` -> `scripts/ted-profile/proof_jc022.sh`
- `JC-023` -> `scripts/ted-profile/proof_jc023.sh`
- `JC-024` -> `scripts/ted-profile/proof_jc024.sh`
- `JC-025` -> `scripts/ted-profile/proof_jc025.sh`
- `JC-026` -> `scripts/ted-profile/proof_jc026.sh`
- `JC-027` -> `scripts/ted-profile/proof_jc027.sh`
- `JC-028` -> `scripts/ted-profile/proof_jc028.sh`

## Stop-the-Line

- Any UX path bypassing certification for risky actions.
- Any non-health sidecar route called without auth contract.
- Any mismatch between UI-reported job-card metrics and source-of-truth files.

## Execution Update (2026-02-20)

- `TED-US-070` PASS
- `TED-US-071` PASS
- `TED-US-072` PASS
