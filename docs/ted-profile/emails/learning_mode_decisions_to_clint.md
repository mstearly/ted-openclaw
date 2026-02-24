# Email: Ted Learning Mode — 3 Quick Decisions Needed

**To:** Clint Phillips
**From:** Matt Stearly
**Date:** 2026-02-24
**Subject:** Ted Learning Mode — 3 Quick Decisions Needed
**Reference:** SDD 54 — TED Learning Mode Proposal

---

Clint,

The council completed their design for Ted's Learning Mode — the deep onboarding scan that builds Ted's understanding of your world before he starts creating deals, tasks, and drafts on your behalf. Research-backed, all 10 seats voted in favor.

Three decisions need your input before we build it. Each has a council recommendation — you can go with those or override.

**1. How far back should Ted scan your email/calendar?**

| Option                     | Timeframe    | Estimated Cost | Time       |
| -------------------------- | ------------ | -------------- | ---------- |
| Shallow                    | 90 days      | ~$5            | ~30 min    |
| **Standard (recommended)** | **1 year**   | **~$20**       | **~2 hrs** |
| Deep                       | Full archive | $50-100        | 4-8 hrs    |

Council says 1 year. Covers a full deal lifecycle for active deals without picking up noise from ancient history. 90 days is fine for a fast start but misses older relationships and deal patterns.

**2. Which AI model should Ted use for the scan?**

For Everest (healthcare/HIPAA), we use the production model — non-negotiable.

For Olumie, we can use a cheaper extraction model (~60% lower cost) since there's no PHI risk. Same quality for pattern extraction, just not the premium tier.

Council says: production for Everest, cheaper model for Olumie. Your call if you want production across the board.

**3. When you correct Ted's understanding, how should corrections work?**

- **Option A: Direct edit** — you change it, old value is gone. Simple.
- **Option B: Correction overlay (recommended)** — original extraction is preserved, your correction layers on top. Full audit trail. Ted can learn from the pattern of _what he got wrong_ and improve systematically.

Council strongly recommends Option B. It matches Ted's existing architecture and feeds the Codex Builder improvement loop.

---

**What happens after you decide:**

Ted scans in the background. While scanning, he's still useful — morning briefs, draft queue, triage all work with the static rules we've already configured. The scan builds a knowledge model (contacts, relationships, deal candidates, your writing voice) that you review and correct before Ted graduates to active mode.

The key insight from the research: every AI assistant that made users wait for learning to finish before delivering value is dead (Clara Labs, x.ai, Astro). Ted delivers value Day 1 and gets smarter in the background.

Just reply with your picks — even "go with council recommendations on all 3" works.

— Matt
