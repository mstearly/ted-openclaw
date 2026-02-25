# Council End-to-End Interrogation Cycle 004 (OpenClaw -> Ted -> Connectors)

Generated: 2026-02-21

## Scope

- OpenClaw control planes and operator surfaces
- Ted sidecar plugin boundary
- Ted engine governance and connector interfaces
- KPI logging, eval signals, and learning-loop maturity path

## Council Verdict

Overall posture: **Amber**

- Strong: governance-first constraints, fail-closed route posture, approval-first decisions, SDD traceability depth.
- Gaps closed in this cycle:
  - recommendation attribution
  - per-card promotion confidence
  - policy change impact attribution
  - explicit operator approval flow visibility in UI
  - connector health visibility for M365 profiles in UI
- Remaining gaps: richer task-level KPI telemetry, end-to-end approval ledger correlation, production connector reliability SLO dashboards.

## End-to-End Findings

1. OpenClaw/Ted boundary:
   - Loopback and auth contracts are present and enforced.
   - Sidecar non-health routes require auth and deterministic mode signaling.

2. Clint workflow clarity:
   - Previously implicit; now explicit in UI via operator workflow card.
   - Primary approval path remains Ted Workbench with chat fallback.

3. Connector controls:
   - M365 profile status now surfaced in Ted UI with next-step guidance.
   - Remaining work: add auth start/poll controls from Ted page.

4. Learning loop:
   - Decisions now feed attribution and promotion confidence.
   - Policy deltas now feed impact attribution and confidence model.

## Stop-the-line Criteria

- Any non-health route callable without auth contract.
- Any approval action without audit event.
- Any confidence render missing drivers or confidence score.
- Any policy update without impact attribution event.

## Promotion Outcome

- Cycle-004 slice accepted for implemented scope.
- Proceed to remediation program `JC-046..055` with dependency order and proof gates.
