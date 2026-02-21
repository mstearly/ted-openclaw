---
id: TED-US-069
title: Ted workbench dashboard for operator friction reduction
epic: EPIC-08
job_family: OUT
priority: P1
release_target: Day-1 to Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-20
---

## User story

As **Operator (Clint)**, I want **a dedicated Ted workbench dashboard in Control UI** so that **I can monitor sidecar health, job-card progression, and KPI gates without bouncing between command flows**.

## Acceptance criteria

- [ ] Control UI includes a `Ted` tab in navigation and route mapping.
- [ ] Ted tab renders snapshot fields from `ted.workbench` (`sidecar`, `job_cards`, `friction_kpis`, `recommendations`, `references`).
- [ ] Refresh action re-queries `ted.workbench` and updates view state without page reload.
- [ ] No dashboard action introduces unsafe writes or bypasses governance gates.

## Notes / constraints

- Dashboard is read-only for Day-1.
- Discoverability and auth boundaries from TED-US-068 remain in force.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
