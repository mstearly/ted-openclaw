# SDD 180 - Council Feature Review 14: `hipaa_compliance`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `hipaa_compliance`

Current registry posture:

1. Plane: `control`
2. Lifecycle: `graduated`
3. Maturity: `3`
4. Fragility: `40`
5. Dependencies: none
6. Usage telemetry gap: all `usage_signals` fields are `null`

## 2. Internal implementation evidence reviewed

Council reviewed PHI controls across policy, runtime, and retention paths:

1. Hard-ban policy explicitly blocks unredacted PHI exposure and entity mixing, and operator profile encodes HIPAA-specific Everest rules and PHI fields.
2. LLM call path always sanitizes message content through `redactPhiFromMessages()` before provider invocation.
3. Redaction layer actively masks SSN, DOB, room/bed references, MRN, phone numbers, and email addresses using deterministic patterns.
4. Provider routing enforces entity-level HIPAA requirements: Everest context requires a `hipaa_cleared` provider and blocks calls when unavailable.
5. Ingestion quality policy explicitly requires PII redaction on extraction workflows (`require_pii_redaction_on_extract: true`).
6. Self-healing ledger compaction applies retention controls with archive manifests and 6-year retention metadata.
7. Governance event taxonomy includes entity and output-block events that capture privacy/scope failures.

Internal strengths confirmed:

1. Multiple safety layers exist (policy bans, entity rules, redaction, provider eligibility, governance blocks).
2. Fail-closed behavior is present for non-HIPAA-cleared provider selection in HIPAA-required entity contexts.
3. Retention/archival behavior is explicit and auditable.

Observed implementation gaps:

1. Redaction comments explicitly note current scope gaps: SharePoint document content, event payloads, and audit trails are not redacted by this function.
2. Regex-based masking covers common PHI patterns but not all context-dependent PHI semantics.
3. HIPAA-relevant controls are distributed across multiple configs/functions rather than a single policy artifact, increasing drift risk.
4. Default HIPAA-cleared provider path (`azure_openai`) is configured but disabled, creating operational availability risk for Everest PHI workloads.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked against modern privacy and safety control patterns:

1. Microsoft Purview DLP guidance emphasizes policy-driven sensitive-data controls and enforcement workflows.
2. Google Sensitive Data Protection guidance emphasizes de-identification/tokenization patterns beyond simple literal masking.
3. Azure prompt-shield guidance reinforces prompt/input attack containment as part of privacy-safe inference operations.
4. NIST AI RMF emphasizes measurable govern/measure/manage lifecycle controls for high-risk AI contexts.
5. OWASP LLM Top 10 reinforces sensitive-data disclosure and prompt-injection threats that can bypass weak redaction designs.

Council inference:

1. Current controls are strong for baseline PHI protection and fail-closed posture.
2. Highest-value gap is depth and centralization: structured PHI detection and document-content coverage.

## 4. Overlap and missing-capability assessment

Keep:

1. `hipaa_compliance` remains a dedicated control-plane feature and should not be merged into generic governance checks.

Avoid-overlap rule:

1. `governance_safety` owns generic safety framework; `hipaa_compliance` owns PHI-specific controls, retention expectations, and provider eligibility constraints.

Missing capability:

1. End-to-end PHI detection/redaction for document content and structured event payloads with measurable redaction-quality metrics.

## 5. Council actions (prioritized)

1. Create unified HIPAA policy artifact.
   - Owner: `council.governance`
   - Acceptance: one policy file defines PHI scope, required controls, coverage surfaces, and validation checks.
2. Expand redaction coverage beyond message text.
   - Owner: `council.control`
   - Acceptance: SharePoint/document ingestion and other text-bearing flows pass through governed PHI sanitization before model use.
3. Add HIPAA-specific observability.
   - Owner: `council.state`
   - Acceptance: emit/report `hipaa.redaction.applied`, `hipaa.redaction.failed`, and coverage metrics by route/connector.
4. Harden provider readiness for HIPAA entity flows.
   - Owner: `council.connector`
   - Acceptance: HIPAA-cleared provider path is operationally tested with documented failover behavior and outage runbook.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `healthcare_privacy_controls_and_auditable_access`
   - `policy_as_code_fail_closed_defaults`
   - `eval_driven_release_controls`
   - `human_approval_for_high_impact_changes`
   - `audit_reason_codes_and_traceability`
3. `source_refs.notes` should be updated to mark this deep re-review as passed.

## 7. Disposition

1. Keep feature active.
2. Prioritize unified policy and broader redaction coverage before enabling deeper document-content intelligence.
3. Continue recursive loop to feature 15.

## External references

1. Microsoft Purview DLP overview: https://learn.microsoft.com/en-us/purview/dlp-learn-about-dlp
2. Google Sensitive Data Protection de-identification: https://cloud.google.com/sensitive-data-protection/docs/deidentify-sensitive-data
3. Azure OpenAI prompt shields: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/content-filter-prompt-shields
4. NIST AI RMF 1.0: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
5. OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
