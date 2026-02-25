---
id: TED-US-004
title: Secrets handled via keychain/vault references only
epic: EPIC-01
job_family: GOV
priority: P0
release_target: Day-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **store credentials in OS keychain or 1Password (references only), never in plaintext files or chats** so that **I reduce the risk of credential leakage while still enabling integrations.**

## Acceptance criteria

- [ ] All integrations accept secret references (e.g., keychain/1Password URI) rather than raw secrets.
- [ ] After entry, the UI never re-displays secret values; only references are shown.
- [ ] Configuration validation rejects plaintext secrets (and provides a fix path: store in keychain, paste reference).

## Notes / constraints

- Client uses 1Password and wants no secrets pasted into chats or embedded in code.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
