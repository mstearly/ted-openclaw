---
id: TED-US-044
title: Daily holdings digest with explicit no-trading execution
epic: EPIC-10
job_family: OUT
priority: P1
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **receive a daily holdings update (changes, news, analysis) while preventing any trading execution** so that **I get decision support without creating an unsafe trading automation lane.**

## Acceptance criteria

- [ ] Holdings digest summarizes portfolio changes and relevant news/research sources with citations where applicable.
- [ ] System refuses any request to place trades or connect to brokerage execution.
- [ ] All holdings outputs are internal artifacts and do not send messages externally.

## Notes / constraints

- Client wants holdings updates + suggestions; governance requires no trading execution.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
