# Ted Operator Experience Remediation Plan

Generated: 2026-02-20
Owner: Council

## Objective

Make Ted intuitive for Clint without sacrificing governance.

## Design Principles

1. Explain first, expose internals second.
2. Every control must answer: what this does, why now, what changes after click.
3. Policy editing must be structured and impact-aware.
4. AI suggestions must be bounded by explicit rules and previewed deltas.

## Required Surfaces

1. Policy Center

- Job Board policy page
- Promotion policy page
- Value/friction gate page
- Each page includes structured form controls, impact preview, and approval record.

2. Work Card Studio

- Structured editor fields for Outcome, Dependencies, KPIs, Proof, Bans.
- Advanced markdown editor remains optional.
- Save path requires impact preview pass for risky cards.

3. Unlock Simulator

- Inputs: current thresholds + proposed overrides.
- Outputs: features unlocked now, risks increased, required mitigation proofs.

4. KPI Cockpit

- Per-card KPI status with trend sparkline.
- Portfolio view for promotion readiness by family.

5. Guided Intake Wizard

- Step 1: intent and domain
- Step 2: risk and automation boundary
- Step 3: AI proposes initial card + KPI pack + hard bans
- Step 4: operator review and save

## Governance Requirements

- All policy changes create governance timeline entries.
- Ignore/dismiss decisions capture optional rationale.
- Preview-before-save is mandatory when changes affect proof, KPI, family, or status.

## Promotion Gate

Do not promote beyond Cycle 003 until JC-036..040 proofs pass.
