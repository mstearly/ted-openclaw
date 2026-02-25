# Day-1 Clarifications (Council)

## A) P0 blockers (must decide before plan)

- ID: CLAR-P0-01 | Category: P0 | Owner(Role): Security/Governance | Question/Decision: Sidecar auth contract is enforced as `/auth/mint` bearer auth for all non-health routes; `/status` and `/doctor` remain loopback health endpoints. | Default recommendation: Keep this contract as release-blocking for Day-1. | Evidence needed: Auth contract tests (`401` without token on non-health, health reachable for doctor), loopback-only checks. | Status: DECIDED
- ID: CLAR-P0-02 | Category: P0 | Owner(Role): Platform Architect | Question/Decision: Day-1 deployables are exactly two runtimes: OpenClaw runtime and Ted sidecar runtime. | Default recommendation: Keep all bot/domain constructs as modules, not new services. | Evidence needed: Day-1 deployables allowlist + matrix alignment + overengineering gate CI pass. | Status: DECIDED
- ID: CLAR-P0-03 | Category: P0 | Owner(Role): Product/Outcome | Question/Decision: Telegram-only is accepted as Day-1 channel operations baseline. | Default recommendation: Enforce Telegram-only and defer iMessage to Phase-2. | Evidence needed: Decision log entry plus channel gate checks. | Status: DECIDED
- ID: CLAR-P0-04 | Category: P0 | Owner(Role): Product/Outcome | Question/Decision: Day-1 retention defaults are locked (audit 30d, transient/media 7d, SDD snapshots 90d). | Default recommendation: Use these defaults unless explicitly overridden by future decision. | Evidence needed: Retention config evidence in release gates. | Status: DECIDED

## B) P1 clarifications (can decide during plan)

- ID: CLAR-P1-01 | Category: P1 | Owner(Role): Product/Outcome | Question/Decision: Tentative calendar holds are deferred; Day-1 remains drafts-first. | Default recommendation: Calendar writes remain approval-gated and deferred unless explicitly promoted later. | Evidence needed: JC sequencing and boundary tests. | Status: DECIDED
- ID: CLAR-P1-02 | Category: P1 | Owner(Role): Product/Outcome | Question/Decision: Filing Day-1 remains suggestions + approval only; no apply/move. | Default recommendation: Defer apply/move to later increment with dedicated proofs. | Evidence needed: Destructive-op expected-fail proofs until promoted. | Status: DECIDED
- ID: CLAR-P1-03 | Category: P1 | Owner(Role): Ops/Packaging | Question/Decision: Notarization/signing may be deferred for first internal operator milestone. | Default recommendation: Notarization required before broad external rollout. | Evidence needed: Release checklist and channel policy entry. | Status: DECIDED
- ID: CLAR-P1-04 | Category: P1 | Owner(Role): QA/Gates | Question/Decision: 2-minute operator validation remains mandatory in addition to CI for each release. | Default recommendation: Keep install, draft creation, and reboot recovery checks as release blockers. | Evidence needed: Gate checklist evidence block completed per release. | Status: DECIDED

## C) Decisions already locked

- ID: LOCK-01 | Category: P0 | Owner(Role): Security/Governance | Question/Decision: Draft-only outbound behavior; no autonomous send/invite. | Default recommendation: Keep hard ceiling with fail-closed policy checks. | Evidence needed: Regression tests proving send/invite absent or blocked without certification. | Status: DECIDED
- ID: LOCK-02 | Category: P0 | Owner(Role): Security/Governance | Question/Decision: Approval-first for risky writes. | Default recommendation: Maintain one-time approval record requirement before execution. | Evidence needed: Approval-required tests + audit events with request IDs. | Status: DECIDED
- ID: LOCK-03 | Category: P0 | Owner(Role): Security/Governance | Question/Decision: Single-operator restriction. | Default recommendation: Keep allowlist/pairing only; reject unknown senders. | Evidence needed: Negative tests for non-allowlisted identity requests. | Status: DECIDED
- ID: LOCK-04 | Category: P0 | Owner(Role): Product/Outcome | Question/Decision: No personal mailbox/calendar in Day-1 scope. | Default recommendation: Restrict to explicit business profiles only. | Evidence needed: Profile-routing checks and setup validation output. | Status: DECIDED
- ID: LOCK-05 | Category: P0 | Owner(Role): Security/Governance | Question/Decision: Auditable and redacted execution trail. | Default recommendation: Persist policy decision + action/result logs with redaction. | Evidence needed: Redaction tests and sampled audit records. | Status: DECIDED
- ID: LOCK-06 | Category: P0 | Owner(Role): Security/Governance | Question/Decision: Secrets rules (no plaintext tokens; keychain-first; fail-closed). | Default recommendation: Keychain required in production; explicit dev override only for memory-only mode. | Evidence needed: Secret scan gate pass + keychain/memory-mode status proof. | Status: DECIDED

