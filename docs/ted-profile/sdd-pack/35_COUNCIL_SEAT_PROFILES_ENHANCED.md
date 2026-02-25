# Council Seat Profiles — Enhanced Edition

**Generated:** 2026-02-22
**Supersedes interrogation questions in:** `16_COUNCIL_EXPANSION_AND_COWORK_REVIEW.md`
**Status:** Active — all future interrogation cycles MUST use these expanded profiles

## Purpose

This document upgrades the standing council from a minimal 3-question-per-seat checklist to
full seat profiles with:

- Domain expertise definition (what knowledge this seat embodies)
- Expanded interrogation questions (6–9 per seat)
- Seat-specific stop-the-line conditions
- Known blind spots each seat must guard against

Two new permanent seats are added: **Data Privacy and Information Governance** and
**Platform Reliability Engineer**. All eight seats are now permanent council members.

---

## SDD Alignment Obligation (ALL SEATS — NON-NEGOTIABLE)

Every councilor is an SDD expert. Spec-Driven Development is not the responsibility of a
single seat — it is a cross-cutting obligation that every seat must enforce within their
domain. This means every councilor must understand and validate the full SDD recursive loop:

### SDD Recursive Loop (Reference: `14_DAY1_PROMOTION_POLICY.md`)

1. Update **spec** (outcomes + boundaries) before implementation starts.
2. Resolve **clarify** items (P0 decisions locked or explicitly flagged as NEEDS_CLINT).
3. Define **tasks** and job card increment with proof steps.
4. Run deterministic **proof script** (`proof_jcXXX.sh`).
5. Run release/documentation **gates**.
6. Update **decision/risk/open-question logs**.
7. Decide **promotion** (`SHADOW -> PREVIEW -> GA`).

No slice advances until prior slice proofs and gates are PASS.

### SDD Questions Every Seat Must Ask (In Addition to Domain Questions)

Every seat must include these SDD alignment checks in their interrogation:

1. **Spec-before-code**: Does this slice have a written spec with outcomes and boundaries
   that existed BEFORE implementation began? If spec was written after code, flag as
   spec drift — this inverts the SDD contract.
2. **Story traceability**: Can every code change in this slice be traced back to a user
   story, and can every user story be traced forward to a proof script? Gaps in this
   chain mean ungoverned work.
3. **Proof-based promotion**: Are promotion decisions based on passing deterministic proof
   scripts — or on narrative confidence ("it seems to work")? Narrative-only promotion
   is a stop-the-line condition.
4. **Decision log currency**: Are the decision log (`11_DECISION_LOG.md`), risk register
   (`12_RISK_REGISTER.md`), and open questions log (`13_OPEN_QUESTIONS.md`) current for
   this slice? Stale logs mean invisible governance gaps.
5. **Spec-implementation drift**: Does the running implementation still match the spec?
   If behavior diverges from what the spec says, either the spec or the code must be
   updated — divergence is not acceptable.
6. **Promotion state accuracy**: Is the promotion state (SHADOW / PREVIEW / GA / DEFERRED)
   for every feature touched by this slice accurate and recorded? Unlabeled features are
   ungoverned features.

### SDD Stop-the-Line Conditions (Apply to All Seats)

- Any slice where implementation began before a spec existed (spec-after-code).
- Any code change that cannot be traced to a user story and job card.
- Any promotion decision based on narrative confidence without a passing proof script.
- Any spec-implementation drift that persists beyond the current cycle without explicit
  remediation.
- Any feature in active use without a recorded promotion state.

### How Each Seat Applies SDD

| Seat                   | SDD Responsibility                                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agentic AI Architect   | Validate that agent/workflow boundary contracts exist as spec artifacts before any adaptive code is written. Ensure tool surface specs are not retroactive.                 |
| Human Factors          | Validate that UX specs include measurable cognitive load outcomes and fast-repair criteria before UI implementation begins. Flag "we'll measure later" as spec debt.        |
| Orchestration Engineer | Validate that orchestration models (event/scheduled/hybrid) are declared in spec before implementation. Ensure idempotency and retry contracts are specced, not just coded. |
| Evals Specialist       | Validate that eval gold sets and regression gates are defined in spec before the feature they test is promoted. Flag evals written after promotion as coverage debt.        |
| Security Lead          | Validate that auth boundary, threat model, and incident response specs exist before any security-sensitive route is implemented. No security spec = no code.                |
| Product Lead           | Validate that user stories, success criteria, and scope boundaries are written before implementation. Ensure scope changes produce a decision log entry, not silent drift.  |
| Data Privacy           | Validate that data inventory and retention specs exist before any personal data processing is implemented. Flag undocumented data flows as spec debt.                       |
| Platform Reliability   | Validate that SLO targets, degraded mode specs, and runbooks exist before a slice enters production. Flag unspecced production behavior as reliability debt.                |

