# SDD-44: Operator Command Center Architecture

**Council Record:** Methodology Research Verdict + Feature Architecture
**Date:** 2026-02-22
**Status:** PLAN — Council-approved, pending operator start
**Prerequisites:** Phase 1+2 complete (SDD-37), Phase 5 plan approved (SDD-43)
**Research Sources:** GTD (David Allen), Inbox Zero (Merlin Mann), Time-Blocking (Cal Newport), PARA (Tiago Forte), EA/CoS communities (CSA, EA Campus, Base HQ, Burrows), Behavior Design (BJ Fogg, James Clear, Nir Eyal)

---

## 0. Council Verdict — Methodology Fit Assessment

Six research councilors independently audited each methodology against Clint's client intake, Ted's existing architecture, and OpenClaw's plugin system. Findings below.

### APPROVED — Build as Ted Sidecar Features

| Methodology         | Approved Scope                                                                                                                    | Rejected Scope                                                                                             | Rationale                                                                                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GTD**             | Capture/clarify/organize/reflect loop, Next Actions, Waiting For, Projects-as-first-class                                         | Someday/Maybe, 2-minute rule, GTD @contexts, full weekly review                                            | Clint's problems are structural (10+ deals, 4 entities, 54 facilities). GTD's action management is core. GTD's personal productivity framing is irrelevant.                  |
| **Inbox Zero**      | 5-action email processing (already partially built), pre-classification, decision queue                                           | None rejected — already aligned                                                                            | Ted's triage + mail list + draft generation IS Inbox Zero. Enhance, don't rebuild.                                                                                           |
| **Time-Blocking**   | Calendar protection (deep work blocks), daily plan generation, deep work metrics                                                  | Full every-minute planning, rigid schedule, Pomodoro timers                                                | Clint context-switches across 4 entities every 30 min. Rigid time-blocking would collapse. But protected blocks are an explicit 8-week success criterion.                    |
| **PARA**            | Projects = deals, Areas = entities, Resources = templates, Archives = closed deals. PARA classification layer on existing filing. | Progressive summarization (nice-to-have, not core)                                                         | PARA provides the right filing taxonomy. Clint's pain is not "I can't find things" — it's "things don't get done." PARA adds organizational structure to filing suggestions. |
| **EA/CoS**          | Meeting prep packets, post-call deliverable capture, commitment tracking, context switch briefing                                 | Travel coordination (lower priority), relationship CRM (not requested), expense management (not mentioned) | Every EA/CoS community rated meeting lifecycle and commitment tracking as top-3 functions. Both are explicit pain points in Clint's intake.                                  |
| **Behavior Design** | Onboarding ramp, notification budget, progressive disclosure, feedback loops (approval rate, time saved), trust dashboard         | Gamification, streak tracking, variable rewards, habit formation features                                  | Clint is a professional operator, not someone who needs motivation nudges. But ADOPTION engineering — making the system easy to start and satisfying to use — is critical.   |

### REJECTED — Do Not Build

| Concept                                | Why                                                   | Clint's Actual Need Instead               |
| -------------------------------------- | ----------------------------------------------------- | ----------------------------------------- |
| GTD Someday/Maybe list                 | Active operational overload, not aspirational backlog | More capacity on active work              |
| Full time-blocking (plan every minute) | Inherently reactive across 4 entities                 | Protected blocks only                     |
| Gamification / streak tracking         | Professional operator running 54 facilities           | Reliable execution, zero missed deadlines |
| Variable rewards / engagement hooks    | Wants predictable, reliable output                    | Consistency and coverage                  |
| Pomodoro-style focus timers            | Context-switching is externally driven                | Entity-aware context management           |
| Personal habit formation features      | Not trying to build new habits                        | Capture, track, surface, draft            |

---

## 1. Architecture Overview

Three new capability families added to Ted Sidecar, each accessible via OpenClaw (gateway methods + agent tools for iMessage):

