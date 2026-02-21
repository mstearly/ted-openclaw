# Console Auth and Ted Discoverability Runbook

## Purpose

Resolve the "Ted not visible in Control UI" symptom without weakening Day-1 governance boundaries.

## Preconditions

- Gateway is running on `127.0.0.1:18789`.
- `ted-sidecar` plugin is enabled in `~/.openclaw/openclaw.json`.

## Step 1 — Verify gateway auth symptom

Run:

```bash
systemctl --user status openclaw-gateway.service --no-pager | rg "token_missing|gateway token missing"
```

If present, Control UI is not authenticated yet.

## Step 2 — Load Control UI with token

- Read token from gateway config: `~/.openclaw/openclaw.json` -> `gateway.auth.token`.
- Open `http://127.0.0.1:18789/`.
- In Control UI settings, paste token and save.

## Step 3 — Verify runtime discoverability

From command surface run:

- `/ted status`
- `/ted doctor`
- `/ted catalog`

Expected:

- `/ted catalog` shows command surface, route families, and governance guard declarations.
- Non-health sidecar routes still require auth and fail closed when unauthenticated.

## Step 4 — Run proof gate

```bash
scripts/ted-profile/proof_jc018.sh
```

Expected result: `OK: discoverability surface verified and auth boundary preserved`.

## Stop-the-line conditions

- Any non-health route works without auth.
- `/ted catalog` requires adding new sidecar route allowlist entries.
- Draft-only or approval-first boundaries regress.
