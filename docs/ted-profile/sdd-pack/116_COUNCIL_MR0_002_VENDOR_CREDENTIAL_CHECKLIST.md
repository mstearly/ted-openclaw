# SDD 116: MR0-002 Vendor Credential Checklist

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Parent Task:** SDD 111 `MR0-002`

---

## 1. Monday.com Checklist

### Account and app setup

1. [ ] Monday workspace/account id recorded.
2. [ ] App auth mode selected (`OAuth` preferred for durable automation).
3. [ ] Required scopes approved and documented.
4. [ ] Environment confirmed (production vs sandbox).

### Webhook readiness

1. [ ] Webhook callback URL registered.
2. [ ] Challenge/handshake test passed.
3. [ ] Retry behavior expectations documented.

### Governance and secrets

1. [ ] Credentials stored via approved secret path (no source-code storage).
2. [ ] Connector admission policy entry created.
3. [ ] Initial mode set to read-only.

---

## 2. RightSignature (ShareFile) Checklist

### Entitlement and account setup

1. [ ] ShareFile plan/API entitlement confirmed.
2. [ ] Account/environment identifier recorded.
3. [ ] Auth model selected (`OAuth` preferred for production).

### OAuth / token setup

1. [ ] Client id recorded.
2. [ ] Client secret recorded in secure store only.
3. [ ] Redirect URI registered (if OAuth path enabled).
4. [ ] Token refresh behavior validated.

### Callback readiness

1. [ ] Callback URL configured.
2. [ ] Callback authenticity validation requirements confirmed.
3. [ ] Out-of-order callback handling expectation documented.

### Governance and e-sign policy

1. [ ] `esign_provider_policy` decision confirmed (`docusign_only` / `rightsignature_only` / `dual_provider`).
2. [ ] Connector admission policy entry created.
3. [ ] Initial mode set to read-only.

---

## 3. Cross-Cutting Security and Operations Checklist

1. [ ] No GUIDs/secrets hardcoded in source files.
2. [ ] All credentials entered through governed setup path or secure store.
3. [ ] Audit record includes credential setup timestamp and actor (redacted).
4. [ ] Replay fixture capture plan prepared for MR-1/MR-2.

---

## 4. MR0-002 Status

`COMPLETED (CHECKLIST BUILT)` - waiting on operator-provided values to mark all items checked.
