---
id: TED-US-003
title: Least-privilege Graph permissions with quick revocation
epic: EPIC-01
job_family: GOV
priority: P0
release_target: Day-1
persona: "IT Admin / Security Admin"
status: Proposed
created: 2026-02-19
---

## User story

As **IT Admin / Security Admin**, I want to **grant only the minimum Microsoft Graph permissions required for draft-first workflows and be able to revoke access immediately** so that **the integration is defensible and the blast radius stays small if something goes wrong.**

## Acceptance criteria

- [ ] Document a permission matrix mapping features → required Graph scopes per tenant/profile.
- [ ] Default scopes are minimal and do not include send/invite abilities beyond what is required to create drafts/holds.
- [ ] Provide a step-by-step revocation checklist (disable app registration / revoke consent) and verify Ted fails closed when access is revoked.
- [ ] Audit logs indicate Graph permission failures clearly (without exposing secrets).

## Notes / constraints

- Client requested least privilege and immediate revocation.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
