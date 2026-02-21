# JC-011 — Mac Packaging Preflight and Installer Gate

## Outcome

Establish deterministic macOS packaging preflight checks so final installer creation is blocked only by explicit environment prerequisites, not hidden failures.

## Promotion State

- Current: PREVIEW
- Promotion rule:
  - PREVIEW -> GA when preflight passes on a macOS runner and `pnpm mac:package` succeeds.

## Non-negotiables

- Packaging prerequisites must be explicit and testable.
- Installer gate failures must produce actionable remediation steps.
- Day-1 governance and quality gates remain required before packaging.

## Deliverables

- Preflight script for macOS packaging requirements.
- Explicit evidence of `pnpm mac:package` pass/fail with root cause.
- Operator validation checklist linkage.

## Proof

- Preflight script verifies required tooling (`swift`, `xcodebuild`) and platform.
- On valid macOS runner, package build produces installer artifacts.
- On non-mac or missing toolchain, gate fails with clear remediation.

## Proof Evidence (Executed)

- Date: 2026-02-20
- Proof Script: `scripts/ted-profile/proof_jc011_mac_preflight.sh`
- Result: BLOCKED (swift toolchain missing in current environment)
- Blocker: `pnpm mac:package` reached Swift build step and failed with `swift: command not found`.

## Friction KPI Evidence

- connector success rate
- ingestion lag
- classification accuracy
- retry/backoff rate
