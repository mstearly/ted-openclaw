# Architecture — OpenClaw Baseline + Ted Engine Sidecar

**Generated:** 2026-02-17

---

## Summary

Use **OpenClaw** for:

- chat UX (Control UI/WebChat)
- channels (Telegram, iMessage/BlueBubbles as enabled)
- sessions + routing + tool invocation surface

Use **Ted Engine** (Python sidecar) for:

- Microsoft Graph (draft-only) workflows
- filing/deadlines/task ledgers + daily digests
- governance primitives (approvals, audit, redaction)
- connector catalog and smoke checks
- operator control-plane pages (setup wizard, doctor, etc.)

---

## High-Level Diagram

```mermaid
flowchart LR
  U[Operator] --> OC[OpenClaw Gateway + UI]
  OC -->|tool call| TS[ted-sidecar tool
(allowlisted endpoints)]
  TS -->|loopback http| TE[Ted Engine Sidecar
127.0.0.1]
  TE --> G[Microsoft Graph]
  TE --> A[(Artifacts / Ledgers)]
  TE --> K[(Keychain Secrets)]
  TE --> AU[(Audit + Observations)]
  TE --> D[Doctor / Setup Wizard]
  OC --> CH[Channels
Telegram / iMessage / WebChat]
```

---

## Contracts Between OpenClaw and Ted Engine

### Transport

- **Loopback-only HTTP**: `http://127.0.0.1:<ted_port>`
- `ted-sidecar` refuses any non-loopback base URL.
- Ted Engine rejects token minting unless request originates from loopback.

### AuthN/AuthZ

- Ted Engine exposes `POST /auth/mint` (loopback-only) returning a short-lived token.
- OpenClaw stores **no Ted secrets**; it requests tokens on-demand over loopback.
- Every sidecar call includes:
  - `Authorization: Bearer <token>`
  - `X-Request-Id: <uuid>`
  - `X-Profile-Id: <profile_id>`

### Endpoint Allowlist

OpenClaw tool wrapper only calls a small allowlist, e.g.:

- `GET /status`
- `GET /doctor`
- `POST /dealops/daily/generate`
- `POST /drafts/email`
- `GET /drafts/queue`
- `POST /filing/suggest`
- `POST /deadlines/extract`

(Exact set defined in `08_OPENCLAW_SIDECAR_TOOLING_SPEC.md`.)

---

## Data and Artifacts

Ted Engine writes durable state to an artifacts directory (local-only), e.g.:

- draft queue ledger
- deal ledger
- triage/unfiled queue
- deadlines proposals
- daily brief outputs
- audit and observation logs (redacted)

OpenClaw should treat these as opaque artifacts and only render them when requested.

---

## Failure Modes (Design For)

- **Sidecar not running** → OpenClaw tool returns actionable instructions (start, doctor link).
- **Graph consent blocked** → system explains “IT admin must approve”; no workaround.
- **Secret missing** → fail-closed; doctor shows which secret reference is missing.
- **Approval missing** → return “needs approval” with a safe next-step link.
