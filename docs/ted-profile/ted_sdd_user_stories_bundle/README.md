# Ted/OpenClaw — User Stories (SDD-ready)

Created: 2026-02-19

## How to use

1. Start with `INDEX.md` to browse the backlog.
2. Ingest `user_stories/*.md` into your SDD framework.
3. Use `epics/*.md` for higher-level framing and scope boundaries.

## Conventions used

- **IDs**: `TED-US-###`
- **Priority**: `P0` (must), `P1` (should), `P2` (later)
- **Release target**:
  - `Day-1`: required for initial usable launch
  - `Phase-1`: needed for the first operational expansion
  - `Phase-2`: longer-term optimization
- **Job family** is aligned to the job-family model:
  - `GOV`, `ING`, `LED`, `OUT`, `MNT`

## Global hard boundaries (apply unless explicitly re-scoped)

- Draft-only communications (no autonomous send).
- Single-operator default posture.
- Secrets handled via keychain/vault references.
- Full auditability with redaction before persistence.
- No trading execution.
