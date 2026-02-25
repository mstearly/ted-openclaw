# SDD 79: Council Wave A Execution Log

**Status:** Active
**Version:** v1
**Date:** 2026-02-25
**Source Plan:** SDD 78 Wave A
**Scope:** Execute all unblocked council tasks (NEW-1, P1-1 kickoff, P1-3 closeout posture)

---

## 1. Wave A Outcome

Wave A executed successfully for all items that do not require operator Azure credentials.

1. NEW-1 secret-management guardrails were implemented.
2. P1-1 decomposition completed first SharePoint extraction seam.
3. P1-3 vulnerability posture was reduced to residual items with explicit disposition.

---

## 2. Executed Changes

### 2.1 NEW-1: Secret management controls

**Implemented**

1. Added pre-commit guardrail to block staging `sidecars/ted-engine/config/graph.profiles.json`.
2. Added explicit error message instructing template use (`graph.profiles.example.json`).
3. Added integration test coverage for this guardrail.

**Files**

1. `git-hooks/pre-commit`
2. `test/git-hooks-pre-commit.e2e.test.ts`

**Result**

Operator-specific Graph profile IDs can no longer be accidentally committed through normal git commit flow.

### 2.2 P1-1: Decomposition kickoff

**Implemented**

1. Extracted SharePoint route dispatch logic into a dedicated module seam.
2. Moved SharePoint handler implementations out of `server.mjs` into `modules/sharepoint.mjs`.
3. Replaced inline route matching and handler calls in `server.mjs` with module delegation.

**Files**

1. `sidecars/ted-engine/modules/sharepoint.mjs`
2. `sidecars/ted-engine/server.mjs`

**Result**

The first Tier-1 extraction is complete for the SharePoint slice with behavior preserved and tests passing.

### 2.3 P1-3: Residual dependency vulnerability disposition

**Current audit summary**

1. `critical: 0`
2. `high: 0`
3. `moderate: 2`
4. `low: 1`

**Residual advisories**

| Package              | Severity | Source path                                                                         | Fix posture                                                                                  |
| -------------------- | -------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `request`            | Moderate | `extensions/matrix -> @vector-im/matrix-bot-sdk -> request`                         | No upstream patch exists; track as accepted transitive risk until upstream removes `request` |
| `ajv` (v6.12.6 path) | Moderate | `extensions/matrix -> @vector-im/matrix-bot-sdk -> request -> har-validator -> ajv` | Upgradable to `>=6.14.0`, but requires dependency override/approval decision                 |
| `hono`               | Low      | `@buape/carbon` transitive                                                          | Carbon dependency is policy-frozen; track as low residual risk                               |

Decision package created:

1. `docs/ted-profile/sdd-pack/80_P1_3_RESIDUAL_VULNERABILITY_DECISION_PACKAGE.md`

### 2.4 P0-2: Azure runbook execution started

**Implemented**

1. Added runbook bootstrap utility:
   - `scripts/ted-profile/p0-2-azure-bootstrap.mjs`
2. Added runbook execution log:
   - `docs/ted-profile/sdd-pack/81_P0_2_AZURE_RUNBOOK_EXECUTION_LOG.md`
3. Executed check-only run to confirm blocker state and required env contract.
4. Updated install-time setup flow to runtime credential model:
   - `scripts/ted-setup.sh` now stores GUIDs in local runtime env (`~/.openclaw/ted/graph-runtime.env`) with `600` permissions.
   - Sidecar startup in setup flow now offers restart to apply runtime GUIDs without writing `graph.profiles.json`.

---

## 3. Decisions and Constraints

1. Do not introduce client-secret flow changes; current auth invariant remains device-code public client.
2. Do not modify Carbon dependency without explicit operator instruction.
3. Do not apply new dependency override/patch strategy without explicit approval.

---

## 4. Ready Next Steps (Post Wave A)

1. Continue P1-1 with next Tier-1 extraction target (scheduler or self-healing).
2. Decide P1-3 `ajv` remediation path:
   - approved and applied on 2026-02-25 (`ajv@6 -> 6.14.0`).
3. Wait for operator inputs from SDD 78 Section 4 to execute P0-2 and P0-4.
