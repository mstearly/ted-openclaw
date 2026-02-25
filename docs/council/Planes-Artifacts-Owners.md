# Planes → Artifacts → Owners (one-page Council view)

**Status:** Proposed (Council review)  
**Version:** v2  
**Purpose:** Provide a one-glance map of **what lives where**, **who owns it**, and **which event/ledger objects** each surface reads/writes.

---

## Canonical objects (used below)

### Event log

- **Append-only:** `event_log`

### Materialized ledgers / views

- `commitments_ledger`
- `draft_queue_ledger`
- `deals_ledger`
- `triage_ledger`
- `meetings_ledger`
- `mail_ledger`
- `calendar_ledger`
- `planning_ledger`
- `para_index`
- `trust_ledger`
- `deep_work_ledger`
- `policy_ledger`
- `ops_ledger`
- `graph_sync_ledger`
- `audit_ledger`

> **Rule of thumb:** any **write** action emits an event to `event_log` and updates one or more ledgers; any **read** action should prefer ledgers first, then query systems of record as needed.

---

## Plane 1 — Experience & Entry Paths (OpenClaw UI + MCP + Gateway Methods)

**Owner:** Platform/UX Lead (primary), OpenClaw Platform Engineer

| Artifact                                     | Reads                                                                 | Writes                                         | Primary Owner              |
| -------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------- | -------------------------- |
| UI Surfaces (Operate/Configure/Plan/Monitor) | all ledgers (esp. `draft_queue_ledger`, `trust_ledger`, `ops_ledger`) | approval actions → `event_log`, `audit_ledger` | Platform/UX Lead           |
| Extension Gateway Methods (31+)              | mapped to Sidecar routes + ledgers                                    | mapped writes emit events                      | OpenClaw Platform Engineer |
| MCP Tools + Resources (`POST /mcp`)          | tools read from ledgers/resources                                     | tool writes emit events                        | OpenClaw Platform Engineer |

---

## Plane 2 — Control Plane (Ted Sidecar Co‑Work Kernel / Orchestrator)

**Owner:** Co‑Work Systems Architect (primary), Reliability Engineer, Security Lead

### Config files (15) — “policy + runtime knobs”

| Config                        | Reads                                                                  | Writes                                                  | Primary Owner                   |
| ----------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------- |
| `autonomy_ladder.json`        | —                                                                      | influences `policy_ledger` (effective capability gates) | Council Policy Owner + Security |
| `brief_config.json`           | `commitments_ledger`, `deals_ledger`, `meetings_ledger`, `mail_ledger` | brief generation events → `event_log`, `audit_ledger`   | EA/CoS Operator + Product       |
| `draft_style.json`            | —                                                                      | influences `policy_ledger` (draft constraints)          | EA/CoS Operator + Product       |
| `graph.profiles.json`         | —                                                                      | drives `graph_sync_ledger` (per-tenant state)           | M365/Graph Architect            |
| `graph.profiles.example.json` | —                                                                      | —                                                       | M365/Graph Architect            |
| `hard_bans.json`              | —                                                                      | influences `policy_ledger` (blocked actions/providers)  | Security/Compliance Lead        |
| `llm_provider.json`           | —                                                                      | influences `policy_ledger` (routing + fallback)         | AI/LLM Architect                |
| `notification_budget.json`    | —                                                                      | updates `ops_ledger` (quiet hours/budget)               | EA/CoS Operator + Reliability   |
| `onboarding_ramp.json`        | —                                                                      | updates `ops_ledger` (phase unlocks)                    | Product + Reliability           |
| `operator_profile.json`       | —                                                                      | updates `policy_ledger` (preferences/constraints)       | Product + EA/CoS Operator       |
| `para_rules.json`             | `para_index`                                                           | updates filing decisions → `event_log`                  | PKM/Data Architect              |
| `planning_preferences.json`   | `calendar_ledger`, `commitments_ledger`                                | updates `planning_ledger`                               | EA/CoS Operator                 |
| `style_guide.json`            | —                                                                      | influences `policy_ledger`                              | Product                         |
| `ted_agent.json`              | `ops_ledger` (schedules)                                               | cron dispatch events → `event_log`                      | Co‑Work Systems Architect       |
| `urgency_rules.json`          | `event_log` (signals), `trust_ledger`                                  | updates `ops_ledger` (escalations)                      | Security + EA/CoS Operator      |

