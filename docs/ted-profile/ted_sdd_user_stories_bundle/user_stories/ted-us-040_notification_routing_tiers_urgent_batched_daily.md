---
id: TED-US-040
title: Notification routing tiers (urgent, batched, daily)
epic: EPIC-08
job_family: OUT
priority: P1
release_target: Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **route notifications by urgency instead of constant interruptions** so that **Ted helps me focus while still surfacing time-critical issues.**

## Acceptance criteria

- [ ] At least three routing tiers exist: urgent alert, end-of-day batch, daily morning brief.
- [ ] Default is non-interruptive (batched) unless a rule flags urgency.
- [ ] Operator can configure routing preferences without code changes.

## Notes / constraints

- Client: EOD brief vs real-time interrupts; SLA windows were discussed.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
