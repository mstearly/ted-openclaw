---
id: EPIC-05
title: DealOps Ledger, Dataroom Ingest, and Daily Reporting
default_job_family: LED
created: 2026-02-19
status: Proposed
---

## Intent

Keep deal work tied to deal context; ingest datarooms, track phases, and generate daily/operator reports.

## Scope (plain English)

Describe user-visible outcomes; avoid prescribing a specific API shape.

## Hard constraints (apply to all stories unless explicitly re-scoped)

- Draft-only for outbound communication and calendar invites.
- Single-operator posture by default; no team-wide access.
- Secrets never stored in plaintext files; use keychain/vault references.
- Full auditability with redaction before persistence.