```
Phase 6: Operator Command Center
├── JC-077: Meeting Lifecycle (prep → debrief → commitments)
├── JC-078: Commitment Tracking (who-owes-what graph)
├── JC-079: GTD Action Management (next actions + waiting-for)
└── JC-080: Enhanced Briefs (GTD + commitments in morning/EOD)

Phase 7: Calendar Intelligence + PARA Filing
├── JC-081: Time-Block Planning (generate → approve → apply)
├── JC-082: PARA Filing Classification (enhance filing suggestions)
└── JC-083: Deep Work Metrics and Reporting

Phase 8: Adoption Engineering
├── JC-084: Notification Budget + Onboarding Ramp
├── JC-085: Trust Dashboard (approval rate, time saved, autonomy progress)
└── JC-086: Progressive Disclosure in Briefs
```

All new capabilities follow the existing patterns:

- **Sidecar:** New route families in `server.mjs`, JSONL ledgers in `artifacts/`, config in `config/`
- **Extension:** `api.registerGatewayMethod()` + `api.registerTool()` (dual registration per JC-076 pattern)
- **UI:** New operate-tab surfaces in `views/ted.ts`, state in `controllers/ted.ts`, wiring in `app-render.ts`
- **Governance:** All write operations respect `autonomy_ladder.json`, entity boundaries, hard bans

---

## 2. Phase 6: Operator Command Center

### 2.1 JC-077: Meeting Lifecycle

**The single highest-value new capability** per EA/CoS community consensus and Clint's intake.

#### Data Model

```json
// artifacts/meetings/prep.jsonl
{
  "kind": "meeting_prep",
  "event_id": "calendar-event-abc",
  "profile_id": "olumie",
  "date": "2026-02-23",
  "attendees": [
    { "name": "Isaac", "email": "isaac@olumiecapital.com", "context": "Olumie", "vip": true }
  ],
  "related_deals": ["sunrise-snf"],
  "related_emails": ["msg-id-1", "msg-id-2"],
  "last_meeting_notes": "2026-02-20: Discussed Sunrise DD timeline...",
  "open_commitments": ["commitment-001", "commitment-002"],
  "prep_packet": {
    "agenda_suggestion": "...",
    "key_decisions_needed": ["..."],
    "background_summary": "..."
  },
  "generated_at": "2026-02-23T07:00:00Z"
}

// artifacts/meetings/debrief.jsonl
{
  "kind": "meeting_debrief",
  "event_id": "calendar-event-abc",
  "profile_id": "olumie",
  "transcript_source": "manual" | "zoom" | "teams",
  "deliverables": {
    "ted_owned": [
      { "id": "del-001", "description": "Draft follow-up email to investors", "due": "2026-02-24", "status": "pending" }
    ],
    "clint_owned": [
      { "id": "del-002", "description": "Review and approve DD checklist", "due": "2026-02-25", "status": "pending" }
    ]
  },
  "commitments_extracted": ["commitment-003", "commitment-004"],
  "generated_at": "2026-02-23T11:00:00Z"
}
```

#### Sidecar Endpoints

| Method | Route                             | Purpose                                                  | Autonomy               |
| ------ | --------------------------------- | -------------------------------------------------------- | ---------------------- |
| GET    | `/meeting/upcoming?hours=24`      | List meetings with enrichment (attendees, deals, emails) | read-only              |
| POST   | `/meeting/prep/{event_id}`        | Generate prep packet for a specific meeting              | read-only (generation) |
| POST   | `/meeting/debrief`                | Process meeting outcome (transcript or summary input)    | draft_only             |
| GET    | `/meeting/prep/{event_id}/packet` | Retrieve generated prep packet                           | read-only              |

#### Auto-Trigger

- **60 minutes before each meeting:** Cron checks calendar, auto-generates prep packet if not already generated
- **Morning brief:** Includes "Today's meetings" section with prep status (packet ready / not ready)
- **Urgency rule alignment:** `meeting_no_prep` signal (24h, severity: medium) already in `urgency_rules.json`

