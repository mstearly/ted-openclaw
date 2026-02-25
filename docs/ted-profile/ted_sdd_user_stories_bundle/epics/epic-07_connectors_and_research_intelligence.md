---
id: EPIC-07
title: Connectors and Research Intelligence
default_job_family: ING
created: 2026-02-19
status: Proposed
---

## Intent

Safely pull licensed/approved external data and produce cited outputs under source-tier rules.

## Scope (plain English)

Describe user-visible outcomes; avoid prescribing a specific API shape.

## Hard constraints (apply to all stories unless explicitly re-scoped)

- Draft-only for outbound communication and calendar invites.
- Single-operator posture by default; no team-wide access.
- Secrets never stored in plaintext files; use keychain/vault references.
- Full auditability with redaction before persistence.
