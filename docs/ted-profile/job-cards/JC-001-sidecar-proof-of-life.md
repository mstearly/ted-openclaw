# JC-001 — Sidecar Proof of Life (OpenClaw → Ted Engine)

## Outcome
From OpenClaw chat, operator runs a Ted command that returns sidecar /doctor output.

## Why this is first
Proves the platform/sidecar boundary before we build any features (Graph, ledgers, filing, deadlines).

## Constraints
- Loopback only (127.0.0.1)
- Endpoint allowlist: /status and /doctor only (for this job)
- Fail closed on any violation
- No secrets in logs

## Proof
1) Start sidecar locally (loopback-only).
2) From OpenClaw chat run: /ted doctor
3) Response shows:
   - sidecar version
   - uptime
   - profiles_count
4) Attempting non-allowlisted call is blocked.