### Route families (76 total) — “capability surfaces”

| Route Family         | Primary JTBD                                      | Reads                                                 | Writes                                                             | Primary Owner              |
| -------------------- | ------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------ | -------------------------- |
| `/auth/*`            | mint sessions/tokens                              | `policy_ledger`                                       | `event_log`, `audit_ledger`                                        | Platform Eng + Security    |
| `/ops/*`             | pause/resume/dispatch/rate/retry                  | `ops_ledger`, `trust_ledger`                          | `event_log`, `ops_ledger`, `audit_ledger`                          | Reliability Eng            |
| `/governance/*`      | policy checks, confidence, contradictions, repair | `policy_ledger`, `trust_ledger`, domain ledgers       | `event_log`, `trust_ledger`, `audit_ledger`                        | Security/Compliance Lead   |
| `/reporting/*`       | briefs/digests/metrics                            | all ledgers                                           | `event_log`, `audit_ledger`                                        | EA/CoS Operator            |
| `/meeting/*`         | upcoming/prep/debrief                             | `calendar_ledger`, `meetings_ledger`, `mail_ledger`   | `event_log`, `meetings_ledger`, `draft_queue_ledger`               | EA/CoS Operator            |
| `/planning/*`        | timeblock generation                              | `calendar_ledger`, `commitments_ledger`               | `planning_ledger`, `event_log`                                     | EA/CoS Operator            |
| `/commitments/*`     | commitment lifecycle                              | `commitments_ledger`                                  | `commitments_ledger`, `event_log`                                  | EA/CoS Operator            |
| `/gtd/*`             | next actions + waiting-for                        | `commitments_ledger`                                  | `commitments_ledger`, `event_log`                                  | EA/CoS Operator            |
| `/triage/*`          | ingest/classify/link/approve                      | `mail_ledger`, `triage_ledger`, `policy_ledger`       | `triage_ledger`, `draft_queue_ledger`, `event_log`                 | Co‑Work Systems Architect  |
| `/deals/*`           | deal pipeline + milestones                        | `deals_ledger`, `commitments_ledger`                  | `deals_ledger`, `event_log`                                        | Deal Ops Lead              |
| `/filing/*`          | PARA suggestions + approval                       | `para_index`, `mail_ledger`, `deals_ledger`           | `para_index`, `event_log`                                          | PKM/Data Architect         |
| `/graph/*`           | M365 read + draft/write (gated)                   | `graph_sync_ledger`, `mail_ledger`, `calendar_ledger` | `event_log`, `mail_ledger`, `calendar_ledger`, `graph_sync_ledger` | M365/Graph Architect       |
| `/learning/*`        | modifiers/affinity/meetings learnings             | `event_log`, `audit_ledger`                           | `trust_ledger` (learned prefs), `event_log`                        | Product + AI/LLM Architect |
| `/extraction/*`      | extract deadlines                                 | `mail_ledger`, `deals_ledger`                         | `commitments_ledger`, `event_log`                                  | AI/LLM Architect           |
| `/mcp`               | tool gateway                                      | tool-specific                                         | tool-specific                                                      | Platform Eng               |
| `/status`, `/doctor` | health checks                                     | `ops_ledger`, `graph_sync_ledger`                     | `event_log` (optional)                                             | Reliability Eng            |

---

## Plane 3 — Contract & Intelligence Fabric (Templates + Validators + Router + Codex lanes)

**Owner:** AI/LLM Architect (primary), Security/Compliance Lead

