---
id: TED-US-062
title: Workflow vs agent boundary contract enforced
epic: EPIC-09
job_family: GOV
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-20
---

## User story

As **Operator (Clint)**, I want **deterministic workflow paths to be explicitly separated from adaptive agent paths** so that **runtime behavior stays predictable and governance remains enforceable.**

## Acceptance criteria

- [ ] Every promoted route has an explicit boundary policy (`WORKFLOW_ONLY` or `ADAPTIVE_ALLOWED`).
- [ ] Missing route boundary declarations fail closed with explainability fields.
- [ ] Adaptive mode requests on workflow-only routes are blocked with a reason code and remediation step.

## Notes / constraints

- Deterministic mode is the default when mode is unspecified.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