## D) Assumptions + who validates

- ID: ASM-01 | Category: P0 | Owner(Role): Product/Outcome | Question/Decision: Manual final send/confirm action is required for all external communications in Day-1. | Default recommendation: Keep manual final action required unless future promotion explicitly changes it. | Evidence needed: No-send regression proofs and approval-surface tests. | Status: DECIDED
- ID: ASM-02 | Category: P0 | Owner(Role): Internal (Ops/Packaging) | Question/Decision: Day-1 deploys on a single-user Mac controlled by operator. | Default recommendation: Keep single-user host assumption and no shared-host Day-1 model. | Evidence needed: Install/runbook constraints and doctor host checks. | Status: DECIDED
- ID: ASM-03 | Category: P1 | Owner(Role): Product/Outcome | Question/Decision: Telegram is accepted as sole Day-1 operational channel. | Default recommendation: Use Telegram now and defer iMessage. | Evidence needed: Channel boundary tests and roadmap reference. | Status: DECIDED
- ID: ASM-04 | Category: P0 | Owner(Role): Internal (Security/Governance) | Question/Decision: Tenant consent friction is handled by fail-closed behavior plus admin consent packet. | Default recommendation: Do not bypass consent failures; keep explicit remediation in doctor/setup. | Evidence needed: Consent checklist + doctor status mapping for consent failure. | Status: DECIDED

## E) Top 5 risks + mitigations

- ID: RISK-01 | Category: P0 | Owner(Role): Security/Governance | Question/Decision: Sidecar auth boundary drift between docs and runtime. | Default recommendation: Enforce auth-contract tests + ADR reconciliation gate before release. | Evidence needed: JC-006 proof and contract conformance report. | Status: DECIDED
- ID: RISK-02 | Category: P0 | Owner(Role): Security/Governance | Question/Decision: Secret leakage to disk/config/logs. | Default recommendation: Keychain-first + secret scan + redaction checks in CI. | Evidence needed: Security gate output and scan evidence. | Status: DECIDED
- ID: RISK-03 | Category: P0 | Owner(Role): Ops/Packaging | Question/Decision: Mac autostart/recovery failures after reboot. | Default recommendation: Keep LaunchAgent + doctor proof as release-blocking gate. | Evidence needed: Reboot validation evidence and doctor non-blocking output. | Status: DECIDED
- ID: RISK-04 | Category: P1 | Owner(Role): Product/Outcome | Question/Decision: Scope creep into autonomous writes or multi-user expansion. | Default recommendation: Treated as explicit de-scope until ADR + new proofs. | Evidence needed: Boundary checklist and roadmap status review each increment. | Status: DECIDED
- ID: RISK-05 | Category: P1 | Owner(Role): QA/Gates | Question/Decision: Non-deterministic proof scripts creating false PASS. | Default recommendation: One proof script per implemented increment and isolated expected-fail scripts. | Evidence needed: Proof script inventory with PASS/EXPECTED_FAIL labels. | Status: DECIDED

## F) Max 10 questions to ask Clint (crisp)

