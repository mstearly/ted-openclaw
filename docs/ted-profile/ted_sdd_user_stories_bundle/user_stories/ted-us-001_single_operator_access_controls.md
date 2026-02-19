---
id: TED-US-001
title: Single-operator access controls
epic: EPIC-01
job_family: GOV
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **restrict all control surfaces to only my approved identities/handles** so that **I can operate Ted privately and reduce the risk of unauthorized control or accidental exposure.**

## Acceptance criteria

- [ ] Only authenticated operator identities can issue commands in any enabled channel (web, Telegram, iMessage).
- [ ] Unknown senders are rejected/ignored and a redacted audit event is recorded.
- [ ] Control plane shows an allowlist of approved identities/handles and the channel(s) they apply to.
- [ ] Default configuration enables single-operator posture; multi-user support is disabled unless explicitly re-scoped.

## Notes / constraints

- Client stated the system should never go beyond them and they prefer others not know it exists.
- This works in tandem with channel pairing/allowlists.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
