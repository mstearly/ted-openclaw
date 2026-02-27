# SDD 163 - DFA-OS Operator Quickstart (Zero-Search)

Date: 2026-02-27
Status: Wave D1 delivered (operator-runbook)
Parents: SDD 160, SDD 162

## 1. Purpose

Run DFA-OS daily/weekly/monthly without searching code.

This quickstart gives:

1. Local command cookbook.
2. Sidecar API route cookbook.
3. Expected output keys and pass/fail interpretation.
4. Stop/go decision table.

## 2. Prerequisites

1. Repo root: `ted-openclaw`
2. Sidecar running on `http://127.0.0.1:48080` for API mode.
3. `jq` installed for readable output.

## 3. Artifact map (where outputs land)

1. Health ledger: `sidecars/ted-engine/artifacts/governance/feature_health.jsonl`
2. Opportunities ledger: `sidecars/ted-engine/artifacts/governance/feature_opportunities.jsonl`
3. Research triggers: `sidecars/ted-engine/artifacts/governance/research_triggers.jsonl`
4. Priority queue JSON: `sidecars/ted-engine/artifacts/governance/feature_priority_queue.json`
5. Priority queue brief: `docs/ted-profile/sdd-pack/FEATURE_PRIORITY_QUEUE.md`
6. Opportunity brief: `docs/ted-profile/sdd-pack/LOW_USAGE_FEATURE_OPPORTUNITY_BRIEF.md`
7. Board summary: `docs/ted-profile/sdd-pack/153_COUNCIL_DFA_OS_BOARD_SUMMARY.md`
8. Release gate summary: `artifacts/replay/feature-release-gate-summary.json`

## 4. Local command cookbook

## 4.1 Validate governance policy contracts

```bash
node scripts/ted-profile/validate-feature-governance-policies.mjs
```

Expected:

1. Pass lines: `[OK] ... valid`
2. No `[FAIL]` lines.

Fail means:

1. Stop and fix invalid policy JSON or threshold shape before running cadence.

## 4.2 Refresh governance ledgers (offline/local mode)

```bash
node scripts/ted-profile/refresh-feature-governance-ledgers.mjs
```

Expected JSON keys:

1. `ok: true`
2. `totals.features`
3. `feature_health_out`
4. `opportunities_out`
5. `research_triggers_out`

Fail means:

1. Stop and inspect missing or malformed inputs in policy/config/ledger files.

## 4.3 Build priority queue artifacts

```bash
node scripts/ted-profile/generate-feature-priority-queue.mjs \
  --output-markdown docs/ted-profile/sdd-pack/FEATURE_PRIORITY_QUEUE.md \
  --output-json sidecars/ted-engine/artifacts/governance/feature_priority_queue.json
```

Expected JSON keys:

1. `ok: true`
2. `totals.risk_now|value_now|research_before_build|backlog_monitor`

## 4.4 Evaluate release gate (pre-merge)

```bash
node scripts/ted-profile/evaluate-feature-release-gate.mjs \
  --base-ref origin/main \
  --head-ref HEAD \
  --output artifacts/replay/feature-release-gate-summary.json
```

Expected keys:

1. `mode` (`advisory` or `hard`)
2. `pass` (boolean)
3. `would_block` (boolean)
4. `violations` (array)
5. `warnings` (array)

Interpretation:

1. `mode=hard` and `pass=false` is a merge stop.
2. `would_block=true` means hard mode would fail even if currently advisory.

## 4.5 Generate operator-facing briefs

```bash
node scripts/ted-profile/generate-low-usage-opportunity-brief.mjs
node scripts/ted-profile/generate-feature-governance-board-summary.mjs
```

## 5. Sidecar API cookbook

Base URL:

1. `http://127.0.0.1:48080`

## 5.1 Check cadence status

```bash
curl -s http://127.0.0.1:48080/ops/feature-operating/status | jq
```

Expected keys:

1. `stale_count`
2. `stale`
3. `jobs.daily|weekly|monthly`
4. `jobs.<cadence>.last_run_at|last_status|stale`

Green:

1. `stale=false`
2. All enabled jobs have recent `last_run_at` within policy windows.

## 5.2 Run cadence jobs

