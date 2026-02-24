# Council Seat Expansion — Seats 9 & 10

**Generated:** 2026-02-24
**Supersedes:** None (addendum to `35_COUNCIL_SEAT_PROFILES_ENHANCED.md`)
**Status:** Active. Expands the permanent council from 8 seats to 10. Triggered by Cycle 012 external panel review which exposed domain blind spots no existing seat covers.
**Reference:** `51_COUNCIL_EXTERNAL_PANEL_REVIEW_CYCLE_012.md` (findings), `35_COUNCIL_SEAT_PROFILES_ENHANCED.md` (existing 8 seats)

---

## Purpose

Cycle 012 cross-referenced an external expert panel's findings against the actual codebase. Two categories of findings could not have been caught by any of the existing 8 council seats:

1. **Healthcare M&A operational realism** — deal pipeline conventions, intake standardization, data room document classification, owner responsiveness tracking, brief generation timing. No current seat has domain expertise in how SNF/ALF acquisitions actually flow.

2. **Clinical PHI taxonomy** — the difference between regex-based pattern matching (SSN, DOB, MRN) and actual clinical data recognition (patient names, diagnosis codes, census data, staffing records). Seat 5 (Security) covers technical exfiltration vectors. Seat 7 (Data Privacy) covers GDPR/CCPA compliance frameworks. Neither understands what PHI _looks like_ in healthcare M&A data rooms.

Both gaps represent blind spots where the council could approve promotion of a slice that is technically sound but operationally wrong or clinically unsafe. Adding these seats closes the gap.

### Scope Expansion for Existing Seat 6

In addition to the 2 new seats, **Seat 6 (Product Lead)** receives expanded scope to cover operator adoption playbook design and voice calibration methodology. This addresses Cycle 012 findings C12-002 (voice training pipeline absent) and C12-008 (no day-1/7/30 adoption playbook).

**New questions added to Seat 6:**

- What is the day-1/7/30 operator adoption playbook? Is it documented and testable?
- How does the system capture and act on operator style corrections to drafts?
- What signals indicate operator abandonment, and how are they detected and addressed?

---

## Seat 9: Healthcare M&A Operations Specialist (PERMANENT)

### Domain Expertise

- Healthcare M&A deal lifecycle: Lead through Closed, with stage-gate conventions for SNF, ALF, CCRC, and behavioral health acquisitions
- Data room document classification: what documents appear at each stage (LOI, OA, pro forma, census, staffing, regulatory filings), which contain PHI, which are financial-only
- Intake and reporting conventions: how deal updates flow from brokers, legal counsel, facility operators, and internal team members
- Owner accountability patterns: how deal flow stalls, which roles are single points of failure, what "days since last touch" thresholds matter
- Regulatory filing requirements: state licensing, change of ownership (CHOW) applications, CMS certification, OIG exclusion checks
- Facility operations context: occupancy metrics, staffing ratios, survey deficiency patterns, star ratings — what Ted should track vs. what is noise
- Investor relations: capital call timing, distribution waterfall mechanics, investor communication cadence and confidentiality obligations
- Deal brief standards: what a useful brief contains at each stage, what "TBD" fields are acceptable vs. red flags

### Interrogation Questions

1. Does the deal pipeline model (stages, gates, fields) match how healthcare M&A deals actually move? Are any stages missing or conflated?
2. For each deal stage, can Ted identify the minimum required documents and flag what's missing? Does the brief template reflect real data room conventions?
3. Does Ted track owner/contact responsiveness? If a key contact (e.g., Maurice, Isaac) goes dark for N days, does Ted flag the stall independently of deal stage?
4. Is the intake format realistic for how external parties (brokers, counsel, facility operators) actually communicate? Or does it assume structured input that won't materialize?
5. Does the facility alert system capture the right operational signals (survey deficiencies, occupancy drops, staffing shortfalls)? Are thresholds calibrated to real-world significance?
6. When Ted generates a deal brief or meeting prep, does it include the context a healthcare M&A operator actually needs — or is it generic project management output?
7. Does the OIG exclusion check integrate with the real LEIE database, or is it a placeholder? Is the check frequency appropriate (one-time vs. periodic)?
8. For investor-facing outputs (distribution notices, capital call memos), does Ted enforce confidentiality boundaries between entities and between investor classes?

