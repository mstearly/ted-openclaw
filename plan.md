# Plan — OpenClaw Ted Profile (Mac) + Ted Engine Sidecar

Canonical planning docs live in:
- Roadmap/job board: docs/ted-profile/sdd-pack/10_ROADMAP_JOB_BOARD.md
- Mac installer spec: docs/ted-profile/sdd-pack/06_MAC_INSTALLER_SPEC.md
- M365 Graph spec: docs/ted-profile/sdd-pack/07_M365_GRAPH_SPEC.md
- Sidecar tooling spec: docs/ted-profile/sdd-pack/08_OPENCLAW_SIDECAR_TOOLING_SPEC.md

## Current execution focus (Phase 1)
1) Prove architecture seam (JC-001)
2) Lock Mac runtime (LaunchAgents + reboot survivability)
3) Enable Draft-only Graph (2 profiles) after seam is proven
4) Add ledgers (deal/triage/drafts/deadlines) behind governance

All phases must pass gates defined in:
- docs/ted-profile/sdd-pack/09_TEST_AND_RELEASE_GATES.md
