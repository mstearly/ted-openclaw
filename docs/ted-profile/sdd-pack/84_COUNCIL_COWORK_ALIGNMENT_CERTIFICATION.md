# SDD 84: Council Co-Work Competitive Alignment Certification

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Mandate:** One additional council research pass to verify TED functionality alignment against leading co-work applications and certify best-practice posture.

---

## 1. Scope and Method

This certification pass combines:

1. **Internal evidence** from code and current SDDs
   - `sidecars/ted-engine/server.mjs`
   - `sidecars/ted-engine/config/route_contracts.json`
   - `extensions/ted-sidecar/index.ts`
   - SDDs 76, 77, 81, 82, 83
2. **External benchmark evidence** from official product/trust documentation of leading co-work platforms (Microsoft, Google, Notion, Slack, Atlassian, Asana, ClickUp, monday.com)
3. **Best-practice controls** from NIST AI RMF and OWASP LLM Top 10

Certification date is fixed at **February 26, 2026**.

---

## 2. Current Internal Capability Baseline (Verified)

1. Sidecar route contracts: **164** registered routes across **24** route families.
2. TED extension tool surface: **81** TED tools.
3. Governance controls present in runtime:
   - hard bans, autonomy ladder, notification budget, onboarding ramp
   - approval-gated write tools + draft queue lifecycle
   - event log + audit ledger patterns
4. Graph auth and resilience logic implemented:
   - device auth start/poll routes
   - retry/pagination (`graphFetchWithRetry`, `graphFetchAllPages`)
5. CI pipeline exists and is broad (`.github/workflows/ci.yml` includes lint/type/test and platform lanes).
6. Critical external blocker remains:
   - both `olumie` and `everest` profiles still have empty `tenant_id` and `client_id`
   - P0-4 smoke runner reports `BLOCKED_CONFIG` until operator Azure inputs are provided.

---

## 3. Competitive Alignment Matrix

| Dimension                                  | Leading-App Baseline                                                                                                          | TED Current State                                                                                                                               | Council Rating            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Unified cross-app knowledge retrieval      | Notion/Atlassian/Slack provide search/summaries across multiple connected SaaS tools                                          | Strong M365 + internal ledger retrieval, but broad third-party retrieval mesh is still limited                                                  | **Partial**               |
| AI workflow automation and agents          | Asana AI Studio, ClickUp Autopilot Agents, monday AI blocks provide low-code automation at scale                              | Builder Lane + scheduler + policy gates are strong, but operator-facing no-code automation authoring remains thinner                            | **Partial**               |
| Human-in-the-loop governance               | Most platforms offer approvals, but often less strict by default                                                              | Draft-only posture, confirmation-gated write tools, autonomy ladder, hard bans are deeply implemented                                           | **Exceeds**               |
| AI data privacy and model handling         | Microsoft/Google/Notion/Slack/Atlassian/monday all emphasize no training on customer prompts by default + enterprise controls | Governance architecture is strong; runtime credential prompting and fail-closed behavior are present; full live tenant validation still pending | **Aligned (conditional)** |
| Security and compliance posture            | Vendors expose SOC2/ISO controls and admin security features                                                                  | Internal controls are strong (audit/event/policy), but external-service proof on real tenant flows is not complete                              | **Aligned (conditional)** |
| Reliability and observability              | Mature platforms provide production observability and resilience                                                              | Self-healing, drift checks, circuit breakers, canaries exist; live-Graph production confidence is blocked on credentials                        | **Partial**               |
| Production external integration validation | Leading apps are battle-tested in live enterprise tenants                                                                     | M365 integration implemented but still blocked from end-to-end live validation                                                                  | **Not yet certified**     |
| Documentation and governance clarity       | Varies across market                                                                                                          | TED remains best-in-class internally (SDD depth + explicit control-plane contracts)                                                             | **Exceeds**               |
| Multi-channel/operator surface             | Leading apps span desktop/web/mobile/chat                                                                                     | OpenClaw channel breadth is strong; TED-specific adoption surfaces still have roadmap/doc drift                                                 | **Aligned (conditional)** |
| Feature completeness vs stated roadmap     | Leading apps generally maintain product/status coherence                                                                      | SDD 83 confirms roadmap drift (implemented features still marked TODO, and some backlog mismatch)                                               | **Partial**               |

---

## 4. Certification Verdict

### 4.1 Certification Decision

**Conditional Certification: PASS with blocking conditions.**

