# JC-005 — Filing Suggestions Queue (Approval-gated)

## Outcome

Ted Engine can propose, list, and approve filing suggestions that are linked to deal context. No auto-filing; approvals are required.

This is the bridge between:

- triage ingest + deal linkage (JC-004)
  and
- draft-only Graph actions (JC-003) once tenant auth is available.

## Non-negotiables

- Suggestions are **not execution**. No moving emails/files without explicit approval and separate proof.
- Every suggestion must be tied to a deal_id or triage item (or fail closed).
- Append-only ledgers + audit entries.
- Fail-closed behavior when prerequisites are missing.

## Deliverables (Increment 1)

### Storage (append-only)

- sidecars/ted-engine/artifacts/filing/suggestions.jsonl

### Endpoints

- POST /filing/suggestions/propose
  Body: { source_type, source_ref, deal_id?, triage_item_id?, suggested_path, rationale? }
  Rules:
  - require (deal_id OR triage_item_id)
  - status = PROPOSED
- GET /filing/suggestions/list
  Returns open suggestions only by default
- POST /filing/suggestions/:suggestion_id/approve
  Body: { approved_by }
  Rules:
  - marks suggestion APPROVED (execution comes later)
  - writes audit entry

### Proof (Increment 1)

- Propose a suggestion -> appears in list with status PROPOSED
- Approve it -> status becomes APPROVED and audit recorded
- No execution side effects occur (no file moves, no Graph calls)

## Notes

Execution (apply/move) is a later increment and will require:

- explicit Graph/Files permissions
- new proofs + gates
