---
id: TED-US-036
title: SEC EDGAR connector for filings and summaries
epic: EPIC-07
job_family: ING
priority: P1
release_target: Phase-1
persona: "Operator (Clint)"
status: Proposed
created: 2026-02-19
---

## User story

As **Operator (Clint)**, I want to **retrieve SEC EDGAR filings and summarize material items with citations** so that **I can quickly assess company risk and leadership changes for deals and holdings.**

## Acceptance criteria

- [ ] I can request filings by company/ticker and date range.
- [ ] Ted produces a structured summary and cites the official filing sources.
- [ ] If a filing cannot be accessed, Ted reports the failure with a remediation path.

## Notes / constraints

- Client listed EDGAR as a desired source.

## Explicit non-goals (safety / scope)

- No autonomous outbound send (email, invites, third-party messaging).
- No access to personal email/calendar unless explicitly re-scoped by governance.
- No trading/broker execution.