As of **2026-02-26**, the council certifies that TED is:

1. **Architecturally aligned or better** than leading co-work apps on governance, auditability, and human-control boundaries.
2. **Functionally competitive but incomplete** on cross-app retrieval breadth and operator-grade no-code automation UX.
3. **Not fully production-certified** until P0-2/P0-4 live Azure/Graph validation is completed with operator credentials.

### 4.2 Blocking Conditions (must close for full certification)

1. Real Azure tenant/client IDs and device auth completion for at least one production profile.
2. P0-4 live Graph smoke evidence (read + gated write paths) captured and archived.
3. Morning brief demo generated from real tenant data (NEW-3 closure).

---

## 5. Value Left on the Table (High-ROI Opportunities)

### V-1: Cross-source retrieval layer (high value)

Add governed read-only connectors and unified retrieval for priority external tools (Slack/Jira/Google Drive) through existing sidecar policy and ledger pipeline.

### V-2: Operator automation composer (high value)

Expose a policy-safe, no-code automation authoring surface (built on existing scheduler + builder lane controls) to match market expectations from Asana/ClickUp/monday while preserving fail-closed governance.

### V-3: Trust-center operator surface (medium-high value)

Add one TED console page that shows:

1. Data-use policy status
2. Active provider/model routing
3. Permission scope inventory
4. Last proof/smoke run status

This closes transparency parity with enterprise trust pages and reduces operator uncertainty.

### V-4: Roadmap-state normalization (medium value)

Reconcile roadmap/job-card status with actual implemented code to prevent false negatives in future council audits and to keep execution priority clear.

---

## 6. Execution Plan (Post-Certification Closure)

### Wave C0 (Immediate: 1-2 days)

1. Complete P0-2 runtime credential capture + device auth (operator action required).
2. Execute P0-4 smoke runner and archive evidence bundle.
3. Run real-data morning brief demo and record artifacts.

**Exit criteria:** Blockers in SDD 81/83 move from BLOCKED to PASS/READY.

### Wave C1 (Near-term: 1 sprint)

1. Implement V-1 (cross-source retrieval adapter, read-only first).
2. Deliver V-3 trust-center card in TED operator UI.
3. Normalize roadmap/docs state drift identified in SDD 83.

**Exit criteria:** competitive retrieval parity improves and operator trust signals are visible in-product.

### Wave C2 (Next sprint)

1. Implement V-2 no-code automation composer with policy simulation checks.
2. Add regression proofs and CI guardrails for new automation paths.

**Exit criteria:** TED reaches functional parity on operator automation ergonomics while retaining stronger governance than peer tools.

---

## 7. Best-Practice Conformance Summary

Against NIST AI RMF and OWASP LLM Top 10 guidance, TED already demonstrates strong patterns in:

1. Policy-gated tool execution
2. Approval boundaries for write operations
3. Audit/event traceability
4. Defense-in-depth model routing constraints

Primary remaining conformance risk is **operational validation depth**, not architectural intent.

---

## 8. Source Links (External Benchmark)

1. Microsoft 365 Copilot page: https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-page
2. Microsoft 365 Copilot privacy/protections: https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-privacy
3. Google Workspace with Gemini overview: https://workspace.google.com/products/gemini/
4. Google Workspace Gemini data handling/privacy: https://support.google.com/a/answer/13992863
5. Notion AI product: https://www.notion.com/product/ai
6. Notion AI security practices: https://www.notion.com/help/notion-ai-security-practices
7. Slack AI features: https://slack.com/features/ai
8. Slack enterprise data management controls: https://slack.com/help/articles/203457187-Customize-data-management-in-Enterprise-Grid
9. Atlassian Rovo features: https://www.atlassian.com/software/rovo/features
10. Atlassian AI trust/privacy commitments: https://www.atlassian.com/trust/atlassian-intelligence
11. Asana AI Studio: https://asana.com/product/ai/asana-ai-studio
12. Asana AI Teammates: https://asana.com/product/ai/teammates
13. Asana trust center: https://asana.com/trust
14. ClickUp AI (Brain/Autopilot): https://clickup.com/features/ai
15. ClickUp trust center: https://trust.clickup.com/
16. monday.com AI overview: https://monday.com/ai
17. monday.com AI governance/privacy FAQ: https://support.monday.com/hc/en-us/articles/18445748790290-Monday-AI-FAQs
18. NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework
19. OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
