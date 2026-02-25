# TED-US-096 Connector Auth Controls in Ted UI

As Clint, I want to recover M365 profile auth directly in Ted so I can keep workflows running without dropping to shell commands.

Acceptance:

- Given a profile is disconnected, when I click Start sign-in, then Ted returns device-code auth details and tracks the session.
- Given sign-in is in progress, when I click Check sign-in, then Ted polls auth state and updates integration health.
- Given I need to reset a profile, when I click Revoke, then Ted revokes auth and shows next-safe-step guidance.
