---
id: TED-US-008
title: Source-tiered claims and citations for research outputs
epic: EPIC-01
job_family: GOV
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **enforce a rule that factual/research outputs cite approved sources and do not rely on unverified sources for conclusions** so that **I can trust outputs and avoid propagating bad info into legal/deal decisions.**

## Acceptance criteria

- [ ] Each research artifact labels sources by tier (approved/licensed vs unverified).
- [ ] Conclusions are only derived from approved/licensed sources; unverified sources are flagged as 'needs verification'.
- [ ] Artifacts include citations/links for any factual claims.

## Notes / constraints

- Client described tiering (0–4) and wants unverified sources excluded from conclusions.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
