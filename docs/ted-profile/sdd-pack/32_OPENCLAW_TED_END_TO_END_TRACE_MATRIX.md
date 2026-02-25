# OpenClaw -> Ted End-to-End Trace Matrix

Generated: 2026-02-21

## Operator Intent -> Runtime Path -> Control Surface -> Evidence

1. Check system health

- Intent: "Is Ted safe to use right now?"
- Runtime: OpenClaw `ted.workbench` -> Ted `/status` + `/doctor`
- UI: Ted summary cards
- Evidence: sidecar health + governance timeline

2. Review and decide recommendations

- Intent: approve/dismiss recommended actions
- Runtime: `ted.recommendations.decide`
- UI: Recommended Next Actions
- Evidence: recommendation outcomes + governance event

3. Inspect work item and readiness

- Intent: open card details and judge promotion readiness
- Runtime: `ted.jobcards.detail`
- UI: Work Item Details + promotion confidence
- Evidence: score, band, drivers, linked recommendation outcomes

4. Tune policy safely

- Intent: adjust promotion/operations policy
- Runtime: `ted.policy.preview_update` -> `ted.policy.update`
- UI: Policy Center + Policy Change Attribution
- Evidence: policy impact events (fields, risk direction, linked cards, KPI effects)

5. Check connector readiness

- Intent: verify M365 profiles are connected before execution
- Runtime: `ted.workbench` integration snapshot (`/graph/{profile}/status`)
- UI: Integration Health panel
- Evidence: profile status, auth store, scope count, next-step guidance

## Required Telemetry per Flow

- timestamp
- action id
- decision outcome
- reason code
- next safe step
- linked card ids (where applicable)
