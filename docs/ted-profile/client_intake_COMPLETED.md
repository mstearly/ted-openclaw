---
sdd:
  type: CoWorkIntakeResponse
  schema_version: "1.0"
  record_id: "clint-olumie-everest-2026-02-20"
  status: in_review
  created_at: "2026-02-20"
  created_by: "Clint"
  client:
    name: "Clint"
    organization: "Olumie Capital, LLC / Everest Management Solutions, LLC"
    primary_email: "CPhillips@Everestmgt.com / CPhillips@olumiecapital.com"
    timezone: "America/Indiana/Indianapolis"
  contexts:
    list:
      - Olumie
      - Everest
      - Prestige
      - Personal
    default_context: "Olumie"
  confidentiality:
    contains_phi: true
    contains_privileged: true
    notes: |
      Everest facilities contain PHI — auto-redact resident names, room numbers,
      medical conditions, DOB, SSN, medical record numbers.
      Attorney-client privilege applies across all entities.
      Olumie approved list: Maurice, Samantha, Isaac.
      Everest approved list: TBD.
      Prestige approved list: TBD.
  intake_method:
    questionnaire_completed: true
    read_only_scan_completed: false
    scan_sources:
      - "M365:Outlook"
      - "M365:Calendar"
      - "M365:OneDrive"
  approvals:
    default_mode: draft_only
    approver_names:
      - "Clint"
    emergency_pause_contact: "205-913-0550"
---

# Client Intake Questionnaire — COMPLETED

## Ted on OpenClaw / Co-Work Setup

**Completed:** 2026-02-20  
**Completed by:** Clint (with Claude, session 2026-02-20)

---

## 0) Intake metadata

- **Intake date:** 2026-02-20
- **Primary context:** Olumie
- **All contexts:** Olumie, Everest, Prestige, Personal
- **Approval posture:** draft_only (all outputs are drafts; Clint approves before execution)

---

## 1) Weekly outcomes (Core Q1)

**Top 3 outcomes Clint wants weekly:**

- Outcome 1: **Save time** — measurably fewer hours spent on routine cognitive work (email, filing, tracking, monitoring)
  - Metric: Hours/week on routine work decreasing over first 90 days. Target: recover 15-25 hrs/week.

- Outcome 2: **Miss fewer commitments** — zero dropped deadlines, follow-ups, and promises across all entities and deals
  - Metric: Zero missed deadlines logged per week. Zero unanswered commitments older than 48 hours.

- Outcome 3: **Turn out work faster and make better decisions** — drafts, deals, and decisions produced quicker; right information surfaced at the right time without Clint going looking for it
  - Metric: Time from deal event (data room access, NDA signed, PSA draft received) to organized response. Qualitative: Clint feels informed without checking manually.

**Additional stated outcomes (priority 4-7):**

- Monitor what Clint doesn't have time to watch (Everest 54 facilities, investments, deal pipeline)
- Expand grasp and production — do more than is currently possible with available time
- Improve calendar quality — protect time for actual work and personal health
- Work-life balance — secondary benefit, flows from the above

---

## 2) Pain points / cognitive load (Core Q2)

**Top 3 pain points:**

- Pain point 1: **Context switching** — switching between Olumie, Everest, Prestige, and Personal contexts approximately every 30 minutes throughout the day. Mental RAM constantly being wiped and reloaded. No single place that holds context across entities.

- Pain point 2: **Deal operations (Olumie)** — multiple structural gaps in the current deal workflow:
  - After NDA signed: data room access given but no systematic process to pull, organize, and file data room contents
  - No DD report templates built yet — working from scratch on each deal
  - No systematic view of what a deal really is: risks, mitigation strategies, financial picture
  - Important deal dates not tracked systematically
  - Outside counsel spend not monitored; quality not tracked
  - PSA progress not actively tracked
  - Team task assignments (Clint + Isaac) not centralized
  - No single source of truth for deal workload shared between Clint and Isaac
  - 10+ deals active simultaneously across 3 deal types (SNF/ALF PropCo/OpCo, software companies, ancillary healthcare)
  - All deals subject to multi-investor structure requiring OIG + state exclusion list checks, investor disclosure forms, and org chart maintenance

