---
id: TED-US-025
title: Dataroom ingest and auto-filing into a predetermined structure
epic: EPIC-05
job_family: MNT
priority: P0
release_target: Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **drop a dataroom into Ted and have it organized into a known deal folder structure** so that **I avoid manual filing and can generate reports from a clean structure.**

## Acceptance criteria

- [ ] System proposes an organization plan first (preview), including where each file will go.
- [ ] After approval, the system applies the plan and records an undoable transaction log.
- [ ] Unmatched/ambiguous files are placed into a review queue and surfaced in daily digest.

## Notes / constraints

- Client described this as an existing core use case.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
