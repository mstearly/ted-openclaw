# JC-002 — macOS Auto-start (LaunchAgents for OpenClaw + Sidecar)

## Outcome
After a Mac reboot, OpenClaw and the Ted Engine sidecar are both running and healthy without manual steps.

## Why this is next
We have proven the OpenClaw ↔ sidecar seam (JC-001). Now we must make the runtime reliable before adding Graph and workflow features.

## Constraints
- No admin/root required for default install (prefer user LaunchAgents)
- Sidecar binds loopback only (127.0.0.1)
- Fail closed: if sidecar isn't healthy, OpenClaw shows degraded state and blocks Ted actions
- Logs exist and do not contain secrets

## Deliverables
- LaunchAgent plist for Ted Engine sidecar
- (If needed) LaunchAgent plist for OpenClaw runtime, or documented integration with existing OpenClaw auto-start
- Install/uninstall scripts under scripts/ted-profile/
- Health check command(s)

## Proof
1) Install LaunchAgents (scripts)
2) Reboot the Mac
3) Verify both processes running:
   - sidecar responds to /doctor and /status
   - OpenClaw can execute /ted doctor successfully
4) Verify logs written to expected paths
5) Verify uninstall removes LaunchAgents and stops auto-start
