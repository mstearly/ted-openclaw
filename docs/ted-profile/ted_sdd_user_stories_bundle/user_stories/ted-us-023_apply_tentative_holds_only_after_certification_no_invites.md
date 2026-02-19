---
id: TED-US-023
title: Apply tentative holds only after certification (no invites)
epic: EPIC-04
job_family: LED
priority: P0
release_target: Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **certify and apply tentative holds for deadlines/focus blocks without sending invites** so that **the calendar reflects commitments while remaining draft-only and controlled.**

## Acceptance criteria

- [ ] Apply is blocked without an explicit approval/certification record tied to the proposal/plan.
- [ ] Created calendar items are tentative/draft holds and do not send invites.
- [ ] Audit record includes proposal id, linkage, and created item identifiers.

## Notes / constraints

- Maintains draft-only boundary.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
