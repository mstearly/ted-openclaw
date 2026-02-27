# SDD 173 - Council Feature Review 07: `document_management`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `document_management`

Current registry posture:

1. Plane: `experience`
2. Lifecycle: `graduated`
3. Maturity: `3`
4. Fragility: `55`
5. Dependency: `sharepoint_integration`
6. Usage telemetry gap: all `usage_signals` fields are `null`

## 2. Internal implementation evidence reviewed

Council reviewed filing and connector behavior directly:

1. Filing suggestions flow has explicit propose and approve lifecycle with idempotency, input validation, and audit events.
2. PARA classification and structure endpoints map content to category and suggested path, persist classification history, and emit `filing.para.classified`.
3. SharePoint connector module enforces execution boundary checks, auth gating, retry-based graph calls, normalized item shapes, and friction event logging.
4. Document quality policy defines friction status code buckets and required reason codes (`AUTH_REQUIRED`, `GRAPH_ERROR`, `RATE_LIMITED`).
5. Event schema covers filing and sharepoint operational events (`filing.*`, `sharepoint.*`) for observability.
6. Route contracts cover filing and SharePoint endpoints used by operator tools and gateway tests.

Internal strengths confirmed:

1. Human-in-the-loop filing workflow is enforced by design.
2. Connector friction instrumentation exists and is policy-driven.
3. PARA indexing gives a repeatable document placement scaffold.

Observed implementation gaps:

1. System is still metadata-first for SharePoint; content extraction and document intelligence are not yet in the core path.
2. No explicit retention-class tagging at document-event level despite governance posture on long-lived records.
3. No confidence-scored automatic filing mode; current model is recommendation plus approval only.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked against leading document-management patterns:

1. Microsoft SharePoint metadata and content type guidance emphasizes consistent metadata schemas and governance-aware classification.
2. Microsoft Purview retention guidance emphasizes policy labels and lifecycle retention enforcement as first-class controls.
3. Google Drive labels guidance emphasizes metadata taxonomy for retrieval, governance, and automation routing.
4. Atlassian Confluence information architecture guidance emphasizes discoverability through structured spaces and taxonomy.

Council inference:

1. Current feature aligns with human-reviewed workflow safety.
2. Largest value gap is intelligent enrichment and retention labeling depth, not additional raw connector routes.

## 4. Overlap and missing-capability assessment

Keep:

1. `document_management` should stay as the user workflow layer over documents.

Avoid-overlap rule:

1. `sharepoint_integration` owns connector transport and API mechanics; `document_management` owns filing UX, policy intent, and placement decisions.

Missing capability:

1. Progressive content extraction and governance labels that flow into retrieval and downstream tasking.

## 5. Council actions (prioritized)

1. Add document enrichment pipeline (metadata plus selective content extraction).
   - Owner: `council.experience`
   - Acceptance: extraction writes structured fields (`doc_type`, `entity`, `sensitivity`, `summary`) with confidence.
2. Add retention and governance label mapping per filing decision.
   - Owner: `council.control`
   - Acceptance: approved filing events include retention label and policy reference in payload.
3. Add confidence-scored fast-lane approvals for low-risk filing suggestions.
   - Owner: `council.governance`
   - Acceptance: suggestions above threshold can enter expedited approval queue with explicit guardrails and rollback audit.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` kept with focus on:
   - `metadata_first_document_indexing`
   - `progressive_document_enrichment_pipeline`
   - `human_in_the_loop_filing_review`
   - `metadata_first_document_indexing_and_retrieval`
3. `source_refs.notes` should remain completed with this deep re-review as canonical evidence.

## 7. Disposition

1. Keep feature active.
2. Prioritize enrichment and retention labeling before expanding to autonomous filing.
3. Continue recursive loop to feature 08.

## External references

1. SharePoint content types and metadata columns: https://support.microsoft.com/en-us/office/create-a-content-type-in-sharepoint-6b4cb8b5-5f53-4a72-a2a5-8f9c6f4fb7be
2. Microsoft Purview retention labels: https://learn.microsoft.com/en-us/purview/retention
3. Google Drive labels overview: https://support.google.com/a/answer/9292382?hl=en
4. Atlassian Confluence information architecture: https://www.atlassian.com/software/confluence/guides/best-practices/information-architecture
