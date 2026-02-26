# SDD 98 - Council Dependabot Remediation Execution Log

Date: 2026-02-26

## Scope

Baseline from Dependabot/audit on `main`:

- Critical: `basic-ftp` via `@mariozechner/pi-ai -> proxy-agent -> pac-proxy-agent -> get-uri`.
- High: `rollup` via `ui -> vite -> rollup`.
- Low: `hono` via `@buape/carbon -> @hono/node-server -> hono`.
- Moderate (residual): `request` via `extensions/matrix -> @vector-im/matrix-bot-sdk -> request` (no patched upstream path).

## Root Cause

1. Vulnerable transitive versions were lockfile-selected and not auto-updated.
2. Matrix SDK dependency chain still relies on deprecated `request` with no patched upstream release.
3. Existing CI did not have a dedicated production-dependency critical gate.

## Remediation Executed

### Wave R1 - Critical/High/Low transitive remediation

1. Added deterministic `pnpm.overrides` pins:
   - `basic-ftp: 5.2.0`
   - `rollup: 4.59.0`
   - `@hono/node-server@1.19.9>hono: 4.11.10`
2. Added root dependency `hono@4.11.10` to satisfy Carbon node-server peer cleanly.
3. Regenerated lockfile with `pnpm install --config.minimum-release-age=0`.

Outcome:

- `pnpm audit --prod --json` now reports:
  - critical: `0`
  - high: `0`
  - low: `0`
  - moderate: `1` (`request`, residual)

### Wave R2 - Matrix containment for residual moderate risk

Implemented immediate guardrails in Matrix plugin:

1. Strict homeserver URL validation (`extensions/matrix/src/matrix/client/config.ts`):
   - only `http://` or `https://`
   - blocks embedded credentials (`user:pass@host`)
   - blocks query/hash in homeserver URL
   - enforces `https://` for non-local hosts by default
   - explicit escape hatch: `channels.matrix.allowInsecureHomeserver: true`
   - env equivalent: `MATRIX_ALLOW_INSECURE_HOMESERVER=true`
2. Redirect hardening for Matrix HTTP calls we own:
   - password login fetch uses `redirect: "error"`
   - live directory fetch helper uses `redirect: "error"`
3. Added/updated tests for these controls.

### Wave R4 - CI/process hardening

1. Added CI job `security-critical-audit` in `.github/workflows/ci.yml`:
   - runs `pnpm audit --prod --audit-level=critical`
   - blocks PR/push on critical vulnerabilities.
2. Added scheduled workflow `.github/workflows/dependency-hygiene.yml`:
   - weekly run + manual dispatch
   - runs critical audit gate
   - prints recursive outdated dependency report.

## Residual Risk Decision (Moderate)

Residual advisory retained:

- `request@2.88.2` via `@vector-im/matrix-bot-sdk@0.8.0-element.3`.

Disposition:

- Accepted short-term with compensating controls from Wave R2.
- Managed under active migration plan from SDD 82 direction.

## Next Tasks

1. Build Matrix SDK migration execution PRD:
   - target maintained Matrix client stack without `request`.
2. Create cutover plan:
   - adapter seam, parity matrix, regression suite.
3. Exit criterion:
   - `pnpm audit --prod` moderate count attributable to Matrix `request` path reaches zero.
