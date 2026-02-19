---
id: TED-US-013
title: Architecture overview + log locations + troubleshooting notes
epic: EPIC-02
job_family: MNT
priority: P1
release_target: Day-1
persona: "IT Admin / Support Engineer"
status: Proposed
created: 2026-02-19
---

## User story

As **IT Admin / Support Engineer**, I want to **understand how the system is structured, what runs where, and where logs/artifacts live** so that **I can support installs, diagnose failures, and apply safe fixes.**

## Acceptance criteria

- [ ] Provide a concise architecture doc (components, trust boundaries, data flows).
- [ ] Document log locations (audit, observations) and artifact paths (daily reports, ledgers).
- [ ] Document common issues and fix steps (Graph consent, token cache, connector smoke failures).

## Notes / constraints

- Client requested architecture overview and troubleshooting docs.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
