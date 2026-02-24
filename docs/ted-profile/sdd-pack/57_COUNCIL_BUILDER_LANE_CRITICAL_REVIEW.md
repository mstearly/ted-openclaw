# SDD 57 — Council Critical Review: Builder Lane Plan (SDD 55/56)

**Generated:** 2026-02-24
**Status:** FINAL — 4 parallel research agents, 80+ sources reviewed
**Scope:** Validate Builder Lane implementation plan against 2024-2026 best practices; identify value left on the table
**Sources:** arXiv (12 papers), CHI/ICLR/NeurIPS (6 papers), Spotify/Netflix/Ramp engineering (5 blogs), Grammarly/Superhuman (4), Anthropic/DeepMind safety frameworks (3), NIST/ISACA governance (3), Smashing Magazine XAI guide, AlgorithmWatch, 40+ additional

---

## What the Plan Gets Right

The council confirms: **the core architecture is sound and well-validated.** Specifically:

1. **Config-only self-modification** — Confirmed as the safest approach by ISACA (2025), Anthropic RSP v2.2, and DeepMind FSF v3.0. The structural boundary (Track 1 can only write JSON, never code) matches enterprise best practice.

2. **Operator approval gate** — The 5-step pattern (observe → detect → propose → approve → apply) matches ServiceNow, Moveworks, Salesforce, Grammarly, Intercom. Constitutional AI production deployments report 65% auto-approved, 15% rejected, 20% escalated — the escalation band is where the most value is created.

3. **Phased thresholds** — The 5-phase progression (silent → observation → proposal → auto-apply → mature) is validated by Pep (Feb 2026), which achieves 80.8% preference alignment with 3-5x fewer interactions using structured dimension decomposition.

4. **Context bucketing** — Validated by Spotify's semantic tokenization (Nov 2025) and ForkMerge (NeurIPS 2024). Dimension isolation prevents the negative transfer problem where improving one task degrades another.

5. **Config snapshots + rollback** — Table-stakes per GoFast.ai (2025) and Stanford research (2025). Organizations lacking version control see longer debugging cycles and higher operational risk.

---

## Value Left on the Table

The research uncovered **6 high-value gaps and 4 medium-value gaps** in the current plan. Organized by impact.

### GAP 1: Missing Correction Signals (HIGH)

**The problem:** The Builder Lane currently plans to capture: draft rejections, draft edits, triage reclassifications, commitment corrections, and brief disengagement. But research shows these are only ~40% of the available signal.

**Signals we're missing:**

| Signal                                    | Type                   | Value                                                                                      | Research Source                                                                                          |
| ----------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **Send-without-edit**                     | Implicit positive      | Strongest confirmation signal — draft sent verbatim = current style is correct             | Grammarly on-device model (5M devices), Netflix implicit feedback                                        |
| **Edit distance / magnitude**             | Implicit quality score | Small edit (typo) vs. wholesale rewrite = very different signals                           | arXiv 2601.04461 (Jan 2026): behavioral patterns achieve 61.3% accuracy vs. 57.7% for stated preferences |
| **Time-to-edit**                          | Implicit               | Draft edited in 10 seconds = minor polish. Rewritten over 5 minutes = fundamental mismatch | VentureBeat Dec 2025 implicit signal catalog                                                             |
| **Section-level edits**                   | Implicit               | Operator edits greeting but not body = greeting style needs refinement specifically        | CLEA (HRI 2025): contrastive learning from edit diffs                                                    |
| **Draft rejection (delete without send)** | Implicit negative      | Draft discarded entirely = total failure for that context                                  | Superhuman AI: tracks accept/reject/modify                                                               |
| **Partial acceptance**                    | Implicit               | Keeps structure, rewrites tone = structure correct, voice wrong                            | Active Preference Optimization (ECML PKDD 2025)                                                          |

**Recommendation:** Add a `correction_signals.jsonl` ledger that records every operator interaction with a Ted output, tagged by: `signal_type` (edit/accept/reject/reclassify/override), `domain` (draft/triage/commitment/brief), `magnitude` (0.0-1.0 via edit distance), `latency_ms` (time from Ted output to operator action), `section_affected` (greeting/body/closing/urgency).

