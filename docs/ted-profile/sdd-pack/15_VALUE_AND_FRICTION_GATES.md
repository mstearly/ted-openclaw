# Value and Friction Gates (Day-1)

**Generated:** 2026-02-20

## Purpose

Prevent feature sprawl and keep Day-1 focused on Clint's operating job:

- compress decisions
- reduce coordination load
- preserve governance and auditability

## Canonical Day-1 Operator Loop

Every Day-1 capability must map to this loop:

1. Morning brief generated from governed sources.
2. Draft queue prioritized by risk and urgency.
3. Operator approves, edits, or escalates.
4. End-of-day digest records outcomes and unresolved items.

Capabilities that do not improve this loop are deferred.

## Value Gate (Required For Promotion)

No slice may promote unless it proves all three:

1. Reduces operator effort or decision count.
2. Preserves governance non-negotiables.
3. Improves output quality or reliability.

## Friction Budget KPIs (Release Blocking)

Day-1 defaults:

- `manual_handling_minutes_per_day <= 45`
- `approval_queue_oldest_age_minutes <= 120`
- `unresolved_triage_items_eod <= 12`
- `critical_explainer_missing_count = 0`

If any KPI breaches for two consecutive days, freeze expansion and run friction-remediation work.

## Unified Approval Surface Rule

Risky actions must use one approval interaction pattern across:

- draft outputs
- filing suggestions
- escalation items
- redaction exceptions

No parallel approval UX flows in Day-1.

## Fail-Closed Explainability Contract

Every denied or blocked action must include:

1. what was blocked
2. why it was blocked (reason code)
3. next safe remediation step

Missing explainability is a release-blocking defect.

## Learning and Memory Rule

Corrections from drafts, filing, triage, and contradiction checks feed a single governed learning queue.
No silent behavior change without explicit promotion decision.

## Scope Guard

"Bot fleet" is conceptual only. Day-1 packaging remains:

- OpenClaw Runtime (deployable)
- Ted Engine Sidecar Runtime (deployable)
- all specialist behavior as modules and policies