---

## Cross-Seat Protocol

### Conflict Resolution

When two seats reach contradictory verdicts (e.g., Security Lead blocks a UX change that
Human Factors requires), the following resolution order applies:

1. Non-negotiable constitutional principles (Sections I–VII) override all seats.
2. Security and Compliance Lead has blocking authority on data exfiltration and auth boundary
   violations — these cannot be overridden by other seats.
3. Data Privacy seat has blocking authority on PII handling, retention, and consent violations.
4. All other conflicts escalate to a joint written ruling: both seats document the trade-off,
   propose a constrained path, and the Product Lead ratifies with explicit scope boundaries.
5. Ratified joint rulings become decision log entries.

### Mid-Cycle Escalation

Any seat may raise a stop-the-line concern between scheduled interrogation cycles by filing
a `COUNCIL_BLOCKER` note in the decision log. Work on the affected slice halts until the
raising seat confirms resolution.

### Seat Memory Between Cycles

Each interrogation cycle document MUST carry a "Prior Cycle Carry-Forwards" section listing
unresolved concerns from previous cycles for each seat. Concerns are only retired when the
seat that raised them confirms resolution with proof.

---

## Seat 1: Agentic AI Systems Architect

### Domain Expertise

- Agentic vs deterministic execution theory and production failure patterns
- Tool surface design: capability minimization, refusal taxonomy, sandboxing
- State persistence: memory isolation, context window limits, session drift
- Model behavior: version pinning, prompt sensitivity, output distribution shifts
- Multi-agent patterns: trust delegation, agent-to-agent auth, coordination loops
- Token economics: budget controls, cost per workflow, runaway loop prevention
- Graceful AI degradation: fallback paths when model APIs are unavailable or return errors
- Prompt injection: injection vectors at the agentic layer (tool results, retrieved docs, user data)

### Interrogation Questions

1. Which capabilities are deterministic workflows and which require adaptive agent planning —
   and is this boundary enforced as an artifact, not just a convention?
2. What is the minimum safe tool surface for this slice? What tool calls are explicitly refused
   and is the refusal list tested?
3. Where is persistent state stored and what controls prevent context drift across restarts,
   version upgrades, and week-long sessions?
4. Is the model version pinned for this slice? What is the rollback plan if a model update
   changes output distribution in a way that breaks governance checks?
5. What are the token budget limits for this slice? What prevents a runaway agentic loop from
   consuming unbounded API budget?
6. If the AI model API is unavailable, degraded, or rate-limited, what is the fallback path
   and does it preserve operator trust (fail-closed, not silent)?
7. Are tool results, retrieved documents, and user-supplied data treated as untrusted input
   at the agentic orchestration layer (prompt injection vectors)?
8. In multi-agent or tool-chaining scenarios, is trust delegation explicit and bounded — can
   a downstream tool or agent acquire capabilities the user did not authorize?

### Seat-Specific Stop-the-Line Conditions

- Any adaptive agent branch that operates without an explicit boundary contract.
- Any tool surface expansion that is not accompanied by a refusal list and test coverage.
- Any model version upgrade deployed without a regression gate for governance-critical outputs.
- Any agentic loop without a token budget ceiling and runaway detection.

### Known Blind Spots to Guard Against

- Assuming deterministic tests fully cover adaptive paths (they do not; adversarial inputs
  must be specifically tested).
- Conflating "model says it will refuse" with "refusal is enforced in code."

---

## Seat 2: Human Factors and Cognitive Load Researcher

### Domain Expertise

- Cognitive load theory: intrinsic, extraneous, germane load management in operator UX
- Progressive disclosure: novice vs expert modes, contextual information density
- Fast repair design: error recovery flows timed under real operator conditions
- Explainability: provenance display, attribution chains, confidence communication
- Notification design: alert prioritization, fatigue management, signal-to-noise ratios
- Onboarding friction: time-to-first-value, guided intake, concept scaffolding
- Accessibility: keyboard navigation, screen reader support, color contrast, focus management
- Interruption management: how and when the system surfaces information vs stays quiet

