# Security & Governance Spec (Ted Profile)

**Generated:** 2026-02-17

---

## Non‑Negotiables

1. **No secrets in files**
   - No raw API keys, passwords, refresh tokens, or OAuth caches in plaintext on disk.

2. **Keychain-first**
   - macOS Keychain is the canonical secret store.
   - If dynamic credentials must be written, encrypt at rest using a Keychain key.

3. **Draft-only**
   - No API path exists that sends email or sends calendar invites without explicit human action.

4. **Single-operator**
   - The system only responds to allowlisted operator identities/handles.
   - Pairing/allowlist required for inbound channels.

5. **Fail-closed**
   - If auth/audit/policy/secret resolution is unhealthy: block execution.

---

## Threat Model (Pragmatic)

### Threats we assume are realistic

- infostealer harvesting local files
- token leakage leading to Graph data extraction
- accidental scope creep (permissions expand silently)
- exfiltration via normal HTTPS/chat traffic
- supply chain compromise via dependencies/plugins

### Threats we deprioritize day‑1

- targeted nation-state compromise
- physical theft with full disk decryption (still mitigated by Keychain, but not fully solvable)

---

## Controls (What must be implemented)

### A) Identity and Channel Controls

- DM policy: pairing-only or strict allowlist.
- Refuse unknown senders.
- Channel “send” only replies within the active session, not arbitrary outbound.

### B) Tool & Endpoint Blast Radius

- Deny-by-default tool posture.
- Endpoint allowlists (OpenClaw tool wrappers and Ted Engine control plane).
- Break-glass flags require explicit audit record.

### C) Graph Least Privilege

- Delegated device-code by default.
- Scopes limited to read + draft-only.
- Separate “read” operations from “write” operations for clearer gates.

### D) Approvals

- Risky writes require approval records.
- Approvals are one-time-use and optionally plan-scoped.

### E) Audit + Redaction

- Every tool call → policy decision → result/error is logged.
- Redact secrets and sensitive token patterns before persistence.
- Include `request_id` on all records for traceability.

### F) Data Minimization + Retention

- Do not persist full email bodies by default.
- Keep only what is needed for drafts and traceability.
- Define retention policy for audit/artifacts.

---

## Governance Surfaces (Operator-Facing)

- Setup Wizard: shows missing prerequisites and links to fix pages.
- Doctor: prioritizes blockers and next actions.
- Approvals console: issue approvals for gated actions.
- Audit viewer: shows redacted audit stream.

---

## Acceptance Criteria (Security)

- A “deep security audit” gate is GREEN before shipping installers.
- No secret-looking values are present in config/state directories.
- Sidecar is unreachable from non-loopback clients.
- Unknown inbound channel senders are rejected.
- Any operation categorized “risky write” fails without an approval record.
