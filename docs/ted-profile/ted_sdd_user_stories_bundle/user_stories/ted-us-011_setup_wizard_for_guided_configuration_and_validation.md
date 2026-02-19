---
id: TED-US-011
title: Setup wizard for guided configuration and validation
epic: EPIC-02
job_family: MNT
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **use a guided setup wizard to configure Graph profiles, secrets, approvals, connectors, and channels** so that **I can self-serve setup and confirm readiness quickly.**

## Acceptance criteria

- [ ] Wizard checks and reports status for: auth, Graph profiles, secrets backend, approvals key, connector readiness, mobile channels.
- [ ] Wizard provides direct links to each setup surface and highlights what is missing.
- [ ] No secret values are displayed.

## Notes / constraints

- Matches the shipped operator flow with /setup-wizard and /doctor surfaces.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