| Artifact                                          | Reads                               | Writes                                          | Primary Owner              |
| ------------------------------------------------- | ----------------------------------- | ----------------------------------------------- | -------------------------- |
| Templates (per route/output)                      | ledgers relevant to output          | `event_log` (generation), `audit_ledger`        | Product + AI/LLM Architect |
| Validators (schema/sections/bans/signature)       | model outputs + `policy_ledger`     | `trust_ledger` (pass/fail), `event_log`         | Security + Reliability     |
| Provider Router (`llm_provider.json`)             | `policy_ledger`, entity context     | `event_log` (routing decisions)                 | AI/LLM Architect           |
| Codex **Runtime Lane** (contract-bound synthesis) | ledgers + source pointers           | drafts → `draft_queue_ledger`, `event_log`      | AI/LLM Architect           |
| Codex **Builder Lane** (gated improvements)       | repo + `AGENTS.md` + `audit_ledger` | change requests (spec/tests/diff) → `event_log` | Platform Eng + Council     |

---

## Plane 4 — Connector Plane + Event Ingestion (dual-tenant)

**Owner:** M365/Graph Architect (primary), Integration Engineer, Security Lead

| Artifact                                             | Reads                            | Writes                                            | Primary Owner        |
| ---------------------------------------------------- | -------------------------------- | ------------------------------------------------- | -------------------- |
| Graph Tenant A profile                               | A-tenant sources                 | `event_log`, `graph_sync_ledger`                  | M365/Graph Architect |
| Graph Tenant B profile                               | B-tenant sources                 | `event_log`, `graph_sync_ledger`                  | M365/Graph Architect |
| Mail ingestion                                       | Outlook signals                  | `mail_ledger`, `triage_ledger`, `event_log`       | Integration Eng      |
| Calendar ingestion                                   | meetings/events                  | `calendar_ledger`, `meetings_ledger`, `event_log` | Integration Eng      |
| Draft output (Outlook drafts)                        | `draft_queue_ledger` + approvals | `mail_ledger`, `event_log`, `audit_ledger`        | M365/Graph Architect |
| (Future) Monday/DocuSign/Zoom/Teams/PACER connectors | system signals                   | `event_log`, domain ledgers                       | Integration Eng      |

---

## Plane 5 — State Plane (Event Log + Ledgers + Command Center projections)

**Owner:** PKM/Data Architect (primary), Reliability Engineer

| Object               | Reads                          | Writes                             | Primary Owner                  |
| -------------------- | ------------------------------ | ---------------------------------- | ------------------------------ |
| `event_log`          | (replay, audit, rebuild views) | append-only events from all planes | PKM/Data Architect             |
| `audit_ledger`       | UI + compliance review         | writes from Sidecar + approvals    | Security/Compliance            |
| `policy_ledger`      | governance checks, router      | derived from configs               | Council Policy Owner           |
| `ops_ledger`         | health/limits/pauses           | ops writes + scheduling            | Reliability Eng                |
| `graph_sync_ledger`  | connector health               | connector writes                   | M365/Graph Architect           |
| `mail_ledger`        | triage, drafting, briefs       | ingestion + mail moves/drafts      | Integration Eng                |
| `calendar_ledger`    | planning/meeting prep          | ingestion + event creation         | Integration Eng                |
| `meetings_ledger`    | prep/debrief                   | meeting workflows                  | EA/CoS Operator                |
| `triage_ledger`      | inbox state                    | triage workflows                   | Co‑Work Systems Architect      |
| `commitments_ledger` | briefs, GTD, planning          | extraction + user actions          | EA/CoS Operator                |
| `draft_queue_ledger` | approvals/execution            | draft generation + reviews         | EA/CoS Operator                |
| `deals_ledger`       | deal views/status              | deal routes + connectors           | Deal Ops Lead                  |
| `planning_ledger`    | timeblocks                     | planning route                     | EA/CoS Operator                |
| `para_index`         | filing retrieval               | filing approvals                   | PKM/Data Architect             |
| `trust_ledger`       | proof checks + confidence      | validators + learning              | Reliability + AI/LLM Architect |
| `deep_work_ledger`   | metrics                        | reporting                          | EA/CoS Operator                |

---

## Tools (27) — reads/writes by permission tier

### Read-only tools (16)

