# SDD 168 - Council Feature Review 02: `calendar_awareness`

Date: 2026-02-27
Status: Completed (deep review + benchmark refresh)
Parents: SDD 151, SDD 166

## 1. Feature scope and current state

Feature: `calendar_awareness`

Current registry posture:

1. Plane: `experience`
2. Lifecycle: `mature`
3. Maturity: `3`
4. Fragility: `50` (registry), `22` (latest feature-health snapshot)
5. Dependencies: none

Latest health snapshot (governance ledger):

1. `freeze=false`
2. `escalation=false`
3. `research_required=false`
4. `low_usage=true`

## 2. Internal implementation evidence reviewed

Council reviewed the calendar and meeting lifecycle implementation:

1. Graph-backed calendar listing with bounded window and enriched event fields (`subject`, `attendees`, `body`, `organizer`, `location`, time data).
2. Upcoming meetings endpoint with prep-readiness and open-commitment enrichment.
3. Meeting prep generation using event details, attendee domains, related deals, and open commitments.
4. Meeting debrief flow that extracts deliverables, creates commitments, and queues follow-up drafts.
5. MCP-exposed meeting tools (`ted_meeting_upcoming`, `ted_meeting_prep`, `ted_meeting_debrief`) for controlled operator workflows.

Primary code evidence:

1. `sidecars/ted-engine/server.mjs`
2. `sidecars/ted-engine/config/route_contracts.json`
3. `sidecars/ted-engine/tests/contracts.test.mjs`
4. `sidecars/ted-engine/tests/gateway-contracts.test.mjs`

## 3. External benchmark pass (modern co-work leaders)

Research date: 2026-02-27.

Council benchmarked this feature against current co-work calendar and meeting patterns:

1. Microsoft Graph guidance emphasizes calendar event retrieval with attendee/body/timezone handling and contextual meeting experiences.
2. Google Workspace Gemini updates show calendar actions from Gmail (create/edit/delete events and schedule queries, web and mobile).
3. Slack huddles now include AI huddle notes with action-item capture in canvas artifacts.
4. Notion AI Meeting Notes and Notion Calendar emphasize automatic transcription/summaries, action items, and event-linked meeting workflows.
5. Atlassian Team Calendars emphasizes cross-calendar integration, recurring scheduling, and embedded planning views.

## 4. Overlap and gap assessment for `calendar_awareness`

Overlap (already covered well):

1. Event + attendee context ingestion for meeting-aware workflows.
2. Prep and debrief lifecycle hooks connected to commitments and drafts.
3. Calendar-backed upcoming meeting awareness with operational enrichment.

Missing or underdeveloped value opportunities:

1. No AI-first meeting notes mode comparable to huddle/meeting note auto-capture patterns.
2. Limited operator-facing scheduling automation (for example, suggested slots or auto-reschedule recommendations).
3. Limited cross-surface meeting artifact unification (single meeting object spanning prep, notes, commitments, follow-ups, and outcomes score).

Feature-overlap finding:

1. No destructive overlap requiring merge with other features.
2. Some opportunity overlap with `task_management` and `knowledge_retrieval` should be coordinated via shared meeting object contracts, not feature collapse.

## 5. Council recommendations (prioritized)

1. Add AI meeting-note capture mode (opt-in, consent-aware) linked to existing debrief pipeline.
   - Outcome: stronger action extraction quality and less manual post-meeting load.
2. Add scheduling-assist actions (best-time recommendations and conflict-aware slot suggestions).
   - Outcome: faster coordination and higher operator throughput.
3. Introduce unified meeting artifact model across prep/debrief/commitments/drafts.
   - Outcome: less fragmentation and better lifecycle observability.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` set to current cycle.
2. `research_profile.external_patterns` set to:
   - `timezone_aware_calendar_fetch_and_render`
   - `ai_assisted_calendar_actions_from_inbox`
   - `meeting_notes_to_action_items_pipeline`
   - `unified_meeting_object_across_tools`
3. Source notes updated to mark this feature review as completed.

## 7. Disposition

1. Keep feature as-is structurally (`no merge` / `no deprecate`).
2. Prioritize calendar value expansion work in activation waves.
3. Continue recursive loop on next pending feature: `config_migration`.

## External references

1. Microsoft Graph events API: https://learn.microsoft.com/en-us/graph/api/user-list-events?view=graph-rest-1.0
2. Microsoft Graph overview (meeting context scenarios): https://learn.microsoft.com/en-us/graph/overview
3. Google Workspace update (Gemini add-to-calendar from Gmail): https://workspaceupdates.googleblog.com/2025/03/add-events-to-google-calendar-using-gemini-in-gmail.html
4. Google Workspace update (Gemini calendar actions on mobile): https://workspaceupdates.googleblog.com/2025/05/reference-google-calendar-using-gemini-in-gmail-on-mobile.html
5. Slack AI huddle notes: https://slack.com/help/articles/31377193680019-Use-AI-to-take-huddle-notes-in-Slack
6. Slack huddles notes/canvas workflow: https://slack.com/help/articles/4402059015315-Use-huddles-in-Slack
7. Notion AI Meeting Notes: https://www.notion.com/help/ai-meeting-notes
8. Notion Calendar: https://www.notion.com/product/calendar
9. Atlassian Team Calendars: https://www.atlassian.com/software/confluence/team-calendars/
