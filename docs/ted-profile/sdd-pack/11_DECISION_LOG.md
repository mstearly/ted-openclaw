# Decision Log

**Generated:** 2026-02-17

Record key decisions so the project stays aligned.

| Date       | Decision                                                                    | Status   | Rationale                                                                          |
| ---------- | --------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| 2026-02-17 | Use OpenClaw as baseline platform; integrate Ted Engine as loopback sidecar | Accepted | Fastest parity + preserves existing Ted workflows; avoids re-implementing OpenClaw |
| 2026-02-17 | Draft-only for email/calendar in Phase 1                                    | Accepted | Required safety boundary; aligns with “drafts ready for review” success metric     |
| 2026-02-17 | Keychain-first secrets; no secrets/token caches in plaintext files          | Accepted | Reduces infostealer blast radius; aligns with Ted Profile security plan            |
| 2026-02-17 | Fail-closed on policy/audit/auth/secret failures                            | Accepted | Prevents silent unsafe degradation                                                 |

---

## ADR-0003 — Microsoft Graph Auth Model + Scopes (JC-003)

**Status:** ACCEPTED  
**Date:** 2026-02-18  
**Scope:** Ted Engine Graph integration (two profiles) + draft-only workflows

### Decision

1. **Auth model:** Delegated auth via **device-code** per profile (`profile_id`, `tenant_id`, `client_id`).
2. **Profiles:** Two explicit profiles are always supported; selection is **explicit per operation** (no hidden context switching).
3. **Token storage:** **No plaintext tokens** on disk. Token/refresh material must be stored via the approved secrets store (OS keychain-backed).
4. **Least-privilege scopes:** Start with only what is required for Day-1 draft workflows, and add scopes only when a concrete workflow demands it.
5. **Draft-only boundary:** Graph writes are restricted to **draft creation** (email drafts; optional tentative calendar item only when enabled). No send.
6. **Revoke behavior:** “Revoke” must:
   - delete local cached auth material for the selected profile (keychain-backed cache),
   - mark profile state as disconnected in status/doctor,
   - require re-auth (device-code) on next use.  
     Tenant-wide consent removal and grant revocation remain an admin action (documented as operator guidance).

### Minimum Scopes (Day-1)

- `User.Read`
- `Mail.Read` (optional; keep if draft creation uses read context)
- `Mail.ReadWrite` (required for draft creation)
- `Calendars.Read` (read-only brief/conflict detection)

**Optional (only when explicitly enabled by workflow):**

- `Calendars.ReadWrite` (tentative holds / calendar item creation)
- Task scopes (To Do / Planner) — only when task sync is enabled

### Rationale

- Delegated device-code avoids client secrets and supports fast setup for a single operator.
- Keychain-backed token caching prevents “credentials in files” risks.
- Least-privilege + “add only when needed” prevents scope creep and keeps the system governable.
- Explicit multi-profile routing avoids implicit context bleed across identities.

### Consequences

- Some tenants may block user consent → admin approval required (non-engineering blocker).
- Token expiry or policy changes require device-code re-auth.
- Calendar write features remain off until scopes + policy + gates are explicitly enabled and proven.

### Acceptance Criteria (SDD Gate)

- Two profiles configured and independently healthy
- Draft created in Outlook Drafts (never sent)
- No plaintext token/refresh-token artifacts
- Revoke clears local auth material and forces re-auth on next use
- Doctor reports Graph connectivity per profile (healthy/degraded) with clear fix steps
