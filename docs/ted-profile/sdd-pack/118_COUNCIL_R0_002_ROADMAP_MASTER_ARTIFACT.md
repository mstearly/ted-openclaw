# SDD 118: R0-002 Roadmap Master Artifact

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Task:** SDD 110 `R0-002`

---

## 1. Objective

Create one authoritative roadmap artifact that merges:

1. Onboarding phase windows.
2. P0/P1/P2 alpha stabilization tracks.
3. Integrated SDD 99-105 execution waves.

---

## 2. Artifact Location

1. `sidecars/ted-engine/config/roadmap_master.json`

---

## 3. What the Artifact Now Provides

1. Unified wave dependency graph (`I0` through `I11`) with release windows.
2. Atomic task register with owner, dependency, readiness gate, and mode.
3. Explicit line-item mode classification:
   - `configure_only`
   - `build_cycle`
4. Linked track overlays for onboarding, P0/P1/P2 stabilization, and boardroom SDD 99-105 requirements.

---

## 4. Acceptance Check

1. One JSON artifact answers what/when/who/dependency in one pass.
2. Every task includes a mode tag (`configure_only` or `build_cycle`).
3. Wave dependency relationships are explicitly encoded for machine validation.

---

## 5. Evidence

1. `sidecars/ted-engine/config/roadmap_master.json`
2. `docs/ted-profile/sdd-pack/112_COUNCIL_MASTER_INTEGRATED_EXECUTION_PLAN_SDD107_111.md`
3. `docs/ted-profile/sdd-pack/110_COUNCIL_PLAN_4_ROADMAP_MODULE_LIFECYCLE_TASK_BREAKDOWN.md`