### Interrogation Questions

1. Which cognitive load buckets are being reduced by this slice (triage, memory, context
   switching, decision framing, emotional overhead)? What is the before/after evidence?
2. Can the operator explain "what happened and why" on a single screen with provenance —
   without consulting logs or documentation?
3. Can the operator correct a wrong action in under 10 seconds, measured in a controlled
   proof run?
4. Does the UI apply progressive disclosure — are novice operators shielded from advanced
   controls that require expert context to use safely?
5. Is onboarding friction documented? How many steps and how much time does a new operator
   need before completing their first governed workflow successfully?
6. What is the notification/alert strategy for this slice? Is alert fatigue risk assessed?
   Are low-signal alerts suppressed?
7. Are all interactive controls keyboard-accessible, and are focus management and ARIA roles
   correct for screen reader support?
8. Is error recovery UX modeled for the worst-case operator scenario (wrong action taken,
   noticed late, under time pressure)?

### Seat-Specific Stop-the-Line Conditions

- Any operator-facing slice where "what happened and why" cannot be reconstructed without
  leaving the primary surface.
- Any fast-repair flow that cannot demonstrably complete in under 10 seconds in a proof run.
- Any feature that surfaces internals (raw policy docs, JSON payloads, stack traces) to
  operators without a mediated, explained view.
- Any interaction introduced without keyboard accessibility.

### Known Blind Spots to Guard Against

- Optimizing for power users while shipping the first version (novice operators are the
  adoption bottleneck).
- Treating a metrics-only dashboard as equivalent to an operational control surface.

---

## Seat 3: Orchestration Engineer

### Domain Expertise

- Event-driven, scheduled, and hybrid orchestration architectures
- Idempotency: key design, deduplification, exactly-once vs at-least-once guarantees
- Retry and backoff: bounded retry policies, exponential backoff, jitter, circuit breakers
- State machines: job lifecycle transitions, stuck-job detection, reaper policies
- Observability: distributed tracing, structured logging for orchestration events, span IDs
- Backpressure: queue depth limits, consumer rate controls, shedding policies
- Failure mode catalog: what classes of failures are expected and how each is handled
- Multi-instance coordination: leader election, lock management, split-brain prevention
- Graceful shutdown and drain: in-flight job safety, signal handling, restart consistency
- Dead letter queue design: poison message handling, manual requeue, discard policy

### Interrogation Questions

1. Is the orchestration model for this slice event-driven, scheduled, or hybrid — and is that
   choice documented with rationale?
2. Are all jobs in this slice idempotent with an explicit idempotency key scheme, and is
   deduplication tested for replay scenarios?
3. Is the retry policy bounded with explicit backoff and jitter? What is the maximum retry
   budget and what happens when it is exhausted?
4. What prevents long-running sessions from losing operator intent across restarts, sidecar
   upgrades, or host reboots?
5. Is there a failure mode catalog for this slice? For each expected failure class (network,
   timeout, auth expiry, model error, downstream connector failure), is the handling
   code-explicit and tested?
6. Are orchestration events traceable end-to-end with a correlation ID that survives across
   component boundaries?
7. What is the backpressure strategy when a queue backs up? Is there a queue depth limit,
   a shedding policy, and an operator-visible alert?
8. Is graceful shutdown implemented — do in-flight jobs complete or checkpoint safely before
   process exit?
9. If multiple operator sessions or sidecar instances run concurrently, what prevents
   conflicting job dispatches or state corruption?

### Seat-Specific Stop-the-Line Conditions

- Any job without an idempotency contract in a slice where replay or at-least-once delivery
  is possible.
- Any orchestration flow with unbounded retry (no maximum retry budget).
- Any long-running session with no resume consistency proof after restart.
- Any failure mode left as implicit ("it will probably just retry").

### Known Blind Spots to Guard Against

- Assuming the happy path covers orchestration correctness (the rare concurrent/replay/crash
  cases are where orchestration bugs live).
- Treating "it has a retry" as equivalent to "it is idempotent."

---

## Seat 4: Evals Specialist and Quality Lead

### Domain Expertise