| Tool                    | Reads                                   | Writes                                  | Primary Owner        |
| ----------------------- | --------------------------------------- | --------------------------------------- | -------------------- |
| `ted_status`            | `ops_ledger`, `graph_sync_ledger`       | —                                       | Reliability Eng      |
| `ted_morning_brief`     | all ledgers                             | `event_log` (generated)                 | EA/CoS Operator      |
| `ted_eod_digest`        | all ledgers                             | `event_log` (generated)                 | EA/CoS Operator      |
| `ted_mail_list`         | `mail_ledger` (+ Graph if needed)       | —                                       | M365/Graph Architect |
| `ted_draft_generate`    | ledgers + source pointers               | `draft_queue_ledger`, `event_log`       | AI/LLM Architect     |
| `ted_deadlines`         | `mail_ledger`, `deals_ledger`           | —                                       | AI/LLM Architect     |
| `ted_deal_list`         | `deals_ledger`                          | —                                       | Deal Ops Lead        |
| `ted_deal_get`          | `deals_ledger`                          | —                                       | Deal Ops Lead        |
| `ted_meeting_upcoming`  | `calendar_ledger`                       | —                                       | EA/CoS Operator      |
| `ted_commitments_list`  | `commitments_ledger`                    | —                                       | EA/CoS Operator      |
| `ted_actions_list`      | `commitments_ledger`                    | —                                       | EA/CoS Operator      |
| `ted_waiting_for_list`  | `commitments_ledger`                    | —                                       | EA/CoS Operator      |
| `ted_timeblock_plan`    | `calendar_ledger`, `commitments_ledger` | `planning_ledger` (plan proposal event) | EA/CoS Operator      |
| `ted_deep_work_metrics` | `deep_work_ledger`                      | —                                       | EA/CoS Operator      |
| `ted_trust_metrics`     | `trust_ledger`, `audit_ledger`          | —                                       | Reliability Eng      |
| `ted_para_structure`    | `para_index`                            | —                                       | PKM/Data Architect   |

### Write tools (confirmation-gated, 11)

| Tool                      | Reads                                | Writes (always emits `event_log`)                                             | Primary Owner        |
| ------------------------- | ------------------------------------ | ----------------------------------------------------------------------------- | -------------------- |
| `ted_mail_move`           | `mail_ledger`                        | `mail_ledger`, `audit_ledger`                                                 | M365/Graph Architect |
| `ted_calendar_create`     | `calendar_ledger`                    | `calendar_ledger`, `audit_ledger`                                             | M365/Graph Architect |
| `ted_deal_create`         | `deals_ledger`                       | `deals_ledger`, `audit_ledger`                                                | Deal Ops Lead        |
| `ted_deal_update`         | `deals_ledger`                       | `deals_ledger`, `audit_ledger`                                                | Deal Ops Lead        |
| `ted_deal_manage`         | `deals_ledger`                       | `deals_ledger`, `commitments_ledger`, `audit_ledger`                          | Deal Ops Lead        |
| `ted_meeting_debrief`     | `meetings_ledger`                    | `meetings_ledger`, `commitments_ledger`, `draft_queue_ledger`, `audit_ledger` | EA/CoS Operator      |
| `ted_meeting_prep`        | `calendar_ledger`, `meetings_ledger` | `draft_queue_ledger`, `meetings_ledger`, `audit_ledger`                       | EA/CoS Operator      |
| `ted_commitment_create`   | `commitments_ledger`                 | `commitments_ledger`, `audit_ledger`                                          | EA/CoS Operator      |
| `ted_commitment_complete` | `commitments_ledger`                 | `commitments_ledger`, `audit_ledger`                                          | EA/CoS Operator      |
| `ted_action_create`       | `commitments_ledger`                 | `commitments_ledger`, `audit_ledger`                                          | EA/CoS Operator      |
| `ted_para_classify`       | `para_index`, source pointers        | `para_index`, `audit_ledger`                                                  | PKM/Data Architect   |

---

## Council validation checklist (quick)

- **Does every write tool emit an event + update a ledger + write an audit record?**
- **Do all entry paths converge into Sidecar before tool use?**
- **Are tenant boundaries enforced at connector + state layers (not just prompts)?**
- **Is Codex split into runtime lane vs builder lane with gated change requests?**
