# Ted UI Strategy (Operator-Centered)

**Generated:** 2026-02-20  
**Goal:** move from metric dashboard to governed operator cockpit.

## Design Principles

1. **Action over telemetry:** every important card has an adjacent next action.
2. **Drill-down by default:** list items are navigable to structured detail.
3. **Governance in flow:** warnings, reason codes, and next-safe-step are in-context.
4. **Friction budget visible:** threshold and KPI implications shown before operator commits.

## Target Information Architecture

- `Operate`
  - Unified approvals
  - Active queues (triage/filing/ops)
- `Build`
  - Job cards board
  - Card detail + draft studio
  - Proof execution and promotion readiness
- `Govern`
  - Policy checks, role-card validation, threshold controls
- `Intake`
  - New work intake
  - Recommended card draft + KPI seed
- `Evals`
  - KPI trends
  - Regression and release-gate status

## Interaction Contract

- Any risky action requires explicit approval path.
- Any threshold relaxation requires explicit risk acknowledgment.
- Any blocked action renders:
  - reason code
  - what failed
  - next safe step

## UX Milestones

1. M1: inventory + IA lock (`JC-031`, `JC-032`)
2. M2: core task redesign (`JC-033`)
3. M3: governance + approval unification (`JC-034`)
4. M4: KPI/evals cockpit (`JC-035`)
