# JC-018 — Sidecar Discoverability Surface and Console Visibility

## Outcome

Operators can explicitly discover Ted capabilities (commands, route families, governance guards) from the existing governed surface, removing ambiguity when the console appears empty.

## Promotion State

- Current: DONE
- Promotion rule:
  - Requires `JC-013` auth boundary to remain intact (no new unauthenticated non-health routes).

## Non-negotiables

- No expansion of sidecar route allowlist beyond `/status` and `/doctor`.
- Discoverability is additive metadata only.
- Existing draft-only/approval-first boundaries remain unchanged.

## Deliverables

- Additive catalog metadata on sidecar `/status` and `/doctor` payloads.
- `/ted catalog` command in plugin that renders discoverability from `/status`.
- Contract and docs updates clarifying visibility expectations and auth caveat.

## Operator Loop Impact

- Faster orientation in Day-1 console and lower setup confusion.

## Friction KPI Evidence

- No increase in blocked actions from boundary hardening.
- Reduced time-to-diagnosis for "why no Ted features listed" incidents.

## Proof

- Sidecar health payload includes catalog metadata with governance guard declarations.
- `/ted catalog` command path is available without adding non-health route surface.
- Config/token prerequisites for Control UI visibility are validated.

## Proof Script

- `scripts/ted-profile/proof_jc018.sh`

## Proof Evidence (Executed)

- Date: 2026-02-20
- Result: PASS
