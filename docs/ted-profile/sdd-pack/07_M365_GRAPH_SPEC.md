# Microsoft Graph Spec — Draft-Only, Two Profiles

**Generated:** 2026-02-17

---

## Goals

- Support **two Microsoft identity profiles** simultaneously (e.g., two tenants).
- Enable **read** operations needed to generate drafts and insights.
- Enable **draft-only write** operations:
  - create email drafts (no send)
  - create tentative calendar items (no invite send)

---

## Non‑Negotiables

- No Graph permission or endpoint that enables autonomous sending.
- Token caches and refresh tokens must not be stored in plaintext files.
- All Graph access flows through the Ted Engine governance layer (never direct from OpenClaw).

---

## Identity Model

### Profiles
A profile is a named tenant/app pair:
- `profile_id` (stable string, e.g., `olumie`, `everest`)
- `tenant_id` (GUID)
- `client_id` (GUID)
- delegated scopes list (string list)

### Always-active
The sidecar may maintain token caches for multiple profiles concurrently.  
Each request chooses the profile explicitly (`X-Profile-Id`).

---

## Minimal Scope Guidance (Start Small)

Day‑1 recommended delegated scopes (exact names depend on tenant policy):
- `User.Read` (identity)
- `Mail.Read` (to scan inbox)
- `Mail.ReadWrite` (required to create drafts in many setups)
- `Calendars.Read` (read-only)
- `Calendars.ReadWrite` (only if tentative holds are implemented day‑1)
- (Optional) `Tasks.Read`, `Tasks.ReadWrite` if To Do sync is in scope

**Rule:** add scopes only when a workflow needs them.

---

## Operations

### Read operations (low risk)
- list mail (metadata only; body by exception)
- fetch specific message (body only when needed)
- list events (minimal fields)
- list tasks (minimal fields)

### Draft-only write operations (risk-gated)
- create email draft
- create tentative calendar item (no invite send)

### Filing actions (optional, risk-gated)
- apply categories
- move message to folder

---

## Governance Requirements

- Each operation maps to a named policy operation id.
- Risky operations require approval records.
- Each operation emits audit records with:
  - request_id
  - profile_id
  - operation_id
  - redacted args
  - linkage metadata (deal_id/task_id if available)

---

## Failure Handling

- Consent blocked → clear message: “IT admin must approve delegated permission.”
- Token expired → device-code reauth flow; do not degrade into insecure caching.
- Scope missing → return “missing scope” with suggested scope to add.

