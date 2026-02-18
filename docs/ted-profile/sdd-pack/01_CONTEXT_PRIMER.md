# Context Primer (Read First)

**Generated:** 2026-02-17

This is the _stable_ interpretation of the request, stripped of accidental implementation details.

---

## Job To Be Done (JTBD)

On a Mac, provide a secure “executive assistant” experience with a chat-first UI that can:

1. **Read Outlook context** (email + calendar + tasks) to reduce copy/paste.
2. **Create drafts** (email drafts, tentative calendar holds) for the operator to review.
3. **Organize deal work** (filing suggestions, deadlines extraction, task capture) with strong governance.

---

## Day‑1 Definition of Done

**Day‑1 is done when:**

- A Mac installer exists (arm64 + intel) that:
  - installs the OpenClaw fork (Ted Profile) and the Ted Engine sidecar,
  - starts reliably on reboot (auto-start),
  - exposes a chat surface (OpenClaw UI + at least one mobile-like channel).

- From OpenClaw chat, the operator can run the _core_ Draft-Only loop end‑to‑end:
  1. scan inbox (read only)
  2. produce 1–N email drafts (write drafts only; no send)
  3. produce proposed calendar holds (draft/tentative only; no invite send)
  4. log all operations with a request_id and redaction

- Security posture is enforced:
  - secrets live in macOS Keychain (or equivalent secure store),
  - loopback-only sidecar calls,
  - deny-by-default tools and endpoint allowlists,
  - approval gates for risky writes.

---

## Baseline Decision

**OpenClaw is the platform baseline** (UI + gateway + channels).  
**Ted Engine is a localhost sidecar** (M365 draft-only workflows, filing, deadlines, ledgers, templates).

Rationale: reaching OpenClaw parity by extending a non-OpenClaw gateway is slower and riskier than adopting OpenClaw and integrating the existing Ted Engine as an add-on.

---

## Non‑Negotiables (Safety & Governance)

1. **Draft-only** for outbound email/calendar (no send/invite).
2. **Single-operator** (no team multi-user support).
3. **Least privilege** Graph scopes; add only when a workflow needs them.
4. **No secrets in files** (including MSAL token caches).
5. **Auditable actions**: what was touched/created/moved is logged.
6. **Fail-closed** on missing approvals/policy/audit/secret resolution.

---

## What We Intentionally Treat as “User Narrative” (Not Requirements)

The following may be valid later, but are _not_ binding requirements for the Mac/OpenClaw revamp:

- “36 bots” / Domain Manager decomposition
- specific endpoint names/paths (they are implementation suggestions)
- specific vendors/connectors and automation expectations (especially scrapers)
- “overnight runs” or “works while I sleep” claims
- “auto-send in Phase 3” (conflicts with draft-only day‑1 posture)

---

## Primary Acceptance Metric (30 days)

> The operator checks Outlook a few times per day and finds multiple high‑quality drafts ready in `/Drafts/` for review and send.

(And **the system never sends autonomously**.)
