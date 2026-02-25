# SDD 82: Matrix Dependency Deep Strategy

**Status:** Active
**Version:** v1
**Date:** 2026-02-25
**Source Plan:** SDD 78 Wave D, P1-3 follow-through
**Scope:** Deep strategy for Matrix dependency risk reduction after P1-3 `ajv` override execution

---

## 1. Council Verdict

Proceed with staged execution:

1. Execute containment and adapter seam now (MDO-1 + MDO-2).
2. Defer fork versus migration (MDO-3/MDO-4) until adapter milestone is complete.
3. Keep `request` as explicit accepted transitive risk until a controlled replacement path is approved.

This keeps current Matrix feature behavior stable while reducing future migration risk.

---

## 2. Analyzer Run and Evidence

Executed:

```bash
node scripts/ted-profile/matrix-dependency-strategy.mjs
node scripts/ted-profile/matrix-dependency-strategy.mjs --format json --out /tmp/matrix-strategy.json
```

Observed:

1. Matrix SDK in use: `@vector-im/matrix-bot-sdk@0.8.0-element.3`.
2. Latest `matrix-js-sdk`: `41.0.0`.
3. Files importing Matrix SDK directly: `34`.
4. Highest import concentration by area:
   - `monitor`: 11
   - `client-core`: 6
   - `actions`: 5
   - `send`: 4
   - `tests`: 4
5. Vulnerability chain status:
   - `request` still present in transitive chain.
   - `ajv@6` still present in chain (now pinned to patched `6.14.0` via override).

Impact reading:

1. A direct full migration has high blast radius because imports are spread across all runtime surfaces.
2. A local adapter seam is the fastest way to reduce migration risk without immediate feature churn.

---

## 3. Option Matrix

| ID    | Option                               | Readiness             | Effort (weeks) | Security Delta  | Feature Impact |
| ----- | ------------------------------------ | --------------------- | -------------- | --------------- | -------------- |
| MDO-1 | Contain and monitor current chain    | Ready now             | 0.5            | Low positive    | None           |
| MDO-2 | Add local SDK adapter seam           | Ready now             | 1.5            | Medium positive | Low            |
| MDO-3 | Maintain minimal matrix-bot-sdk fork | Needs scoped approval | 2.5            | High positive   | Medium         |
| MDO-4 | Migrate plugin to matrix-js-sdk      | Not ready             | 4.0            | High positive   | High           |

Council recommendation:

1. Execute `MDO-1` and `MDO-2` now.
2. Open a scoped decision gate for `MDO-3` versus `MDO-4` after adapter completion.

---

## 4. Execution Tasks

### MDS-T1: Adapter seam

1. Create `extensions/matrix/src/matrix/sdk/adapter.ts` as the only runtime entrypoint to SDK operations.
2. Route non-test SDK imports through adapter interfaces.
3. Keep behavior and payload shaping unchanged.

Acceptance:

1. Direct `@vector-im/matrix-bot-sdk` imports in runtime feature modules are removed.
2. Matrix test lane remains passing.

### MDS-T2: Contract tests and gates

1. Add adapter contract tests covering:
   - send flow (text/media)
   - monitor flow (event ingestion)
   - room actions (room lookup, membership, reactions)
2. Add CI gate in matrix lane to fail if new direct SDK imports appear outside adapter/tests.

Acceptance:

1. Matrix tests pass with adapter boundary active.
2. Import guard rejects direct SDK coupling regressions.

### MDS-T3: Decision gate (fork vs migration)

1. Build side-by-side effort/risk comparison once adapter is complete.
2. Compare:
   - minimal fork path (remove `request` chain)
   - `matrix-js-sdk` migration path
3. Record signed decision with phased rollout and rollback criteria.

Acceptance:

1. Decision artifact includes owner, schedule, regression gates, and rollback plan.

---

## 5. Dependencies and Ordering

1. `MDS-T1` must complete before `MDS-T3`.
2. `MDS-T2` should run in parallel with late `MDS-T1` work and finish before `MDS-T3` signoff.
3. P0-2/P0-4 execution remains independent and should proceed as soon as operator credentials are provided.

---

## 6. Governance Notes

1. This strategy does not require immediate dependency patching beyond approved `ajv@6 -> 6.14.0` override.
2. Carbon dependency remains unchanged per repo policy.
3. Matrix residual `request` advisory remains tracked and explicitly accepted pending chosen replacement path.
