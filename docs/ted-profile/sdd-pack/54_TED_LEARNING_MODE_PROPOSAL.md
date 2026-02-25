# TED Learning Mode — Council Proposal & Research-Informed Design

**Generated:** 2026-02-24
**Status:** PROPOSAL — Council debate complete, research synthesized, awaiting operator review
**Scope:** Deep onboarding learning system + continuous learning architecture
**Council vote:** 10/10 seats in favor (with conditions noted per seat below)
**Research sources:** 4 parallel research domains — AI assistant onboarding patterns, writing style learning, enterprise AI adoption failures, knowledge graph construction from email

---

## Executive Summary

TED currently has _infrastructure_ (127 routes, 52 MCP tools, 24 UI cards) but no _world model_. TED knows how to create a deal but doesn't know what Clint's deals look like. TED can draft an email but doesn't know how Clint writes.

Learning Mode solves this by building a knowledge foundation from Clint's existing M365 data — email, calendar, SharePoint, Planner, To Do — then letting Clint review and correct TED's understanding before TED begins acting on his behalf.

**The research is unequivocal on one point:** every AI assistant product that required a "learning period" before delivering value has failed. Clara Labs, x.ai, Astro, Google Inbox, Cortana — all dead. The survivors (Reclaim AI, Lindy, Motion, Gmail Smart Compose, Superhuman) all deliver value on Day 1 and learn in the background.

**TED's Learning Mode must therefore follow the Day-1 Value principle:** scan in the background, deliver imperfect-but-useful output immediately, and refine through operator corrections.

---

## Part 1: What the Research Says — Lessons from Others' Mistakes

### 1.1 The Graveyard: Products That Got Learning Mode Wrong

| Product                                        | What Happened                                                                                                                                    | The Mistake                                                                                                                                                                                                           | Ted's Lesson                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Clara Labs** (2014-2021, dead)               | AI scheduling assistant via email. Raised ~$10M. Required massive human-in-the-loop labeling. Cold start took weeks of error-prone interactions. | Put unvalidated AI in front of _external contacts_ from Day 1. One wrong response to a client destroyed trust permanently.                                                                                            | Never expose unvalidated AI actions to external parties. Shadow/draft mode first.                                      |
| **x.ai / Amy Ingram** (2014-2021, acqui-hired) | AI scheduling assistant. Raised ~$100M. Extensive preference calibration required before any value delivered.                                    | Users had to teach Amy their preferences _before_ she could schedule a single meeting. Most abandoned before calibration was complete.                                                                                | Zero-value learning phases kill adoption. Deliver value immediately with explicit rules, refine with learned behavior. |
| **Astro** (email AI, acquired by Slack 2018)   | Email client with AI prioritization. Required scanning all email for its model. Couldn't explain why it prioritized what it did.                 | "Let me scan all your email" scared enterprise/healthcare users. Prioritization without context (no understanding of deals, relationships) was useless.                                                               | Request minimum data permissions first. Prove value on a narrow scope before requesting broader access.                |
| **Google Inbox** (2014-2019, killed)           | Reimagined email with AI bundling, smart replies, categorization.                                                                                | Opaque AI bundling buried important emails. Users couldn't understand _why_ emails were grouped. Smart Reply survived because it was transparent and optional. Bundling died because it was invisible and autonomous. | Every AI decision must be visible, explainable, and overridable. Transparent augmentation beats invisible automation.  |
| **Cortana** (2014-2023, deprecated)            | Microsoft's AI assistant. Tried to be everything — consumer voice, enterprise productivity, Outlook scheduler, Teams helper.                     | Passive (waited to be asked), unfocused (no clear value prop), and never leveraged M365 data effectively despite having access.                                                                                       | Be excellent at one narrow workflow before expanding. Embed in the workflow, don't be a separate destination.          |

**Source:** Industry post-mortems, McKinsey Global Survey on AI (70% of AI initiatives fail to move beyond pilot), Gartner Hype Cycle analysis.

### 1.2 The Survivors: Products That Got It Right

