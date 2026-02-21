---
id: TED-US-064
title: Idempotent retryable and resume-safe orchestration
epic: EPIC-02
job_family: MNT
priority: P1
release_target: Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-20
---

## User story

As **Operator (Clint)**, I want **write-like operations to be idempotent with bounded retry/backoff and consistent resume behavior** so that **retries and restarts do not duplicate work or lose intent.**

## Acceptance criteria

- [ ] Requests with the same idempotency key return deduplicated responses without duplicate side effects.
- [ ] Retry policy outputs deterministic `RETRY`/`STOP` decisions with bounded backoff.
- [ ] Resume summary remains queryable after recovery and is auditable.

## Notes / constraints

- Idempotency behavior must preserve existing governance checks.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
