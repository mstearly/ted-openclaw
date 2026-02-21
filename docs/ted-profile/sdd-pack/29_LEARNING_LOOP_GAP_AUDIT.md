# Learning Loop Gap Audit (Council)

Generated: 2026-02-21

## What is now enforced

- All existing job cards include `## Friction KPI Evidence`.
- Job-card save is blocked if KPI evidence is removed.
- Intake-generated cards include KPI evidence by default.
- Recommendation decisions are auto-attributed to impacted cards.
- Per-card promotion confidence is computed from status, dependencies, KPI coverage, proof results, and recommendation outcomes.
- Policy updates are auto-attributed with changed fields, risk direction, linked cards, and expected KPI effects.

## Remaining gaps (not fully hard-wired yet)

1. Fast-repair correction patterns are logged, but not yet converted into adaptive UX prompts.
2. Promotion confidence is visible, but thresholded promotion recommendation actions are not yet auto-generated.

## Required next remediation cards

- JC-044 Fast-repair Pattern Learning Prompts
- JC-045 Learning-to-Promotion Confidence Contract