| Product                       | How They Solved Cold Start                                                                                                                       | Key Pattern                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| **Superhuman AI**             | Scans user's sent emails to build style profile. Useful after ~50 sent emails. Captures per-recipient style adaptation.                          | Learn from _existing behavior_ in _existing tools_, not new behavior in a new tool.                             |
| **Shortwave AI**              | RAG over full email history. Finds "last time you emailed this person about a similar topic" as style reference.                                 | Context-aware retrieval beats bulk style averaging.                                                             |
| **Reclaim AI**                | Users declare preferences explicitly (focus time, habits). AI optimizes within constraints, learns adjustments from observation.                 | Explicit-first, implicit-second. Be useful Day 1 with declared rules, layer learning on top.                    |
| **Lindy AI**                  | Template-based workflow builder. Users configure triggers/actions, AI refines over time. No unsupervised learning phase.                         | Start with user-defined rules, not inferred ones. Inference comes later as refinement.                          |
| **Glean** (enterprise search) | Connects to existing data sources, indexes automatically. Search works immediately. Personalizes results silently over time from click behavior. | Parasitize existing data. Zero manual entry required.                                                           |
| **Gmail Smart Compose**       | Federated learning across all users, with personalization layer. Personalization kicks in after ~50-100 accepted suggestions.                    | Base model does heavy lifting; personalization captures vocabulary and sign-off preferences (~15% improvement). |

### 1.3 Trust Calibration Research — The 10:1 Rule

**Source:** Lee & See (2004), "Trust in Automation"; Parasuraman & Riley (1997), "Humans and Automation"

- Trust is **asymmetric**: it takes 10 good experiences to recover from 1 bad one.
- Over-trust (automation bias) is MORE dangerous than under-trust — it leads to catastrophic failures that permanently destroy confidence.
- **Implication:** It is better to start with a system that users slightly under-trust (and are pleasantly surprised by) than one they over-trust (and are eventually betrayed by).
- **For TED:** Learning Mode should err heavily toward "here's what I would do — what do you think?" rather than "I did this for you."

### 1.4 Levels of Automation — The Sweet Spot

**Source:** Sheridan & Verplank (1978), 10 Levels of Automation; SAE J3016 (self-driving levels)

| Level | Description                             | Ted Application                                           |
| ----- | --------------------------------------- | --------------------------------------------------------- |
| 1     | Human does everything                   | No TED                                                    |
| 2     | Computer suggests alternatives          | "I found 3 possible deals in your email"                  |
| 3     | Computer narrows alternatives           | "This email looks like a deal update from Maurice"        |
| 4     | Computer suggests one action            | "I'd classify this as a Stage 2 update for Sunrise Manor" |
| **5** | **Computer executes if human approves** | **"I've drafted a commitment. Approve?"**                 |
| 6     | Computer executes, human can veto       | "I created a To Do task. Undo?"                           |
| 7     | Computer executes, informs human        | "Morning brief sent. Deal pipeline updated."              |

**Research consensus:** Level 5 is the sweet spot for building trust. It lets users see AI competence without bearing consequences of errors. The L2→L3 gap is where Tesla Autopilot killed people — semi-autonomous is the most dangerous zone.

**For TED:** Start at Level 2-3 during Learning Mode. Graduate to Level 5 after operator confirms understanding. Only reach Level 7 with explicit operator opt-in per workflow.

### 1.5 Knowledge Management — Why "Index Everything" Fails

**Source:** First-generation KM failures (1995-2005), modern approaches (Glean, Notion AI, Guru)

**The #1 KM killer:** Requiring users to manually enter knowledge before the system provides value. Empty knowledge base = zero value, but filling it requires enormous effort. Most KM initiatives died in this gap.

**Modern pattern (Glean, Notion AI):** Parasitize existing data sources. Connect to where knowledge already lives (email, calendar, docs). The AI extracts knowledge from existing tools — no manual entry required.

**For TED:** The discovery pipeline already does this correctly. The key enhancement is making the extracted knowledge _visible and correctable_ by the operator, not just stored in JSONL ledgers.

---

## Part 2: Voice & Style Learning — How to Write Like Clint

### 2.1 Industry Approaches

| Approach                                     | Sample Size    | Fidelity            | Infrastructure        |
| -------------------------------------------- | -------------- | ------------------- | --------------------- |
| Few-shot prompting (3-10 examples in prompt) | 3-10 emails    | Good for broad tone | Zero                  |
| Style profile extraction + few-shot hybrid   | 20-50 emails   | Very good           | Minimal (JSON config) |
| Fine-tuning (LoRA or full)                   | 50-200+ emails | Excellent           | Significant           |
| Correction-delta learning                    | Ongoing        | Compounds over time | Medium                |

