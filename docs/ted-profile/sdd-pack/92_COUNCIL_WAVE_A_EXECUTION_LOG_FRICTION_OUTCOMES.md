# SDD 92: Council Wave A Execution Log — Friction and Outcomes Core

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent:** SDD 91  
**Wave:** A (D1 + D7 core)

---

## 1. Scope Executed

Wave A executed the first mandatory SDD 90 deltas:

1. D1 telemetry contract baseline (trace-aware friction events and run rollups).
2. D7 outcomes baseline (dashboard, trends, per-job outcomes).

---

## 2. Completed Tasks

1. Added friction ledgers and startup integrity coverage.
2. Instrumented workflow runtime to emit:
   - step-level friction events
   - run-level friction summary and trajectory timeline
3. Added new sidecar endpoints:
   - `GET /ops/friction/summary`
   - `GET /ops/friction/runs`
   - `GET /ops/outcomes/dashboard`
   - `GET /ops/outcomes/friction-trends`
   - `GET /ops/outcomes/job/{job_id}`
4. Added route normalization + execution-boundary policy for all new endpoints.
5. Added route contract entries and event schema taxonomy updates.
6. Added extension gateway methods for all new friction/outcomes routes.
7. Added Ted UI types, controller methods, app state bindings, and UI surface for friction/outcomes controls.

---

## 3. Operator Value Added

1. Clint can now inspect harmful friction drivers without curl.
2. Workflow runs now return friction summary directly.
3. Outcome dashboard exposes optimization recommendation from measured data.

---

## 4. Validation Evidence

1. `pnpm build`: pass.
2. `node --check sidecars/ted-engine/server.mjs`: pass.

---

## 5. Residual Gaps (Queued)

1. Connector admission lifecycle and attestation (Wave B).
2. Post-install setup wizard for credentials (Wave C).
3. Replay and adversarial harness (Wave D).
4. Workflow risk lint and simulation hardening (Wave E).
5. Memory confidence/harm controls (Wave F).
6. Healing blast-radius boundaries and rollback triggers (Wave G).

---

## 6. Council Recommendation

Proceed immediately to Wave B then Wave C, because they close the largest governance and operator-readiness gaps left after Wave A.