### 2.2 JC-078: Commitment Tracking

**Addresses Clint's #2 weekly outcome:** "Zero dropped deadlines and follow-ups."

#### Data Model

```json
// artifacts/commitments/commitments.jsonl
{
  "kind": "commitment_create" | "commitment_update" | "commitment_complete",
  "id": "commitment-001",
  "who_owes": "Isaac",
  "who_to": "Clint",
  "what": "Send revised PSA markup by Friday",
  "entity": "Olumie",
  "deal_id": "sunrise-snf",
  "source_type": "email" | "meeting_debrief" | "manual",
  "source_ref": "msg-id-123",
  "due_date": "2026-02-28",
  "status": "active" | "overdue" | "completed" | "cancelled",
  "follow_up_count": 0,
  "created_at": "2026-02-22T15:00:00Z"
}
```

#### Sidecar Endpoints

| Method | Route                                           | Purpose                                              | Autonomy                     |
| ------ | ----------------------------------------------- | ---------------------------------------------------- | ---------------------------- |
| GET    | `/commitments/list?status=active&entity=Olumie` | List commitments with filters                        | read-only                    |
| POST   | `/commitments/create`                           | Create a commitment (from debrief, email, or manual) | autonomous (>80% confidence) |
| POST   | `/commitments/{id}/complete`                    | Mark complete                                        | autonomous                   |
| POST   | `/commitments/{id}/follow-up`                   | Generate follow-up draft email                       | draft_only                   |
| POST   | `/commitments/extract`                          | LLM-powered extraction from text                     | depends on JC-070b           |

#### Integration Points

- **Meeting debrief** → auto-creates commitments from extracted deliverables
- **Email triage** → commitment extraction when emails contain promises/deadlines
- **Morning brief** → "Follow-ups Clint owes" + "Overdue items from others" sections
- **EOD digest** → "Commitments completed today" + "Still overdue" sections

### 2.3 JC-079: GTD Action Management

**The connective tissue** between Ted's existing triage, deals, and filing systems.

#### Data Model

```json
// artifacts/gtd/actions.jsonl
{
  "kind": "action_create" | "action_complete" | "action_delegate",
  "id": "act-001",
  "description": "Review Sunrise SNF DD checklist section 3",
  "entity": "Olumie",
  "deal_id": "sunrise-snf",
  "source_type": "triage" | "commitment" | "meeting" | "manual",
  "source_ref": "triage-item-456",
  "energy_level": "high",
  "time_estimate_minutes": 45,
  "due_date": "2026-02-25",
  "status": "active" | "completed" | "delegated",
  "created_at": "2026-02-22T15:00:00Z"
}

// artifacts/gtd/waiting_for.jsonl
{
  "kind": "waiting_create" | "waiting_received" | "waiting_follow_up",
  "id": "wf-001",
  "description": "Outside counsel feedback on Sunrise PSA Section 4",
  "delegated_to": "Wilson & Associates",
  "entity": "Olumie",
  "deal_id": "sunrise-snf",
  "expected_by": "2026-02-27",
  "status": "waiting" | "overdue" | "received",
  "follow_up_count": 0,
  "created_at": "2026-02-22T15:00:00Z"
}
```

#### Sidecar Endpoints

| Method | Route                                           | Purpose                  | Autonomy                       |
| ------ | ----------------------------------------------- | ------------------------ | ------------------------------ |
| GET    | `/gtd/actions/list?entity=Olumie&status=active` | Next actions list        | read-only                      |
| POST   | `/gtd/actions/create`                           | Create an action         | autonomous (>80% conf.)        |
| POST   | `/gtd/actions/{id}/complete`                    | Mark complete            | autonomous                     |
| POST   | `/gtd/actions/{id}/delegate`                    | Convert to waiting-for   | draft_only (creates follow-up) |
| GET    | `/gtd/waiting-for/list?status=overdue`          | Waiting-for list         | read-only                      |
| POST   | `/gtd/waiting-for/create`                       | Track a delegation       | autonomous                     |
| POST   | `/gtd/waiting-for/{id}/follow-up`               | Generate follow-up draft | draft_only                     |