**Recommendation for TED:** Hybrid approach (style profile extraction + few-shot + correction-delta).

### 2.2 Sample Size Milestones (from research)

| Examples              | What You Get                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| 5                     | Basic tone and formality matching. "Not embarrassing" first draft.                                         |
| 20                    | Vocabulary and greeting/sign-off patterns. Drafts feel "plausible."                                        |
| 50                    | Sentence structure and paragraph rhythm. Drafts feel "familiar."                                           |
| 100+                  | Subtle patterns emerge (hedging language, topic-specific vocabulary). Drafts feel "mine with minor edits." |
| 200+ with corrections | Deep personalization. Minimal editing needed.                                                              |

### 2.3 What to Extract from Sent Emails

From each sent email, extract:

- Word count, sentence count, average sentence length
- Greeting pattern ("Hi [Name]," vs "Hey" vs "Dear" vs none)
- Sign-off pattern ("Best," vs "Thanks," vs "— Clint" vs none)
- Formality markers (contractions, slang, hedging phrases)
- Structural pattern (single paragraph, bullets, numbered lists)
- Recipient relationship type (inferred from domain, thread history)
- Context classification (deal counterparty, internal team, investor, casual)

### 2.4 Continuous Learning from Draft Corrections

**Source:** Spark AI edit-delta approach, Superhuman implicit learning

The highest-signal continuous learning mechanism:

1. TED generates draft D
2. Clint edits to produce final version F
3. System stores (context, D, F) triple
4. Delta analysis extracts patterns: "always shortens paragraphs," "replaces 'utilize' with 'use'," "removes exclamation marks"
5. Future drafts incorporate these preferences

**Sample size:** 10-20 correction cycles for basic personalization. 50+ for strong adaptation.

**Failure mode to guard against:** Clint sometimes edits for _content_ (not style), polluting the style signal. Mitigation: distinguish structural edits (style) from factual edits (content) in delta analysis.

---

## Part 3: Relationship Graph — Metadata-First Architecture

### 3.1 The 80/20 Rule for Email Intelligence

**Source:** Affinity CRM, Salesforce Einstein Activity Capture, academic research (Diesner & Carley)

**You can build 80% of a useful relationship graph from email headers alone — no body parsing needed.**

| Signal                  | Source             | PHI Risk | Value                               |
| ----------------------- | ------------------ | -------- | ----------------------------------- |
| Communication frequency | From/To/CC headers | None     | High                                |
| Recency of contact      | Timestamp          | None     | High                                |
| Bidirectionality        | Reply chains       | None     | High                                |
| Response latency        | Timestamp deltas   | None     | Very High (strongest single signal) |
| Meeting co-attendance   | Calendar attendees | None     | High                                |
| Domain clustering       | Email addresses    | None     | Medium                              |
| Subject line keywords   | Subject header     | Low      | Medium                              |
| Full body content       | Message body       | HIGH     | Medium (for deals)                  |

**Response latency is the strongest single signal of relationship strength.** People respond faster to people they care about. (Agrawal et al., "Mining Email to Map Social Networks")

### 3.2 Relationship Strength Formula

```
strength(A, B) = Σ weight_i × recency_decay(age_i) × direction_multiplier_i

where:
  weight_i = 1.0 (direct To) | 0.3 (CC) | 0.5 (meeting co-attendee)
  recency_decay = exp(-age_days / half_life)  // half_life = 60 days
  direction_multiplier = 2.0 (bidirectional) | 1.0 (unidirectional)
```

### 3.3 Contact Enrichment (No LLM Required)

- **Signature parsing**: Regex-based extraction of title, company, phone from email signatures
- **Domain clustering**: Group contacts by company domain (`@broker.com`, `@lawfirm.com`)
- **Role inference**: Communication patterns reveal roles — hub-spoke = manager, broker = intermediary connecting disconnected clusters

### 3.4 Deal Signal Detection

**Source:** Gong, Chorus, Clari revenue intelligence approaches

Signals that indicate a deal in email:

1. New external domain appearing in threads (new relationship = possible deal)
2. Multi-party threads with broker/counsel domains
3. Keywords: "LOI," "operating agreement," "purchase price," "due diligence," "census"
4. Attachment patterns (proposals, contracts, NDAs)
5. Temporal acceleration (increasing frequency with a contact)
6. Executive involvement (C-suite emails from either side)

### 3.5 Scale Estimates for Clint's Mailbox

| Metric                                    | Estimate                    |
| ----------------------------------------- | --------------------------- |
| Daily email volume                        | 50-200                      |
| 90-day backlog                            | 5,000-15,000                |
| Header-only processing time               | <5 minutes for full backlog |
| LLM extraction (deal-relevant only, ~10%) | 500-1,500 emails            |
| LLM cost at ~$0.005/email                 | $2.50-$7.50 total           |
| Incremental daily processing              | Trivial (real-time capable) |

---

## Part 4: Microsoft Graph API — Efficient Extraction Patterns

### 4.1 Delta Queries Are the Key

**Source:** Microsoft Graph documentation (learn.microsoft.com)

Delta queries are the single most important pattern for Learning Mode:

1. **First call**: Gets ALL current data, returns `@odata.deltaLink` token
2. **Subsequent calls**: Returns only changes since last call
3. **Supported for**: messages, events, contacts, Planner tasks, To Do tasks, driveItems

```
Initial: GET /me/mailFolders/sentitems/messages/delta?$select=sender,subject,receivedDateTime,from,toRecipients
  → pages through all sent mail → stores deltaLink

Incremental: GET {deltaLink}
  → returns only new/changed/deleted since last call
```

### 4.2 Rate Limits and Pacing

| Parameter                 | Value                                                 |
| ------------------------- | ----------------------------------------------------- |
| Global limit              | 130,000 requests per 10 seconds per app               |
| Per-mailbox limit         | 10,000 requests per 10 minutes                        |
| Max page size (messages)  | 1,000 items with `$top`                               |
| **Recommended page size** | **100** (avoid 504 Gateway Timeout on large payloads) |
| 429 handling              | Respect `Retry-After` header, exponential backoff     |
| JSON batch max            | 20 requests per batch                                 |

### 4.3 Recommended Scan Strategy

**Phase A: Header-only scan (metadata-first)**

```
GET /me/mailFolders/sentitems/messages/delta
  ?$select=sender,subject,receivedDateTime,from,toRecipients,ccRecipients,importance
  &$top=100
  &$filter=receivedDateTime ge 2025-02-24T00:00:00Z
```

**Phase B: Sent mail body scan (voice extraction)**

```
GET /me/mailFolders/sentitems/messages
  ?$select=body,from,toRecipients,subject,receivedDateTime
  &$top=50
  &$filter=receivedDateTime ge 2025-11-24T00:00:00Z
```

Limit to 90 days of sent mail. LLM extraction for voice patterns on batches of 10-20 emails.

**Phase C: Incremental sync (ongoing)**

```
GET {stored_deltaLink}
```

Run every 5 minutes during business hours (already configured in ingestion cron).

### 4.4 What NOT to Scan

- Newsletters and marketing (filter by `$filter=importance eq 'high'` or sender domain allowlist)
- Automated notifications (O365 system messages, calendar notifications)
- Distribution list emails (high volume, low signal)
- Spam/Junk folders

---

## Part 5: Refined Architecture — Research-Informed Design

### 5.1 State Machine

```
UNCONFIGURED ──→ SCANNING ──→ REVIEW ──→ OPERATIONAL
     │              │            │             │
     │              │            │             ▼
     │              │            │        CONTINUOUS
     │              │            │        LEARNING
     │              ▼            │
     │          SCAN_PAUSED      │
     │          (resumable)      │
     └──────────────────────────┘
              (restart)
```

| State                 | Description                                                         | TED Behavior                                                  |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| `UNCONFIGURED`        | No Graph credentials. Setup not complete.                           | Setup wizard only. No scanning.                               |
| `SCANNING`            | Deep scan in progress. Background job.                              | Morning brief with static rules. Operator sees scan progress. |
| `SCAN_PAUSED`         | Scan interrupted (crash, network). Resumable from checkpoint.       | Same as SCANNING. Resume button in UI.                        |
| `REVIEW`              | Scan complete. Knowledge model ready for operator review.           | All knowledge cards visible. Confirm/Edit/Reject on each.     |
| `OPERATIONAL`         | Operator approved understanding. TED acting on confirmed knowledge. | Full feature set. Level 5 automation (propose + approve).     |
| `CONTINUOUS_LEARNING` | Always-on background state. Runs alongside OPERATIONAL.             | Draft corrections, triage feedback, deal stage corrections.   |

