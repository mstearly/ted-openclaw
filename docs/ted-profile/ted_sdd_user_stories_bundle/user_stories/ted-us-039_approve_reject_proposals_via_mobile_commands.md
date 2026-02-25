---
id: TED-US-039
title: Approve/reject proposals via mobile commands
epic: EPIC-08
job_family: LED
priority: P0
release_target: Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **approve or reject filing suggestions, holds, and other proposals directly from my chat thread** so that **governance stays practical and I don't need to open a laptop for routine approvals.**

## Acceptance criteria

- [ ] Each proposal is assigned an id and presented with an Approve/Reject action.
- [ ] Approvals are one-time-use and bound to the specific proposal/plan (prevents replay).
- [ ] Approvals received from unknown senders are ignored and logged.

## Notes / constraints

- Needed for the propose→certify→execute model.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
