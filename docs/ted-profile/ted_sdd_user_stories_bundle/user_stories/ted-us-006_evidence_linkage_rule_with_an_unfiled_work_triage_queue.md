---
id: TED-US-006
title: Evidence linkage rule with an Unfiled Work triage queue
epic: EPIC-01
job_family: GOV
priority: P0
release_target: Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **ensure every draft/task/filing/deadline artifact is linked to a deal_id or task_id (or goes to triage)** so that **nothing important gets produced without context and I can cleanly reconcile my workflow.**

## Acceptance criteria

- [ ] When an action would write an artifact without linkage, the system writes it to an Unfiled Work (triage) queue instead.
- [ ] Triage UI/API allows me to link an item to an existing deal/task with a quick selection.
- [ ] Daily digest includes triage counts and the top triage items.
- [ ] Linkage coverage and triage volume are measurable and visible in a scorecard.

## Notes / constraints

- This is a governance rule that prevents silent drift and missed deadlines.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