- Pain point 3: **Zero Everest visibility** — no current means of monitoring 54 facilities, Everest team workloads, or operational processes. Flying blind.

**Additional pain point: Calendar quality**

- Calendar packed with back-to-back calls; no protected time for actual work or personal health
- No systematic capture of what came out of each call — deliverables, action items, ownership
- No mechanism for Ted to tell Clint what it can handle vs. what requires Clint personally

**Load types:**

- [x] context switching
- [x] remembering commitments
- [x] decision framing
- [x] repetitive admin
- [x] uncertainty / "what should I do next?"

---

## 3) Non-negotiable boundaries (Core Q3)

**Never without approval:**

- Send any external email (no exceptions until 90%+ approval rate proven over 3-6 months)
- Send meeting invites to external attendees
- Execute any financial transaction, trade, or payment
- File, move, or delete documents (Day-1: suggestions + approval only; no apply/move)
- Forward attorney-client privileged communications outside approved lists
- Contact any invoice marked as Disputed (three statuses only: Active, Paid, Disputed)
- Send the nightly Isaac report without Clint review
- Any action involving a new recipient not already on the email thread

**Never do (even with approval):**

- Execute investment trades of any kind — analysis and alerts only; Clint places all orders manually
- Access personal email or personal calendar directly
- Mix entity data across Olumie, Everest, Prestige, or Personal boundaries
- Share Prestige vendor pricing with Everest or Olumie personnel
- Produce output containing un-redacted PHI for non-HIPAA-cleared recipients

---

## 4) Daily brief preferences (Core Q4)

**Format:** Decision-ready — options + next actions + sources. Two separate briefs:

- Personal Brief: 7:00am ET
- Work Brief: 7:30am ET
- Briefs must never mix personal and work data

**Must always include (Work Brief):**

