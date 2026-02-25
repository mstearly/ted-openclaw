---
id: TED-US-038
title: Phone-like chat interface (web/Telegram/iMessage)
epic: EPIC-08
job_family: OUT
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **interact with Ted in a text-message style thread from my phone** so that **I can use Ted the same way I use iMessage/WhatsApp/ChatGPT while traveling.**

## Acceptance criteria

- [ ] Day-1 includes at least one reliable mobile surface (web thread and/or Telegram).
- [ ] If iMessage is enabled, it requires allowlisted handles and optional pairing.
- [ ] Chat can request briefs, drafts, and show pending approvals.

## Notes / constraints

- Client explicitly requested phone conversation style.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
