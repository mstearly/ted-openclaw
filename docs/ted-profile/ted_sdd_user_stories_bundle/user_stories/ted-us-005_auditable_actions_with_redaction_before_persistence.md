---
id: TED-US-005
title: Auditable actions with redaction before persistence
epic: EPIC-01
job_family: GOV
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **review an audit trail of what Ted touched/created while ensuring sensitive content is redacted** so that **I can trust the system and diagnose issues without creating new security risk.**

## Acceptance criteria

- [ ] Every material action writes an audit record including timestamp, operation id, actor/profile, and redacted metadata.
- [ ] No audit record stores raw secrets/access tokens; redaction occurs before writing to disk.
- [ ] Audit viewer exists in the local control plane and can filter by date, deal_id/task_id, and operation.

## Notes / constraints

- Auditability was explicitly requested (full auditability).

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
