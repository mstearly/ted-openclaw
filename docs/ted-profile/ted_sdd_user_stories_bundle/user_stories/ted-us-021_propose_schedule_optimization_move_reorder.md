---
id: TED-US-021
title: Propose schedule optimization (move/reorder)
epic: EPIC-04
job_family: LED
priority: P0
release_target: Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **get proposals for schedule changes that make me more efficient** so that **I spend less time shuffling meetings and more time executing priorities.**

## Acceptance criteria

- [ ] System proposes candidate moves with justification and risk flags (who is impacted, what conflicts).
- [ ] No changes are applied automatically; proposals are queued for review.
- [ ] Personal calendar is never accessed or modified.

## Notes / constraints

- Client wants more than time-slot suggestion; wants efficient rearrangement.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
