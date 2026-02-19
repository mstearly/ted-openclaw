---
id: TED-US-002
title: Draft-only boundary for all outbound actions
epic: EPIC-01
job_family: GOV
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **ensure Ted can only draft/propose (never send email, never send invites, never outreach third parties)** so that **I get the speed of automation without the risk of uncontrolled outbound actions.**

## Acceptance criteria

- [ ] Email workflow saves drafts only; there is no capability to send mail autonomously.
- [ ] Calendar workflow proposes time slots/holds; any calendar write is draft/tentative and requires explicit approval; no invites are sent.
- [ ] Any attempted outbound send/invite operation is blocked (fail-closed) and logged with a policy decision.

## Notes / constraints

- Non-negotiable safety guardrail.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
