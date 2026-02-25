---
id: TED-US-029
title: Optional sync with Microsoft To Do/Planner (read + gated writes)
epic: EPIC-05
job_family: LED
priority: P1
release_target: Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **keep Microsoft To Do/Planner aligned with my canonical task list while preventing uncontrolled writes** so that **I can use M365 task surfaces without sacrificing governance.**

## Acceptance criteria

- [ ] System can read tasks from To Do/Planner for reconciliation.
- [ ] Any create/update to external task systems requires explicit approval.
- [ ] Reconciliation report shows drift and proposed fixes.

## Notes / constraints

- Matches 'keep planner true' concept.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
