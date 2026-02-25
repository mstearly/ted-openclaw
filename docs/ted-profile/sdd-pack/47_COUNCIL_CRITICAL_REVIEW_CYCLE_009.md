# Council Critical Review — Cycle 009: Vision vs. Reality Audit

**Filed:** 2026-02-23
**Status:** FINDINGS COMPLETE — Execution Plan Pending
**Scope:** Full-stack critical review of Ted system: architecture, M365 integration, operator experience, vision alignment

---

## Executive Summary

The architecture is **genuinely sophisticated** — 11 Design Laws, 21 JSONL ledgers, dual-write event sourcing, 6-state draft machine, golden fixture validation, operator confirmation gates. This is real governance engineering.

But there is a critical gap between "route exists" and "route does real work."

| Category                       | Grade | Notes                                                           |
| ------------------------------ | ----- | --------------------------------------------------------------- |
| Architecture & Governance      | A+    | World-class for a sidecar                                       |
| LLM Integration                | B-    | 9 call sites, but fed summarized data, not live context         |
| M365 Graph Integration         | C+    | Calls are real but blocked by empty credentials + no pagination |
| Operator Day-1 Experience      | D     | Opens workbench → most cards empty → gives up                   |
| Clint's 15-25 hrs/week savings | F     | Zero hours saved today — nothing runs autonomously              |

---

## The Core Problem

Clint's intake says he needs to **recover 15-25 hours/week**. His pain points are:

1. Context switching every 30 minutes across 4 entities
2. Deal operations chaos (no data room, no DD templates, no systematic tracking)
3. Everest blindness (54 facilities, zero visibility)

**What Ted delivers today:** A beautifully governed framework that writes to local JSONL files. The brief generates from empty ledgers. The scheduler ticks but doesn't fire. The agent tools return 409. The morning brief shows `"0 triage open, 0 deals"` because nothing is flowing in.

**The system is waiting for Clint to feed it data manually — but the whole point is that Ted feeds Clint.**

---

## M365 Integration Gap Analysis

### What's Working (When Auth Is Present)

| Capability          | Implementation                      | Quality                         |
| ------------------- | ----------------------------------- | ------------------------------- |
| Mail Read           | Real Graph `/messages` call         | B+ (no pagination)              |
| Mail Create Draft   | Real Graph POST                     | A                               |
| Mail Send           | Real Graph `/send` + operator gate  | A-                              |
| Mail Move           | Real Graph with idempotency         | A                               |
| Calendar Read       | Real Graph `/calendarview`          | B (no pagination, no attendees) |
| Calendar Create     | Real Graph POST (tentative only)    | B+                              |
| Planner List Plans  | Real Graph, enriched                | C+ (no pagination)              |
| Planner List Tasks  | Real Graph                          | C+ (no pagination)              |
| Planner Create Task | Real Graph with assignees           | A-                              |
| Planner Update Task | Real Graph, 412 unhandled           | B                               |
| To Do List Tasks    | Real Graph, hardcoded 100           | C+                              |
| To Do Create/Update | Real Graph                          | A                               |
| Auth: Device Code   | Real OAuth calls                    | A                               |
| Auth: Token Refresh | Proactive via refresh_token + mutex | A                               |

### What's Blocked

| Capability                  | Status  | Blocker                                                     |
| --------------------------- | ------- | ----------------------------------------------------------- |
| ALL Graph operations        | BLOCKED | Empty `tenant_id`/`client_id` in graph.profiles.json        |
| Device code auth completion | BLOCKED | Stub flow returns PENDING forever without real Azure AD app |

### What's Missing

| Capability                      | Status                 | Impact                                  |
| ------------------------------- | ---------------------- | --------------------------------------- |
| Calendar Accept/Decline         | NOT IMPLEMENTED        | Cannot RSVP to meetings                 |
| Calendar attendee list reading  | NOT IMPLEMENTED        | Meeting prep can't know who's attending |
| Calendar event body/description | NOT IMPLEMENTED        | Context lost                            |
| Contacts/People resolution      | HARDCODED MAPPING ONLY | No directory lookup                     |
| Teams integration               | NOT IMPLEMENTED        | No channel operations                   |
| SharePoint/OneDrive             | NOT IMPLEMENTED        | No document management                  |
| Graph change notifications      | NOT IMPLEMENTED        | Polling only                            |

### Infrastructure Gaps

