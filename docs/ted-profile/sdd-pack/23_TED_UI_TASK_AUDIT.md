# Ted UI Task Audit

**Generated:** 2026-02-20  
**Method:** task-first audit against operator JTBD and friction budget.

## Core Operator Tasks

| Task                               | Current Path                     | Friction Notes                                          | Score (1-5) |
| ---------------------------------- | -------------------------------- | ------------------------------------------------------- | ----------- |
| Find highest-priority work         | dashboard + recommendation cards | good visibility, still lacks explicit priority queue    | 3           |
| Inspect a job card deeply          | board -> open detail             | now feasible, markdown edit/create still absent         | 4           |
| Decide on recommendation           | recommendation approve/dismiss   | action exists, lacks rationale template before decision | 3           |
| Run implementation proof           | board -> run proof               | operational, no batched proof orchestration             | 4           |
| Create new job from intake         | intake form -> recommendation    | high value, draft save/publish workflow not yet present | 4           |
| Tune thresholds for early unlock   | threshold controls               | explicit warning path exists                            | 4           |
| Certify risky actions in one place | not available in Ted tab         | missing unified approval surface                        | 1           |
| Track KPI/eval drift over time     | not available                    | missing charts/history                                  | 1           |

## Key Friction Drivers

1. Approval flows are fragmented.
2. KPI/evals are snapshot-only.
3. Intake recommendations are not yet persisted to draft files from UI.
4. No explicit “what changed since yesterday” operator digest in Ted panel.

## Immediate UX Requirements

- Add unified approval queue with evidence snippets.
- Add KPI trend strip and release-gate trajectory.
- Add “save draft card” from intake recommendation.
- Add queue of pending recommended cards (not yet promoted).

## Execution Mapping

- `JC-033`: reduce navigation/decision friction in core flow.
- `JC-034`: approval + explainability consolidation.
- `JC-035`: KPI/evals visibility and trendability.
