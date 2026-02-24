# Graph Profile Setup Guide

**Generated:** 2026-02-22
**Remediation card:** JC-056a
**Purpose:** Step-by-step guide for configuring Microsoft Graph API access for the Ted Engine sidecar.

---

## Prerequisites

Before starting, confirm you have:

- An **Azure Active Directory tenant** (personal Microsoft accounts are not sufficient).
- **Admin access** (or Global Administrator consent) to register applications in that tenant.
- The Ted Engine sidecar source checked out locally (`sidecars/ted-engine/`).
- Node 22+ installed.

---

## Step 1: Register an Azure AD Application

1. Open the [Azure Portal](https://portal.azure.com).
2. Navigate to **Azure Active Directory** > **App registrations** > **New registration**.
3. Fill in the registration form:
   - **Name:** `OpenClaw Ted Engine` (or any recognizable name for your organization).
   - **Supported account types:** Select **Accounts in this organizational directory only** (single tenant).
   - **Redirect URI:** Leave blank. The sidecar uses the device code flow, which does not require a redirect URI.
4. Click **Register**.

Azure will create the application and display its overview page.

---

## Step 2: Configure API Permissions

1. In the app registration overview, click **API permissions** in the left sidebar.
2. Click **Add a permission** > **Microsoft Graph** > **Delegated permissions**.
3. Search for and select the following permissions:

   | Permission            | Purpose                                         |
   | --------------------- | ----------------------------------------------- |
   | `User.Read`           | Read the signed-in user's identity              |
   | `offline_access`      | Obtain refresh tokens for persistent sessions   |
   | `Mail.ReadWrite`      | Read inbox messages and create email drafts     |
   | `Calendars.ReadWrite` | Read calendar events and create tentative holds |

   **Note:** `Calendars.ReadWrite` (not `Calendars.Read`) is required because JC-063 creates tentative calendar events on the operator's behalf. Read-only calendar access is insufficient for this workflow.

4. Click **Add permissions**.
5. Click **Grant admin consent for [your tenant]** and confirm. The status column should show a green checkmark for each permission.

If you do not have admin consent authority, ask your Global Administrator to grant consent from their account.

---

## Step 3: Enable Device Code Flow

1. In the app registration, click **Authentication** in the left sidebar.
2. Scroll to **Advanced settings**.
3. Set **Allow public client flows** to **Yes**.
4. Click **Save**.

This enables the OAuth 2.0 device authorization grant, which is the only authentication method the Ted Engine sidecar supports. No client secret is needed.

---

## Step 4: Record IDs

From the app registration **Overview** page, copy two values:

| Field                       | Where to find it           | Example format                         |
| --------------------------- | -------------------------- | -------------------------------------- |
| **Application (client) ID** | Overview page, top section | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| **Directory (tenant) ID**   | Overview page, top section | `12345678-abcd-ef01-2345-6789abcdef01` |

Save both values. You will need them in the next step.

---

## Step 5: Update graph.profiles.json

Open the profile configuration file:

```
sidecars/ted-engine/config/graph.profiles.json
```

Replace the empty `tenant_id` and `client_id` values for the target profile with the IDs you recorded in Step 4. The file structure is:

```json
{
  "profiles": {
    "olumie": {
      "tenant_id": "YOUR_TENANT_ID_HERE",
      "client_id": "YOUR_CLIENT_ID_HERE",
      "delegated_scopes": ["User.Read", "offline_access", "Mail.ReadWrite", "Calendars.ReadWrite"]
    }
  }
}
```

Key points:

- **Profile ID** (`olumie` above) is a stable string label used in all sidecar API calls. Choose a short, memorable name.
- **Multiple profiles** are supported. Add additional keys under `profiles` for additional tenants (e.g., `everest` for a second tenant).
- **Scope upgrade:** If upgrading from an earlier configuration that used `Calendars.Read`, change it to `Calendars.ReadWrite`. You will need to re-authenticate (Step 6) so that the new scope is consented.
- **Do not commit real credentials.** The `.example.json` file in the same directory shows the expected structure with placeholder values. Keep your real `graph.profiles.json` out of version control or ensure it is listed in `.gitignore`.

---

## Step 6: Authenticate via Device Code Flow

### 6.1 Start the Sidecar

From the repository root, start the Ted Engine sidecar:

```bash
node sidecars/ted-engine/server.mjs
```

The sidecar listens on `127.0.0.1:48080` by default. You should see startup output confirming the port.

### 6.2 Initiate Device Code Authentication

Send a POST request to start the device code flow. Replace `{profile_id}` with your profile name (e.g., `olumie`):

```bash
curl -s -X POST http://127.0.0.1:48080/graph/olumie/auth/device/start | jq .
```

The response includes:

```json
{
  "profile_id": "olumie",
  "tenant_id": "YOUR_TENANT_ID",
  "client_id": "YOUR_CLIENT_ID",
  "scopes": ["User.Read", "offline_access", "Mail.ReadWrite", "Calendars.ReadWrite"],
  "verification_uri": "https://microsoft.com/devicelogin",
  "user_code": "ABCD1234",
  "device_code": "...",
  "expires_in": 900,
  "interval": 5,
  "message": "Complete device-code authentication."
}
```

### 6.3 Complete Browser Authentication

1. Copy the `user_code` value from the response (e.g., `ABCD1234`).
2. Open `https://microsoft.com/devicelogin` in a browser.
3. Enter the `user_code` when prompted.
4. Sign in with the Microsoft account that belongs to the configured tenant.
5. Review and accept the requested permissions.

### 6.4 Poll for Token Completion

After completing browser authentication, poll the sidecar to exchange the device code for tokens. Pass the `device_code` value from the start response:

```bash
curl -s -X POST http://127.0.0.1:48080/graph/olumie/auth/device/poll \
  -H "Content-Type: application/json" \
  -d '{"device_code": "DEVICE_CODE_FROM_STEP_6_2"}' | jq .
```

If the browser authentication is not yet complete, the response will indicate `authorization_pending`. Wait the number of seconds indicated by the `interval` field and try again.

On success, the sidecar stores the tokens internally and the response confirms authentication.

### 6.5 Verify Authentication Status

```bash
curl -s http://127.0.0.1:48080/graph/olumie/status | jq .
```

The response should show the profile is authenticated with valid token material. If the status shows `misconfigured` or `unauthenticated`, review the troubleshooting section below.

---

## Step 7: Verify Inbox Access

With authentication complete, confirm that the sidecar can read real mailbox data:

```bash
curl -s http://127.0.0.1:48080/graph/olumie/mail/list | jq .
```

Expected response:

```json
{
  "profile_id": "olumie",
  "folder": "inbox",
  "messages": [
    {
      "id": "...",
      "subject": "...",
      "from_name": "...",
      "from_address": "...",
      "received": "...",
      "is_read": false,
      "body_preview": "...",
      "has_attachments": false,
      "importance": "normal"
    }
  ],
  "total_count": 10
}
```

If the `messages` array contains real inbox items, the Graph profile is fully operational. The sidecar is ready for use with the Ted executive assistant workflows.

---

## Troubleshooting

### Wrong Tenant ID

**Symptom:** The device code start request returns a `502` with an error like `invalid_resource` or `unauthorized_client`.

**Fix:** Verify the `tenant_id` in `graph.profiles.json` matches the Directory (tenant) ID on the Azure AD app overview page. A common mistake is copying the Object ID instead of the Directory ID.

### Missing Admin Consent

**Symptom:** Authentication succeeds but inbox or calendar requests fail with `403 Forbidden` or `Authorization_RequestDenied`.

**Fix:**

1. Return to Azure Portal > App registrations > your app > API permissions.
2. Confirm that all four permissions show **Granted for [tenant]** (green checkmark).
3. If any show "Not granted," click **Grant admin consent** again.
4. After granting consent, revoke and re-authenticate:

```bash
curl -s -X POST http://127.0.0.1:48080/graph/olumie/auth/revoke | jq .
```

Then repeat Step 6.

### Expired or Revoked Tokens

**Symptom:** Requests that previously worked now return `401 Unauthorized`.

**Fix:** Tokens expire after a period determined by the tenant's token lifetime policy (typically 60-90 minutes for access tokens). The sidecar should handle refresh automatically using the `offline_access` scope. If refresh fails:

1. Revoke stored tokens:

```bash
curl -s -X POST http://127.0.0.1:48080/graph/olumie/auth/revoke | jq .
```

2. Re-run the device code flow from Step 6.

### Device Code Flow Not Enabled

**Symptom:** The start request returns an error mentioning `public_client_not_allowed` or similar.

**Fix:** Return to Azure Portal > App registrations > your app > Authentication > Advanced settings. Confirm **Allow public client flows** is set to **Yes** and save.

### Conditional Access Policy Blocking

**Symptom:** Browser authentication fails with a message about Conditional Access requirements (MFA, compliant device, trusted location).

**Fix:** This is a tenant-level policy, not an app configuration issue. Either:

- Satisfy the Conditional Access requirements (e.g., enroll the device, complete MFA).
- Ask your tenant admin to create an exclusion for the Ted Engine app registration.
- Authenticate from a device/location that satisfies the policy.

### Scope Mismatch After Upgrade

**Symptom:** Calendar event creation fails after upgrading scopes from `Calendars.Read` to `Calendars.ReadWrite`.

**Fix:** Changing scopes in `graph.profiles.json` does not automatically update the consented scopes on existing tokens. You must re-authenticate:

1. Revoke stored tokens:

```bash
curl -s -X POST http://127.0.0.1:48080/graph/olumie/auth/revoke | jq .
```

2. Re-run the device code flow from Step 6 so that the new scopes are included in the consent prompt.

---

## Related Documents

| Document                                     | Relevance                                               |
| -------------------------------------------- | ------------------------------------------------------- |
| `07_M365_GRAPH_SPEC.md`                      | Identity model, scope guidance, governance requirements |
| `08_OPENCLAW_SIDECAR_TOOLING_SPEC.md`        | Sidecar endpoint contracts and allowlist                |
| `37_REMEDIATION_TASK_BREAKDOWN_JC056_069.md` | Task breakdown including JC-056a through JC-056c        |
| `05_SECURITY_GOVERNANCE.md`                  | Token storage policy and fail-closed requirements       |

---

## Clint's Configuration Reference

Clint requires **two separate Azure AD app registrations** — one per tenant/entity. Each registration maps to its own profile in `graph.profiles.json`.

| Profile   | Entity                       | Email Address               |
| --------- | ---------------------------- | --------------------------- |
| `olumie`  | Olumie Capital               | CPhillips@olumiecapital.com |
| `everest` | Everest Management Solutions | CPhillips@Everestmgt.com    |

**Required scopes** (already configured in `graph.profiles.json` for both profiles):

- `User.Read`
- `offline_access`
- `Mail.ReadWrite`
- `Calendars.ReadWrite`

**Setup checklist:**

1. Register an Azure AD application in the **Olumie Capital** tenant. Follow Steps 1-6 above using the `olumie` profile. Authenticate as `CPhillips@olumiecapital.com`.
2. Register a **separate** Azure AD application in the **Everest Management Solutions** tenant. Follow Steps 1-6 above using the `everest` profile. Authenticate as `CPhillips@Everestmgt.com`.
3. Verify inbox access for both profiles (Step 7) before marking JC-056b complete.