| Gap                                 | Severity | Impact                                                                                |
| ----------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| No pagination (nextLink) anywhere   | HIGH     | Mail capped at 50, Calendar at 200, Planner at ~20, To Do at 100 — silently truncates |
| No retry/backoff logic              | MEDIUM   | Network blip = immediate 502, no recovery                                             |
| No 429 rate-limit handling          | MEDIUM   | Graph throttling causes cascading failures                                            |
| No Planner etag conflict resolution | MEDIUM   | Concurrent edits fail silently                                                        |
| No truncation warnings in audit log | LOW      | Operator doesn't know data was capped                                                 |

---

## Feature-by-Feature Reality Assessment

### Features That Are REAL (End-to-End Functional)

| Feature                     | What It Does                                                                        | Grade               |
| --------------------------- | ----------------------------------------------------------------------------------- | ------------------- |
| Email triage classification | Pattern matching + LLM fallback for ambiguous emails                                | A                   |
| Draft email generation      | Fetches email from Graph + LLM generates reply + validates contract                 | A                   |
| Commitment extraction       | Fetches email body + LLM extracts commitments with confidence scores                | A                   |
| Draft queue lifecycle       | 6-state machine: drafted → pending_review → edited → approved → executed → archived | A                   |
| Sync reconciliation         | Fetches real Planner/To Do data, computes drift, proposes writes                    | A-                  |
| Improvement proposals       | LLM analyzes trust failures, proposes config changes, applies on approval           | A-                  |
| Meeting debrief             | Parses action items, auto-creates commitments + draft queue entries                 | B+                  |
| Deal CRUD                   | Local ledger with full lifecycle                                                    | B (no external CRM) |

### Features That Are PARTIAL (LLM-Backed but Fed Summarized Data)

| Feature             | What's Missing                                           | Grade |
| ------------------- | -------------------------------------------------------- | ----- |
| Morning brief       | LLM gets ledger counts, not live inbox/calendar data     | C+    |
| EOD digest          | LLM gets audit summaries, not actual transaction details | C+    |
| Deadline extraction | Works but depends on emails being ingested first         | C     |

### Features That Are STUBS (Route Exists, No Real Integration)

| Feature                    | What's Missing                                                     | Grade |
| -------------------------- | ------------------------------------------------------------------ | ----- |
| Meeting prep               | Hardcoded sample events (`cal-sample-001`), no real calendar fetch | D     |
| Timeblock planning         | Ignores real calendar, algorithmic distribution only               | D     |
| Scheduler auto-dispatch    | Writes pending entries but NEVER fires the actual route            | D     |
| Facility health monitoring | Local CRUD only — no external health data source                   | D     |
| Deal pipeline intelligence | Local JSON — no Salesforce/Pipedrive/Monday.com connection         | D     |

---

## Missing Critical Capability: Data Ingestion / Onboarding Loop

**Current state:** There is NO automated ingestion loop. Ted does not:

- Scan Clint's existing inbox to discover deals, commitments, contacts
- Crawl calendar history to identify recurring meetings and relationships
- Read existing Planner/To Do tasks to seed ledgers
- Build a relationship graph from email patterns
- Present a "Here's what I found — confirm/correct" workflow

**Impact:** Clint starts with an empty system. Every deal, commitment, and relationship must be manually entered. This is the opposite of "saving 15-25 hours/week" — it COSTS hours to set up.

**What's needed:** A first-run data ingestion pipeline that:

1. Scans N days of email history per profile
2. Extracts entities, deals, commitments, contacts, patterns
3. Reads existing Planner plans and To Do lists
4. Reads calendar events for the past/next 30 days
5. Presents a structured "discovery report" for operator confirmation
6. Seeds all ledgers from confirmed data
7. Builds initial relationship map (who emails whom, about what)

---

## Top 3 Changes to Unlock Next-Level Capability

### Change 1: LIVE INBOX INGESTION LOOP (The Missing Heartbeat)

**Problem:** Ted has no heartbeat. Nothing flows in automatically. Every piece of data requires manual creation or an explicit agent tool call.

**What Clint needs:** Ted wakes up, reads his inbox, triages new emails, extracts commitments, queues drafts — all before Clint opens his laptop.

**What to build:**

- A polling loop (or Graph change notification webhook) that runs every 5 minutes
- Fetches new/unread emails from each profile's inbox
- Auto-runs triage classification on each email
- Auto-extracts commitments from high-confidence emails
- Auto-generates reply drafts for emails matching draft-worthy patterns
- Populates the morning brief with real data
- All still draft-only — nothing sends without approval

