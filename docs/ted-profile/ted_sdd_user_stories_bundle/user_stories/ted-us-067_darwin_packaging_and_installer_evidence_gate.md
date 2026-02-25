---
id: TED-US-067
title: Darwin packaging and installer evidence gate
epic: EPIC-02
job_family: MNT
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-20
---

## User story

As **Operator (Clint)**, I want **final packaging to pass on a macOS Darwin runner with evidence artifacts** so that **the installable app can be distributed with confidence.**

## Acceptance criteria

- [ ] macOS preflight check passes on Darwin with Swift/Xcode toolchain present.
- [ ] Packaging command succeeds and emits expected installer artifacts.
- [ ] Operator validation checklist evidence is attached before promotion.

## Notes / constraints

- Linux environments may prepare but cannot close this gate.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
