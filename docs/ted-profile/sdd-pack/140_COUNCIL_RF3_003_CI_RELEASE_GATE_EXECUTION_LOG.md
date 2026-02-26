# SDD 140: RF3-003 Release Gate Wiring in CI Execution Log

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Task:** SDD 129 `RF3-003`

---

## 1. Scope

Execute RF3-003 requirements:

1. Add CI lane that fails closed on replay gate failure.
2. Publish replay and rollout evidence artifacts from CI.
3. Provide operator-readable pass/fail summary for release gate runs.

---

## 2. Implemented Changes

1. Added CI release-gate runner script:
   - `scripts/ted-profile/ci-replay-rollout-gate.mjs`
   - behavior:
     - provisions isolated sidecar runtime in temp directory
     - runs `POST /ops/replay/run`
     - runs `GET /ops/rollout-policy` with replay-derived reason codes
     - writes gate summary JSON and replay evidence artifact
     - appends Markdown summary to `GITHUB_STEP_SUMMARY`
     - exits non-zero when replay release gate fails
2. Added CI job in primary workflow:
   - `.github/workflows/ci.yml` job `replay-release-gate`
   - runs the new script
   - uploads artifact bundle from `$RUNNER_TEMP/replay-release-gate/`
   - retains artifacts for 14 days
3. Corrected replay corpus fixture outputs to satisfy replay gate baseline thresholds:
   - `sidecars/ted-engine/config/replay_corpus.json`
   - fixes:
     - `golden_meeting_prep` output now includes required phrase `Open questions`
     - `workflow_run_snapshot_pinning` output now includes required phrase `workflow_version`

---

## 3. Evidence Surfaces

1. CI workflow lane:
   - `.github/workflows/ci.yml`
2. Gate runner tooling:
   - `scripts/ted-profile/ci-replay-rollout-gate.mjs`
3. Replay baseline fixture:
   - `sidecars/ted-engine/config/replay_corpus.json`
4. Inventory/handoff:
   - `docs/ted-profile/sdd-pack/114_COUNCIL_R0_001_ACTIVE_PLAN_WAVE_INVENTORY.md`

---

## 4. Validation

Executed:

```bash
node scripts/ted-profile/ci-replay-rollout-gate.mjs --output /tmp/replay-release-gate-summary.json
pnpm vitest run --config vitest.sidecar.config.ts sidecars/ted-engine/tests/contracts.test.mjs sidecars/ted-engine/tests/config-schemas.test.mjs sidecars/ted-engine/tests/roadmap-governance.test.mjs
pnpm check
pnpm build
```

Result:

1. CI gate runner completed with pass status:
   - replay pass rate `1.0`
   - release gate passed `true`
   - replay and rollout summary artifacts written
2. Sidecar governance/contract tests passed (1277/1277).
3. `pnpm check` passed.
4. `pnpm build` passed.

---

## 5. Exit Decision

RF3-003 is complete.

Next task:

1. Start RF4-001 connector reliability policy schema hardening.