**Why this unlocks everything:** The morning brief, EOD digest, commitment tracking, and draft queue all become live instead of empty.

**Estimated effort:** ~300 lines server.mjs (polling loop + auto-triage + auto-extract), ~50 lines extension, ~30 lines UI

### Change 2: CALENDAR-AWARE INTELLIGENCE (The Context Engine)

**Problem:** Meeting prep returns stub data. Timeblock planning ignores real calendar. Morning brief doesn't know what meetings are today.

**What Clint needs:** "You have 4 meetings today. Here's your prep for the 9am deal review with Sunrise SNF — related commitments, open items, draft talking points."

**What to build:**

- Morning brief fetches real calendar events from Graph before generating
- Meeting prep fetches the actual event (attendees, body, location) and cross-references with deal + commitment ledgers
- Timeblock planning reads real calendar and plans around fixed meetings
- Meeting debrief calls LLM to extract action items (not just regex)
- Auto-link meetings to deals by attendee email domain matching

**Why this unlocks everything:** Clint's day is structured around meetings. Calendar-aware intelligence saves 5-10 hours/week of manual prep.

**Estimated effort:** ~200 lines server.mjs, ~50 lines extension

### Change 3: SCHEDULER AUTO-DISPATCH (The Autonomous Loop)

**Problem:** Scheduler ticks and writes pending_delivery.jsonl entries, but nothing actually fires. Cron jobs (morning brief 7am, daily plan 8am, EOD digest 5pm) exist in config but never execute.

**What Clint needs:** At 7:00 AM, without anyone touching anything, Ted generates the morning brief from live data. At 5:00 PM, the EOD digest for Isaac is auto-generated and waiting for approval.

**What to build:**

- `schedulerTick()` internally invokes the route handler when a cron job matches
- Delivery channel integration: write brief output to well-known file for external pickup (Shortcuts/AppleScript) or integrate messaging API
- The scheduler becomes the autonomous heartbeat driving the entire daily workflow

**Why this unlocks everything:** Difference between "a tool Clint has to remember to use" and "an assistant that works while Clint sleeps."

**Estimated effort:** ~100 lines server.mjs, ~50 lines delivery channel

### The Compound Effect

```
[1] Inbox Ingestion Loop  →  Ledgers have REAL data
                                    ↓
[2] Calendar-Aware Intelligence  →  Briefs/prep have REAL context
                                    ↓
[3] Scheduler Auto-Dispatch  →  Outputs DELIVERED automatically
                                    ↓
                          Clint opens phone at 7:01 AM
                          Morning brief is already there
                          With real inbox triage, real calendar, real commitments
                          Draft replies already queued
                          Meeting prep already generated
                          → 15-25 hrs/week ACTUALLY saved
```

---

## First-Run Data Onboarding Pipeline (New Capability)

### Problem

Clint starts with empty ledgers. No deals, no commitments, no relationships, no context. Must manually enter everything.

### Proposed Solution: `POST /ops/onboarding/discover`

**Phase 1 — Email Discovery (per profile)**

- Fetch last 90 days of email from Inbox, Sent, and key folders
- Extract unique senders/recipients → build contact graph
- Identify deal-related threads (NDA, LOI, PSA, DD keywords)
- Identify commitment-bearing emails (deadlines, action items, follow-ups)
- Identify recurring patterns (weekly reports, facility updates)

**Phase 2 — Calendar Discovery**

- Fetch past 30 + next 30 days of calendar events
- Extract recurring meetings and attendee lists
- Cross-reference attendees with email contact graph
- Identify deal-related meetings by attendee domain/subject

**Phase 3 — Planner/To Do Discovery**

- Read all Planner plans and tasks
- Read all To Do lists and tasks
- Map existing tasks to discovered deals/commitments

**Phase 4 — Discovery Report**

- Present structured report: "I found N deals, M commitments, K contacts, J recurring meetings"
- Operator confirms/corrects each discovery
- Confirmed items seed ledgers automatically

**Phase 5 — Relationship Map**

- Build entity → person → deal → commitment graph
- Store as `relationship_graph.jsonl`
- Use for intelligent cross-referencing in briefs and prep

### Estimated Effort

~500 lines server.mjs (discovery engine), ~100 lines extension (gateway methods), ~150 lines UI (discovery review card)

