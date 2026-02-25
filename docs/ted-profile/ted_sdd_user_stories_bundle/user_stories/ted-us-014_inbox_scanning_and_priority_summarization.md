---
id: TED-US-014
title: Inbox scanning and priority summarization
epic: EPIC-03
job_family: ING
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **have Ted scan my inbox and summarize what matters (by deal/context and urgency)** so that **I can check email less often and still stay on top of critical items.**

## Acceptance criteria

- [ ] System can list inbox messages by filters (unread, sender, date range) and build a digest.
- [ ] Digest groups items by deal where possible and flags unlinked items for triage.
- [ ] Digest does not move or modify email unless I approve a filing action.

## Notes / constraints

- Client success metric: see drafts waiting in Drafts folder when checking email every few hours.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
