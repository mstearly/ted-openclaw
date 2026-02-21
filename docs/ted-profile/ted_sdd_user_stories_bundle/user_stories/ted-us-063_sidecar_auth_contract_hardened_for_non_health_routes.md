---
id: TED-US-063
title: Sidecar auth contract hardened for non-health routes
epic: EPIC-01
job_family: GOV
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-20
---

## User story

As **Operator (Clint)**, I want **all non-health sidecar routes to require authenticated access** so that **the local sidecar boundary remains secure and fail closed.**

## Acceptance criteria

- [ ] `/status` and `/doctor` remain unauthenticated loopback health endpoints.
- [ ] Missing or invalid auth on non-health routes returns `401` with explainability fields.
- [ ] Valid auth allows route handlers to execute normal governance logic.

## Notes / constraints

- Auth failures must be auditable and redacted.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
