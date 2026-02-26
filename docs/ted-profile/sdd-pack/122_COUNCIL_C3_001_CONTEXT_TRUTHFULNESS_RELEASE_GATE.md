# SDD 122: C3-001 Context Truthfulness Release Gate

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Task:** SDD 107 `C3-001`

---

## 1. Objective

Define and enforce required CI/release checks for context semantics truthfulness.

---

## 2. Gate Command

```bash
pnpm test:context-semantics-gate
```

Script location:

1. `scripts/context-semantics-gate.mjs`

---

## 3. Gate Contents

1. Unit branch checks:
   - `src/gateway/openresponses-http.context-semantics.test.ts`
2. Gateway OpenResponses contract e2e checks:
   - `src/gateway/openresponses-http.e2e.test.ts`
   - `src/gateway/openresponses-parity.e2e.test.ts`

---

## 4. CI Enforcement

The `checks` matrix now includes a required lane:

1. Task: `context-semantics-gate`
2. Command: `pnpm test:context-semantics-gate`
3. Workflow file: `.github/workflows/ci.yml`

---

## 5. Acceptance

1. Context truthfulness regressions fail a dedicated CI lane before merge.
2. Release checklist has an explicit contract-check step via gate command.