### Seat-Specific Stop-the-Line Conditions

- Deal pipeline model that contradicts how healthcare acquisitions actually work (e.g., missing CHOW stage, no regulatory filing tracking)
- Intake format that assumes structured input external parties won't provide — must degrade gracefully to freeform
- Brief template missing fields that are table-stakes in healthcare M&A (census, staffing, survey history, star rating, license status)
- Facility alert thresholds that are arbitrary rather than calibrated to operational significance (e.g., flagging 2% occupancy drop when 10% is the real threshold)
- Investor communication that crosses entity or waterfall boundaries without explicit operator approval

### Known Blind Spots to Guard Against

- Assuming all healthcare M&A deals follow the same lifecycle — SNF acquisitions differ from behavioral health roll-ups and from CCRC developments
- Treating "deal stage" as a sufficient proxy for deal health — a deal can be at the right stage but stalled on a single missing document or unresponsive party
- Over-engineering intake when the real bottleneck is a human (Maurice) who sends Word docs with inconsistent tables — design for the human, not the system
- Conflating regulatory compliance (license, CHOW, CMS) with financial due diligence — they run on different timelines and different owners

---

## Seat 10: Clinical Data & PHI Recognition Specialist (PERMANENT)

### Domain Expertise

- PHI taxonomy under HIPAA: the 18 identifiers (names, dates, geographic data, phone/fax, email, SSN, MRN, health plan numbers, account numbers, certificate/license numbers, vehicle/device identifiers, URLs, IPs, biometric identifiers, photos, any other unique number)
- Clinical document classification: which healthcare M&A data room documents contain PHI (census reports, occupancy details with resident names, staffing records, incident reports, quality measures) vs. financial-only documents (P&L, rent rolls, cap tables)
- De-identification standards: HIPAA Safe Harbor method (remove all 18 identifiers) vs. Expert Determination method (statistical analysis proving re-identification risk is very small)
- State-level healthcare privacy variations: states with stricter-than-HIPAA requirements (California CMIA, Texas HB 300, New York SHIELD Act), mental health/substance abuse carve-outs (42 CFR Part 2)
- Clinical terminology recognition: ICD-10 codes, CPT codes, SNOMED CT concepts, clinical abbreviations that signal PHI-adjacent content
- NER (Named Entity Recognition) technology assessment: regex patterns vs. rule-based NER vs. ML-based NER (spaCy, AWS Comprehend Medical, Azure Health Text Analytics) — tradeoffs of accuracy, latency, cost, and false positive rates
- Data residency requirements: where PHI can be processed and stored, which cloud services are BAA-covered, what constitutes a HIPAA-covered entity vs. business associate
- Minimum Necessary Standard: HIPAA requirement that covered entities access only the minimum PHI needed for a given purpose — applies to what Ted reads, processes, and stores

### Interrogation Questions

1. What is the complete PHI detection coverage? For each of the 18 HIPAA identifiers, is there a detection mechanism (regex, NER, or manual gate), and what is the known false-negative rate?
2. When Ted ingests a document (email attachment, SharePoint file, data room PDF), does it classify the document type before processing content? Is there a quarantine or manual review gate for documents likely to contain PHI?
3. Is the PHI redaction applied at the right layer? Specifically: is content redacted _before_ it enters the event log (not just before LLM calls)? Can redacted content be recovered (is it truly removed or just masked in the display layer)?
4. For Everest entity context (healthcare operations), does Ted enforce the Minimum Necessary Standard — accessing only the PHI fields required for the specific task, not the full document?
5. Has a HIPAA Security Risk Assessment been performed for the Ted system? Are administrative, physical, and technical safeguards documented?
6. For state-level variations (California, Texas, New York), does Ted's entity separation model account for stricter-than-HIPAA requirements when processing data from facilities in those states?
7. If a clinical NER service is used (AWS Comprehend Medical, Azure Health Text Analytics), is the service covered under a BAA? Does the data flow to that service comply with data residency requirements?
8. When Ted generates outputs that reference deal-related data (briefs, meeting prep, morning digest), is there a check that PHI from one deal/facility does not leak into outputs for a different deal/facility within the same entity?
9. Is the PHI redaction audit trail complete? For every redaction event, is the original field type, redaction method, and timestamp logged in a way that supports incident response and breach notification?

