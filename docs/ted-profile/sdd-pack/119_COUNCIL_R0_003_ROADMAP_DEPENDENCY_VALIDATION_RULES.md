# SDD 119: R0-003 Roadmap Dependency Validation Rules

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Task:** SDD 110 `R0-003`

---

## 1. Objective

Add deterministic validation rules so invalid roadmap graph state fails checks before execution proceeds.

---

## 2. Validation Rules Implemented

1. Detect duplicate wave ids.
2. Detect duplicate task ids.
3. Detect orphan tasks with missing or unknown `wave_id`.
4. Detect missing task dependencies.
5. Detect task self-dependencies.
6. Detect circular dependencies in task graph.
7. Detect circular dependencies in wave graph.
8. Enforce task mode values:
   - `configure_only`
   - `build_cycle`

---

## 3. Runtime and Tooling Hooks

1. Startup validation now evaluates:
   - `roadmap_master.json`
   - `module_lifecycle_policy.json`
2. Sidecar config drift monitoring now tracks both files.
3. Validation CLI added:
   - `scripts/ted-profile/validate-roadmap-master.mjs`

Command:

```bash
node scripts/ted-profile/validate-roadmap-master.mjs
```

---

## 4. Acceptance Check

1. Invalid roadmap graph now fails validation checks.
2. Validation result is machine-consumable (`ok`, `errors[]`, `warnings[]`, `stats`).
3. Sidecar startup captures roadmap/module policy validity in startup validation outcomes.

---

## 5. Evidence

1. `sidecars/ted-engine/modules/roadmap_governance.mjs`
2. `sidecars/ted-engine/config/roadmap_master.json`
3. `sidecars/ted-engine/config/module_lifecycle_policy.json`
4. `scripts/ted-profile/validate-roadmap-master.mjs`
5. `sidecars/ted-engine/server.mjs`
6. `sidecars/ted-engine/tests/roadmap-governance.test.mjs`
7. `sidecars/ted-engine/tests/config-schemas.test.mjs`