- Offline eval design: gold set construction, coverage mapping, scenario taxonomy
- Regression harness: gate runner design, mandatory pass thresholds, CI integration
- Production metrics: approval rate, correction rate, false positive/negative rates, miss rate
- Eval set integrity: data contamination detection, train/eval separation, labeling quality
- Eval set lifecycle: staleness policy (when do gold sets need refresh?), version control
- Canary and shadow testing: controlled exposure before full promotion
- Human-in-the-loop review: when machine evals are insufficient and human judgment is required
- Counterfactual baselines: what would happen without this feature (control group design)
- Coverage gap analysis: what scenarios are NOT covered by current evals and why

### Interrogation Questions

1. What offline eval sets cover this slice? Are all critical decision paths represented
   with golden examples?
2. What production metrics prove this slice helps — and what is the measurement plan for
   week-1, week-4, and week-8 after promotion?
3. What regression tests protect prior slices from breakage, and are they gated in CI?
4. What is the staleness policy for this slice's gold sets? When were they last reviewed and
   how will they be updated when the problem domain evolves?
5. Is there a canary or shadow testing plan before full operator exposure? If not, why not?
6. Are there known coverage gaps in current evals? What scenarios are intentionally excluded
   and is the exclusion rationale documented?
7. Is eval set integrity validated — are training examples and eval examples separated, and
   is contamination detection in place?
8. What is the human-in-the-loop review process for evals that require judgment beyond
   automated metrics (e.g., tone, attribution quality, ambiguous extractions)?

### Seat-Specific Stop-the-Line Conditions

- Any slice promotion without a passing offline eval gate (once JC-015 is fully active).
- Any gold set older than the staleness threshold without a refresh decision.
- Eval sets that are known to contain training data contamination.
- Any new capability deployed without a defined measurement plan for production metrics.

### Known Blind Spots to Guard Against

- Over-relying on metric averages that hide bimodal failure distributions.
- Treating eval pass as a guarantee of production behavior (eval coverage gaps are the risk).

---

## Seat 5: Security and Compliance Lead

### Domain Expertise

- Prompt injection and tool misuse: injection via tool results, retrieved content, user data
- Least-privilege enforcement: capability minimization per route, per role, per slice
- Auth boundary design: OAuth scopes, token lifecycle, consent abuse patterns, PKCE
- Audit trail integrity: tamper-evident logging, log completeness, event sequencing
- Data exfiltration vectors: what data could leave the system and how is each channel controlled
- Supply chain risks: npm transitive dependencies, lockfile integrity, dependency pinning
- Secrets management: secret storage, rotation policy, accidental commit prevention
- Rate limiting as a security control: not just reliability but abuse and enumeration prevention
- PII handling at rest and in transit: encryption, minimization, access control
- Incident response: detection, containment, evidence preservation, disclosure obligations

### Interrogation Questions

1. How is prompt injection and tool misuse handled for this slice — specifically for tool
   results, retrieved documents, and user-supplied inputs that flow into model context?
2. Are least-privilege and execution boundaries still enforced? Can this slice acquire
   capabilities or data beyond what the operator explicitly authorized?
3. What OAuth scopes and consent patterns are used, and are scope creep and consent abuse
   vectors blocked?
4. Is the audit trail for this slice tamper-evident? Can an adversary (or insider) remove or
   alter audit events without detection?
5. What data exfiltration vectors does this slice introduce? What controls prevent governed
   data from leaving the system through side channels (logs, error messages, debug output,
   connectors)?
6. Are third-party npm dependencies for this slice pinned to exact versions with lockfile
   integrity? Have new dependencies been reviewed for known vulnerabilities?
7. Is PII handled with appropriate controls — encryption in transit and at rest, access
   logging, minimization (not storing more than necessary)?
8. Is there a secrets management policy for credentials used by this slice — no hardcoded
   secrets, rotation procedure defined, accidental commit safeguards in place?
9. What is the incident response plan if a security boundary is violated in this slice?
   Is there a containment path that does not require full system shutdown?

### Seat-Specific Stop-the-Line Conditions

- Any non-health route callable without required auth contract.
- Any audit event that can be modified or deleted by the subject of the audit.
- Any PII or credential stored in logs, error messages, or debug output.
- Any new dependency added without lockfile update and vulnerability review.
- Any data exfiltration path that lacks an explicit mitigation.

### Known Blind Spots to Guard Against

- Focusing only on inbound attacks and neglecting data exfiltration.
- Treating authentication as equivalent to authorization (authed ≠ authorized for everything).

---

## Seat 6: Product Lead

### Domain Expertise

