# OpenClaw ↔ Ted Engine Sidecar Tooling Spec

**Generated:** 2026-02-17

---

## Purpose

Define how OpenClaw calls the Ted Engine sidecar safely.

---

## Hard Requirements

1. **Loopback only**
   - OpenClaw tool refuses non-loopback base URLs.
   - Ted Engine refuses token minting from non-loopback.

2. **Endpoint allowlist**
   - OpenClaw tool only calls explicitly allowlisted Ted endpoints.

3. **Short-lived tokens**
   - OpenClaw mints a token via `POST /auth/mint` as needed.
   - Tokens are short TTL and scoped to the operator/profile.

4. **Per-call profile selection**
   - Every call includes `X-Profile-Id`.

5. **Auditable**
   - Every tool call is logged by Ted Engine with request_id.

---

## Recommended Allowlisted Endpoints (Day‑1)

### Health / setup

- `GET /status`
- `GET /doctor`
- `GET /setup-wizard` (or a lightweight status endpoint for setup wizard summary)

### Draft-only workflows

- `POST /drafts/email`
- `GET /drafts/queue`

### Daily surface

- `POST /dealops/daily/generate`
- `GET /dealops/daily/latest` (or similar)

### (Optional) Filing / deadlines

- `POST /filing/suggest`
- `POST /deadlines/extract`
- `POST /deadlines/proposals/tentative`

---

## Tool UX Guidance

- In OpenClaw chat:
  - tools should return short summaries + links to local pages for full details
  - if approval required, return “needs approval” with next step

- Prefer streaming responses for long operations (optional phase 2).

---

## Error Contracts (Stable)

Every tool response should include:

- `ok` (bool)
- `request_id` (string)
- `kind` (enum: `SUCCESS` | `NEEDS_APPROVAL` | `BLOCKED` | `ERROR`)
- `message` (string)
- `next_steps` (list of strings/links)