- [x] Deadlines due in next 7 days (all entities)
- [x] Meetings today + prep notes
- [x] Inbox items needing reply
- [x] Follow-ups Clint owes
- [x] Risks / anomalies (Everest facility alerts, deal flags, investment thesis breaks)
- [x] Draft queue count (how many drafts are waiting for review)
- [x] Post-call deliverable summary (what came out of yesterday's calls; what Ted owns vs. what Clint owns)
- [x] Deal status snapshot (top 3-5 active deals: status + next action + owner)

**Must always include (Personal Brief):**

- [x] Health and fitness (workout plan for the day, sleep debt if applicable)
- [x] Personal calendar holds and family items
- [x] Travel prep if trip within 48 hours

---

## 5) Urgency rules (Core Q5)

**Urgency definition:**

- Any deadline within 48 hours on any active deal or Everest compliance matter
- Any Everest facility entering CRISIS level (3+ metrics off 20%+) — immediate text alert
- Any stop loss breach on investment holdings — immediate alert (Ted monitors 24/7; Clint executes manually)
- Any email from Isaac requiring a response
- Any outside counsel communication flagged as time-sensitive
- Any OIG or state exclusion list hit on an active investor

**Urgency signals:**

- [x] Deadline within 48 hours
- [x] Email from VIP list (Isaac, outside counsel, facility administrators, deal counterparties at LOI/PSA stage)
- [x] Client/partner escalation keywords (crisis, urgent, immediately, deadline, default, breach)
- [x] Financial threshold (deal deposits, closing dates, invoice disputes above $10K)
- [x] Health/safety keyword set (Everest facility: fall, incident, survey, citation, deficiency, DOH)
- [x] Meeting within 24h and no prep materials

---

## 6) Contexts / entities and separation (Core Q6)

**Entity definitions and separation rules:**

- **Olumie Capital, LLC**
  - Scope: All acquisition targets, deal docs, capital partner communications, investment analysis, deal team coordination, investor management
  - Must never mix with: Everest, Prestige, Personal
  - Special rules: Multi-investor deals require OIG + state exclusion list checks on all investors; investor disclosure forms; org chart maintenance per deal

- **Everest Management Solutions, LLC**
  - Scope: All 54 facility operations, management contracts, staffing, vendor relationships, compliance, COO workload, owner communications
  - Must never mix with: Olumie, Prestige, Personal
  - Special rules: HIPAA required — auto-redact PHI. Facility admins are HIPAA-cleared; facility owners are NOT. COO communications routed through Clint first.

- **Prestige**
  - Scope: TBD — Clint to define full scope
  - Must never mix with: Olumie, Everest, Personal
  - Special rules: Vendor pricing is entity-confidential — for Clint only; never accessible to Everest or Olumie personnel

- **Personal**
  - Scope: Personal calendar items (placed on work calendar as source of truth), family coordination with Katie, health and fitness, finances, travel
  - Must never mix with: Any business entity
  - Special rules:
    - Ted has NO access to personal email
    - Work calendar is the single source of truth — personal items are placed on work calendar
    - When Katie needs something on her calendar: Clint creates work calendar event and includes Katie's personal email as invitee; she accepts to her calendar
    - Ted never directly accesses or modifies Katie's calendar

**Default classification rule:**

- Sender domain @olumiecapital.com or deal-related → Olumie
- Sender domain @everestmgmt.com or facility-related → Everest
- Prestige keyword in subject or sender → Prestige
- All else → surface for Clint classification in daily brief triage queue

---

## 7) Error tolerance (Core Q7)

**Tradeoff:** Prefer fewer misses (OK to see more false alarms)

**Notes:** In deal operations and Everest monitoring, a missed deadline or missed facility crisis is far more costly than a false alarm. Err on the side of surfacing more. Clint will manage the noise. Quality of coverage matters more than clean inbox.

---

## 8) Low confidence behavior (Core Q8)

**When confidence is low:**

- Primary: Create a draft + flag uncertainty with confidence score and source
- Secondary: Put it in the daily brief as "needs review" with the specific question
- Do NOT ask clarifying questions in real time during off-hours — batch them into the daily brief

**Notes:** Clint reviews the brief every morning. Low-confidence items should be surfaced there, not as interruptions throughout the day. Exception: CRISIS-level facility alerts and stop loss breaches are always immediate regardless of confidence.

---

## 9) Draft tone and style (Core Q9)

**Preferred tone:**

- Business communications: Direct, concise, professional. No fluff. Lead with the answer or the ask.
- Isaac nightly report: Matter-of-fact. State what was done, what's in progress, what's next, who owns each next step. Clint is the operator reporting to the owner — confident and organized.
- Everest owner communications: Professional, measured, solution-oriented
- Deal counterparty communications: Professional, precise — always Tier 3, Clint approves

**Signature conventions:**

- Business: — Clint
- (Generated as a draft for review; not sent) — include this note on all drafts per governance

**Words/phrases to avoid:**

- Filler: "I hope this finds you well", "Please don't hesitate", "As per my previous email"
- Hedging: "It seems like", "I think maybe", "You might want to consider"

**Voice samples:** Matt to extract from Clint's sent email archive (1,000+ sent emails via Graph API export) — this is the primary training source

---

## 10) Escalation triggers (Core Q10)

**Always escalate immediately (text alert) when:**

- Everest facility enters CRISIS level (3+ metrics off 20%+)
- Stop loss breach on any investment holding
- OIG or state exclusion list hit on any investor
- Outside counsel flags a material legal issue on any active deal
- Any Everest facility receives an unannounced survey notification
- Isaac sends a message marked urgent or requiring same-day response

**Escalate to:** Clint directly

**Method:**

- [x] SMS / text alert (immediate escalation)
- [x] Telegram (operational channel — Day-1)
- [ ] iMessage (Phase 2)
- [x] Daily brief (non-urgent surface)

---

# Optional Sections

## A) Systems inventory

**In scope now:**

- [x] Microsoft 365 — Outlook (email), Calendar (work calendar = source of truth), OneDrive, SharePoint
- [x] Monday.com (deal and project tracking)
- [x] DocuSign (signature tracking — DocuSign only, not Adobe Sign)
- [x] Zoom (meeting capture — auto-join)
- [x] Microsoft Teams (meeting capture — auto-join)
- [x] PACER (legal/court record research)
- [x] CMS database (facility research at LOI phase)
- [ ] Phone calls — best effort only; no auto-join; manual transcript upload if capture needed

**Off-limits:**

- Personal email (never — LOCK-04)
- Personal calendar (never — work calendar is source of truth)
- Investment brokerage accounts (read data for monitoring only; never execute trades)

---

## B) Autonomy ladder

| Action category                  | Draft-only | Execute w/ approval | Autonomous | Notes                                                    |
| -------------------------------- | :--------: | :-----------------: | :--------: | -------------------------------------------------------- |
| Send external emails             |    [x]     |         [ ]         |    [ ]     | No exceptions until 90%+ approval rate proven 3-6 months |
| Schedule meetings (external)     |    [x]     |         [ ]         |    [ ]     | Always Tier 3                                            |
| Create internal tasks            |    [ ]     |         [ ]         |    [x]     | Above 80% confidence threshold                           |
| File / move documents            |    [x]     |         [ ]         |    [ ]     | Day-1: suggestions + approval only                       |
| Create calendar holds (personal) |    [ ]     |         [ ]         |    [x]     | Work calendar personal holds only; no external attendees |
| Create calendar holds (external) |    [x]     |         [ ]         |    [ ]     | Propose → Certify → Apply                                |
| Payments / trades / contracts    |    [x]     |         [ ]         |    [ ]     | Analysis only for investments; never execute             |
| Everest facility alerts          |    [ ]     |         [ ]         |    [x]     | Alert generation is autonomous; response requires Clint  |
| Isaac nightly report             |    [x]     |         [ ]         |    [ ]     | Clint approves before every send                         |
| Collections (non-disputed)       |    [x]     |         [ ]         |    [ ]     | Draft reminders; Clint approves                          |
| Collections (disputed)           |    [ ]     |         [ ]         |    [ ]     | BLOCKED — never contact disputed invoices                |

---

## C) Deal operations — detailed configuration

**Deal types (all subject to multi-investor structure):**

1. **SNF/ALF PropCo/OpCo acquisitions**
   - Separate diligence tracks for property company and operating company
   - SNF financial framework: pending Bob Norcross consultation before templates finalized
   - Regulatory: CMS research at LOI, CHOW monitoring, state licensing
   - Template status: to be built — shell structure ready, financial sections pending Bob Norcross

2. **Software company acquisitions**
   - Different DD framework — no SNF financials, different risk profile
   - Template status: to be built

3. **Ancillary healthcare company acquisitions**
   - Different regulatory footprint, different valuation approach
   - Template status: to be built

**Standard deal workflow (all types):**

| Stage                   | Trigger             | Ted's Role                                                                      |
| ----------------------- | ------------------- | ------------------------------------------------------------------------------- |
| Deal identified         | New deal intake     | Create deal folder, load DD checklist, create deal ledger entry                 |
| NDA signed              | NDA executed        | Alert Clint; prepare data room access tracking                                  |
| Data room access        | Access granted      | Pull data room contents, organize into filing system by category                |
| DD active               | Data room organized | Track DD checklist completion; draft information requests                       |
| Important dates         | Dates identified    | Extract and track: deposit deadlines, DD periods, closing date, PSA milestones  |
| Outside counsel engaged | Engagement letter   | Track counsel name, matter, invoices (via email), spend vs. budget              |
| PSA in progress         | PSA draft received  | Contract Review module flags all material changes; track PSA milestone progress |
| Team tasks              | Throughout          | Track who on team owns what; surface in deal ledger                             |
| Deal status             | Daily               | Include in Isaac nightly report and Clint daily brief                           |
| Investor onboarding     | Investor identified | Run OIG exclusion check, state exclusion check, generate disclosure form        |
| Close                   | Closing             | Archive deal folder, final deal summary                                         |

**Multi-investor compliance (all deals):**

- OIG National Exclusion List: check at onboarding + monthly re-check
- State exclusion lists: check at onboarding + monthly re-check per operating state
- Any hit: immediate alert to Clint — never proceed without explicit Clint review
- Audit trail: document that checks were run, date run, result
- Investor disclosure forms: generate from template per deal
- Investor org charts: maintain per deal

**Outside counsel monitoring:**

- Source: invoices arrive via email → Ted pulls via Graph API
- Track: matter, amount, date, cumulative spend per deal, cumulative spend per firm
- Alert: if monthly spend on any matter exceeds threshold (Clint to define threshold)
- Quality tracking: Clint to define quality metrics (to be configured)

**Post-call deliverable capture:**

- After every Zoom/Teams call: Ted produces deliverable list
- Deliverables split into two buckets: Ted-owned vs. Clint-owned
- Clint-owned items surfaced in next morning's daily brief
- Ted-owned items auto-added to Ted's task queue

---

## D) Isaac nightly report — configuration

**Format:** Matter-of-fact executive summary. Clint is reporting to owner.

**Required sections:**

1. What got done today (completed items with deal/entity reference)
2. What's in progress (active items, current status, estimated completion)
3. Deal status snapshot (each active deal: stage, last development, next milestone)
4. Next steps and ownership (clear list: item → owner → target date)
5. Flags / items needing Isaac's awareness or decision

**Tone:** Confident, organized, complete. No hedging. No fluff.

**Delivery:** Draft generated nightly → Clint reviews → Clint approves → sends to Isaac

**Frequency:** Nightly (suggest: draft ready by 5:30pm ET for Clint review before end of day)

---

## E) Everest visibility — configuration

**Current state:** Zero visibility. No monitoring of facilities, workloads, or processes.

**Required surfaces:**

- Facility Health Score per facility (Census 25%, Deficiencies 25%, Financial 25%, Staffing 15%, Vendors 10%)
- Alert levels: FYI (1 metric off 5-10%), WARNING (2+ off 10-15%), CRISIS (3+ off 20%+)
- COO workload: Ted drafts morning TOP 5 (MUST ACT / SHOULD REVIEW / FYI) → Clint reviews → sends to COO
- Friday executive call agenda: auto-generated
- Compliance calendar: survey windows, CAP deadlines, regulatory filings

**Data source question for Matt:** Where does Everest facility data currently live? (Monday.com? EHR? Manual reports?) — Clint to identify one test facility for SDD schema validation.

---

## F) Success criteria and pause conditions

**Success — first 2 weeks:**

- Clint reads the daily brief every morning and finds it useful
- Email draft queue has drafts waiting — approval rate above 75%
- At least one deal has an organized data room and active deal ledger
- Zero governance violations (entity mixing, PHI exposure, unauthorized sends)
- Post-call deliverables captured from at least 3 calls

**Success — first 8 weeks:**

- Email draft approval rate at 90%+
- Isaac nightly report running — Clint approving and sending daily
- Everest daily brief active — Clint has visibility into portfolio health for first time
- Deal operations module active on at least 3 deals
- Time savings measurably felt — Clint's subjective report: "I couldn't work without this"
- Calendar has protected work time blocks that are being respected
- OIG/state exclusion checks running on all active investors

**Pause / rollback conditions:**

- Any governance violation (entity data mixing, PHI in wrong output, unauthorized send)
- Email draft approval rate below 60% for two consecutive weeks
- Isaac receives an incorrect report (factual error, wrong deal status, wrong attribution)
- Any investor proceeds without OIG/state exclusion check being documented
- Any Everest facility crisis that Ted detected but did not escalate

---

# SDD Response Object

```yaml
type: CoWorkIntakeResponse
schema_version: "1.0"
record_id: "clint-olumie-everest-2026-02-20"
created_at: "2026-02-20"
created_by: "Clint"
client:
  name: "Clint"
  organization: "Olumie Capital LLC / Everest Management Solutions LLC"
  primary_email: "CPhillips@Everestmgt.com / CPhillips@olumiecapital.com"
  timezone: "America/Indiana/Indianapolis"
contexts:
  list:
    - Olumie
    - Everest
    - Prestige
    - Personal
  default_context: "Olumie"
confidentiality:
  contains_phi: true
  contains_privileged: true
  notes: "Everest PHI auto-redact required. Privilege lists: Olumie: Maurice/Samantha/Isaac. Everest/Prestige: TBD."
intake_method:
  questionnaire_completed: true
  read_only_scan_completed: false
  scan_sources:
    - "M365:Outlook"
    - "M365:Calendar"
    - "M365:OneDrive"
approvals:
  default_mode: "draft_only"
  approver_names:
    - "Clint"
  emergency_pause_contact: "205-913-0550"
responses:
  outcomes:
    weekly_top3:
      - outcome: "Save time — fewer hours on routine cognitive work"
        metric: "Hours/week on routine work decreasing. Target: recover 15-25 hrs/week."
      - outcome: "Miss fewer commitments — zero dropped deadlines and follow-ups"
        metric: "Zero missed deadlines per week. Zero unanswered commitments older than 48 hours."
      - outcome: "Turn out work faster and make better decisions"
        metric: "Time from deal event to organized response. Qualitative: Clint feels informed without checking manually."
  pain_points:
    top3:
      - "Context switching every 30 minutes across Olumie/Everest/Prestige/Personal"
      - "Deal operations gaps: data room pull, DD templates, date tracking, outside counsel monitoring, PSA tracking, no single source of truth with Isaac"
      - "Zero Everest visibility — no monitoring of 54 facilities, workloads, or processes"
    load_types:
      - context_switching
      - remembering_commitments
      - decision_framing
      - repetitive_admin
      - uncertainty_what_to_do_next
  boundaries:
    never_without_approval:
      - "Send any external email"
      - "Send meeting invites to external attendees"
      - "File, move, or delete documents"
      - "Forward privileged communications outside approved lists"
      - "Contact any Disputed invoice"
      - "Send Isaac nightly report"
      - "Add new recipients to email threads"
    never_do:
      - "Execute investment trades of any kind"
      - "Access personal email or personal calendar directly"
      - "Mix entity data across Olumie/Everest/Prestige/Personal"
      - "Share Prestige vendor pricing with any other entity"
      - "Produce un-redacted PHI for non-HIPAA-cleared recipients"
  daily_brief:
    format: "decision_ready"
    delivery_times:
      personal: "7:00am ET"
      work: "7:30am ET"
    must_include:
      - deadlines_next_7_days
      - meetings_today_with_prep
      - inbox_items_needing_reply
      - follow_ups_clint_owes
      - risks_and_anomalies
      - draft_queue_count
      - post_call_deliverables
      - deal_status_snapshot
  urgency:
    definition:
      - "Any deadline within 48 hours on active deal or Everest compliance matter"
      - "Everest facility entering CRISIS level"
      - "Stop loss breach on any holding"
      - "OIG or state exclusion list hit on any investor"
      - "Isaac communication requiring same-day response"
    signals:
      - deadline_within_48h
      - email_from_vip_list
      - escalation_keywords
      - financial_threshold
      - health_safety_keyword_set
      - meeting_within_24h_no_prep
  contexts:
    entity_separation:
      - entity: Olumie
        never_mix_with: [Everest, Prestige, Personal]
        special: "Multi-investor OIG/state exclusion checks required on all investors"
      - entity: Everest
        never_mix_with: [Olumie, Prestige, Personal]
        special: "HIPAA required. Facility admins HIPAA-cleared; owners are NOT."
      - entity: Prestige
        never_mix_with: [Olumie, Everest, Personal]
        special: "Vendor pricing entity-confidential — Clint only."
      - entity: Personal
        never_mix_with: [Olumie, Everest, Prestige]
        special: "Work calendar is source of truth. Ted has NO access to personal email/calendar."
    default_classification_rule: "Olumie if deal-related; Everest if facility-related; Prestige if Prestige keyword present; else triage queue"
  quality:
    tradeoff: "prefer_fewer_misses"
    notes: "Missed deadline or missed facility crisis >> false alarm. Surface more, not less."
  low_confidence:
    behavior: "draft_and_flag"
    notes: "Batch low-confidence items into daily brief. Do not interrupt. Exception: CRISIS alerts and stop loss breaches are always immediate."
  communication:
    tone_style:
      preferred_tone: "Direct, concise, professional. Lead with the answer or the ask. No filler."
      signature_conventions: "— Clint. Add draft disclaimer on all outbound drafts."
      avoid: "Filler openers, hedging language, excessive qualifiers"
      examples: "Matt to extract from 1000+ sent emails via Graph API export"
  escalation:
    triggers:
      - "Everest facility CRISIS level"
      - "Stop loss breach"
      - "OIG or state exclusion list hit"
      - "Outside counsel flags material legal issue"
      - "Unannounced facility survey notification"
      - "Isaac urgent message"
    escalate_to: "Clint"
    method:
      - SMS
      - Telegram
  systems_inventory:
    in_scope_now:
      - "M365:Outlook"
      - "M365:Calendar (work calendar only — source of truth)"
      - "M365:OneDrive"
      - "Monday.com"
      - "DocuSign (not Adobe Sign)"
      - "Zoom (auto-join meeting capture)"
      - "Microsoft Teams (auto-join meeting capture)"
      - "PACER"
      - "CMS database"
    off_limits:
      - "Personal email (never)"
      - "Personal calendar (never — work calendar is source of truth)"
      - "Investment brokerage execution (read-only monitoring only)"
  autonomy:
    action_categories:
      - action: "Send external emails"
        mode: "draft_only"
      - action: "Schedule external meetings"
        mode: "draft_only"
      - action: "Create internal tasks (above 80% confidence)"
        mode: "autonomous"
      - action: "File/move documents"
        mode: "draft_only"
      - action: "Personal calendar holds (no external attendees)"
        mode: "autonomous"
      - action: "External calendar holds"
        mode: "propose_certify_apply"
      - action: "Investment trades"
        mode: "never — analysis only"
      - action: "Everest facility alerts"
        mode: "autonomous (alerts); response requires Clint"
      - action: "Isaac nightly report"
        mode: "draft_only"
      - action: "Collections — non-disputed"
        mode: "draft_only"
      - action: "Collections — disputed"
        mode: "blocked — never"
  success:
    first_2_weeks: "Daily brief used every morning. Email drafts at 75%+ approval. One deal with organized data room and active ledger. Zero governance violations."
    first_8_weeks: "Email approval 90%+. Isaac nightly report running daily. Everest daily brief active. Deal ops on 3+ deals. Time savings felt. Calendar has protected work time."
    pause_conditions:
      - "Any governance violation (entity mixing, PHI exposure, unauthorized send)"
      - "Email approval rate below 60% for two consecutive weeks"
      - "Isaac receives factually incorrect report"
      - "Any investor proceeds without documented OIG/state exclusion check"
      - "Everest facility crisis detected but not escalated"
```
