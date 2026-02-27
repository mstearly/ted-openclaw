# SDD 162 - Council DFA-OS Documentation Closure and Zero-Search Map

Date: 2026-02-27
Status: Documentation closure plan (operator-ready)
Parents: SDD 151, SDD 160, SDD 161

## 1. Council objective

Create a zero-search documentation system so operators and contributors can execute DFA-OS without hunting through code or scattered SDD logs.

## 2. What is already documented (core DFA-OS set)

These artifacts already exist and should be treated as the current baseline:

1. Strategy and model:
   - `151_COUNCIL_AGENTIC_DOCUMENTATION_AND_FEATURE_AWARENESS_OPERATING_MODEL.md`
2. Execution logs:
   - `152_COUNCIL_WAVE_A_EXECUTION_LOG_DFA_OS.md`
   - `155_COUNCIL_WAVES_B_TO_E_EXECUTION_LOG_DFA_OS.md`
   - `159_COUNCIL_DFA_OS_DELTA_EXECUTION_LOG.md`
   - `161_COUNCIL_TOP5_EXECUTION_DISPOSITION_AND_NEXT_WAVES.md`
3. Operating and coaching:
   - `153_COUNCIL_DFA_OS_BOARD_SUMMARY.md`
   - `154_COUNCIL_DFA_OS_RESEARCH_RUNBOOK.md`
   - `160_COUNCIL_OPERATOR_COACHING_PASS_TOP5.md`
4. Decision outputs:
   - `FEATURE_PRIORITY_QUEUE.md`
   - `LOW_USAGE_FEATURE_OPPORTUNITY_BRIEF.md`

## 3. Documentation gaps still open (what else must be documented)

To remove search friction, the council recommends adding the following missing docs in priority order:

1. **Single-source operator quickstart (missing)**
   - One page: daily/weekly/monthly commands, expected outputs, stop/go decisions.
2. **DFA-OS API contract reference (missing)**
   - `/ops/feature-health`, `/ops/feature-opportunities`, `/ops/feature-operating/status`, `/ops/feature-operating/run`, `/ops/feature-release-gate/evaluate`, `/ops/feature-priority-queue`.
3. **Ledger schema and interpretation guide (missing)**
   - Field dictionary for `feature_health.jsonl`, `feature_opportunities.jsonl`, `research_triggers.jsonl`, `feature_priority_queue.json`.
4. **Policy-to-behavior explainer (missing)**
   - Exact mapping from each policy file and threshold to runtime behavior and gate outcomes.
5. **Feature change playbook (missing)**
   - “If you change a feature, update these exact fields/tests/policies/events.”
6. **Research trigger closure playbook (missing)**
   - Required evidence to close `research_required` and move back to normal flow.
7. **Ownership and escalation matrix (missing)**
   - Per-plane and per-feature owner/backup plus response SLA.
8. **Troubleshooting and failure modes (missing)**
   - Common failure signatures and deterministic fixes.
9. **Documentation freshness policy (missing)**
   - What auto-updates, what manual updates are mandatory, and review cadence.
10. **Index hygiene and navigation debt (open)**

- `00_README.md` and `spec_index.json` are not up to date with the full current SDD set.

## 4. Wave plan to close documentation debt

## Wave D0 - Zero-search entrypoint

Tasks:

1. Publish this map and link it from `00_README.md`.
2. Add a “DFA-OS quick navigation” block with canonical doc order.
3. Record known stale index debt in the pack.

Acceptance:

1. Operator can find DFA-OS strategy, runbook, queue, and status docs within one click path.

## Wave D1 - Operator operations layer

Tasks:

1. Create `163_COUNCIL_DFA_OS_OPERATOR_QUICKSTART.md`.
2. Include command cookbook and route cookbook with pass/fail examples.
3. Include “what to do next” decision table.

Acceptance:

1. New operator can run daily cadence and interpret outcomes without code lookup.

## Wave D2 - Technical reference layer

Tasks:

1. Create `164_COUNCIL_DFA_OS_API_AND_LEDGER_REFERENCE.md`.
2. Document endpoint request/response contracts and ledger schemas.
3. Add glossary for lifecycle, maturity, fragility, research_required, low_usage.

Acceptance:

1. Engineers and reviewers can validate behavior from docs alone.

## Wave D3 - Governance closure layer

Tasks:

1. Create `165_COUNCIL_DFA_OS_CHANGE_PLAYBOOK_AND_RACI.md`.
2. Add feature-change checklist and owner escalation matrix.
3. Add research trigger closure evidence checklist.

Acceptance:

1. Every feature change path has documented required updates and owner sign-off path.

## Wave D4 - Housekeeping and anti-drift

Tasks:

1. Update `spec_index.json` generation date and include DFA-OS era docs.
2. Reconcile stale references (for example, `.jsonl` vs `.json` queue artifacts where applicable).
3. Add monthly doc drift review task to operating cadence.

Acceptance:

1. No stale canonical references in DFA-OS operator docs.

## 5. Immediate next 5 documentation tasks (execute now)

1. Publish `163_COUNCIL_DFA_OS_OPERATOR_QUICKSTART.md`.
2. Publish `164_COUNCIL_DFA_OS_API_AND_LEDGER_REFERENCE.md`.
3. Publish `165_COUNCIL_DFA_OS_CHANGE_PLAYBOOK_AND_RACI.md`.
4. Update `spec_index.json` to include DFA-OS docs through this cycle.
5. Run one documentation drift pass on `151`, `158`, `159`, `160`, `161` for stale path/status statements.

## 6. Council recommendation

Proceed with Waves D0-D4. The system is technically strong, but documentation discoverability is the remaining bottleneck. Closing these docs turns DFA-OS from “implemented” into “operationally self-serve.”