**Critical design decision:** TED delivers value during SCANNING state — it doesn't wait for scan completion. Morning briefs, draft queue, and basic deal tracking work with static rules from `operator_profile.json` while the scan runs in the background.

### 5.2 Knowledge Model Structure

```
knowledge_model/
  ├── contacts.jsonl          # Extracted contact entities
  ├── relationships.jsonl     # Weighted edges between contacts
  ├── deal_candidates.jsonl   # Deals identified from email patterns
  ├── voice_profile.jsonl     # Extracted writing style patterns
  ├── workflow_patterns.jsonl  # How Clint handles scenarios
  ├── scan_progress.jsonl     # Checkpoint for resumable scan
  └── corrections.jsonl       # Operator corrections (append-only)
```

Each entity has:

- `source_type`: "email_header" | "email_body" | "calendar" | "planner" | "todo" | "sharepoint" | "operator_correction"
- `confidence`: 0.0-1.0 (higher with more confirming signals)
- `first_seen` / `last_seen`: temporal bounds
- `confirmed`: null (unreviewed) | true | false
- `corrected_value`: operator's correction if confirmed=false

### 5.3 What Gets Extracted (Prioritized by Signal/Risk Ratio)

**Pass 1: Metadata-only (zero LLM cost, zero PHI risk)**

- Contact graph from email headers (From, To, CC)
- Communication frequency and recency per contact pair
- Response latency per contact pair
- Meeting frequency and co-attendance from calendar
- Domain clustering (company identification)
- Email volume patterns (when is Clint busiest?)

**Pass 2: Subject line analysis (minimal LLM cost, low PHI risk)**

- Deal-related keywords in subject lines
- Thread depth and participants per deal topic
- Temporal patterns (deal activity acceleration/deceleration)

**Pass 3: Sent mail body extraction (moderate LLM cost, voice training)**

- Greeting/sign-off patterns per recipient type
- Sentence structure and vocabulary analysis
- Formality gradient across contexts
- Communication style samples per category (deal, internal, investor, casual)
- PHI redaction applied before LLM processing

**Pass 4: Deal-relevant inbox body extraction (highest LLM cost, highest value)**

- Only emails matching deal contacts or deal keywords
- Commitment extraction (who owes what to whom)
- Action item identification
- Deal term mentions (price, timeline, conditions)
- PHI redaction applied before LLM processing

### 5.4 The Review Surface

**"TED's Understanding" — Operator Dashboard Card**

```
┌─────────────────────────────────────────────────┐
│  TED'S UNDERSTANDING                            │
│                                                  │
│  ┌──────────────┬────────┬────────┬───────────┐ │
│  │ Category     │ Found  │ Conf.  │ Status    │ │
│  ├──────────────┼────────┼────────┼───────────┤ │
│  │ Contacts     │ 47     │ 82%    │ ◉ Review  │ │
│  │ Active Deals │ 12     │ 71%    │ ◉ Review  │ │
│  │ Voice Profile│ 4 ctx  │ 65%    │ ◉ Review  │ │
│  │ Relationships│ 134    │ 78%    │ ◉ Review  │ │
│  │ Workflows    │ 8      │ 58%    │ ◉ Review  │ │
│  └──────────────┴────────┴────────┴───────────┘ │
│                                                  │
│  [Review Contacts] [Review Deals] [Review Voice] │
│                                                  │
│  Overall readiness: 67%                          │
│  [Activate TED] (unlocks after review)           │
└─────────────────────────────────────────────────┘
```

Each category expands to show individual entries with **Confirm / Edit / Reject** controls:

```
┌─────────────────────────────────────────────────┐
│  CONTACT: Maurice Washington                     │
│  Confidence: 89% (52 emails, 11 meetings)        │
│                                                  │
│  Role: Deal sourcing / facility operations       │
│  Entity: Everest (domain: everestmgt.com)        │
│  Communication: Weekly (Tuesdays), Word docs     │
│  Relationship: Strong (avg response: 2.1 hrs)   │
│                                                  │
│  [✓ Correct] [✎ Edit] [✗ Wrong]                │
└─────────────────────────────────────────────────┘
```

