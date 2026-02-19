---
id: EPIC-10
title: Holdings Digest and Finance Research (No Execution)
default_job_family: OUT
created: 2026-02-19
status: Proposed
---

## Intent

Provide analysis outputs (digest, research) with explicit prohibition on trading execution.

## Scope (plain English)

Describe user-visible outcomes; avoid prescribing a specific API shape.

## Hard constraints (apply to all stories unless explicitly re-scoped)

- Draft-only for outbound communication and calendar invites.
- Single-operator posture by default; no team-wide access.
- Secrets never stored in plaintext files; use keychain/vault references.
- Full auditability with redaction before persistence.