#### Bridge to Existing Systems

- **Triage ingest** → auto-creates action when item is actionable
- **Deal team_tasks** → bidirectional sync with GTD actions (deal tasks are actions)
- **Commitment tracking** → commitments to Clint become actions; commitments from others become waiting-for
- **Filing suggestions** → non-actionable triage items routed to filing (GTD "reference" path)

### 2.4 JC-080: Enhanced Briefs

**Upgrade morning brief and EOD digest** with data from meeting lifecycle, commitments, and GTD actions.

#### Morning Brief Additions

```json
{
  "...existing fields...",
  "meetings_today": [
    {
      "event_id": "cal-abc",
      "title": "Sunrise SNF DD Review",
      "time": "09:00",
      "prep_ready": true,
      "key_decision": "Approve DD extension request"
    }
  ],
  "commitments_snapshot": {
    "clint_overdue": 2,
    "clint_due_today": 3,
    "others_overdue": 1,
    "total_active": 15
  },
  "actions_snapshot": {
    "high_priority_today": 4,
    "total_active": 18,
    "waiting_for_overdue": 3
  }
}
```

#### EOD Digest Additions

```json
{
  "...existing fields...",
  "commitments_completed_today": 5,
  "commitments_created_today": 3,
  "actions_completed_today": 8,
  "waiting_for_received_today": 2,
  "meetings_debriefed": 3,
  "meetings_not_debriefed": 1
}
```

---

## 3. Phase 7: Calendar Intelligence + PARA Filing

### 3.1 JC-081: Time-Block Planning

**Directly fulfills 8-week success criterion:** "Calendar has protected work time blocks that are being respected."

#### Sidecar Endpoints

| Method | Route                                 | Purpose                                          | Autonomy                                                 |
| ------ | ------------------------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| POST   | `/planning/timeblock/generate`        | Generate daily time-block plan from task sources | draft_only                                               |
| POST   | `/planning/timeblock/{plan_id}/apply` | Sync approved plan to calendar                   | autonomous (personal) / propose_certify_apply (external) |
| POST   | `/planning/deep-work/protect`         | Set busy status + optional auto-response drafts  | autonomous (calendar) / draft_only (auto-response)       |
| GET    | `/planning/timeblock/history`         | Past plans with deep work metrics                | read-only                                                |

#### Time-Block Generation Logic

1. Read existing calendar events for the date
2. Read active GTD actions, commitments due, meeting prep needed
3. Classify each task as "deep" (deal analysis, document review) or "shallow" (email batch, approvals)
4. Fit tasks around existing commitments, prioritizing deep work blocks
5. Return proposed plan (not applied until approved)

#### Config: `config/planning_preferences.json`

```json
{
  "default_deep_work_hours_target": 4,
  "default_work_start": "07:30",
  "default_work_end": "17:30",
  "deep_work_minimum_minutes": 60,
  "shallow_batch_maximum_minutes": 45,
  "deep_work_show_as": "busy",
  "shallow_show_as": "tentative",
  "buffer_blocks": 1
}
```

### 3.2 JC-082: PARA Filing Classification

**Enhances existing filing suggestion system** with structured organizational taxonomy.

#### Sidecar Endpoints

| Method | Route                    | Purpose                              | Autonomy                              |
| ------ | ------------------------ | ------------------------------------ | ------------------------------------- |
| POST   | `/filing/para/classify`  | Classify item into PARA category     | draft_only (feeds filing suggestions) |
| GET    | `/filing/para/structure` | Return current PARA folder structure | read-only                             |

#### Classification Rules

- Active deal match → **Project** (file under deal folder)
- Ongoing entity responsibility → **Area** (file under entity context)
- Reference material not tied to specific project → **Resource**
- Closed deal or inactive item → **Archive**

