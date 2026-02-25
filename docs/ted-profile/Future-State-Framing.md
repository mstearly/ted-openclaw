# Future-State Framing (North Star)

**Status:** Proposed (Council review)  
**Version:** v2  
**Purpose:** Provide a single clear thought + executive framing for Ted’s future-state co-work architecture **without breaking** the Sidecar governance choke-point.

---

## How to use this document

- Use this as the **canonical message** when explaining Ted to the Council, engineering, security, and operators.
- Treat the **Design Laws** below as non-negotiable requirements that must hold as new capabilities are added.
- For “what changes where,” pair this doc with: **Planes → Artifacts → Owners**.

---

## Design Laws (non‑negotiables)

1. **Single governance choke-point**  
   No matter where a request comes from (MCP, OpenClaw UI, Copilot webhook), it must converge into the **same Sidecar pipeline** before anything happens.

2. **Template-as-Contract (never-dark)**  
   Outputs are defined by templates/contracts; the model only fills them.  
   If a model fails or is disabled, Ted still returns a valid, structured output with `source: "template"`.

3. **Provider cascade + entity overrides**  
   Per-job → entity override → default provider is the standard selection pattern (no ad hoc calls).

4. **HIPAA hard gate + defense in depth**  
   If `entityContext === "everest"` then:
   - block providers not explicitly HIPAA-cleared
   - redact PHI before any model call, regardless of provider

5. **Contract validation after every response**  
   If a model response fails validation, it **doesn’t ship**. It falls back to template output and logs a proof failure.

6. **Governance tiers for tools**
   - Read-only tools (no confirmation)
   - Write tools are confirmation-gated (preview → confirm)
   - Hard-banned tools are never callable

7. **Multi-tenant boundaries are sacred**  
   No cross-tenant mixing, indexing, retrieval, caching, or drafting—unless explicitly permitted, logged, and designed.

8. **Progressive autonomy**  
   Autonomy ladder governs how “agentic” Ted can be—capabilities are earned (promoted by proof + approval), not assumed.

9. **Operational reality is part of product**  
   Notification budget, quiet hours, onboarding phases, and progressive disclosure are first-class.

10. **Event-sourced truth, not “note soup”**  
    The living diary must be anchored to an **append-only event log** + **materialized ledgers** so truth is replayable and auditable.

11. **Draft Queue is a state machine**  
    Drafts are objects with lifecycle: drafted → pending review → edited → approved → executed/archived.

---

## Reframed single clear thought (future-state + value)

### One sentence (North Star)

**Ted is a governed co-work kernel: OpenClaw/MCP capture intent, the Sidecar enforces policy + tenant firewalls, event-driven connectors stream M365/DealOps signals into an event-sourced diary, and contract-bound models (Codex included) generate validated briefs and ready-to-approve drafts—so the client stays organized and accountable without risking compliance.**

### 15‑second version (say out loud)

**Everything routes through the Sidecar. Events from M365 and deal systems become a canonical ledger. Templates define ‘correct’ outputs; models fill them. Ted produces daily briefs and draft deliverables; humans approve. Codex improves the system through gated change requests, not uncontrolled self-modification.**

### Why this wording matters

- It makes “agentic co-work” about **control + state + proof**, not just “a smarter model.”
- It positions Codex safely: Codex never becomes a bypass around governance.
- It ties value to outcomes: **briefs + drafts + accountability + audit**.

---

## Key definitions (terms used consistently)

- **Sidecar (Co‑Work Kernel):** The single choke-point enforcing governance, scheduling playbooks, and gating tool calls.
- **Event Log:** Append-only record of signals, actions, approvals, and escalations.
- **Ledgers:** Materialized “current truth” views derived from events (commitments, drafts, deals, meetings, trust, etc.).
- **Contract:** Template + validator defining allowed output shape and required sections.
- **Codex Runtime Lane:** Contract-bound synthesis/drafting (never self-executing beyond allowed tools).
- **Codex Builder Lane:** Generates _change requests_ (spec/tests/diff) reviewed and staged like any other code change.

---

## Related canonical docs

- `Planes-Artifacts-Owners.md` — maps configs/routes/tools to planes and ledgers
- (Recommended) `Evals-and-Proof-Harness.md` — how we prove correctness and prevent regressions
- (Recommended) `Tenant-Firewall-and-Identity.md` — dual-tenant identity + partitioning rules
