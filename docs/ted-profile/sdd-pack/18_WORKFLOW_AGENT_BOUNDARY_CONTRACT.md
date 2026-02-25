# Workflow Agent Boundary Contract

**Generated:** 2026-02-20
**Purpose:** enforce deterministic-by-default behavior and explicitly bound adaptive execution.

## Contract

- Default execution mode is `DETERMINISTIC`.
- Allowed mode values are `DETERMINISTIC` and `ADAPTIVE`.
- Any route without a declared boundary policy is fail-closed.
- `ADAPTIVE` execution is denied on `WORKFLOW_ONLY` routes with explainability fields.

## Route Policy (Day-1 + Phase-1)

- `WORKFLOW_ONLY`
  - Governance routes (`/governance/*`) except adaptive-specific routing
  - Ops routes (`/ops/*`)
  - Deals, triage, filing, patterns routes
  - Graph routes and diagnostics
- `ADAPTIVE_ALLOWED`
  - `/learning/affinity/route` only

## Required Request Surface

- Header: `x-ted-execution-mode: DETERMINISTIC|ADAPTIVE`
- Missing header defaults to `DETERMINISTIC`.

## Failure Contract

- Invalid execution mode: `INVALID_EXECUTION_MODE`
- Out-of-contract adaptive request: `OUT_OF_CONTRACT_EXECUTION_MODE`
- Undeclared route policy: `UNDECLARED_EXECUTION_BOUNDARY`

## Non-goals

- This contract does not relax approval-first or draft-only constraints.
- This contract does not grant new side effects.