- ID: Q-01 | Category: P0 | Owner(Role): Product/Outcome | Question/Decision: Telegram-only Day-1 operations are accepted. | Default recommendation: Defer iMessage to Phase-2. | Evidence needed: Decision log entry and channel tests. | Status: DECIDED
- ID: Q-02 | Category: P0 | Owner(Role): Product/Outcome | Question/Decision: Retention defaults (30d audit, 7d transient/media, 90d snapshots) are accepted. | Default recommendation: Apply unless future override approved. | Evidence needed: Retention decision and config mapping. | Status: DECIDED
- ID: Q-03 | Category: P0 | Owner(Role): Product/Outcome | Question/Decision: Calendar hold writes are deferred; drafts-only remains initial scope. | Default recommendation: Drafts-only first. | Evidence needed: JC sequencing and boundary tests. | Status: DECIDED
- ID: Q-04 | Category: P0 | Owner(Role): Product/Outcome | Question/Decision: Filing suggestions+approval is sufficient for Day-1; no apply/move. | Default recommendation: Keep no destructive filing execution in Day-1. | Evidence needed: Scope in roadmap/job cards and expected-fail apply tests. | Status: DECIDED
- ID: Q-05 | Category: P1 | Owner(Role): Product/Outcome | Question/Decision: Day-1 daily output priority is draft queue + DealOps digest, triage queue third. | Default recommendation: Keep this ordering as default KPI focus. | Evidence needed: Success metrics and daily digest outputs. | Status: DECIDED
- ID: Q-06 | Category: P1 | Owner(Role): Product/Outcome | Question/Decision: Acceptable Day-1 manual effort threshold is <=45 minutes/day. | Default recommendation: Use as release-blocking friction KPI. | Evidence needed: KPI snapshot in release evidence. | Status: DECIDED
- ID: Q-07 | Category: P1 | Owner(Role): Ops/Packaging | Question/Decision: Internal unsigned first milestone is acceptable; notarize before broad rollout. | Default recommendation: Keep phased distribution policy. | Evidence needed: Release checklist entry and channel decision. | Status: DECIDED
- ID: Q-08 | Category: P1 | Owner(Role): Security/Governance | Question/Decision: Living knowledge publish remains approval-gated for Day-1. | Default recommendation: Approvals required for publish actions. | Evidence needed: Policy tests and workflow evidence. | Status: DECIDED

## G) Proof requirements per SPINE story

- ID: PROOF-SPINE-01 | Category: P0 | Owner(Role): QA/Gates | Question/Decision: Governance/identity baseline proof bundle. | Default recommendation: Require deny-unknown, approval-required, redaction, and secret-scan proofs as release blockers. | Evidence needed: Tests for unknown sender reject, risky write fail-without-approval, redacted audit output, no plaintext secret scan. | Status: DECIDED
- ID: PROOF-SPINE-02 | Category: P0 | Owner(Role): Ops/Packaging | Question/Decision: Mac reliability/recovery proof bundle. | Default recommendation: Require install success, doctor pass/no blockers, and reboot autostart verification. | Evidence needed: Artifact install output, doctor summary, reboot test logs/screens. | Status: DECIDED
- ID: PROOF-SPINE-03 | Category: P0 | Owner(Role): Product/Outcome | Question/Decision: Draft-first communications proof bundle. | Default recommendation: Require draft creation in Outlook Drafts and explicit no-send assertions. | Evidence needed: Integration test + artifact evidence of draft presence, absence of send/invite execution. | Status: DECIDED
- ID: PROOF-SPINE-04 | Category: P0 | Owner(Role): QA/Gates | Question/Decision: Ledger/daily surface proof bundle. | Default recommendation: Require linkage-or-triage enforcement and reproducible daily digest from governed artifacts. | Evidence needed: Triaging tests, ledger linkage records, deterministic digest generation proof. | Status: DECIDED
- ID: PROOF-SPINE-05 | Category: P1 | Owner(Role): QA/Gates | Question/Decision: Approval-first workflow-action proof bundle. | Default recommendation: Keep destructive actions blocked unless explicit future increment is approved. | Evidence needed: Suggest/approve pass proofs and expected-fail proof for apply/move when not enabled. | Status: DECIDED
- ID: PROOF-SPINE-06 | Category: P1 | Owner(Role): Security/Governance | Question/Decision: Connector/self-serve governance proof bundle. | Default recommendation: Block onboarding without legal metadata and allowed-ops declarations. | Evidence needed: Negative tests for missing approval metadata; provenance visibility checks. | Status: DECIDED
- ID: PROOF-SPINE-07 | Category: P0 | Owner(Role): Security/Governance | Question/Decision: Sidecar boundary + retention governance proof bundle. | Default recommendation: Enforce authenticated non-health routes and auditable retention purge behavior. | Evidence needed: Contract auth tests, loopback-only tests, retention no-early-delete tests, purge audit logs. | Status: DECIDED

## P0 OPEN count

- P0 items remaining OPEN: 0