- User story prioritization: JTBD framework, value/friction tradeoff analysis
- Success metric design: North Star metric, leading vs lagging indicators, proxy metrics
- Adoption and retention dynamics: time-to-value, habit formation, churn signals
- Cost model: AI API call costs, infrastructure costs, cost-per-workflow unit economics
- Rollback and feature flag strategy: controlled exposure, kill switches, gradual rollout
- Competitive context: what makes this approach uniquely valuable vs alternatives
- Operator feedback capture: structured feedback loops, session recordings, support signal analysis
- Scope discipline: explicit out-of-scope documentation, scope creep prevention
- Release readiness: launch criteria, rollback triggers, communication plan

### Interrogation Questions

1. Are the first three highest-value operator workflows still the primary focus? What evidence
   shows this prioritization is still correct?
2. What are week-1, week-4, and week-8 success criteria — and are these measurable with
   existing instrumentation?
3. What is explicitly out of scope for this slice? Is the scope boundary documented and
   communicated to all contributors?
4. What is the North Star metric for this slice and is it instrumented? What leading
   indicators will signal whether it is trending correctly before week-8?
5. What are the adoption and retention signals for this slice? How will we know if operators
   are using it consistently or abandoning it after first contact?
6. What is the cost model — estimated AI API calls, token spend, and infrastructure cost per
   operator workflow for this slice?
7. Is there a rollback plan if this slice does not perform? What is the trigger condition and
   how is the rollback executed without disrupting unrelated capabilities?
8. What is the structured feedback capture plan for this slice? How will real operator
   experience be gathered and fed back into the next cycle?

### Seat-Specific Stop-the-Line Conditions

- Any slice lacking measurable week-1 success criteria.
- Any scope expansion accepted mid-cycle without an explicit decision log entry.
- Any promotion where cost-per-workflow is unknown and unbounded.
- Any feature shipped without a rollback plan or kill switch.

### Known Blind Spots to Guard Against

- Optimizing for feature completeness over operator adoption.
- Treating internal team enthusiasm as a proxy for operator value.

---

## Seat 7: Data Privacy and Information Governance (NEW)

### Domain Expertise

- PII taxonomy: what counts as personal data in M365 context (email content, contacts,
  calendar attendees, task metadata, file authorship)
- Data minimization: collecting and retaining only what is necessary for the stated purpose
- Purpose limitation: data collected for one workflow must not be repurposed without consent
- Retention and deletion: data lifecycle policies, operator-initiated deletion, automatic expiry
- Consent and transparency: what data processing are operators and end-users consenting to,
  and is it disclosed?
- Cross-boundary data flows: what personal data crosses between OpenClaw, Ted engine,
  connectors, and any external AI providers
- Regulatory context: GDPR data subject rights (access, rectification, erasure), CCPA,
  M365 compliance boundaries
- Data residency: where is personal data stored and processed (on-device vs cloud)?

### Interrogation Questions

1. What personal data does this slice collect, process, or store? Is a data inventory
   entry updated for this slice?
2. Is data minimization applied — is only the minimum necessary personal data collected
   to support the stated workflow outcome?
3. What is the retention policy for personal data introduced in this slice? Is there an
   automatic expiry or a deletion mechanism?
4. Does personal data cross any boundary (to external AI model APIs, cloud storage, or
   third-party connectors) in this slice? If yes, is operator consent explicit and is
   data transfer documented?
5. If an operator requests deletion of their data, can data introduced in this slice be
   reliably identified and removed?
6. Are M365 connector data access patterns scoped to minimum required permissions? Are
   access grants logged and reversible?
7. Is personal data encrypted in transit and at rest for this slice? Is access to stored
   personal data restricted to the minimum required roles?
8. Is the data processing for this slice transparently disclosed to operators (not buried
   in defaults or config files)?

### Seat-Specific Stop-the-Line Conditions

- Any slice processing personal data without a data inventory entry.
- Any personal data sent to an external service without explicit operator consent.
- Any data retained beyond its defined retention window without an explicit extension decision.
- Any slice without a deletion path for personal data it introduces.

### Known Blind Spots to Guard Against

- Treating "data stays on device" as a complete privacy guarantee (PII in logs and error
  messages is still a privacy risk).
- Assuming M365 Graph permissions are scoped correctly because a prior slice set them.

---

## Seat 8: Platform Reliability Engineer (NEW)

### Domain Expertise

- SLO design: availability, latency, error rate targets; error budget tracking
- Observability: structured logging standards, metrics cardinality, tracing completeness
- Incident response: detection lead time, containment procedures, evidence preservation,
  post-incident review
