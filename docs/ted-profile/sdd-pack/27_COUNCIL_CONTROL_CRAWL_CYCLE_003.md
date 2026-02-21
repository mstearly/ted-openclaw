# Council Control Crawl Cycle 003 (Ted UI)

Generated: 2026-02-20
Scope: Ted workbench controls in `ui/src/ui/views/ted.ts` and bound handlers in `ui/src/ui/app-render.ts`.

## Council Decision

The current surface is functional but still operator-hostile in key moments. The gap is not missing data; it is missing guided decision flow.

## Control-by-Control Findings

1. Global `Refresh`

- Status: Partial
- Finding: Works, but no recovery guidance when fetch times out.
- Remediation: Add explicit reconnect and retry affordance when refresh fails.

2. View switches (`All`, `Run Today`, `Build and Improve`, `Safety Controls`, `Add New Work`, `Quality Trends`)

- Status: Partial
- Finding: Active state is present, but cross-view narrative is weak.
- Remediation: Add persistent “You are here -> next step” breadcrumb and promotion-state indicator.

3. Source documents `Open`

- Status: Partial
- Finding: Opens raw markdown in embedded viewer; no safe edit workflow, no impact guidance.
- Remediation: Replace with dedicated policy pages (structured forms + impact preview + approval gate).

4. Threshold controls (`Reset Safe Defaults`, `Apply Changes`)

- Status: Partial
- Finding: Risk warning exists, but “what unlocks” is still static text.
- Remediation: Add dynamic unlock simulator showing which features become available for chosen thresholds.

5. Recommendations (`Accept`, `Ignore`)

- Status: Partial
- Finding: Decisions save, but rationale capture is missing for audit quality.
- Remediation: Require optional note on ignore, include before/after in timeline.

6. Job cards (`Run proof`, `View Details`)

- Status: Partial
- Finding: Detail view exists; still too markdown-centric for non-technical operator.
- Remediation: Add structured editor mode (Outcome, Dependencies, KPIs, Proof, Bans) with markdown as advanced mode.

7. Job card detail (`Suggest KPIs`, `Apply Suggested KPIs to Editor`, `Preview Impact`, `Save Changes`)

- Status: Improving
- Finding: AI guidance now exists, but preview should be required for risky edits.
- Remediation: enforce preview-before-save for cards in GOV family or when proof/KPI sections are removed.

8. Intake examples and `Generate Recommended Setup`

- Status: Partial
- Finding: Examples help, but there is no guided intake wizard with progressive prompts.
- Remediation: Add 3-step intake wizard (Intent -> Risk -> Recommended policy + KPI pack).

9. Persona rules validator (`Validate Rules`)

- Status: Partial
- Finding: Validation exists; lacks plain-English remediation guidance and autofix options.
- Remediation: map validation errors to “Fix this” actions.

## Critical UX Risks from Clint Seat

- Policy docs are readable but not operable.
- System exposes internals faster than it explains consequences.
- KPI ownership is still card-local, not portfolio-visible.

## Council Recommendation

Promote UI only through governed remediation cards:

- JC-036 Policy Pages with Safe Config Editors
- JC-037 Guided Job Card Editor (Structured + Advanced)
- JC-038 Unlock Simulator and Risk Forecaster
- JC-039 KPI Cockpit (Per-card + Portfolio)
- JC-040 Guided Intake Wizard with AI Guardrails

No further visual polish-only work should be promoted until JC-036 to JC-038 are complete.
