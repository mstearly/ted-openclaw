---
id: TED-US-046
title: Loopback sidecar contract with authenticated non-health routes
epic: EPIC-01
job_family: GOV
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want **OpenClaw and Ted sidecar to enforce a strict loopback-only contract where non-health routes require authenticated access** so that **governed workflows remain secure and fail closed.**

## Acceptance criteria

- [ ] Sidecar health routes are reachable for diagnostics (`/status`, `/doctor`) using loopback-only access rules.
- [ ] Non-health sidecar routes require authenticated calls and reject missing/invalid auth tokens.
- [ ] OpenClaw sidecar bridge enforces endpoint allowlist and refuses non-loopback base URLs.
- [ ] Contract mismatch conditions are surfaced by Doctor and logged as auditable boundary errors.

## Notes / constraints

- Align with current ADR tracking for sidecar auth contract reconciliation.
- This story defines enforceable boundary behavior, not broad permission expansion.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
