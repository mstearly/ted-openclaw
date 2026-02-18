# Risk Register

**Generated:** 2026-02-17

| Risk | Likelihood | Impact | Mitigation | Monitoring |
| --- | --- | --- | --- | --- |
| Tenant blocks Graph delegated consent | Med | High | Provide IT consent packet; design UX to clearly state "admin approval required" | Doctor shows consent errors; onboarding checklist |
| Secrets accidentally written to disk (token cache, .env) | Med | High | Keychain-first store + secret scan gate + deep security audit | CI secret scan + security audit |
| OpenClaw plugin/endpoint allowlist too broad | Low/Med | High | Explicit allowlist; tests for deny-by-default; code review | Unit tests; audit for unexpected endpoints |
| Auto-start flakiness (LaunchAgent issues) | Med | Med | ship launch agent templates; doctor check; reboot test in release gates | Release checklist includes reboot proof |
| iMessage integration breaks due to macOS permissions | Med | Med | Treat as optional/experimental day‑1; provide Telegram fallback | Doctor checks for required permissions |
| Scope creep toward autonomous sending | Low | High | No send endpoints; enforce in policy; ship explicit boundaries | Regression tests asserting “send not present” |

