# SDD 121: C2-001 Context Semantics Unit Coverage Log

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Task:** SDD 107 `C2-001`

---

## 1. Scope

Add unit-level branch coverage for context semantics policy decisions.

---

## 2. Coverage Added

1. Previous response id is allowed for `openclaw` model family.
2. Previous response id is rejected for non-`openclaw` models.
3. Unsupported controls are rejected:
   - `reasoning`,
   - `context_management.compaction`,
   - `truncation`.
4. Compatibility helper contract verifies model eligibility behavior.

---

## 3. Evidence

1. `src/gateway/openresponses-http.context-semantics.test.ts`
2. `src/gateway/openresponses-http.ts` (exported semantics policy helpers)

---

## 4. Test Command

```bash
pnpm vitest run src/gateway/openresponses-http.context-semantics.test.ts
```

Result: pass.
