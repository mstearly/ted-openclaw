# SDD 189 - Council Feature Review 23: `scheduler`

Date: 2026-02-27
Status: Completed (deep re-review + benchmark refresh)
Parents: SDD 151, SDD 166, SDD 194

## 1. Feature scope and current state

Feature: `scheduler`

Current registry posture:

1. Plane: `control`
2. Lifecycle: `graduated`
3. Maturity: `3`
4. Fragility: `40`
5. Dependencies: `draft_state_machine`, `self_healing`
6. Usage telemetry gap: `invocation_count_30d`, `adoption_ratio_30d`, and `success_rate_30d` are `null`

## 2. Internal implementation evidence reviewed

Council reviewed scheduler correctness and operational controls:

1. Scheduler config controls enablement, tick interval, failure backoff, and delivery mode (`config/scheduler_config.json`).
2. Cron parser supports ranges, steps, comma sets, and Sunday alias `7 -> 0` (`modules/scheduler.mjs`).
3. Tick loop enforces six execution gates: cron match, minute dedup, onboarding gate, notification budget, failure backoff, then execute (`modules/scheduler.mjs`).
4. Job catalog includes morning brief, eod digest, daily plan, inbox ingestion, builder-lane scan, and self-healing maintenance (`config/ted_agent.json`).
5. Scheduler emits explicit lifecycle and dispatch events (`scheduler.started`, `scheduler.tick.error`, `scheduler.dispatch.success|failed`).
6. Pending delivery ledger and acknowledgement endpoint provide operator traceability for scheduled outputs (`modules/scheduler.mjs`).

Internal strengths confirmed:

1. Scheduler is fail-aware and event-rich.
2. Execution gates are explicit and auditable.
3. Core job portfolio spans value delivery and system maintenance.

Observed implementation gaps:

1. Scheduler defaults to disabled, which can delay value and maintenance loops if not explicitly enabled.
2. No explicit jitter policy for load smoothing at scale.
3. Usage telemetry fields remain null.

## 3. External benchmark pass (deep research)

Research date: 2026-02-27.

Council benchmarked scheduler posture against modern reliability practices:

1. Kubernetes CronJob guidance reinforces predictable scheduling contracts, concurrency controls, and missed-run handling.
2. OpenTelemetry event guidance reinforces stable scheduler telemetry for incident diagnosis.
3. NIST AI RMF playbook reinforces controlled automation with pause and escalation semantics.

Council inference:

1. Scheduler design is governance-aligned.
2. Next leverage is operational hardening for large-scale and degraded network conditions.

## 4. Overlap and missing-capability assessment

Keep:

1. `scheduler` remains a control-plane dispatcher and should not be merged into `self_healing`.

Avoid-overlap rule:

1. Scheduler decides when jobs run; feature modules decide what each job does.

Missing capability:

1. Policy-level job jitter/concurrency settings and queue-age escalation SLOs.

## 5. Council actions (prioritized)

1. Add scheduler jitter and concurrency policy.
   - Owner: `council.control`
   - Acceptance: scheduler config defines max concurrent jobs and jitter windows per job class.
2. Add queue-age escalation controls.
   - Owner: `council.state`
   - Acceptance: pending-delivery age threshold emits escalation events and operator digest entries.
3. Add scheduler failure drill replay.
   - Owner: `council.qa`
   - Acceptance: replay covers paused mode, repeated failures, and recovery sequencing.
4. Populate usage telemetry fields.
   - Owner: `council.experience`
   - Acceptance: scheduler dispatch metrics feed feature `usage_signals` automatically.

## 6. Registry updates from this review

1. `research_profile.last_benchmark_date` reaffirmed as `2026-02-27`.
2. `research_profile.external_patterns` retained as:
   - `event_sourced_scheduler_with_idempotent_dispatch`
   - `priority_queue_with_pause_resume_semantics`
   - `stale_job_escalation_with_owner_ack`
   - `priority_queue_scheduler_with_pause_resume_and_escalation`
   - `policy_as_code_fail_closed_defaults`
   - `eval_driven_release_controls`
   - `human_approval_for_high_impact_changes`
   - `audit_reason_codes_and_traceability`
3. `source_refs.notes` should be updated to mark deep re-review pass.

## 7. Disposition

1. Keep feature active.
2. Prioritize jitter/concurrency and queue-age escalation controls.
3. Continue recursive loop to feature 24.

## External references

1. Kubernetes CronJobs: https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/
2. OpenTelemetry semantic events: https://opentelemetry.io/docs/specs/semconv/general/events/
3. NIST AI RMF playbook: https://airc.nist.gov/AI_RMF_Knowledge_Base/Playbook
