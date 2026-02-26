# SDD 95: Council Wave D Execution Log — Replay and Adversarial Harness

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent:** SDD 91 (Wave D)

---

## 1. Scope Executed

Wave D (D2) completed for deterministic replay and adversarial safety gating:

1. Golden task corpus introduced as a versioned config artifact.
2. Deterministic replay runner implemented with output and trajectory graders.
3. Adversarial scenarios (prompt injection, tool contamination, timeout cascade) enforced via release-gate thresholds.
4. Extension + Ted UI wave surface wired for no-curl operation.

---

## 2. Delivered

1. New versioned corpus config:
   - `sidecars/ted-engine/config/replay_corpus.json`
2. New replay ledger:
   - `sidecars/ted-engine/artifacts/replay/replay_runs.jsonl`
3. New sidecar routes:
   - `GET /ops/replay/corpus`
   - `POST /ops/replay/run`
   - `GET /ops/replay/runs`
4. Replay runner behavior:
   - deterministic scenario execution from corpus fixtures
   - output checks (required/forbidden phrase failures)
   - trajectory checks (missing/disallowed step, duration bound failures)
   - safety assertion checks for adversarial scenarios
   - release gate summary with blockers (`min_pass_rate`, safety/adversarial failure caps)
5. Governance updates:
   - execution-boundary policy and route normalization entries for replay routes
   - route contracts updated for replay routes
   - event taxonomy extended with replay/adversarial events
6. Extension gateway methods:
   - `ted.ops.replay.corpus`
   - `ted.ops.replay.run`
   - `ted.ops.replay.runs`
7. Ted UI Execution Waves controls:
   - replay corpus load
   - replay run trigger (all/golden/adversarial + scenario-id subset)
   - replay run history load
   - release-gate pass/fail + blockers visibility

---

## 3. Acceptance Mapping

1. **D-001:** Golden corpus is executable and versioned (`replay_corpus.json`).
2. **D-002:** Replay runner returns per-scenario output and trajectory pass/fail with explicit failure reasons.
3. **D-003:** Adversarial failures are surfaced and included in release gate blocking logic.

---

## 4. Validation

1. `node --check sidecars/ted-engine/server.mjs` passes.
2. JSON parse checks pass for:
   - `route_contracts.json`
   - `event_schema.json`
   - `replay_corpus.json`
3. `pnpm check` passes.
4. `pnpm build` passes.

---

## 5. Residual Follow-Up

1. Bind replay scenarios to live workflow snapshots for richer trajectory evidence beyond deterministic fixture simulation.
2. Add CI release gate job to fail PR merges automatically when replay gate fails.
3. Expand adversarial corpus with MCP-specific exfiltration and multi-step recovery scenarios as connector usage grows.
