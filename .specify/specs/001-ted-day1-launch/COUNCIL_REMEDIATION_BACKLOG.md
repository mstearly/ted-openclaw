# Council Remediation Backlog (Cycle 001)

**Generated:** 2026-02-20
**Input reviewed:** runtime routes, Day-1 spine spec, story traceability, coverage matrix.

## Dependency-Ordered JC Queue (Auto-generated)

1. `JC-012-workflow-agent-boundary-contract.md` — PASS
2. `JC-013-sidecar-auth-boundary-hardening.md` — PASS
3. `JC-014-orchestration-idempotency-retry-resume.md` — PASS
4. `JC-015-offline-evals-and-regression-gates.md` — PASS
5. `JC-016-fast-repair-and-explainability-gate.md` — PASS
6. `JC-017-darwin-packaging-closure.md` — BLOCKED (Darwin-only proof required)
7. `JC-018-sidecar-discoverability-surface.md` — PASS

## Why this order

- `JC-012` defines safe execution boundaries before adding more behavior.
- `JC-013` hardens the sidecar boundary before broader orchestration work.
- `JC-014` stabilizes retries/restarts so later quality signals are trustworthy.
- `JC-015` introduces reusable eval gates for ongoing regression control.
- `JC-016` enforces operator correction-speed and explainability outcomes.
- `JC-017` closes final mac installer distribution gate after runtime quality gates are green.

## Proof scripts staged

- `scripts/ted-profile/proof_jc012.sh`
- `scripts/ted-profile/proof_jc013.sh`
- `scripts/ted-profile/proof_jc014.sh`
- `scripts/ted-profile/proof_jc015.sh`
- `scripts/ted-profile/proof_jc016.sh`
- `scripts/ted-profile/proof_jc017.sh`
- `scripts/ted-profile/proof_jc018.sh`

## Promotion rule

- No promotion to the next remediation card unless the current card proof is PASS and prior existing proofs (`JC-006..JC-011`) remain green.
