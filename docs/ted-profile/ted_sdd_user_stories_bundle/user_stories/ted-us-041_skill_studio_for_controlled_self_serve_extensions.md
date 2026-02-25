---
id: TED-US-041
title: Skill Studio for controlled self-serve extensions
epic: EPIC-09
job_family: GOV
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **add/enable/disable skills and report outputs safely without engineering help** so that **I can keep building and iterating on Ted over time.**

## Acceptance criteria

- [ ] I can add or toggle skills via a UI surface; skills call approved workflows only.
- [ ] Policy gating continues to apply (risky operations require approval).
- [ ] Skills changes are audited and reversible.

## Notes / constraints

- Client asked for a mechanism to continue building, even if he prototypes in ChatGPT then brings it over.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