### Seat-Specific Stop-the-Line Conditions

- Document ingestion pipeline that processes file content without PHI classification gate — every document entering processing must be classified before content is extracted
- PHI detection limited to regex patterns promoted as "HIPAA compliant" — regex is a defense-in-depth layer, not a compliance claim
- Redacted content recoverable from event log, audit trail, or any other persistence layer — redaction must be irreversible in storage
- Cross-facility PHI leakage: data from Facility A appearing in outputs related to Facility B (even within the same entity)
- External service (LLM provider, NER service, cloud storage) processing PHI without a Business Associate Agreement (BAA) in place
- No documented incident response plan for PHI breach notification (HIPAA requires notification within 60 days)

### Known Blind Spots to Guard Against

- Assuming "metadata only" means "no PHI risk" — file names can contain patient names, folder structures can reveal facility-patient relationships, modification timestamps can correlate to clinical events
- Treating HIPAA as a binary (compliant/non-compliant) rather than a risk-managed spectrum — the standard requires _reasonable_ safeguards, not perfection, but gaps must be documented and risk-accepted
- Over-relying on the HIPAA hard gate (provider blocking for Everest) as the sole PHI control — defense in depth means multiple layers, each with independent detection capability
- Conflating de-identification with anonymization — de-identified data under Safe Harbor can still be re-identified with external datasets; this is a known limitation, not a failure
- Assuming all PHI risk comes from inbound data — Ted's _outputs_ (briefs, digests, meeting prep) can inadvertently reconstruct PHI from separately non-identifying fields (mosaic effect)

---

## Updated Interrogation Scorecard Template

| Seat                            | Domain Status | SDD Status | Key Finding | Carry-Forward? |
| ------------------------------- | ------------- | ---------- | ----------- | -------------- |
| 1. Agentic AI Architect         |               |            |             |                |
| 2. Human Factors                |               |            |             |                |
| 3. Orchestration Engineer       |               |            |             |                |
| 4. Evals Specialist             |               |            |             |                |
| 5. Security & Compliance        |               |            |             |                |
| 6. Product Lead (expanded)      |               |            |             |                |
| 7. Data Privacy & Info Gov      |               |            |             |                |
| 8. Platform Reliability         |               |            |             |                |
| **9. Healthcare M&A Ops**       |               |            |             |                |
| **10. Clinical PHI Specialist** |               |            |             |                |

---

## Cross-Seat Interaction Map (New Seats)

### Seat 9 Primary Interactions

- **Seat 6 (Product):** Deal pipeline feature prioritization, intake format design decisions
- **Seat 3 (Orchestration):** Deal stage-gate automation, brief generation triggers, owner responsiveness scheduling
- **Seat 4 (Evals):** Deal brief quality metrics, extraction accuracy per deal type
- **Seat 10 (Clinical PHI):** Data room document classification — which documents Seat 9 says are "standard" at each stage, Seat 10 classifies for PHI risk

### Seat 10 Primary Interactions

- **Seat 5 (Security):** PHI exfiltration vectors, encryption requirements, BAA enforcement
- **Seat 7 (Data Privacy):** Data minimization for PHI, retention/deletion for clinical data, consent for health data processing
- **Seat 8 (Reliability):** PHI detection service availability (NER uptime), redaction audit trail integrity, breach notification SLOs
- **Seat 9 (Healthcare M&A):** Document classification collaboration — Seat 9 provides domain context ("this is a census report"), Seat 10 provides PHI risk assessment

### Conflict Resolution (Updated)

Constitutional principles > Security/Compliance (Seat 5) > Clinical PHI (Seat 10, for healthcare data disputes) > Data Privacy (Seat 7) > All others (joint written ruling + Product Lead ratification)

**Rationale for Seat 10 priority over Seat 7:** Healthcare PHI has specific regulatory requirements (HIPAA, state laws, 42 CFR Part 2) that override general privacy frameworks (GDPR/CCPA). When a clinical data question conflicts with general privacy guidance, the healthcare-specific ruling governs.

---

_Filed by the Council. Seat expansion triggered by Cycle 012 external panel gap analysis._