#### Config: `config/para_rules.json`

```json
{
  "classification_rules": [
    { "signal": "active_deal_match", "category": "project", "confidence_boost": 0.3 },
    { "signal": "entity_context_match", "category": "area", "confidence_boost": 0.2 },
    {
      "signal": "reference_keywords",
      "category": "resource",
      "keywords": ["template", "checklist", "guide", "methodology"]
    },
    { "signal": "deal_archived_or_closed", "category": "archive", "confidence_boost": 0.4 }
  ],
  "folder_template": "/{entity}/{para_category}/{deal_or_topic}/{document_type}"
}
```

### 3.3 JC-083: Deep Work Metrics

| Method | Route                                      | Purpose                                               | Autonomy  |
| ------ | ------------------------------------------ | ----------------------------------------------------- | --------- |
| GET    | `/reporting/deep-work-metrics?period=week` | Weekly deep work hours, plan adherence, replan counts | read-only |

Feeds into morning brief ("Deep work this week: 14.5 / 20 hrs target") and EOD digest ("Deep work today: 3.5 hrs").

---

## 4. Phase 8: Adoption Engineering

### 4.1 JC-084: Notification Budget + Onboarding Ramp

**The onboarding ramp is the single most important implementation detail** (per behavior design councilor). If Clint is overwhelmed in week 1, no amount of features will bring him back.

#### Config: `config/notification_budget.json`

```json
{
  "daily_push_max": 3,
  "crisis_override": true,
  "quiet_hours": { "start": "20:00", "end": "07:00" },
  "batch_window_minutes": 15,
  "decay_policy": "no_resend_non_critical",
  "auto_reduce_threshold": { "action_rate_below": 0.5, "window_days": 7 }
}
```

#### Config: `config/onboarding_ramp.json`

```json
{
  "phases": [
    { "days": [1, 3], "features": ["morning_brief"], "push_max": 1 },
    { "days": [4, 7], "features": ["morning_brief", "draft_queue"], "push_max": 2 },
    {
      "days": [8, 14],
      "features": ["morning_brief", "draft_queue", "isaac_report"],
      "push_max": 3
    },
    {
      "days": [15, 21],
      "features": ["morning_brief", "draft_queue", "isaac_report", "triage"],
      "push_max": 3
    },
    { "days": [22, 42], "features": ["all_except_autonomy_promotion"], "push_max": 3 },
    { "days": [43, null], "features": ["full"], "push_max": 3 }
  ]
}
```

#### Enforcement

- Sidecar checks onboarding phase before exposing features in briefs
- Push notification count tracked per day; excess items batched into next brief
- CRISIS-level triggers always bypass budget (per existing `urgency_rules.json`)

### 4.2 JC-085: Trust Dashboard

New metrics endpoint + UI surface showing operator trust signals:

| Metric                         | Source                       | Display                                    |
| ------------------------------ | ---------------------------- | ------------------------------------------ |
| Draft approval rate            | Triage ledger                | Trend line (weekly)                        |
| Draft edit rate                | Triage ledger                | "3 of 8 needed edits"                      |
| Time saved estimate            | Action completion timestamps | "~4.5 hours this week"                     |
| Queue clearance speed          | Approval timestamps          | "Avg 22 min from ready to approved"        |
| Morning brief engagement       | Open tracking                | "12 of 14 days reviewed before 8 AM"       |
| Autonomy promotion eligibility | Approval rate over time      | "91% over 4 months — eligible in 2 months" |

#### Sidecar Endpoint

| Method | Route                                  | Purpose                                |
| ------ | -------------------------------------- | -------------------------------------- |
| GET    | `/reporting/trust-metrics?period=week` | Operator trust and performance metrics |

### 4.3 JC-086: Progressive Disclosure in Briefs

**Design principle applied to morning brief and EOD digest:**

