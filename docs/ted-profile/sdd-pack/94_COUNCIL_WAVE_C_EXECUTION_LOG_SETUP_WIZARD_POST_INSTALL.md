# SDD 94: Council Wave C Execution Log — Setup Wizard + Post-Install Credentials

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent:** SDD 91 (Wave C)

---

## 1. Scope Executed

Wave C baseline (D8) implemented for post-install setup readiness:

1. Setup state contract exposing Graph/provider readiness with redacted diagnostics.
2. Operator-approved credential entry route for Graph profile GUID/scopes.
3. Ted UI Setup Wizard panel to complete this flow without source edits.

---

## 2. Delivered

1. New sidecar routes:
   - `GET /ops/setup/state`
   - `POST /ops/setup/graph-profile`
2. Existing `GET /ops/setup/validate` now returns richer setup snapshot data.
3. Setup write-path enforces:
   - operator approval header required
   - GUID validation for `tenant_id` and `client_id`
   - delegated scopes required
   - secret fields blocked (`client_secret`/`secret`)
4. Setup state includes profile-level readiness detail:
   - masked GUID diagnostics
   - missing field list
   - placeholder/example-value detection
   - authentication status and next action
5. Extension gateway methods added for setup state + setup write.
6. Ted UI Execution Waves panel now includes Setup Wizard controls for:
   - profile selection
   - tenant/client/scopes entry
   - optional auth-clear toggle
   - setup-state readiness refresh

---

## 3. Acceptance Mapping

1. **C-001:** Setup state endpoint delivered with redacted readiness diagnostics.
2. **C-002:** Credential entry path delivered; no secret hardcoding path added.
3. **C-003:** Operator can execute setup end-to-end in Ted UI (no curl required).

---

## 4. Validation

1. JSON contract files parse successfully.
2. `node --check sidecars/ted-engine/server.mjs` passes.
3. `pnpm build` passes.

---

## 5. Residual Follow-Up

1. Add inline setup field prefill from selected profile snapshot to further reduce operator friction.
2. Add guided smoke-launch button that chains setup check -> auth flow -> read-only Graph proof calls.
