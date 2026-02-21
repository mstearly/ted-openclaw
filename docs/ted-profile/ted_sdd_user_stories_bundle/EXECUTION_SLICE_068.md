# Execution Slice: TED-US-068 (Discoverability Remediation)

## SDD Method

- Dependency-preserving remediation slice.
- No auth boundary regression allowed.
- Proof-first promotion.

## Slice

1. `TED-US-068` Ted discoverability surface and console visibility

## Proof Mapping

- `JC-018` -> `scripts/ted-profile/proof_jc018.sh`

## Stop-the-Line

- Any non-health sidecar route made unauthenticated.
- Any `/ted` contract change that bypasses `/status`/`/doctor` allowlist.
