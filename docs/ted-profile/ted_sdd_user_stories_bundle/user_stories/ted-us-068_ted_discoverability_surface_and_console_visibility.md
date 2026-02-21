---
id: TED-US-068
title: Ted discoverability surface and console visibility
epic: EPIC-08
job_family: OUT
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-20
---

## User story

As **Operator (Clint)**, I want **a clear Ted capability catalog visible from the runtime command surface** so that **I can verify what is available without guessing whether Ted loaded correctly**.

## Acceptance criteria

- [ ] Sidecar health payload includes additive catalog metadata (commands, route families, governance guards).
- [ ] `/ted catalog` renders the discoverability payload without introducing new non-health sidecar routes.
- [ ] Documentation states that Control UI requires gateway token configuration in settings to show live runtime surfaces.

## Notes / constraints

- Must preserve JC-013 auth hardening: non-health routes remain auth-gated.
- Catalog is informational and cannot override policy boundaries.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
