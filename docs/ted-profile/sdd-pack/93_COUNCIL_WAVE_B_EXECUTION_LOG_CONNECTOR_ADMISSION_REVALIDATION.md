# SDD 93: Council Wave B Execution Log — Connector Admission + Revalidation Baseline

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent:** SDD 91 (Wave B)

---

## 1. Scope Executed

Wave B baseline (D5) completed for external MCP connector governance:

1. Trust policy/admission metadata support in connector config lifecycle.
2. Admission checklist endpoint with production-readiness blockers.
3. Revalidation scaffold with append-only ledger and status query route.
4. Extension/UI wiring so operators can run this without curl.

---

## 2. Delivered

1. Sidecar config model now supports per-connector admission metadata:
   - `attestation_status`
   - `attested_at`
   - `scope_verified`
   - test evidence fields (`last_tested_at`, `last_test_ok`, `last_tool_count`)
2. New sidecar routes:
   - `GET /ops/mcp/external/servers/admission`
   - `POST /ops/mcp/external/servers/revalidate`
   - `GET /ops/mcp/external/servers/revalidate/status`
3. Revalidation ledger added:
   - `artifacts/external_mcp/revalidation.jsonl`
4. Connector test endpoint now persists health-test evidence into connector metadata.
5. Extension gateway methods added for all new routes.
6. Ted UI External MCP surface now supports:
   - attestation metadata entry/edit
   - admission refresh
   - per-server/all-server revalidation
   - last revalidation summary display

---

## 3. Acceptance Mapping

1. **B-001:** Backward-compatible schema extension delivered (`_config_version` uplift with normalization fallback).
2. **B-002:** Admission checklist endpoint delivered with explicit blockers and next actions.
3. **B-003:** Revalidation scaffold delivered with persisted run rows and operator-visible status.

---

## 4. Validation

1. JSON contract files parse successfully.
2. `node --check sidecars/ted-engine/server.mjs` passes.
3. `pnpm build` passes.

---

## 5. Residual Follow-Up

1. Add calendar/scheduler-based automatic revalidation trigger cadence (currently operator-triggered scaffold).
2. Tighten production-ready gate thresholds once live connector evidence accumulates.