### 5.5 Graduation Criteria

TED displays readiness per category. The operator decides when to activate:

| Category      | Minimum for Activation           | How Measured                           |
| ------------- | -------------------------------- | -------------------------------------- |
| Contacts      | Top 20 contacts reviewed         | Operator confirm/edit/reject           |
| Deals         | All identified deals reviewed    | Operator confirm/edit/reject           |
| Voice         | 3 test drafts rated ≥ 7/10       | Operator rating after voice extraction |
| Relationships | Deal contact mapping reviewed    | Operator confirms who-owns-what        |
| Workflows     | Maurice update pattern confirmed | Operator confirms intake understanding |

**The operator can activate at any time** — there is no hard gate. If Clint wants to activate after reviewing only contacts and deals, he can. The system warns about unreviewed categories but does not block.

### 5.6 Continuous Learning (Post-Graduation)

| Signal               | Source                            | Destination                  | Frequency               |
| -------------------- | --------------------------------- | ---------------------------- | ----------------------- |
| Draft edits          | Draft queue approve/edit/reject   | voice_profile.jsonl          | Every draft interaction |
| Triage corrections   | Inbox ingestion review            | Triage classifier weights    | Every correction        |
| Deal stage overrides | Deal pipeline UI                  | Deal stage model             | Every override          |
| Commitment edits     | Commitment extraction review      | Extraction prompt refinement | Every edit              |
| Morning brief rating | Brief UI thumbs up/down           | Content selection model      | Daily                   |
| Stale deal flags     | Operator response to stale alerts | Staleness threshold tuning   | Weekly                  |

All signals flow through `learning_signals.jsonl` → Codex Builder lane → improvement proposals.

---

## Part 6: Council Conditions and Per-Seat Notes

### Seat 1 — Agentic AI Architect

**Vote:** YES. This is the missing piece — the world model that makes TED an agent rather than a tool set.
**Condition:** State machine must be enforced. SCANNING and REVIEW states must be real gates in the code, not just UI labels.

### Seat 2 — Human Factors

**Vote:** YES. Critical for trust calibration.
**Condition:** Review UI must be low-friction. One-click confirm/reject. Never show more than 10 items at a time. Group by confidence level (high first).

### Seat 3 — Orchestration Engineer

**Vote:** YES. Technically sound with delta queries.
**Condition:** Scan must be resumable from checkpoint. If sidecar crashes during scan, it picks up where it left off using scan_progress.jsonl.

### Seat 4 — Evals Specialist

**Vote:** YES.
**Condition:** Track precision and recall of each extraction category. Surface accuracy metrics in the operator dashboard so Clint can see whether TED is getting better over time.

### Seat 5 — Security & Compliance

**Vote:** YES with conditions.
**Condition:** PHI redaction before ALL LLM calls (already enforced). Knowledge model must not store raw email bodies — only structured extractions. Entity isolation between Olumie and Everest knowledge models. Same execution boundary policy applies.

### Seat 6 — Product Lead

