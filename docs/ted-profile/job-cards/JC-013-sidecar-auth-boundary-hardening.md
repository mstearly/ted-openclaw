# JC-013 — Sidecar Auth Boundary Hardening

## Outcome

All non-health sidecar routes enforce the Day-1 auth contract; only `/status` and `/doctor` remain unauthenticated loopback health endpoints.

## Promotion State

- Current: DONE
- Promotion rule:
  - Requires `JC-012` PASS.

## Non-negotiables

- No auth bypass for non-health routes.
- Health endpoints remain accessible for doctor/recovery workflows.
- Auth failures are auditable and redacted.

## Deliverables

- Central auth gate for sidecar route handling.
- Explicit allowlist of unauthenticated health endpoints.
- Audit event emission on auth failure paths.

## Operator Loop Impact

- Preserves trust and reduces blast radius without impacting normal operator flow.

## Friction KPI Evidence

- Approval queue latency does not regress due to auth checks.
- Missing/expired auth errors provide actionable next-step remediation.

## Proof

- Non-health request without auth returns `401`.
- Health endpoints remain `200` on loopback without auth.
- Non-health request with valid auth reaches target handler.

## Proof Script

- `scripts/ted-profile/proof_jc013.sh`

## Proof Evidence (Executed)

- Date: 2026-02-20
- Result: PASS
