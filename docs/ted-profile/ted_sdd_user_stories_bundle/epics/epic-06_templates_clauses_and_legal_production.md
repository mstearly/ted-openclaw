---
id: EPIC-06
title: Templates, Clauses, and Legal Production
default_job_family: OUT
created: 2026-02-19
status: Proposed
---

## Intent

Render template-based legal drafts and build reusable clause libraries from executed documents.

## Scope (plain English)

Describe user-visible outcomes; avoid prescribing a specific API shape.

## Hard constraints (apply to all stories unless explicitly re-scoped)

- Draft-only for outbound communication and calendar invites.
- Single-operator posture by default; no team-wide access.
- Secrets never stored in plaintext files; use keychain/vault references.
- Full auditability with redaction before persistence.
