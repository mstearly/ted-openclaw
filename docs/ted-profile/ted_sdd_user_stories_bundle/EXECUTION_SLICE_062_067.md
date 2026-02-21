# Execution Slice: TED-US-062..067 (Council Remediation)

## SDD Method

- Dependency-ordered implementation.
- Proof-first promotion.
- No forward promotion when current slice proof fails.

## Ordered Slices

1. `TED-US-062` Workflow-vs-agent boundary contract enforced
2. `TED-US-063` Sidecar auth contract hardened for non-health routes
3. `TED-US-064` Idempotent retryable and resume-safe orchestration
4. `TED-US-065` Offline eval gold sets and regression gate
5. `TED-US-066` Fast repair under 10 seconds with explainability
6. `TED-US-067` Darwin packaging and installer evidence gate

## Proof Mapping

- `JC-012` -> `scripts/ted-profile/proof_jc012.sh`
- `JC-013` -> `scripts/ted-profile/proof_jc013.sh`
- `JC-014` -> `scripts/ted-profile/proof_jc014.sh`
- `JC-015` -> `scripts/ted-profile/proof_jc015.sh`
- `JC-016` -> `scripts/ted-profile/proof_jc016.sh`
- `JC-017` -> `scripts/ted-profile/proof_jc017.sh`

## Stop-the-Line

- Non-health route auth bypass.
- Out-of-contract adaptive execution on workflow-only routes.
- Eval regression gate failure.
- Fast-repair gate failure (>10 seconds median).

## Follow-on slice

- `TED-US-068` discoverability remediation is tracked separately in `EXECUTION_SLICE_068.md`.
