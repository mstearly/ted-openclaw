# SDD 117: C0 Context Semantics Field Inventory and Policy Map

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Tasks:** SDD 107 `C0-001`, `C0-002`, `C0-003`

---

## 1. Accepted Request Field Inventory (Gateway `/v1/responses`)

| Field                  | Runtime Status              | Current Policy Decision   |
| ---------------------- | --------------------------- | ------------------------- |
| `model`                | Implemented                 | Keep implemented          |
| `input`                | Implemented                 | Keep implemented          |
| `instructions`         | Implemented                 | Keep implemented          |
| `tools`                | Implemented                 | Keep implemented          |
| `tool_choice`          | Implemented                 | Keep implemented          |
| `stream`               | Implemented                 | Keep implemented          |
| `max_output_tokens`    | Implemented                 | Keep implemented          |
| `user`                 | Implemented                 | Keep implemented          |
| `previous_response_id` | Previously accepted/ignored | **Reject explicitly**     |
| `reasoning`            | Previously accepted/ignored | **Reject explicitly**     |
| `truncation`           | Previously accepted/ignored | **Reject explicitly**     |
| `max_tool_calls`       | Accepted, no behavior wired | Defer policy finalization |
| `temperature`          | Accepted, no behavior wired | Defer policy finalization |
| `top_p`                | Accepted, no behavior wired | Defer policy finalization |
| `metadata`             | Accepted, no behavior wired | Defer policy finalization |
| `store`                | Accepted, no behavior wired | Defer policy finalization |

---

## 2. Implemented C0 Policy Decisions (This Execution Slice)

1. Explicitly reject unsupported context-semantics fields:
   - `previous_response_id`,
   - `reasoning`,
   - `truncation`.
2. Return deterministic `invalid_request_error` with field-specific details.
3. Do not silently ignore context-semantics controls.

---

## 3. Error Contract (C0-003)

Current unsupported-context response shape:

```json
{
  "error": {
    "message": "Unsupported context semantics: previous_response_id",
    "type": "invalid_request_error",
    "details": [
      {
        "field": "previous_response_id",
        "reason": "continuation by response id is not implemented in gateway mode yet; resend required context in `input`."
      }
    ]
  }
}
```

Contract guarantees:

1. `type` is always `invalid_request_error`.
2. `message` names unsupported field(s).
3. `details[]` includes machine-readable field + reason.

---

## 4. Verification Evidence

1. `src/gateway/openresponses-http.e2e.test.ts` - rejection assertions for `previous_response_id`, `reasoning`, `truncation`.
2. `src/gateway/openresponses-parity.e2e.test.ts` - parity suite remains green.

---

## 5. Remaining C0 Follow-up (Planned)

1. Finalize policy for non-context optional fields currently accepted with no behavior (`max_tool_calls`, `temperature`, `top_p`, `metadata`, `store`).
2. Decide per field: implement, reject explicitly, or allow with documented noop behavior.
