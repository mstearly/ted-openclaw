# Council Interrogation Cycle 001 (Runtime + Stories)

**Generated:** 2026-02-20
**Scope interrogated:** current sidecar runtime (`sidecars/ted-engine/server.mjs`), Day-1 spine spec, and story traceability/coverage artifacts.

## Method (SDD-aligned)

- Reviewed council-required interrogation prompts from `16_COUNCIL_EXPANSION_AND_COWORK_REVIEW.md`.
- Cross-checked runtime route surface against governance and story outcomes.
- Converted each material gap into dependency-ordered remediation job cards (`JC-012+`) with proof scripts.
- Kept Day-1 ceilings intact (draft-only, approval-first, fail-closed).

## Council Findings

## 1) Agentic AI Systems Architect

- Deterministic-vs-agent boundary is still implicit in code paths.
- Runtime can execute many policy and ops checks, but slice-level "workflow only vs adaptive" declarations are not yet enforceable artifacts.
- Recommendation: add explicit boundary contract + route policy map, enforced by proof.

## 2) Human Factors and Cognitive Load Researcher

- Explainability exists on key governance endpoints, but operator fast-repair path (<10s correction) is not yet measured as a release gate.
- Recommendation: add fast-repair interaction contract with timing proofs.

## 3) Orchestration Engineer

- Pause/resume and rate controls exist, but idempotency/retry/resume invariants are not yet first-class tested contracts.
- Recommendation: add idempotency key + dedupe + bounded retry/backoff + resume consistency proofs.

## 4) Evals Specialist and Quality Lead

- Proof scripts validate endpoint behavior, but no reusable offline gold set for drafting/extraction/contradiction routing regressions.
- Recommendation: add eval corpus + regression gate runner with mandatory pass threshold.

## 5) Security and Compliance Lead

- Day-1 clarifications require authenticated non-health route contract; runtime currently exposes many non-health routes without explicit per-route auth gate in sidecar process.
- Recommendation: enforce sidecar auth middleware + explicit allowlist exception for health endpoints only.

## 6) Product Lead

- Value path is strong and staged, but quality unlock criteria for each post-Day-1 slice need tighter proof linkage in job execution order.
- Recommendation: wire remediation backlog into dependency-ordered JC slices with stop-the-line criteria.

## Interrogation Scorecard

- Governance posture: **Amber** (policy checks strong, auth boundary contract needs hardening)
- Operator UX posture: **Amber** (explainability present, fast-repair not yet gated)
- Reliability posture: **Amber** (pause/rate present, idempotency/resume proof gaps)
- Evals posture: **Red** (no gold-set regression harness yet)
- Packaging posture: **Amber** (preflight exists; mac runner completion still required)

## Concrete Remediation Backlog (Auto-generated)

Dependency order is strict: each card must pass before promoting next.

1. `JC-012` Workflow-vs-agent boundary contract and enforcement map.
2. `JC-013` Sidecar auth boundary enforcement for non-health routes.
3. `JC-014` Orchestration integrity (idempotency, dedupe, retry/backoff, resume consistency).
4. `JC-015` Offline eval gold sets + regression gate harness.
5. `JC-016` Operator fast-repair (<10s) and explainability completion gate.
6. `JC-017` Mac packaging closure on Darwin runner with installer evidence.

## Stop-the-line Criteria

- Any non-health sidecar route callable without required auth contract.
- Any regression in draft-only / approval-first boundaries.
- Any failure of eval gold-set gate once `JC-015` is active.
- Any fast-repair flow exceeding 10 seconds median in controlled proof runs once `JC-016` is active.

## Promotion Decision (Cycle 001)

- Proceed with remediation backlog implementation.
- Do not promote beyond current slice set until `JC-012` through `JC-016` are complete and proofs are green.
- Keep `JC-011` as packaging blocker until Darwin packaging evidence is attached.

## Execution Update (2026-02-20)

- `JC-012` PASS
- `JC-013` PASS
- `JC-014` PASS
- `JC-015` PASS
- `JC-016` PASS
- `JC-017` BLOCKED (Darwin packaging environment required)
- `JC-018` PASS
- `JC-019` PASS (Ted Workbench dashboard surface for lower operator friction)
- Follow-on: UI operability expansion moved to Cycle 002 (`21_COUNCIL_UI_INTERROGATION_CYCLE_002.md`), starting with `JC-020`.
