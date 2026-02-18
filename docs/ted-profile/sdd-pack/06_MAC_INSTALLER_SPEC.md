# macOS Installer Spec — OpenClaw Ted Profile

**Generated:** 2026-02-17

---

## Goals

Deliver a repeatable, supportable Mac installation that:

- installs the OpenClaw fork (Ted Profile) and required components,
- auto-starts on login/reboot,
- keeps secrets in Keychain,
- supports upgrades and rollback.

---

## Target Platforms

- macOS 13+ (minimum)
- Apple Silicon (arm64) + Intel (x64) builds

---

## Packaging Options

### Option 1 (Preferred): Single Installer Bundle

- One DMG installs:
  - OpenClaw app
  - Ted Engine sidecar (packaged as a background service or embedded app)
  - LaunchAgent(s) for auto-start

Pros: simplest for operator  
Cons: more engineering/packaging work

### Option 2 (Acceptable Day‑1): Two Apps + Coordinated Auto-Start

- Two DMGs or one DMG containing two apps:
  - OpenClaw app
  - Ted Engine app
- LaunchAgent starts both (or starts Ted first, then OpenClaw)

Pros: faster to ship  
Cons: two moving parts

---

## Auto-Start Requirements

### Must

- Ted Engine sidecar starts automatically on login.
- OpenClaw gateway starts automatically on login.
- Restarting the Mac restores service without manual steps.

### Implementation guidance

- Use `~/Library/LaunchAgents/<bundle_id>.plist` for per-user.
- Bind services to loopback only.

---

## Secrets & Configuration

- Any runtime secrets (Graph token cache, channel tokens, API keys) stored in Keychain.
- Config files may store _references_ only (e.g., `keychain://service/name`).
- Installer should not write secrets.

---

## First-Run Experience

- OpenClaw opens to a setup state:
  - shows whether Ted Engine is reachable
  - links to Ted Engine Setup Wizard if needed
- Operator can complete:
  - Graph profile setup (two profiles)
  - approvals key init
  - channel pairing (Telegram / iMessage)

---

## Upgrade & Rollback

### Upgrade

- Replace app(s) in `/Applications`.
- Preserve artifacts/state in `~/Library/Application Support/<app>/...` (or `~/.openclaw/...`).
- Post-upgrade: run health gates (doctor + setup checks).

### Rollback

- Keep prior DMG builds.
- Roll back by replacing app(s), leaving operator data untouched.

---

## Uninstall / Revoke (Day‑1 requirement)

Provide a documented “revoke and purge” procedure:

- revoke Graph consent (operator + IT steps)
- delete Keychain secrets created by the app (by service prefix)
- remove state directory after confirmation

(Full “one command revoke” can be a later enhancement.)