```
LEVEL 1 — Headline (5 seconds, visible in iMessage preview)
"Tuesday brief: 2 urgent deadlines, 5 drafts pending, 1 risk flag."

LEVEL 2 — Decision-Ready Summary (60 seconds)
- [URGENT] Everest COO contract review due tomorrow
- 5 email drafts awaiting approval (oldest: 2h 15m)
- 1 risk: Facility B census dropped 8%
- 3 meetings today (first at 9:00 — prep attached)

LEVEL 3 — Full Detail (drill-in from UI)
Each item expandable with full context, documents, proposed actions
```

Implementation: Morning brief and EOD digest responses include `headline` and `summary` fields alongside existing detailed data. UI renders with collapsible sections. iMessage delivery uses headline only with link to full brief.

---

## 5. OpenClaw Integration (iMessage Access)

All new capabilities follow the dual-registration pattern from JC-076:

### Agent Tools (via `api.registerTool()`)

**Read-Only Tools (auto-approve):**

- `ted_meeting_upcoming` — list upcoming meetings with prep status
- `ted_meeting_prep` — get prep packet for a meeting
- `ted_commitments_list` — list active commitments
- `ted_actions_list` — list next actions
- `ted_waiting_for_list` — list waiting-for items
- `ted_timeblock_plan` — get today's time-block plan
- `ted_deep_work_metrics` — deep work hours this week
- `ted_trust_metrics` — approval rate, time saved

**Write Tools (confirmation gate):**

- `ted_meeting_debrief` — process meeting outcome (first call: preview; second: apply)
- `ted_commitment_create` — create commitment
- `ted_commitment_follow_up` — generate follow-up draft
- `ted_action_create` — create next action
- `ted_timeblock_apply` — sync plan to calendar

All write tools use the `confirmed: boolean` pattern from JC-076b.

### Cron Integration

Extend the Ted Agent cron jobs (from JC-076d):

```json
{
  "cron": [
    { "schedule": "0 7 * * 1-5", "tool": "ted_morning_brief", "channel": "imessage" },
    { "schedule": "0 17 * * 1-5", "tool": "ted_eod_digest", "channel": "imessage" },
    {
      "schedule": "0 8 * * 1-5",
      "tool": "ted_timeblock_plan",
      "channel": "imessage",
      "note": "Daily plan suggestion after brief review"
    }
  ]
}
```

---

## 6. Governance Alignment

All new endpoints respect Ted's existing governance framework:

| Principle               | How Enforced                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| **Draft-only boundary** | Meeting debrief deliverables, commitment follow-ups, time-block plans all proposed as drafts       |
| **Approval-first**      | Calendar sync requires explicit approval unless personal holds                                     |
| **Entity separation**   | Commitments, actions, meeting preps all tagged with entity context; cross-entity queries blocked   |
| **Fail-closed**         | If generation fails, return `blockedExplainability()` with `what_blocked`, `why`, `next_safe_step` |
| **Audit trail**         | All mutations appended to JSONL ledgers                                                            |
| **PHI redaction**       | Everest-tagged items auto-redact before display to non-cleared recipients                          |
| **Hard bans**           | `before_tool_call` hook (JC-076c) enforces for agent tool access                                   |
| **Notification budget** | Push count tracked; excess batched into next brief                                                 |

---

## 7. New Artifacts Directory Structure

```
artifacts/
  ├── triage/          (existing)
  ├── deals/           (existing)
  ├── meetings/
  │   ├── prep.jsonl
  │   └── debrief.jsonl
  ├── commitments/
  │   └── commitments.jsonl
  ├── gtd/
  │   ├── actions.jsonl
  │   └── waiting_for.jsonl
  └── planning/
      └── timeblock_plans.jsonl
```

---

## 8. Execution Order

