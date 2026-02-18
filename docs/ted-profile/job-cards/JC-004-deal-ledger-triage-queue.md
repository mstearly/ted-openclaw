# JC-004 — Deal Ledger + Triage Queue (Governed System of Record)

## Outcome

Ted Engine maintains a canonical, auditable system of record for:

- Deals (deal_id, metadata, file structure pointers)
- Triage queue for any item that cannot be linked to a deal_id/task_id

This enables later workflows (filing, deadlines, dashboards) to be governed and explainable.

## Non-negotiables

- Every sidecar action that produces an artifact must link to deal_id or task_id, or go to triage.
- No silent auto-linking at first; learning comes later behind approval.
- Fail-closed: if linkage cannot be asserted, it must be triaged.
- Audit log entries for create/update/link actions.

## Deliverables (Increment 1)

- Storage:
  - deals ledger file(s): sidecars/ted-engine/artifacts/deals/<deal_id>.json
  - triage ledger: sidecars/ted-engine/artifacts/triage/triage.jsonl (append-only)
- Endpoints:
  - POST /deals/create
  - GET /deals/:deal_id
  - GET /deals/list
  - GET /triage/list
  - POST /triage/:item_id/link (link to deal_id/task_id)
- Doctor surface: reports deal/triage counts

## Proof (Increment 1)

- Create a deal -> deal file exists -> GET returns it
- Add a triage item (unlinked) -> appears in triage list
- Link triage item to deal_id -> removed from triage list and recorded in audit trail
