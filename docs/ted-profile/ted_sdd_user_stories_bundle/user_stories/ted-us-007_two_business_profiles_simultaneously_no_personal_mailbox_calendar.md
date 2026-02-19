---
id: TED-US-007
title: Two business profiles simultaneously (no personal mailbox/calendar)
epic: EPIC-01
job_family: GOV
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **operate across two business identities without manual context switching while keeping personal email/calendar inaccessible** so that **I can run deal workflows across entities safely and clearly.**

## Acceptance criteria

- [ ] System supports two configured business profiles simultaneously and each action is explicitly attributed to a profile.
- [ ] Personal accounts are not connected, and any attempt to access them is blocked.
- [ ] Daily outputs can be generated per profile and/or combined with clear labeling.

## Notes / constraints

- Client stated: no personal email/calendar control; also referenced two OneDrive contexts.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