Daily:

```bash
curl -s -X POST http://127.0.0.1:48080/ops/feature-operating/run \
  -H 'content-type: application/json' \
  -d '{"cadence":"daily","force":true}' | jq
```

Weekly:

```bash
curl -s -X POST http://127.0.0.1:48080/ops/feature-operating/run \
  -H 'content-type: application/json' \
  -d '{"cadence":"weekly","force":true}' | jq
```

Monthly:

```bash
curl -s -X POST http://127.0.0.1:48080/ops/feature-operating/run \
  -H 'content-type: application/json' \
  -d '{"cadence":"monthly","force":true}' | jq
```

Expected keys:

1. `ok: true`
2. `cadence`
3. `run_at`
4. `summary`
5. `status`

Common fail:

```json
{ "error": "invalid_cadence", "expected": ["daily", "weekly", "monthly"] }
```

## 5.3 Get health snapshot

```bash
curl -s "http://127.0.0.1:48080/ops/feature-health?force=1" | jq
```

Expected keys:

1. `totals.features|frozen|escalated|research_required|low_usage`
2. `features[]`
3. `policy.fragility|usage|research`

## 5.4 Get low-usage opportunities

```bash
curl -s "http://127.0.0.1:48080/ops/feature-opportunities?force=1&top_n=10" | jq
```

Expected keys:

1. `total_candidates`
2. `opportunities[]`

## 5.5 Evaluate feature release gate via API

```bash
curl -s -X POST http://127.0.0.1:48080/ops/feature-release-gate/evaluate \
  -H 'content-type: application/json' \
  -d '{"changed_feature_ids":["builder_lane"],"force_refresh":true}' | jq
```

Expected keys:

1. `policy_mode`
2. `pass`
3. `would_block`
4. `violations[]`
5. `warnings[]`

## 5.6 Pull current priority queue

```bash
curl -s "http://127.0.0.1:48080/ops/feature-priority-queue?force=1" | jq
```

Expected keys:

1. `totals.risk_now|value_now|research_before_build|backlog_monitor`
2. `queue.risk|value|research|backlog`

## 6. Stop/go decision table

| Signal                                                  | Meaning                                     | Operator action                                                    |
| ------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| `validate-feature-governance-policies` has any `[FAIL]` | Governance contract invalid                 | **STOP**. Fix policy schema/content first.                         |
| `/ops/feature-operating/status.stale=true`              | Cadence drifted                             | **STOP-TO-RECOVER**. Run missing cadence jobs and re-check status. |
| Release gate `mode=hard` and `pass=false`               | Merge should fail                           | **STOP**. Resolve violations or apply approved override path.      |
| Release gate `would_block=true` in advisory mode        | Risk likely to fail in hard mode            | **CAUTION**. Treat as pre-fail and remediate before merge.         |
| Health totals `frozen > 0`                              | One or more features above freeze threshold | **LIMIT CHANGES** to remediation/fix-only scope.                   |
| Queue `risk_now > 0`                                    | Immediate stabilization workload exists     | **PRIORITIZE RISK WAVE** before value activation work.             |
| Queue `research_before_build > 0`                       | Build work lacks required external delta    | **RUN RESEARCH LOOP** then update roadmap/tasks.                   |
| Queue `value_now > 0` with low risk                     | Underused but governed features available   | **RUN ACTIVATION EXPERIMENTS** and track deltas.                   |

## 7. Recommended operating rhythm

1. Daily:
   - Validate policies.
   - Run daily cadence.
   - Check `stale_count`, `frozen`, `research_required`.
2. Weekly:
   - Run weekly cadence.
   - Regenerate queue and opportunity brief.
   - Execute top value/risk actions.
3. Monthly:
   - Run monthly cadence.
   - Regenerate board summary.
   - Review threshold/policy tuning with council.

## 8. Escalation triggers

Escalate to council/operator-primary if any occur:

1. Two consecutive failed cadence runs for same cadence.
2. Any `frozen` feature changed without explicit remediation intent.
3. Repeated release-gate block on same feature for two or more PRs.
4. `research_before_build` backlog grows cycle-over-cycle.
5. Documentation drift (runbook and live route behavior diverge).