**Impact on plan:** Adds ~60 lines to sidecar (signal capture hooks on draft send, draft edit, draft delete handlers). Feeds into `detectCorrectionPatterns()` as richer evidence. No new routes needed — signal capture is passive.

---

### GAP 2: No Negative Evidence / Confidence Accumulator (HIGH)

**The problem:** The Builder Lane only learns from failures. It has no mechanism to learn from success. If Clint sends 50 drafts without editing them, that's the strongest possible signal that the current draft style is calibrated — but the system ignores it entirely.

**Research basis:** Netflix bandits (Eugene Yan), ACM KDD 2024 multi-task bandits, Grammarly on-device model (5M+ devices: "significant decrease in reverted suggestions" after learning from implicit accepts).

**Recommendation:** Add a confidence accumulator per config dimension:

```
{
  "dimension": "draft_email.greeting_style",
  "consecutive_accepts": 47,
  "last_correction_at": "2026-01-15T...",
  "confidence": 0.94
}
```

Rules:

- Each send-without-edit increments `consecutive_accepts`, raises `confidence` (logistic curve, diminishing returns)
- Each edit resets `consecutive_accepts` to 0, drops `confidence` proportional to edit magnitude
- Confidence decays slowly without new data (preferences may drift)
- When confidence > 0.90, that dimension is EXCLUDED from improvement proposals (don't fix what's working)
- **Critical safeguard:** Every 20-30 accepts, the system notes this as a calibration checkpoint — if the operator suddenly corrects after a long streak of accepts, that correction gets higher weight

**Impact on plan:** ~50 lines in sidecar (accumulator logic + storage in `builder_lane_status.jsonl`). Feeds into `detectCorrectionPatterns()` as a gating mechanism. No new routes needed.

---

### GAP 3: Correction Fatigue Detection (HIGH)

**The problem:** Users stop correcting over time — even when the AI is still wrong. ACM Computing Surveys (2024) documents this as "alert fatigue" in security operations. IBM (2025) reports operational toil rising to 30%. The risk: Ted stops improving because Clint stops correcting, and the system interprets silence as approval.

**Research basis:** Alert fatigue reaches onset after 7-8 exposures (Madgicx ML detection). Wang et al. (2024) propose active learning to select only high-value items for human validation.

**Recommendation:** Implement a "correction health monitor" that tracks:

- `correction_rate_7d`: rolling 7-day correction rate per domain
- `correction_rate_delta`: change vs. prior 7 days

**Three states:**

1. **Healthy learning**: correction rate stable or slowly declining, trust failures also declining → system is improving
2. **Suspected fatigue**: correction rate drops >50% in 7 days while trust failure rate stays constant → operator may have stopped checking
3. **Confirmed improvement**: both correction rate AND trust failures decline together → real improvement

When suspected fatigue detected, Ted surfaces in the next brief: "I noticed you haven't corrected any drafts in 2 weeks. Is my style hitting the mark, or have you stopped checking?"

**Impact on plan:** ~40 lines in sidecar (health monitor in `detectCorrectionPatterns()`). One new field in builder lane status response. UI shows health indicator on the Builder Lane card.

---

### GAP 4: Cold-Start Acceleration (HIGH)

**The problem:** The current plan waits passively for 10-25 corrections per dimension before the first proposal. That's 3-6 weeks of silence. Pep (Feb 2026) achieves 80.8% preference alignment with 3-5x fewer interactions using structured elicitation.

**Research basis:** Pep structured preference quiz, PersonalLLM (ICLR 2025), Superhuman sent-folder import, Algolia synthetic data bootstrapping.

**Recommendation:** Three-phase cold-start acceleration:

**Day 0 — Archetype selection during setup (5 minutes):**
Present 3-4 draft style archetypes: "Direct dealmaker" (short, bullets, action-first), "Thorough analyst" (narrative, citations, context-rich), "Relationship builder" (warm, context-rich, personal touch). Operator picks closest match. Pre-load corresponding `draft_style.json` values. Ted has a reasonable voice from the first draft.

**Day 1 — Sent-folder voice extraction (automated):**
Ted already scans `sentitems` in discovery pipeline. Add LLM-based style extraction: analyze 30-50 sent emails, extract greeting_style, closing_style, sentence_length_avg, formality_gradient per audience. Write results to `draft_style.json` voice_training block. This is documented but not implemented.

