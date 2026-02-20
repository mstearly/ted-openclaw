# Ted Day-1 Launch Spine Spec

## Overview

This spec is the cohesive Day-1 spine for Ted on OpenClaw, with the story bundle as the detailed backlog.
Day-1 scope is security-first, draft-only outbound, single-operator, and proof/gate driven.

## Day-1 Definition of Done

Day-1 is complete when all P0 spine stories are accepted and gates are green:

1. Single-operator governance and security boundaries are enforced fail-closed.
2. Mac install, autostart, setup, and doctor paths are reliable and operator-usable.
3. Draft-first communication workflows operate without autonomous send/invite behavior.
4. Governed ledgers/audit/evidence paths are active, redaction compliant, and retention-configured.
5. Sidecar boundary contract and secrets posture are enforced and testable.

## Day-1 Approval Surface

Day-1 risky write certification is operator-only and must happen through the OpenClaw operator-facing approval/review surface.
If certification is missing, expired, or invalid, execution fails closed and emits an auditable redacted event.

## Spine Stories (P0/P1)

### SPINE-01 - Governance and Identity Baseline

- Priority: P0
- Release target: Day-1
- Job family: GOV

Given single-operator mode is configured,  
When control requests arrive from non-allowlisted identities,  
Then requests are denied and an auditable redacted event is recorded.

Given profile-backed operations are requested,  
When the requested profile is not one of the two configured business tenants or is a personal profile,  
Then execution is denied fail-closed with remediation guidance.

Given risky actions are requested,  
When certification is not present through the Day-1 approval surface,  
Then execution is blocked and a policy event is logged.

### SPINE-02 - Mac Reliability and Operator Recovery

- Priority: P0
- Release target: Day-1
- Job family: MNT

Given a fresh install,  
When setup wizard completes required configuration,  
Then operator can run core Day-1 workflows without manual file editing.

Given host reboot or service interruption,  
When OpenClaw starts,  
Then sidecar health is visible and Doctor provides actionable remediation when degraded.

### SPINE-03 - Draft-First Communications and Scheduling Assist

- Priority: P0
- Release target: Day-1
- Job family: OUT

Given inbox/schedule workload,  
When operator requests assistance,  
Then the system proposes drafts and schedule insights without autonomous send/invite actions.

Given draft generation request,  
When business profiles are healthy,  
Then outputs land in draft/review surfaces and include audit linkage.

Given outbound execution is requested,  
When the action is send/invite/share in Day-1,  
Then the system refuses execution and provides next safe manual step.

### SPINE-04 - DealOps Ledger and Daily Surface Foundation

- Priority: P0
- Release target: Day-1
- Job family: LED

Given deal/task context is available,  
When workflow artifacts are generated,  
Then they are linked to deal/task or routed to triage under fail-closed rules.

Given daily digest generation,  
When operator requests day summary,  
Then DealOps outputs are reproducible from governed artifacts.

### SPINE-05 - Approval-First Workflow Actions (Phase-1 Expansion)

- Priority: P1
- Release target: Phase-1
- Job family: LED

Given filing/deadline proposals,  
When approvals are absent,  
Then no destructive apply/move/invite execution occurs.

Given approvals are present for explicitly allowed actions,  
When operator executes,  
Then transitions are auditable with clear before/after status.

### SPINE-06 - Controlled Connectors and Self-Serve Extensions

- Priority: P1
- Release target: Day-1 to Phase-1
- Job family: ING

Given a new connector/skill request,  
When legal/governance approval metadata is missing,  
Then onboarding is blocked fail-closed.

Given approved connector configuration,  
When read workflows run,  
Then provenance, source tiering, and allowed operations are visible.

### SPINE-07 - Sidecar Boundary Contract and Retention Governance

- Priority: P1
- Release target: Day-1 to Phase-1
- Job family: GOV

Given OpenClaw invokes sidecar routes,  
When route is non-health and auth contract conditions are unmet,  
Then request is denied fail-closed and logged with remediation guidance.

Given Day-1 retention defaults are configured,  
When logs/artifacts reach the retention boundary,  
Then purge behavior is auditable and no early deletion occurs.

## Boundaries and Ceilings (Explicit)

1. Draft-only outbound boundary: no autonomous send, auto-invite, or share.
2. Single-operator scope only for Day-1.
3. Profiles limited to two explicit business tenants; no personal mailbox/calendar scope.
4. Secrets/tokens must not persist in plaintext files.
5. Risky writes require approval-gated certification via Day-1 approval surface; missing approvals fail closed.
6. Sidecar communication is loopback-only; non-health routes require auth contract.
7. Day-1 excludes filing apply/move and calendar invite sends.
8. Day-1 retention baseline defaults: audit logs 30 days, transient/media artifacts 7 days, SDD snapshots 90 days unless explicitly overridden.

## Risks and Governance Mitigations

| Risk                                | Mitigation                                           | Governance Tie                          |
| ----------------------------------- | ---------------------------------------------------- | --------------------------------------- |
| Scope creep into autonomous actions | Enforce draft-only and approval gates                | GOV controls + fail-closed policy       |
| Sidecar boundary drift              | Explicit contract story and reconciliation tracking  | ADR-required tracking + boundary proofs |
| Secret leakage                      | Keychain-first and redaction checks                  | Security gates + audit protocol         |
| Operational fragility on macOS      | Setup/doctor/autostart acceptance checks             | MNT stories + release gates             |
| Evidence gaps                       | Required linkage-or-triage and artifact traceability | LED/ING stories + evidence protocol     |

## Notes

- Detailed behavior and edge cases are intentionally delegated to the user story bundle.
- This spine remains outcome-driven and does not prescribe implementation internals beyond governance boundaries.
