---
id: TED-US-010
title: Auto-start on boot (LaunchAgent) and survive restarts
epic: EPIC-02
job_family: MNT
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **have Ted start automatically on Mac boot and keep running after restarts** so that **it behaves like an assistant, not a fragile script I have to restart.**

## Acceptance criteria

- [ ] Provide LaunchAgent configuration and instructions to enable/disable it.
- [ ] After reboot, the local UI/control plane is reachable and health checks pass.
- [ ] If startup fails, Doctor reports a clear blocker and fix path.

## Notes / constraints

- Client explicitly: 'So it survives Mac restarts (unlike current setup)'.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
