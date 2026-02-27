# SDD 175 - Council Feature Review 09: `email_handling`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `email_handling`

Current registry posture:

1. Plane: `experience`
2. Lifecycle: `mature`
3. Maturity: `3`
4. Fragility: `58`
5. Runtime signal families: `mail.*`, `draft.*`
6. Usage telemetry gap: all `usage_signals` fields are `null`

## 2. Internal implementation evidence reviewed

Council reviewed ingestion, triage, drafting, and action paths directly:

1. Inbox ingestion fetches unread Graph mail, performs duplicate suppression against ingestion + triage ledgers, and emits both `triage.ingested` and `ingestion.message.processed` events.
2. Ingestion quality is policy-scored (`duplicate_suppression_rate`, `parse_error_rate`) and emits `ingestion.quality.evaluated` plus reason codes when thresholds fail.
3. Mail listing endpoint enforces auth/token validity, supports folder/filter/pagination controls, writes mail ledger entries, and emits `mail.fetched` telemetry.
4. Draft generation uses LLM-first with template fallback, validates `draft_email` output contract, queues governed drafts, and emits `draft.queued`.
5. Commitment extraction endpoint fetches full message body, wraps content as untrusted, validates extraction output, and emits `extraction.commitment.detected` or guarded failure events.
6. Mail move endpoint supports idempotency key replay and emits auditable `mail.moved` events.
7. Draft send execution is intentionally separated to the draft state machine approval path (no direct send bypass from this feature).

Internal strengths confirmed:

1. Strong auth and failure-handling posture around Graph operations.
2. Practical never-dark fallbacks in both drafting and extraction.
3. Explicit telemetry coverage for ingestion, listing, drafting, moving, and extraction.

Observed implementation gaps:

1. Contract drift exists for `POST /graph/{profile_id}/drafts/generate`: route contract requires `candidates`, but runtime response emits `candidates_evaluated` and no `candidates` field.
2. Auto-ingestion and draft generation are inbox/body-preview centric; thread depth and attachment content are not first-class in core routing.
3. Registry notes already acknowledge missing semantic retrieval across historical email context.
4. `mail_moved` ledger currently hardcodes `from_folder: "inbox"`, which can distort telemetry when moving items from other folders.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked against modern co-work communication patterns:

1. Gmail Gemini workflows now convert inbox context into direct scheduling actions (email-to-calendar assist), reducing context-switch friction.
2. Slack AI guidance emphasizes conversational summarization and action extraction loops in daily collaboration surfaces.
3. Notion AI meeting notes workflow emphasizes extraction of decisions/actions and immediate operational follow-through.
4. Asana AI positioning emphasizes teammate-style workflow acceleration and action recommendation.
5. Microsoft Graph message APIs demonstrate robust lifecycle primitives (`list`, `sendMail`) that support higher-order orchestration safely.

Council inference:

1. Current feature is strong on governed transport and drafting mechanics.
2. Largest value gap is context depth and prioritization intelligence, not additional CRUD endpoints.

## 4. Overlap and missing-capability assessment

Keep:

1. `email_handling` remains the communication workflow feature for inbox-to-action execution.

Avoid-overlap rule:

1. `draft_state_machine` owns approval/execute transition control; `email_handling` must not introduce parallel send-state logic.

Missing capability:

1. Cross-thread semantic memory and priority scoring that blends sender importance, commitment risk, and deadline proximity.

## 5. Council actions (prioritized)

1. Align route contract and runtime response for draft-generation endpoint.
   - Owner: `council.contract`
   - Acceptance: response contract and implementation agree on required fields; contract tests enforce the final shape.
2. Add thread-aware and attachment-aware context extraction.
   - Owner: `council.experience`
   - Acceptance: ingestion and draft/extraction pipelines can include bounded thread history + attachment metadata under policy guardrails.
3. Implement semantic retrieval over recent mail history.
   - Owner: `council.state`
   - Acceptance: priority and drafting endpoints can query indexed recent history with citations and policy scope constraints.
4. Correct move telemetry provenance.
   - Owner: `council.governance`
   - Acceptance: `mail_moved` records true source folder and supports reliable movement analytics.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `inbox_triage_to_draft_action_loop`
   - `assistant_in_context_user_workflows`
   - `meeting_and_task_summary_assistance`
   - `template_driven_onboarding_and_activation`
   - `operator_digest_with_actionable_next_steps`
3. `source_refs.notes` should be updated to mark this deep re-review as passed.

## 7. Disposition

1. Keep feature active.
2. Prioritize semantic/thread-depth upgrades and contract alignment before expanding adjacent channels.
3. Continue recursive loop to feature 10.

## External references

1. Gemini in Gmail adding calendar events: https://workspaceupdates.googleblog.com/2025/03/add-events-to-google-calendar-using-gemini-in-gmail.html
2. Slack AI feature guide: https://slack.com/help/articles/25076892548883-Guide-to-AI-features-in-Slack
3. Notion AI meeting notes: https://www.notion.com/help/ai-meeting-notes
4. Asana AI overview: https://asana.com/ai
5. Microsoft Graph list messages: https://learn.microsoft.com/en-us/graph/api/user-list-messages?view=graph-rest-1.0
6. Microsoft Graph send mail: https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0