**Day 7+ — Correction flywheel takes over:**
The Builder Lane's phased thresholds activate. Archetype + voice extraction have collapsed 3-6 weeks of cold start to days.

**Impact on plan:** ~80 lines in sidecar (archetype config + voice extraction function). New route: `POST /ops/onboarding/voice-extract`. Extends existing discovery pipeline. This could be a separate sub-task or folded into Learning Mode (SDD 54).

**Note:** This overlaps with SDD 54 (Learning Mode). If Clint chooses to implement Learning Mode, the cold-start acceleration is built into it. If not, the Builder Lane should include a minimal version (archetype selection + basic voice extraction).

---

### GAP 5: Proactive Calibration Moments (MEDIUM-HIGH)

**The problem:** Ted never asks "did I get this right?" at moments when the answer would be high-signal and low-friction. CHI 2024/2025 research shows post-event timing is the best moment for feedback solicitation.

**High-signal moments already detectable by Ted:**

| Moment                            | Signal Quality | Friction                                 | How to Ask                                                                    |
| --------------------------------- | -------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| **After meeting debrief**         | Very high      | Very low (operator is already reviewing) | "I identified 3 commitments from that meeting. Did I get them right?"         |
| **After draft send (with edits)** | High           | Near zero                                | "You changed the tone for [recipient]. Remember this for future drafts?"      |
| **During EOD digest**             | Medium-high    | Low (batch context)                      | "How was Ted today?" — 3 thumbs up/down on key outputs                        |
| **After deal stage change**       | High (rare)    | Low                                      | "This deal moved to due diligence. Should I switch to detailed analyst tone?" |

**Constraints from research:**

- Never during deep work / focus time (respect quiet hours)
- Max 3 calibration prompts per day (APO research: diminishing returns, trust erosion beyond this)
- Never ask about something the operator can't immediately verify

**Impact on plan:** ~60 lines in sidecar (calibration prompt logic integrated into existing route handlers for debrief, draft execution, EOD). Small UI addition: thumbs-up/down in EOD digest card. Each calibration response = 3-5x a passive correction signal.

---

### GAP 6: Compound Improvement Dashboard (MEDIUM-HIGH)

**The problem:** Ted has 172 event types across 37 namespaces but no aggregation into operator-facing improvement metrics. There is no "how much better has Ted gotten?" view anywhere in the 24 operator cards.

**Research basis:** McKinsey (2024): companies tracking AI personalization impact see 20-30% higher ROI. Calabrio "Bot Experience Score" starts at 100, degrades on failures. The act of measurement itself drives adoption.

**Recommendation:** Add a "Ted Confidence Index" card to the operator dashboard:

- **Correction rate trend** (sparkline): corrections per 100 items processed, over last 30 days
- **Draft acceptance rate**: % of drafts sent without edits (tracks over time)
- **Monthly summary**: "47 emails drafted, 38 sent without edits (81%, up from 62% last month). 3 style corrections applied."
- **Config change markers**: vertical lines on the sparkline showing when config changes were applied
- **Progress bar**: "You've taught Ted 23 preferences. 78% of the way to fully personalized morning briefs."

**Impact on plan:** ~40 lines in sidecar (aggregation route: `GET /ops/builder-lane/improvement-metrics`). ~80 lines in UI (new dashboard card). This is the most visible operator-facing deliverable — it makes the Builder Lane tangible.

---

### GAP 7: Cross-Config Consistency Check (MEDIUM)

**The problem:** The current `applyImprovementProposal()` does a flat top-level merge into config files. A proposal that improves draft tone for deal counterparties could overwrite the tone rules for internal team emails. There is no dimension isolation.

**Research basis:** ForkMerge (NeurIPS 2024): "negative transfer might be severer when the task gradients are highly consistent." Spotify (2025): separate semantic dimensions with independent tuning. INFORMEDQX (AAAI 2024): minimal conflict set identification in over-constrained problems.

**Recommendation:**

1. Before applying any proposal, validate that the proposed changes don't contradict existing config in related dimensions
2. Add a static `config_interactions.json` mapping which config files affect which routes: `{urgency_rules -> [triage, morning_brief, escalation], draft_style -> [draft_email, eod_digest]}`
3. When applying a proposal to one dimension, check for pending proposals that affect overlapping dimensions

