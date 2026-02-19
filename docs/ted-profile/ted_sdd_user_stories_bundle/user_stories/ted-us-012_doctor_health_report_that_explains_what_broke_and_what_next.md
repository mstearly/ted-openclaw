---
id: TED-US-012
title: Doctor health report that explains 'what broke' and 'what next'
epic: EPIC-02
job_family: MNT
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **run a Doctor report that identifies blockers and points me to exact fixes** so that **I can troubleshoot without digging through logs.**

## Acceptance criteria

- [ ] Doctor summarizes: Graph auth/consent issues, connector readiness, approvals configuration, policy/role-pack status, and recent failures.
- [ ] Doctor includes recommended next actions with links to relevant pages.
- [ ] Doctor is safe/redacted and local-only.

## Notes / constraints

- Operator guide emphasizes Doctor as the operating console.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
