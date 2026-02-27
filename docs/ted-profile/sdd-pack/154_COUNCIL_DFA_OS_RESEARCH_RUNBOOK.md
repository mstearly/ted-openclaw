# SDD 154 - DFA-OS Research Trigger Runbook

Date: 2026-02-27
Status: Active

## Purpose

Define a deterministic research loop for feature changes that cross fragility, maturity, or strategic low-usage thresholds.

## Trigger Sources

1. `feature.fragility.evaluated` events from `/ops/feature-health`
2. `feature.research.triggered` events persisted to `artifacts/governance/research_triggers.jsonl`
3. Low-usage opportunities from `artifacts/governance/feature_opportunities.jsonl`

## Trigger Conditions

1. `fragility_score >= research_trigger_policy.thresholds.fragility_score`
2. `maturity_score <= research_trigger_policy.thresholds.maturity_score` with user-impacting requests
3. Strategic feature listed in `research_trigger_policy.strategic_feature_ids` and low usage below threshold

## Research Quality Bar

1. Prefer primary vendor and standards sources (official docs, standards bodies, peer-reviewed publications).
2. Capture publication date and access date for every source.
3. Require explicit design delta: what changes in TED architecture and why.
4. Require explicit QA delta: which tests/contracts/gates must change.
5. Require explicit security delta: which controls and OWASP mappings change.

## Cadence

1. Weekly: review new research triggers and assign owners.
2. Monthly: generate low-usage opportunity brief.
3. Quarterly: run comparative review against leading agentic platforms and update board summary.

## Artifacts

1. `docs/ted-profile/sdd-pack/LOW_USAGE_FEATURE_OPPORTUNITY_BRIEF.md`
2. `docs/ted-profile/sdd-pack/153_COUNCIL_DFA_OS_BOARD_SUMMARY.md`
3. `docs/ted-profile/sdd-pack/APPENDIX_SOURCES.md` (source appendix updates)

## Operational Steps

1. Run `GET /ops/feature-health?force=1`.
2. Run `GET /ops/feature-opportunities?force=1&top_n=10`.
3. Run `node scripts/ted-profile/generate-low-usage-opportunity-brief.mjs`.
4. Run `node scripts/ted-profile/generate-feature-governance-board-summary.mjs`.
5. Publish any resulting roadmap/QA/security task deltas before implementation.
