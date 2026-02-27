# SDD 160 - Council Operator Coaching Pass: How To Use DFA-OS Tools + Top 5 Actions

Date: 2026-02-27
Status: Operator-ready (superseded by SDD 161 for latest queue and executed disposition)
Parents: SDD 158, SDD 159

## 1. Council review of today's build

Council confirms the DFA-OS delta implementation is now live in four executable surfaces:

1. Policy validation surface
   - `scripts/ted-profile/validate-feature-governance-policies.mjs`
2. Feature-aware release gate surface
   - `scripts/ted-profile/evaluate-feature-release-gate.mjs`
   - `POST /ops/feature-release-gate/evaluate`
3. Priority queue generation surface
   - `scripts/ted-profile/generate-feature-priority-queue.mjs`
   - `GET /ops/feature-priority-queue`
4. Operating cadence surface
   - `GET /ops/feature-operating/status`
   - `POST /ops/feature-operating/run`

## 2. How to use the new tools

## A) Pre-merge governance check (local)

1. Validate governance policies:

```bash
node scripts/ted-profile/validate-feature-governance-policies.mjs
```

2. Evaluate release gate for changed features or files:

```bash
node scripts/ted-profile/evaluate-feature-release-gate.mjs \
  --base-ref origin/main \
  --head-ref HEAD \
  --output artifacts/replay/feature-release-gate-summary.json
```

3. Generate priority queue from current governance ledgers:

```bash
node scripts/ted-profile/generate-feature-priority-queue.mjs \
  --output-markdown docs/ted-profile/sdd-pack/FEATURE_PRIORITY_QUEUE.md \
  --output-json sidecars/ted-engine/artifacts/governance/feature_priority_queue.json
```

## B) Runtime operations (sidecar running)

Assume sidecar base URL: `http://127.0.0.1:48080`

1. Check cadence health:

```bash
curl -s http://127.0.0.1:48080/ops/feature-operating/status | jq
```

2. Run cadence loops:

```bash
curl -s -X POST http://127.0.0.1:48080/ops/feature-operating/run \
  -H 'content-type: application/json' \
  -d '{"cadence":"daily","force":true}' | jq
```

```bash
curl -s -X POST http://127.0.0.1:48080/ops/feature-operating/run \
  -H 'content-type: application/json' \
  -d '{"cadence":"weekly","force":true}' | jq
```

```bash
curl -s -X POST http://127.0.0.1:48080/ops/feature-operating/run \
  -H 'content-type: application/json' \
  -d '{"cadence":"monthly","force":true}' | jq
```

3. Evaluate release gate via API:

```bash
curl -s -X POST http://127.0.0.1:48080/ops/feature-release-gate/evaluate \
  -H 'content-type: application/json' \
  -d '{"changed_feature_ids":["builder_lane"]}' | jq
```

4. Read queue via API:

```bash
curl -s "http://127.0.0.1:48080/ops/feature-priority-queue?force=1" | jq
```

## 3. Operator coaching pass (from current ledgers)

Data source used:

1. `sidecars/ted-engine/artifacts/governance/feature_priority_queue.json`
2. `sidecars/ted-engine/config/feature_registry.json`

Prioritized Top 5 actions:

1. `multi_user` (score `92.35`, fragility `83`, maturity `0`)
   - Action: keep frozen for now and explicitly route as deferred unless near-term multi-operator requirement exists.
   - Why now: highest risk score with not-present maturity.
2. `knowledge_retrieval` (score `86.9`, fragility `82`, maturity `1`)
   - Action: define minimal retrieval baseline (index + query + security boundary) before any feature expansion.
   - Why now: core state-plane gap with high fragility.
3. `non_destructive_evolution` (score `86.9`, fragility `82`, maturity `1`)
   - Action: complete schema-versioning and migration controls before broadening roadmap scope.
   - Why now: contract-plane stability risk can cascade to multiple features.
4. `config_migration` (score `81.5`, fragility `70`, maturity `1`)
   - Action: implement and test migration runner path with rollback-safe checkpoints.
   - Why now: direct dependency of non-destructive evolution controls.
5. `content_isolation` (score `81.5`, fragility `70`, maturity `1`)
   - Action: implement isolation policy controls and replay tests for injection/contamination scenarios.
   - Why now: control-plane safety baseline for agentic workflows.

## 4. Council note on data quality

Current queue is valid but mostly baseline-driven because only `feature_priority_queue.json` is currently present under governance artifacts. After running daily/weekly cadence against live events, reprioritize with runtime evidence.
