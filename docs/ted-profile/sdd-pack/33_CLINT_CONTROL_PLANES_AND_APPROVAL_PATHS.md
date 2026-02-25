# Clint Control Planes and Approval Paths

Generated: 2026-02-21

## Primary Control Plane

Ted Workbench is primary for:

- recommendation decisions
- work-item inspection
- policy updates
- KPI and confidence review

## Secondary Control Plane

OpenClaw chat remains fallback for:

- status/doctor/catalog command checks
- degraded-mode operational continuity

## Approval Path Contract

1. Recommendation appears in Ted Workbench.
2. Clint approves/dismisses in Ted Workbench.
3. Decision is recorded in governance timeline and attribution store.
4. Promotion confidence updates on next snapshot.

## UX Guardrails

- Every actionable panel must state "what this does" and "what happens next".
- Every blocked state must include reason + next safe step.
- No advanced toggle should apply silently without explicit operator action.
