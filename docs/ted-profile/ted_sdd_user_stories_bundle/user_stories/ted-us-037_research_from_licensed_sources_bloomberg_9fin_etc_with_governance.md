---
id: TED-US-037
title: Research from licensed sources (Bloomberg, 9fin, etc.) with governance
epic: EPIC-07
job_family: ING
priority: P2
release_target: Phase-2
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **pull research from licensed vendor sources I already pay for, under explicit governance rules** so that **Ted’s outputs reflect premium data while respecting licensing and access constraints.**

## Acceptance criteria

- [ ] Each vendor source is only enabled after license approval metadata is captured.
- [ ] Access is via vendor-supported API/export methods when possible; no brute-force login automation.
- [ ] Outputs include citations/links back to the vendor source where permitted.

## Notes / constraints

- Client listed Bloomberg and '9 Fin' as desired sources.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
