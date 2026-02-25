---
id: TED-US-047
title: Retention and purge controls with auditable lifecycle
epic: EPIC-01
job_family: LED
priority: P1
release_target: Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want **retention windows and purge actions to be explicit, configurable, and auditable** so that **the system preserves governance evidence without keeping sensitive artifacts forever.**

## Acceptance criteria

- [ ] Retention defaults are defined for audit records, transient artifacts/media, and SDD snapshots.
- [ ] Purge operations remove only items outside retention windows and never delete protected/legal-hold records.
- [ ] Every purge action writes an auditable record with scope, counts, and timestamp.
- [ ] Doctor/status surfaces show retention policy state and last purge result.

## Notes / constraints

- Retention policy should follow least-data-retention and fail-closed behavior when policy cannot be loaded.
- Manual override actions require explicit operator approval.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