| Phase       | JC Cards         | Sessions | Depends On                   | Impact                                    |
| ----------- | ---------------- | -------- | ---------------------------- | ----------------------------------------- |
| **Phase 6** | JC-077 to JC-080 | 29-34    | JC-070b (LLM for extraction) | Meeting lifecycle + commitments + actions |
| **Phase 7** | JC-081 to JC-083 | 35-37    | JC-063 (calendar create)     | Calendar protection + PARA filing         |
| **Phase 8** | JC-084 to JC-086 | 38-40    | Phase 6 (needs metrics data) | Adoption engineering                      |

**Critical path for Clint value:** Phase 6 (JC-077 meeting prep) → JC-078 (commitments) → JC-080 (enhanced briefs)
**Critical path for calendar protection:** Phase 7 (JC-081 time-blocking) → JC-083 (deep work metrics)
**Critical path for adoption:** Phase 8 (JC-084 onboarding ramp) — ideally deployed BEFORE Phase 6 features go live

---

## 9. Decision Log

| #       | Decision                                                                       | Rationale                                                                                                     |
| ------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| D-44-01 | Meeting lifecycle is highest-priority new capability                           | Unanimous EA/CoS community consensus; explicit intake pain point                                              |
| D-44-02 | Commitment tracking is separate from GTD actions                               | Commitments track inter-person promises; actions track operator tasks. Different lifecycles.                  |
| D-44-03 | Time-blocking generates proposed plans, not rigid schedules                    | Clint context-switches every 30 min across 4 entities; rigid scheduling would collapse                        |
| D-44-04 | PARA enhances existing filing, not replaces                                    | Filing suggestion system already works; PARA adds structural taxonomy                                         |
| D-44-05 | Onboarding ramp is mandatory, not optional                                     | Behavior design research: feature overload on Day 1 kills adoption                                            |
| D-44-06 | Gamification and streak tracking are REJECTED                                  | Professional operator; patronizing features would erode trust                                                 |
| D-44-07 | Notification budget enforced at sidecar level                                  | Prevents Ted from becoming noise; auto-reduces if action rate drops                                           |
| D-44-08 | All new tools dual-registered (gateway + agent)                                | Ensures iMessage value flow from Day 1 per JC-076 architecture                                                |
| D-44-09 | Commitment extraction requires LLM (JC-070b dependency)                        | Pattern matching insufficient for "Isaac said he'd send the PSA by Friday"                                    |
| D-44-10 | PARA Someday/Maybe list NOT built                                              | Clint's problem is active operational overload, not aspirational backlog                                      |
| D-44-11 | Full GTD weekly review NOT built                                               | Daily brief + EOD digest already cover this cadence; adding separate weekly ceremony is additive but not core |
| D-44-12 | Progressive disclosure in briefs is a design principle, not a separate feature | Applied to morning brief and EOD digest UI/iMessage rendering                                                 |

---

## 10. Alignment with Existing Architecture

| System                     | SDD-44 Integration Point                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Sidecar (`server.mjs`)** | 4 new route families: `/meeting/*`, `/commitments/*`, `/gtd/*`, `/planning/*`                                          |
| **Extension (`index.ts`)** | ~15 new gateway methods + ~13 new agent tools                                                                          |
| **UI (`views/ted.ts`)**    | 3 new operate-tab surfaces: Meetings, Actions, Daily Plan                                                              |
| **Config**                 | 4 new config files: `planning_preferences.json`, `para_rules.json`, `notification_budget.json`, `onboarding_ramp.json` |
| **Brief/Digest**           | Enhanced with meeting, commitment, action, and deep work data                                                          |
| **Cron**                   | Daily plan suggestion at 8am (after brief review)                                                                      |
| **JC-076 Agent Tools**     | All new capabilities accessible via iMessage through agent tools                                                       |
| **JC-070 LLM**             | Commitment extraction and meeting prep narrative use `routeLlmCall()`                                                  |
| **Autonomy Ladder**        | All new write operations mapped to existing action categories                                                          |
| **Entity Boundaries**      | All data models include `entity` field; cross-entity queries blocked                                                   |
