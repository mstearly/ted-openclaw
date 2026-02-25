---
id: TED-US-042
title: Builder console shows self-serve vs glass-break boundaries
epic: EPIC-09
job_family: GOV
priority: P1
release_target: Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **see which changes I can self-serve and where the 'glass breaking points' are** so that **I know when to escalate to engineering/security and avoid unsafe changes.**

## Acceptance criteria

- [ ] Console lists hard boundaries (send/share/invite, tenant isolation, secrets handling, finance execution).
- [ ] For a proposed change, console classifies it as self-serve, governance review, or feature request required.
- [ ] Any governance-impacting change creates a governance record.

## Notes / constraints

- Matches governance blueprint approach.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