**Vote:** YES. This IS the adoption playbook come to life.
**Condition:** Day 1 value is non-negotiable. TED must produce a morning brief during SCANNING state using whatever data is available (even if it's just calendar events).

### Seat 7 — Data Privacy

**Vote:** YES.
**Condition:** Metadata-first approach (Pass 1-2) runs by default. Body extraction (Pass 3-4) requires explicit operator opt-in. `Mail.ReadBasic` scope is sufficient for metadata passes; `Mail.ReadWrite` for body passes.

### Seat 8 — Platform Reliability

**Vote:** YES.
**Condition:** Rate limiting at 100 requests per 10 seconds (well under Graph API limits). Progress reporting to UI. Background processing that doesn't block HTTP server.

### Seat 9 — Healthcare M&A Operations

**Vote:** YES. Most important feature for real-world utility.
**Condition:** Deal vocabulary extraction must be validated against real deal lifecycle. Maurice's update format needs special handling (Word docs with inconsistent tables). Broker communication patterns must be learned per-broker, not averaged.

### Seat 10 — Clinical PHI Specialist

**Vote:** YES with conditions.
**Condition:** Learning Mode is the highest PHI risk phase (scanning thousands of emails vs. dozens daily). Everest entity emails need additional scrutiny. Extraction prompts must include explicit PHI exclusion instructions. Knowledge review UI must flag entries that might contain inadvertent PHI.

---

## Part 7: Implementation Approach (High Level)

### What's New vs. What Extends

| Component                 | Status                           | Action                                                         |
| ------------------------- | -------------------------------- | -------------------------------------------------------------- |
| `runDiscoveryPipeline()`  | Exists (90d email, 60d calendar) | Extend with delta queries, metadata passes, voice extraction   |
| Ingestion JSONL ledger    | Exists                           | Add scan_progress.jsonl checkpoint                             |
| Knowledge model ledgers   | New                              | contacts.jsonl, relationships.jsonl, voice_profile.jsonl, etc. |
| Review UI                 | New                              | "TED's Understanding" card with confirm/edit/reject            |
| Learning state machine    | New                              | UNCONFIGURED → SCANNING → REVIEW → OPERATIONAL                 |
| Voice extraction pipeline | New                              | Sent mail analysis → style profile → draft_style.json          |
| Continuous learning       | Partially exists (Codex Builder) | Add learning_signals.jsonl, correction tracking                |
| Graduation gate           | New                              | Readiness dashboard, operator-controlled activation            |

### Estimated Scope

| File               | New Lines | Change Type                                                             |
| ------------------ | --------- | ----------------------------------------------------------------------- |
| server.mjs         | +800-1200 | Deep scan pipeline, knowledge model, voice extraction, review endpoints |
| index.ts           | +300-400  | Gateway methods for review/approve/activate, agent tools                |
| views/ted.ts       | +400-500  | Understanding review card, contact/deal/voice review panels             |
| controllers/ted.ts | +200-250  | Review controllers, activation, learning signal tracking                |
| types.ts           | +100-150  | Knowledge model types, review state types                               |
| config/            | +50-100   | Learning mode config, voice extraction prompts                          |
| event_schema.json  | +20-30    | learning.\* event types                                                 |

### What the Operator Needs to Provide

1. **Azure AD credentials** (already blocked as JC-056b/c) — required for ALL Graph API access including Learning Mode
2. **Scope consent** — `Mail.ReadBasic` minimum for metadata scan; `Mail.ReadWrite` for body extraction
3. **Time** — 30-60 minutes across Days 3-5 to review TED's understanding cards
4. **Corrections** — ongoing edit-delta signal from draft queue interactions

### What the Operator Does NOT Need to Provide

- ~~20-30 manually selected sent emails~~ (Learning Mode scans sent mail automatically — C12-002 is subsumed)
- ~~Manual contact entry~~ (extracted from email headers)
- ~~Deal stage mapping~~ (inferred from email patterns, confirmed in review)
- ~~Explicit voice training session~~ (extracted from sent mail corpus)

---

## Part 8: The Three Design Decisions Requiring Operator Input

### Decision 1: Scan Depth

| Option                     | Timeframe    | Emails Scanned   | LLM Cost | Time     | Best For                              |
| -------------------------- | ------------ | ---------------- | -------- | -------- | ------------------------------------- |
| **Shallow**                | 90 days      | ~5,000-10,000    | ~$5      | ~30 min  | Fast start, recent context only       |
| **Standard** (recommended) | 1 year       | ~20,000-40,000   | ~$20     | ~2 hrs   | Good balance of history and cost      |
| **Deep**                   | Full archive | ~50,000-100,000+ | ~$50-100 | ~4-8 hrs | Maximum learning, but noise increases |

**Council recommendation:** Standard (1 year). Captures full deal lifecycle for active deals. Going deeper increases noise without proportional value increase.

### Decision 2: LLM Provider for Extraction

| Option                                 | Provider                                   | Cost/Email | HIPAA Status            | Latency                         |
| -------------------------------------- | ------------------------------------------ | ---------- | ----------------------- | ------------------------------- |
| **Production provider**                | Same as daily operations                   | Higher     | Compliant (for Everest) | Real-time optimized             |
| **Extraction-optimized** (recommended) | Cheaper model (Claude Haiku / GPT-4o-mini) | ~60% lower | Needs BAA check         | Slightly slower, fine for batch |

**Council recommendation:** Use production provider for Everest entity (HIPAA required), extraction-optimized model for Olumie entity (no PHI risk). Per-entity routing already exists via `selectLlmProvider()`.

### Decision 3: Knowledge Persistence Model

| Option                                         | How It Works                                               | Pros                                                          | Cons                          |
| ---------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------- |
| **Mutable**                                    | Operator edits directly modify knowledge entries           | Simpler, intuitive                                            | No audit trail of corrections |
| **Append-only with corrections** (recommended) | Original extraction preserved. Corrections layered on top. | Full audit trail, reversible, pattern analysis on corrections | Slightly more complex queries |

**Council recommendation:** Append-only with corrections. This is consistent with TED's existing JSONL dual-write architecture. The correction overlay enables the Codex Builder lane to analyze _what TED gets wrong_ and propose systematic improvements.

---

## Part 9: Research Bibliography

### AI Assistant Onboarding & Cold Start

- Lindy AI (lindy.ai) — Template bootstrapping, explicit-first approach
- Reclaim AI (reclaim.ai) — Declared preferences, progressive learning
- Motion (usemotion.com) — Immediate value, learned estimation
- Clara Labs / x.ai — Cautionary: autonomous before competent = death
- Fin by Intercom — Bounded domain RAG works; unbounded doesn't
- Glean — Parasitize existing data, zero manual entry

### Writing Style & Voice Learning

- Superhuman AI — Sent email scanning, per-recipient adaptation, ~50 emails minimum
- Shortwave AI — RAG over email history, context-aware retrieval for style
- Spark AI — Edit-delta correction learning, highest signal density
- Gmail Smart Compose (Chen et al., 2019) — Federated personalization, ~15% improvement from personal layer
- Jasper AI Brand Voice — Few-shot + description hybrid, 3-5 samples minimum
- OpenAI Fine-Tuning Guide — 50-100 examples sweet spot for style

### Trust Calibration & Automation Levels

- Lee & See (2004), "Trust in Automation" — 10:1 trust asymmetry, calibration principles
- Parasuraman & Riley (1997), "Humans and Automation" — Use/misuse/disuse/abuse framework
- Sheridan & Verplank (1978), Levels of Automation — 10-level scale, Level 5 sweet spot
- SAE J3016 — L0-L5 driving automation (narrow L4 beats broad L2)
- Amershi et al. (2019), "Guidelines for Human-AI Interaction" (Microsoft Research) — 18 guidelines for AI interaction design

### Enterprise AI Adoption

- McKinsey Global Survey on AI (2024) — 70%+ AI initiatives fail beyond pilot
- Gartner Hype Cycle — Trough of Disillusionment, managed expectations for recovery
- Fountaine et al. (2019), HBR, "Building the AI-Powered Organization" — Trust architecture required
- Davenport & Prusak (1998), "Working Knowledge" — KM failure patterns

### Knowledge Graph & Email Intelligence

- Diesner & Carley, "Exploration of Communication Networks from the Enron Email Corpus" — Header-only analysis reveals org structure
- Agrawal et al., "Mining Email to Map Social Networks" — Response latency as strongest relationship signal
- Affinity CRM — Relationship intelligence from passive email sync
- Salesforce Einstein Activity Capture — Header-based matching, no body parsing needed
- Microsoft Graph People API — Built-in relevance ranking from communication patterns

### Microsoft Graph API

- Graph Throttling Guidance — 130K/10s, 429 Retry-After, exponential backoff
- Delta Query Overview — Incremental sync, deltaLink/nextLink pattern
- JSON Batching — 20 max, dependsOn sequencing, individual throttling
- Paging Guide — $top=100 recommended, @odata.nextLink opaque
- Change Notifications — Webhook subscriptions, delta+webhook combination

### RAG Pitfalls

- Lewis et al. (2020), "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" — Original RAG paper
- Barnett et al. (2024), "Seven Failure Points When Engineering a RAG" — Context pollution, entity confusion, chunking failures
- Brown et al. (2020), GPT-3 Paper — Few-shot in-context learning for style tasks
- Min et al. (2022), "Rethinking the Role of Demonstrations" — Format matters more than labels

---

_Filed by the Council. TED Learning Mode — Research-Informed Design Proposal. Awaiting operator review on 3 design decisions and implementation approval._
