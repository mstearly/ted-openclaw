# Council UI Interrogation Cycle 002 (Ted Workbench UX + Operability)

**Generated:** 2026-02-20  
**Scope interrogated:** Control UI `Ted` tab vs implemented Ted sidecar capability surface.

## Method (SDD-aligned)

- Compared live Ted tab payload and interactions against sidecar routes and SDD user stories.
- Reviewed operator JTBD requirements for persona lifecycle, job-card lifecycle, governance controls, and execution flow.
- Converted confirmed gaps into dependency-ordered remediation job cards (`JC-020+`) and story entries.

## Findings

1. Current Ted tab is telemetry-only and does not provide operational control for most governed workflows.
2. Persona/role-card lifecycle is missing from UI (create/edit/validate/promote path absent).
3. Job-card lifecycle is missing from UI (dependency graph, status transitions, proofs, promotion state).
4. Governance controls exist server-side but are mostly inaccessible from Ted UI.
5. Ops controls (pause/resume/rate/retry/dispatch) are not represented as an operator surface.
6. Triage/filing and Graph profile flows are not represented in Ted UI.
7. Data-source trust issue observed: workbench showed `job_cards_total=0` in a non-empty project.

## Council Recommendation

Promote Ted UI from a summary card to a **governed operations console** with staged unlocks:

- `Operate` (queues, approvals, triage/filing)
- `Design` (personas/role cards)
- `Govern` (policy checks + explainability)
- `Build` (job cards, dependencies, proofs, promotion)
- `Connect` (Graph profiles/auth diagnostics)
- `Evals` (friction KPIs, quality gates, regression)

## Critical UX Review Addendum (Operator Friction)

Council consensus after operator feedback:

1. A metrics-only board is insufficient for real operations.
2. Every list item shown to operator must be drillable into attributes/details.
3. Recommendation cards must be actionable (approve/dismiss) from the same surface.
4. New work intake must be first-class and produce governed defaults + KPI scaffolding.

## Dependency-Ordered Remediation Backlog

1. `JC-020` Ted workbench data-source correctness and trust diagnostics.
2. `JC-021` Persona and role-card studio (define/validate/promote).
3. `JC-022` Job-card board (dependency graph, status, proof execution).
4. `JC-023` Governance console (hard bans/output/entity/confidence/contradiction/escalation).
5. `JC-024` Ops console (pause/resume/dispatch/rate/retry/repair).
6. `JC-025` Triage and filing console.
7. `JC-026` Graph profile manager and diagnostics.
8. `JC-027` Unified approval surface for risky decisions.
9. `JC-028` KPI and evals dashboard.

## Stop-the-line Criteria

- Any UI action bypassing draft-only or approval-first boundaries.
- Any UI introducing non-health route calls without sidecar auth contract.
- Any mismatch between displayed job-card state and source-of-truth files.

## Promotion Decision (Cycle 002)

- Immediate execute `JC-020` to restore dashboard trust.
- Continue sequentially with `JC-021` and `JC-022` as the first operability tranche.
- Keep Day-1 ceilings unchanged while expanding operator control surfaces.

## Execution Update (2026-02-20)

- `JC-020` PASS
- `JC-021` PASS
- `JC-022` PASS
- `JC-029` PASS (intake recommender + card detail + recommendation decisions)
- `JC-030` PASS (threshold governance + early unlock controls with warnings)
- `JC-031` PASS (UI surface inventory + gap map accepted)
- `JC-032` PASS (IA sections + interaction contract wired: Operate/Build/Govern/Intake/Evals)
- `JC-033` PASS (core task flow redesign: inspect/decide/prove/intake with explicit states)
- `JC-034` PASS (unified approval queue + governance timeline surfaced)
- `JC-035` PASS (KPI/eval history previews surfaced for observability)
