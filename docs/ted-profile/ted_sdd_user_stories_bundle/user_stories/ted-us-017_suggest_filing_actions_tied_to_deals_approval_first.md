---
id: TED-US-017
title: Suggest filing actions tied to deals (approval-first)
epic: EPIC-03
job_family: LED
priority: P0
release_target: Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **receive filing suggestions (folders/labels/categories) for deal-related email** so that **my inbox stays clean and deal evidence stays organized with minimal manual work.**

## Acceptance criteria

- [ ] System proposes filing suggestions with a rationale and predicted deal linkage.
- [ ] Suggestions are queued for approval (no auto-apply by default).
- [ ] Suggestions appear in daily digest and can be batch-reviewed.

## Notes / constraints

- Client wants deal-specific tagging and moving; launch mode should be approval queue.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
