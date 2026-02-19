---
id: EPIC-02
title: Installation, Operations, and Documentation
default_job_family: MNT
created: 2026-02-19
status: Proposed
---

## Intent

Make the system installable, survivable across restarts, and supportable via docs + health checks.

## Scope (plain English)

Describe user-visible outcomes; avoid prescribing a specific API shape.

## Hard constraints (apply to all stories unless explicitly re-scoped)

- Draft-only for outbound communication and calendar invites.
- Single-operator posture by default; no team-wide access.
- Secrets never stored in plaintext files; use keychain/vault references.
- Full auditability with redaction before persistence.
