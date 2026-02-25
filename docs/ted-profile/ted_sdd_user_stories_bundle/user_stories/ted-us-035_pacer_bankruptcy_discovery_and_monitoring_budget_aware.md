---
id: TED-US-035
title: PACER bankruptcy discovery and monitoring (budget-aware)
epic: EPIC-07
job_family: ING
priority: P1
release_target: Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **search PACER and monitor watchlists for relevant bankruptcy filings with cost controls** so that **I can discover distressed opportunities without surprise PACER fees.**

## Acceptance criteria

- [ ] Ted can run case searches by entity name and store results as cited artifacts.
- [ ] Ted tracks estimated query cost and enforces a configurable monthly budget cap.
- [ ] Monitoring produces batched digests rather than constant alerts.

## Notes / constraints

- Client wants bankruptcy filings across the country; PACER fees must be managed.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
