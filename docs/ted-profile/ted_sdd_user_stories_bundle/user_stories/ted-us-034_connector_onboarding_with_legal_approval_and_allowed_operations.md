---
id: TED-US-034
title: Connector onboarding with legal approval and allowed operations
epic: EPIC-07
job_family: GOV
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **enable connectors only after recording licensing/legal approval and allowed operations** so that **external data usage stays compliant and controlled.**

## Acceptance criteria

- [ ] Each connector requires onboarding metadata (license reference, retention, allowed operations, approval flag).
- [ ] Connector credentials are referenced via secret references only.
- [ ] Connector actions are audited with target host and request id.

## Notes / constraints

- Reduces ToS and exfiltration risks.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
