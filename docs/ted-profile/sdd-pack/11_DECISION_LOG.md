# Decision Log

**Generated:** 2026-02-17

Record key decisions so the project stays aligned.

| Date | Decision | Status | Rationale |
| --- | --- | --- | --- |
| 2026-02-17 | Use OpenClaw as baseline platform; integrate Ted Engine as loopback sidecar | Accepted | Fastest parity + preserves existing Ted workflows; avoids re-implementing OpenClaw |
| 2026-02-17 | Draft-only for email/calendar in Phase 1 | Accepted | Required safety boundary; aligns with “drafts ready for review” success metric |
| 2026-02-17 | Keychain-first secrets; no secrets/token caches in plaintext files | Accepted | Reduces infostealer blast radius; aligns with Ted Profile security plan |
| 2026-02-17 | Fail-closed on policy/audit/auth/secret failures | Accepted | Prevents silent unsafe degradation |

