---
id: TED-US-031
title: Render templates into draft documents with deal data
epic: EPIC-06
job_family: OUT
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **generate a finished draft artifact from a selected template and deal/counterparty inputs** so that **I can produce first-pass documents quickly and consistently.**

## Acceptance criteria

- [ ] Given template + inputs, Ted renders a draft artifact saved to the correct deal folder.
- [ ] Draft is linked to deal_id/task_id and appears in daily digest (as an output).
- [ ] If inputs are missing, Ted asks rather than guessing.

## Notes / constraints

- Supports repeated drafting.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