---

## Full Remediation Plan — Priority Order

### P0 — Blockers (Must Fix Before Anything Else Works)

| ID     | Item                                                    | LOE        | Depends On |
| ------ | ------------------------------------------------------- | ---------- | ---------- |
| C9-001 | Graph API pagination (nextLink loops for all endpoints) | ~200 lines | None       |
| C9-002 | Retry + exponential backoff for Graph calls             | ~100 lines | None       |
| C9-003 | 429 rate-limit detection and backoff                    | ~50 lines  | C9-002     |

### P0 — Core Capability (The Three Unlocks)

| ID     | Item                                                              | LOE        | Depends On |
| ------ | ----------------------------------------------------------------- | ---------- | ---------- |
| C9-010 | Inbox ingestion polling loop (auto-triage + auto-extract)         | ~300 lines | C9-001     |
| C9-011 | Calendar fetch in morning brief + meeting prep                    | ~200 lines | C9-001     |
| C9-012 | Scheduler internal dispatch (fire routes, not just write pending) | ~150 lines | None       |
| C9-013 | Delivery channel abstraction (file output for Shortcuts pickup)   | ~100 lines | C9-012     |

### P0 — First-Run Onboarding

| ID     | Item                                             | LOE                            | Depends On             |
| ------ | ------------------------------------------------ | ------------------------------ | ---------------------- |
| C9-020 | Email discovery engine (90-day scan per profile) | ~200 lines                     | C9-001                 |
| C9-021 | Calendar discovery (past/future 30 days)         | ~100 lines                     | C9-001                 |
| C9-022 | Planner/To Do discovery                          | ~80 lines                      | C9-001                 |
| C9-023 | Discovery report generation + confirmation UI    | ~200 lines (server + ext + UI) | C9-020, C9-021, C9-022 |
| C9-024 | Confirmed discovery → ledger seeding             | ~100 lines                     | C9-023                 |
| C9-025 | Relationship graph builder                       | ~120 lines                     | C9-020, C9-021         |

### P1 — Quality & Completeness

| ID     | Item                                                                     | LOE        | Depends On |
| ------ | ------------------------------------------------------------------------ | ---------- | ---------- |
| C9-030 | Calendar event attendee + body reading                                   | ~80 lines  | None       |
| C9-031 | Meeting prep: fetch real event, LLM-generated talking points             | ~120 lines | C9-030     |
| C9-032 | Timeblock planning: real calendar integration                            | ~80 lines  | C9-030     |
| C9-033 | Meeting debrief: LLM-driven action extraction                            | ~80 lines  | None       |
| C9-034 | Morning brief: pass full email subjects/senders to LLM (not just counts) | ~60 lines  | C9-010     |
| C9-035 | EOD digest: include real email/calendar activity from Graph              | ~60 lines  | C9-010     |

### P2 — Future Enhancements

| ID     | Item                                                    | LOE        | Depends On             |
| ------ | ------------------------------------------------------- | ---------- | ---------------------- |
| C9-040 | Calendar accept/decline integration                     | ~100 lines | C9-030                 |
| C9-041 | Contact resolution from Azure AD directory              | ~80 lines  | None                   |
| C9-042 | Planner etag conflict resolution (re-fetch on 412)      | ~50 lines  | None                   |
| C9-043 | Graph change notifications (webhook instead of polling) | ~200 lines | External webhook setup |

---

## Verification Criteria

For each item, the proof must be behavioral (real HTTP calls, not string presence):

1. **Pagination**: Endpoint returns >50 items when available (not truncated)
2. **Ingestion loop**: Triage ledger has entries after loop runs (without manual creation)
3. **Calendar intelligence**: Morning brief contains real meeting titles from today's calendar
4. **Scheduler dispatch**: Route handler executes at cron time (event_log shows execution event)
5. **Discovery**: Running discovery on a profile with emails produces deal/commitment candidates
6. **Retry**: Simulated network failure → retry → success on second attempt

---

## What's Solid (Don't Touch)

- The 11 Design Laws and governance framework
- The dual-write event sourcing pattern
- The 6-state draft machine
- The operator confirmation gates
- The HIPAA entity firewall
- The golden fixture validation
- The reconciliation engine design
- The improvement proposal lifecycle
- The before_tool_call hook enforcement
- The ensureValidToken + per-profile mutex pattern

---

_Filed by the Council. Cycle 009 critical review. Ready for execution planning._
