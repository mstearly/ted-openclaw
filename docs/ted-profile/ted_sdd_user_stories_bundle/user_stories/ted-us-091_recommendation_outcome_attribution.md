# TED-US-091 Recommendation Outcome Attribution

As Clint, I want recommendation decisions automatically attributed to impacted job cards so Ted learns from my decisions and makes better future guidance.

Acceptance:

- Given a recommendation decision, when Clint approves or dismisses it, then Ted stores an attribution event with decision, time, rationale, and linked card IDs.
- Given workbench refresh, when attribution exists, then totals and recent attribution history appear in Ted UI.
