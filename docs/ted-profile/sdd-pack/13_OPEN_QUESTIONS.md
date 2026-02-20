# Open Questions (Resolved Defaults for Build Start)

**Updated:** 2026-02-20

Council defaults are now locked so build execution can proceed without ambiguity.
Operator overrides can be applied later through decision-log updates plus proof reruns.

1. **Distribution model**
   - Decision: one bundled installer with coordinated OpenClaw + sidecar startup.

2. **Required Day-1 channels**
   - Decision: Telegram only for Day-1; iMessage deferred to Phase-2.

3. **Graph scope minimum**
   - Decision: drafts-first for Day-1; calendar hold writes deferred.

4. **Filing actions Day-1**
   - Decision: suggestions + approvals only; no apply/move behavior in Day-1.

5. **Retention defaults**
   - Decision: audit logs 30 days, transient/media 7 days, SDD snapshots 90 days.

6. **Operator validation gate**
   - Decision: two-minute operator validation remains mandatory per release.

7. **Signing/notarization**
   - Decision: internal distribution may start unsigned; notarization required before broad external rollout.