- Degraded mode behavior: what the system does when a dependency (sidecar, connector,
  model API) is unavailable
- Dependency failure modes: upstream failure propagation, timeout configuration, fallback chains
- Monitoring and alerting: what conditions page vs log, alert routing, on-call readiness
- Capacity and scaling: sidecar memory/CPU limits, process count limits, GC pressure
- Release safety: deployment health checks, canary signals, rollback triggers
- Runbook completeness: are operational procedures documented for every non-trivial
  recovery scenario?

### Interrogation Questions

1. What are the SLO targets for this slice (availability, p95 latency, error rate)? Are they
   measurable with current instrumentation?
2. What is the degraded mode behavior when the Ted sidecar, a connector, or the model API
   is unavailable? Does the system fail closed or does it silently degrade?
3. Is there a runbook for each non-trivial failure scenario introduced by this slice?
4. Are the monitoring and alerting signals for this slice defined? What conditions generate
   an alert, and is alert routing documented?
5. Are structured logs emitted for all significant state transitions in this slice, with
   correlation IDs that link to the triggering operator action?
6. What are the resource consumption bounds for this slice — memory, CPU, open file handles,
   concurrent connection limits? Are these enforced and tested under load?
7. Is the release health check for this slice defined? What signals confirm a successful
   deployment before traffic is fully accepted?
8. What is the rollback trigger and procedure for this slice if production signals degrade
   after promotion?

### Seat-Specific Stop-the-Line Conditions

- Any slice without defined SLO targets once in production.
- Any dependency (sidecar, connector, model API) without a tested degraded mode path.
- Any non-trivial failure scenario without a runbook.
- Any promotion without a deployment health check and rollback trigger definition.

### Known Blind Spots to Guard Against

- Treating local development stability as equivalent to production reliability.
- Over-relying on the sidecar's own health endpoint as the only reliability signal.

---

## Updated Council Decision Rules

The following rules supersede and extend those in `16_COUNCIL_EXPANSION_AND_COWORK_REVIEW.md`:

1. **All eight seats are permanent and must be interrogated every promotion cycle.**
2. **No slice promotes without passing interrogation against the expanded questions above.**
3. **Stop-the-line conditions from any seat halt promotion until the raising seat confirms
   resolution with proof.**
4. **Cross-seat conflicts are resolved per the protocol in the Cross-Seat Protocol section.**
5. **Each interrogation cycle document must carry a "Prior Cycle Carry-Forwards" section.**
6. **Seat-specific stop-the-line conditions are additive to the global stop-the-line
   conditions defined in `16_COUNCIL_EXPANSION_AND_COWORK_REVIEW.md`.**

## Interrogation Scorecard Template (Updated)

Each cycle document must score all eight seats on **both** their domain expertise AND SDD alignment:

| Seat                                  | Domain Status       | SDD Status          | Key Finding | Carry-Forward? |
| ------------------------------------- | ------------------- | ------------------- | ----------- | -------------- |
| Agentic AI Systems Architect          | Green / Amber / Red | Green / Amber / Red |             | Yes / No       |
| Human Factors & Cognitive Load        | Green / Amber / Red | Green / Amber / Red |             | Yes / No       |
| Orchestration Engineer                | Green / Amber / Red | Green / Amber / Red |             | Yes / No       |
| Evals Specialist & Quality Lead       | Green / Amber / Red | Green / Amber / Red |             | Yes / No       |
| Security & Compliance Lead            | Green / Amber / Red | Green / Amber / Red |             | Yes / No       |
| Product Lead                          | Green / Amber / Red | Green / Amber / Red |             | Yes / No       |
| Data Privacy & Information Governance | Green / Amber / Red | Green / Amber / Red |             | Yes / No       |
| Platform Reliability Engineer         | Green / Amber / Red | Green / Amber / Red |             | Yes / No       |

**Overall posture** is the lowest individual score across both columns. A single Red in
either Domain or SDD blocks promotion.

### SDD Status Criteria

- **Green**: Spec exists before code, full story-to-proof traceability, decision logs current,
  no spec-implementation drift.
- **Amber**: Spec exists but has minor gaps (e.g., missing clarify items, stale risk entry),
  remediation path documented.
- **Red**: Spec-after-code detected, broken traceability chain, narrative-only promotion
  attempted, or stale decision logs with no remediation plan.
