---
id: TED-US-030
title: Template library management for legal documents
epic: EPIC-06
job_family: OUT
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **register and manage my legal templates (LOI, NDA, OTA, PSA, Operating Agreement, JV Agreement)** so that **Ted can draft repeatable documents from my preferred starting points.**

## Acceptance criteria

- [ ] I can register templates and specify required variables/fields.
- [ ] Ted can list templates and prompt for missing inputs.
- [ ] Template changes are audited and stored in an allowlisted location.

## Notes / constraints

- Client: templates are the big one for production.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
