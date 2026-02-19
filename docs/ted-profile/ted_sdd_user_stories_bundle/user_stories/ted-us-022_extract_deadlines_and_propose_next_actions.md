---
id: TED-US-022
title: Extract deadlines and propose next actions
epic: EPIC-04
job_family: LED
priority: P0
release_target: Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **extract deadlines from email/docs and turn them into proposed tasks and holds** so that **I don't miss deposit dates, diligence windows, or closing milestones.**

## Acceptance criteria

- [ ] Each extracted deadline includes source reference (email/doc), confidence, and suggested next action.
- [ ] System proposes tasks and/or tentative holds linked to the deal/task.
- [ ] Proposals are batched into a daily digest and require approval before apply.

## Notes / constraints

- Client wants extraction + suggestion + approve onto calendar.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
