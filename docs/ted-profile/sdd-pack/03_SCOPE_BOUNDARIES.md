# Scope & Boundaries

**Generated:** 2026-02-17

---

## In Scope (Phase 1 / Day‑1)

### Platform
- Fork OpenClaw as the baseline UI/gateway/channels on macOS.
- Integrate Ted Engine as a localhost sidecar service.

### Draft-only M365 workflows
- Read email/calendar/task context sufficient to generate drafts.
- Create email drafts in Outlook Drafts.
- Create tentative calendar holds (draft-only / no invite send).
- Optional: read To Do / Planner for task reconciliation (read-only day‑1 unless explicitly gated).

### Governance
- Audit logs (redacted).
- Approval gating for risky operations (writes that affect external systems).
- Evidence linkage (deal_id/task_id when available; else triage).

### Mac Install
- Packaging (arm64 + intel), install guide, auto-start, upgrade/rollback.

---

## Out of Scope (Day‑1)

- Multi-user support (assistants, team).
- Autonomous sending of email or invites.
- Broad web-scraping connectors that might violate vendor terms.
- Automated trading, brokerage integrations, or execution of financial transactions.
- Rebuilding OpenClaw UI inside Ted Engine (or vice versa).
- Full “36-bot fleet” decomposition as separate processes (treated as future organization, not day‑1 requirement).

---

## Assumptions (Explicit)

- Operator will manually send drafts from Outlook (or manually accept invites) — always.
- Microsoft tenants may require admin consent for delegated permissions.
- The OpenClaw fork can ship unsigned/notarization-later for initial internal deployment.
- The Mac is a single-user machine under the operator’s control.

---

## “Narrowly Focused” Requirements (What must not change)

- Draft-only + approvals model.
- Keychain-first secrets.
- Loopback-only sidecar communication.
- Single-operator restrictions.
- Auditable execution with redaction.

