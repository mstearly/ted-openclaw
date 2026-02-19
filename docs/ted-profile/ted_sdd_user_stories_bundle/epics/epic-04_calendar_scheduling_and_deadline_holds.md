---
id: EPIC-04
title: Calendar, Scheduling, and Deadline Holds
default_job_family: LED
created: 2026-02-19
status: Proposed
---

## Intent

Convert commitments into proposals and tentative holds, with approval before any external writes.

## Scope (plain English)

Describe user-visible outcomes; avoid prescribing a specific API shape.

## Hard constraints (apply to all stories unless explicitly re-scoped)

- Draft-only for outbound communication and calendar invites.
- Single-operator posture by default; no team-wide access.
- Secrets never stored in plaintext files; use keychain/vault references.
- Full auditability with redaction before persistence.
