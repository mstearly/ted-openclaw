---
id: TED-US-016
title: Draft queue that mirrors what is ready for review
epic: EPIC-03
job_family: LED
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **view a single draft queue of all generated drafts with context and status** so that **I can review/ship drafts quickly without hunting in Outlook.**

## Acceptance criteria

- [ ] Draft queue lists drafts with: subject, created time, profile, related deal/task, and status.
- [ ] Queue supports filters: by deal, by profile, by age, by 'needs review'.
- [ ] Each queue item links to the underlying Outlook draft identifier (if available).

## Notes / constraints

- Central to day-1 success metric.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
