# Spec — OpenClaw Ted Profile (Mac) + Ted Engine Sidecar

This repo uses Spec Kit SDD. The canonical spec set lives in:

- docs/ted-profile/sdd-pack/

## Canonical spec docs

- Product brief: docs/ted-profile/sdd-pack/02_PRODUCT_BRIEF.md
- Scope & boundaries: docs/ted-profile/sdd-pack/03_SCOPE_BOUNDARIES.md
- Architecture: docs/ted-profile/sdd-pack/04_ARCHITECTURE.md
- Security & governance: docs/ted-profile/sdd-pack/05_SECURITY_GOVERNANCE.md

## Non-negotiables (summary)

- OpenClaw = platform baseline (channels/UX/tool surface)
- Ted Engine = localhost sidecar (workflow + governance)
- Draft-only posture (no send/booking without explicit change)
- Loopback-only sidecar calls + endpoint allowlist + fail-closed
- Keychain-first secrets + auditable actions

## “What we are building first”

JC-001: Sidecar proof-of-life (OpenClaw → ted-sidecar → Ted Engine /doctor → response in chat)

See tasks.md for the execution path.
