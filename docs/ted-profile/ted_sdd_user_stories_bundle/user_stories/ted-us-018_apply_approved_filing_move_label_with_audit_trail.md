---
id: TED-US-018
title: Apply approved filing (move/label) with audit trail
epic: EPIC-03
job_family: LED
priority: P0
release_target: Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **apply filing suggestions after I approve them** so that **the system does the repetitive filing work without unsafe automation.**

## Acceptance criteria

- [ ] Apply requires explicit approval and is logged with the suggestion id and linkage metadata.
- [ ] System can move a message/thread into a deal folder and/or set categories.
- [ ] Failures are surfaced clearly; suggestions remain pending if not applied.

## Notes / constraints

- Supports Option A (approval queue) with future upgrade to optional auto-file after baseline.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
