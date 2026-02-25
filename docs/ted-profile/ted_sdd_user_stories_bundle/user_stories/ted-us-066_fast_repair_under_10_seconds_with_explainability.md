---
id: TED-US-066
title: Fast repair under 10 seconds with explainability
epic: EPIC-08
job_family: OUT
priority: P1
release_target: Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-20
---

## User story

As **Operator (Clint)**, I want **to correct wrong proposals quickly and always see what/why/next-step on blocked actions** so that **I can stay in control without workflow drag.**

## Acceptance criteria

- [ ] Fast-repair proof run demonstrates correction latency <= 10 seconds median.
- [ ] Deny-path responses always include `blocked_action`, `reason_code`, and `next_safe_step`.
- [ ] No autonomous side effects occur during correction actions.

## Notes / constraints

- This is a release-blocking UX/governance gate once enabled.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
