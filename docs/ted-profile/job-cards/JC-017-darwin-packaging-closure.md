# JC-017 — Darwin Packaging Closure for Final Mac Installer

## Outcome

Complete installer packaging on a macOS Darwin runner and attach signed/notarized evidence per release policy stage.

## Promotion State

- Current: BLOCKED
- Promotion rule:
  - Requires `JC-016` PASS and mac packaging environment availability.

## Non-negotiables

- Packaging is executed on macOS with required Swift/Xcode tooling.
- Artifacts are reproducible and tied to release checklist evidence.
- Day-1 governance gates remain green before packaging promotion.

## Deliverables

- Darwin runner packaging execution record.
- Installer artifacts and verification evidence.
- Signed/notarized status aligned to distribution stage policy.

## Operator Loop Impact

- Enables final install distribution without changing runtime governance behavior.

## Friction KPI Evidence

- Installer success does not regress setup/doctor usability.

## Proof

- `scripts/ted-profile/proof_jc011_mac_preflight.sh` passes on Darwin.
- `pnpm mac:package` succeeds and emits expected artifacts.
- Operator validation checklist attached.
- Runbook and checklist: `docs/ted-profile/sdd-pack/19_JC017_DARWIN_RUNBOOK.md`

## Proof Script

- `scripts/ted-profile/proof_jc017.sh`

## Proof Evidence (Executed)

- Date: 2026-02-20
- Result: BLOCKED (`proof_jc017.sh` -> Darwin required; current environment is Linux)
