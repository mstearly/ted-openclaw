---
id: TED-US-065
title: Offline eval gold sets and regression gate
epic: EPIC-09
job_family: QA
priority: P1
release_target: Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-20
---

## User story

As **Operator (Clint)**, I want **a reusable offline eval corpus and regression gate** so that **quality regressions in drafting, extraction, and contradiction routing are blocked before promotion.**

## Acceptance criteria

- [ ] Gold eval fixtures exist for drafting, extraction confidence, and contradiction routing.
- [ ] Eval runner produces deterministic score output and threshold decision.
- [ ] Promotion fails when eval score drops below configured threshold.

## Notes / constraints

- Eval gate complements, not replaces, runtime proof scripts.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