**Impact on plan:** ~30 lines (static config file + validation in `applyImprovementProposal()`). Low cost, prevents subtle regression bugs.

---

### GAP 8: Pre-Apply Constitution Check (MEDIUM)

**The problem:** When Ted generates an improvement proposal via LLM, there is no validation that the proposed changes are consistent with `hard_bans.json`. G-5 (removing `hard_bans` from allowedConfigs) is already planned in BL-002, but a proposal could still try to weaken governance indirectly (e.g., removing a word from `words_to_avoid` that's also in hard_bans).

**Research basis:** Anthropic Constitutional AI, ISACA (2025) drift prevention, 7-Layer Constitutional Guardrails pattern.

**Recommendation:** Before any proposal reaches the operator, validate it against `hard_bans.json`:

- No proposed config value may contradict a hard ban
- `words_to_avoid` entries can only be ADDED, never removed (already in SDD 55)
- Urgency thresholds cannot drop below a minimum floor
- If validation fails, proposal is logged as `blocked_by_constitution` and never surfaces

**Impact on plan:** ~25 lines in `validateProposal()`. Pure safety enhancement.

---

### GAP 9: Rubber-Stamping Detection (MEDIUM)

**The problem:** Ted tracks undertrust (high rejection rate) but not overtrust (rubber-stamping). CalTruIAS (Aug 2024) warns: "overtrust is as dangerous as undertrust." If Clint approves >95% of proposals within <30 seconds for 2+ weeks, he's not actually reviewing them.

**Research basis:** CalTruIAS model (PMC 2024), Dynamic Trust Simulation (IJHCS Sep 2024), Feature-Specific Trust (ICIS 2025).

**Recommendation:** Add an approval velocity monitor:

- Track `time_to_decision` on each proposal review
- If approval rate > 95% AND average time_to_decision < 30 seconds for 14+ days → suspected rubber-stamping
- Surface in brief: "You've approved 18 of 19 proposals in under 30 seconds. Take a moment to review recent changes."

**Impact on plan:** ~20 lines in sidecar (monitor in proposal review handler). Safety enhancement.

---

### GAP 10: Preference Drift Detection (MEDIUM)

**The problem:** The current plan uses a hard timestamp cutoff for correction evidence (`entries.filter(e => e.timestamp >= cutoff)`). All corrections within the window are treated equally regardless of recency. Research shows preferences drift over time, and recent corrections should be weighted higher.

**Research basis:** Drift (arXiv Feb 2025): decoding-time personalized alignment with attribute decomposition. Variable sliding windows outperform fixed windows. Adaptive systems detect behavioral shifts within 4.8 hours vs. 28 hours for rule-based.

**Recommendation:**

- Replace hard cutoff with exponential time decay: recent corrections weighted higher
- When recent corrections contradict older ones on the same dimension, flag for explicit confirmation: "Your recent corrections suggest you now prefer shorter morning briefs. Should I update? [Yes, I changed my mind] [No, one-off corrections]"
- Per-deal-type preferences: healthcare M&A may need different voice than tech deals

**Impact on plan:** ~40 lines in `detectCorrectionPatterns()` (decay weighting + conflict detection). Improves proposal quality.

---

## What NOT to Add (Over-Engineering Risks)

The research also identified patterns that would be over-engineering for Ted's single-operator context:

1. **N-of-1 switchback experiments** — Alternating configs on a schedule is statistically rigorous but operationally disruptive for a single operator. The 7-day shadow mode is sufficient. Reserve switchback for future multi-operator deployments.

2. **Embedding-based semantic contradiction detection** — Using cosine similarity to detect config conflicts is technically elegant but overkill for <10 config files with simple string values. The static `config_interactions.json` is enough.

3. **Contextual bandits for exploration/exploitation** — Presenting 2 draft variants for uncertain dimensions is high-value in theory but disruptive in practice for an executive. Clint doesn't want to pick between two emails — he wants one good one. Reserve for future "advanced mode."

4. **Autonomy certificates / formal audit export** — Useful for multi-operator enterprise deployments. Overkill for Clint. The existing event log and policy ledger serve this purpose.

5. **Active learning with deliberately wrong outputs** — Some research suggests injecting slightly-off outputs to test if the operator is still reviewing. This would destroy trust. Never do this.

---

## Revised Plan Impact

If the council's recommended additions are accepted:

| Addition                                          | Lines    | Priority    | Phase                               |
| ------------------------------------------------- | -------- | ----------- | ----------------------------------- |
| Correction signal ledger + capture hooks          | ~60      | HIGH        | Phase 1 (BL-001 extension)          |
| Confidence accumulator (negative evidence)        | ~50      | HIGH        | Phase 2 (BL-004 extension)          |
| Correction fatigue detection                      | ~40      | HIGH        | Phase 2 (BL-004 extension)          |
| Cold-start archetype selection + voice extraction | ~80      | HIGH        | Separate phase or SDD 54            |
| Proactive calibration moments                     | ~60      | MEDIUM-HIGH | Phase 3 (existing route extensions) |
| Improvement dashboard card                        | ~120     | MEDIUM-HIGH | Phase 3 (new UI card)               |
| Cross-config consistency check                    | ~30      | MEDIUM      | Phase 1 (BL-003 extension)          |
| Pre-apply constitution check                      | ~25      | MEDIUM      | Phase 1 (BL-002 extension)          |
| Rubber-stamping detection                         | ~20      | MEDIUM      | Phase 2 (BL-005 extension)          |
| Preference drift / time decay                     | ~40      | MEDIUM      | Phase 2 (BL-004 extension)          |
| **Total additions**                               | **~525** |             |                                     |

**Revised grand total:** ~1,040 (current plan) + ~525 (council additions) = **~1,565 lines**

---

## Council Seat-by-Seat Verdict

| Seat                   | Verdict                           | Key Finding                                                                                                                                                                                            |
| ---------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1 — Architecture**   | APPROVE with additions            | Correction signal ledger and confidence accumulator are the two highest-value additions. Core architecture holds.                                                                                      |
| **2 — Security**       | APPROVE with G-5 fix + G-8        | `hard_bans` in allowedConfigs is CRITICAL (already planned as BL-002). Pre-apply constitution check is the additional safety layer. Rubber-stamping detection closes the overtrust gap.                |
| **3 — UX**             | APPROVE with dashboard            | The improvement dashboard card (GAP 6) is the most important operator-facing deliverable. Without it, the Builder Lane is invisible. Proactive calibration moments (GAP 5) make the flywheel tangible. |
| **4 — Behavioral**     | APPROVE with drift detection      | Time-decay weighting (GAP 10) and fatigue detection (GAP 3) are necessary for the flywheel to be self-sustaining. Without them, the system can't distinguish "getting better" from "operator gave up." |
| **5 — Data Privacy**   | APPROVE                           | No new privacy surface. Correction signals contain the same data already in draft_queue.jsonl. Local storage only.                                                                                     |
| **6 — Product**        | APPROVE with cold-start           | Archetype selection (GAP 4) is the biggest UX win. Collapses 3-6 weeks of silence to "Ted sounds like me from day 1." This is the difference between adoption and abandonment.                         |
| **7 — Testing**        | APPROVE                           | Shadow mode with separate `shadow_eval.jsonl` ledger (from research) is more robust than the original in-place design. Proof scripts can validate all new components.                                  |
| **8 — Ops**            | APPROVE                           | Cost model unchanged. Correction signal capture is passive (no new LLM calls). Confidence accumulator is in-memory + periodic JSONL flush. Negligible impact.                                          |
| **9 — Healthcare M&A** | APPROVE with per-entity bucketing | Per-deal-type preferences from drift detection research are directly applicable. Everest deals may need different voice than Olumie deals. The dimension isolation in GAP 7 handles this.              |
| **10 — Clinical PHI**  | APPROVE                           | Shadow mode for Everest triage changes is the right safeguard. Correction signals from Everest emails have the same PHI exposure as existing ledgers. No new risk surface.                             |

**Final verdict: 10/10 APPROVE with recommended additions.**

---

## Research Bibliography

### Implicit Feedback & Correction Signals

- Users Mispredict Their Own Preferences for AI Writing Assistance (arXiv, Jan 2026)
- Reading Between the Lines: Scalable User Feedback via Implicit Sentiment (arXiv, Sep 2025)
- Teaching the model: Designing LLM feedback loops (VentureBeat, Dec 2025)
- Need Help? Designing Proactive AI Assistants for Programming (CHI 2025)
- CLEA: Contrastive Learning from Exploratory Actions (HRI 2025)

### Correction Fatigue & Alert Fatigue

- Alert Fatigue in Security Operations Centres (ACM Computing Surveys, 2024)
- Mitigating Alert Fatigue in Cloud Monitoring Systems (ScienceDirect, 2024)
- Alert Fatigue Reduction with AI Agents (IBM, 2025)
- ML Algorithms for Ad Fatigue Detection (Madgicx, 2025)

### Negative Evidence & Bandits

- Bandits for Recommender Systems (Eugene Yan)
- Modeling Implicit Feedback Based on Bandit Learning (ScienceDirect)
- Multi-Task Neural Linear Bandit (ACM KDD 2024)
- Explore, Exploit, Explain: Personalizing Recommendations with Bandits (Spotify Research)

### Multi-Dimensional Personalization

- Teaching LLMs to Speak Spotify: Semantic IDs (Spotify Research, Nov 2025)
- ForkMerge: Mitigating Negative Transfer (NeurIPS 2024)
- Proactive Gradient Conflict Mitigation in Multi-Task Learning (arXiv, Nov 2024)
- Netflix PRS Workshop 2025 (Shaped.ai)

### Cold-Start & Preference Elicitation

- Pep: Cold-Start Personalization via Structured World Models (arXiv, Feb 2026)
- PersonalLLM: Personalizing LLMs (ICLR 2025)
- PEBOL: Bayesian Optimization with LLM-Based Acquisition (RecSys 2024)
- Active Preference Optimization (ECML PKDD 2025)
- Mastering Cold Start Challenges (Shaped.ai)

### Safe Self-Modification & AI Safety

- ISACA: Inside the Risky Code of Self-Modifying AI (2025)
- Anthropic Responsible Scaling Policy v2.2 (Oct 2024)
- Google DeepMind Frontier Safety Framework v3.0 (Sep 2025)
- 7-Layer Constitutional AI Guardrails (2025)
- Reward Hacking in Reinforcement Learning (Lilian Weng, Nov 2024)

### Shadow Mode & Impact Analysis

- Ramp: AI Agent for Automated Merchant Classification (ZenML)
- AWS SageMaker Shadow Tests
- LaunchDarkly AI Configs (2025)
- Microsoft Engineering Fundamentals: Shadow Testing

### Rollback & Version Control

- Agent Versioning and Rollbacks: Lessons from Production Failures (GoFast.ai, 2025)
- Stanford: Systematic Version Control for AI Agents (2025)
- AI-Powered Progressive Delivery (Azati, 2026)

### Trust Calibration

- CalTruIAS: Calibrating Workers' Trust in Intelligent Automated Systems (PMC, Aug 2024)
- Dynamic Trust Simulation Model (IJHCS, Sep 2024)
- Feature-Specific Trust Calibration (ICIS 2025)
- Levels of Autonomy for AI Agents (Knight/Columbia, 2025)

### Explainability & Attribution

- Beyond The Black Box: Practical XAI For UX Practitioners (Smashing Magazine, 2025)
- CORTEX: Too Much to Trust? (arXiv, 2025)
- To Explain or Not? (Penn State, 2025)
- Unifying AI Attribution (Harvard D^3, 2025)
- AlgorithmWatch: Explainable AI Doesn't Work for Remote Services

### Preference Drift

- Drift: Decoding-time Personalized Alignments (arXiv, Feb 2025)
- Modelling Concept Drift in Recommender Systems (ACM TRecSys)
- Algorithmic Drift Simulation Framework (ScienceDirect, 2025)

### Compound Impact & Dashboards

- Google Cloud: KPIs for Gen AI
- AI Evaluation Metrics: User Satisfaction (Tabor, 2025)
- McKinsey: Building Trust in AI (2024)

### Proactive Calibration

- Enhancing UX Evaluation: Proactive Dialogue and Timing (CHI 2024)
- ProPerSim: Proactive and Personalized AI Assistants (2025)
- Developer Interaction Patterns with Proactive AI: 5-Day Field Study (2026)
- PROPER Framework (2026)

---

_Council review complete. 80+ sources across 4 research agents. Core architecture validated. 10 gaps identified with specific line-count estimates. All 10 seats approve with recommended additions. Total revised scope: ~1,565 lines._
