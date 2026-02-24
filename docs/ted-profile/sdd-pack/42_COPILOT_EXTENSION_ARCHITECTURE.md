# SDD-42: GitHub Copilot Extension Agent Architecture for Ted

**Council Record:** Architecture Design Document
**Date:** 2026-02-22
**Status:** DESIGN — Not yet implemented
**Prerequisite:** Phase 1+2 sidecar/extension/UI complete (SDD-37)

---

## 0. Executive Summary

This document specifies the architecture for adding a GitHub Copilot Extension
agent surface to the Ted Operations Console. The design accounts for:

- Two M365 identities (Olumie Capital, Everest Management Solutions)
- HIPAA compliance requirements for Everest PHI
- Day 1 OpenAI direct API access (Clint's ChatGPT Pro account)
- Day 2 Copilot Extension agent activation
- Per-job LLM provider selection
- Full integration with Ted's existing governance guardrails

**Critical finding from research:** GitHub App-based Copilot Extensions were
deprecated on November 10, 2025. The architecture below adopts a **dual-path
strategy**: (A) MCP Server (primary, future-proof) for VS Code / JetBrains /
Copilot Chat integration, and (B) the legacy Copilot Extension SSE protocol
(secondary, for GitHub.com Copilot Chat only, using the `@copilot-extensions/
preview-sdk` while it remains functional). The GitHub Copilot SDK
(`@github/copilot-sdk`, technical preview Jan 2026) is evaluated as a third
option but is too unstable for production legal operations at this time.

---

## 1. Landscape Assessment

### 1.1 GitHub Copilot Integration Paths (as of Feb 2026)

```
Path                        Status            Transport         Best For
-------------------------   ----------------  ----------------  -----------------------
GitHub App Extension        DEPRECATED        SSE streaming     (legacy only)
  (agent webhook)           Nov 10 2025
VS Code Extension           SUPPORTED         VS Code API       Editor-integrated UX
MCP Server                  SUPPORTED (GA)    Streamable HTTP   Cross-IDE, future-proof
Copilot SDK                 TECH PREVIEW      JSON-RPC          Embedded agent runtime
  (@github/copilot-sdk)     Jan 2026
```

### 1.2 Recommendation

| Priority | Path             | Rationale                                       |
| -------- | ---------------- | ----------------------------------------------- |
| P0       | MCP Server       | Cross-IDE, protocol-stable, wraps existing HTTP |
| P1       | Direct OpenAI    | Day 1 operational, Clint's ChatGPT Pro account  |
| P2       | Legacy Extension | GitHub.com chat only, if Clint uses GH heavily  |
| DEFER    | Copilot SDK      | Too early for production legal ops              |

---

## 2. Component Architecture

### 2.1 System Context Diagram

```
+------------------------------------------------------------------+
|  Clint's Workstation                                              |
|                                                                   |
|  +------------------+    +------------------+   +---------------+ |
|  | VS Code /        |    | GitHub.com       |   | OpenClaw UI   | |
|  | JetBrains IDE    |    | Copilot Chat     |   | (Lit app)     | |
|  +--------+---------+    +--------+---------+   +-------+-------+ |
|           |                       |                      |        |
|  MCP Streamable HTTP    SSE webhook (legacy)    Gateway RPC      |
|           |                       |                      |        |
|  +--------v---------+    +--------v---------+   +-------v-------+ |
|  | MCP Server Layer |    | Copilot Ext.     |   | Extension     | |
|  | (ted-engine)     |    | Webhook Handler  |   | (ted-sidecar) | |
|  | :48080/mcp       |    | :48080/copilot/* |   | index.ts      | |
|  +--------+---------+    +--------+---------+   +-------+-------+ |
|           |                       |                      |        |
|           +----------+   +--------+              +-------+        |
|                      |   |                       |                |
|              +-------v---v-----------------------v-------+        |
|              |         Ted Sidecar (server.mjs)          |        |
|              |         127.0.0.1:48080                   |        |
|              |                                           |        |
|              |  /deals/*  /graph/*  /governance/*         |        |
|              |  /triage/* /reporting/* /extraction/*      |        |
|              |  /ops/*   /learning/* /filing/*            |        |
|              |  /mcp     /copilot/webhook                |        |
|              +---+-------------------+-------------------+        |
|                  |                   |                             |
|          +-------v-------+   +------v-------+                     |
|          | Config Layer  |   | Graph API    |                     |
|          | hard_bans     |   | (M365)       |                     |
|          | autonomy      |   +------+-------+                     |
|          | operator      |          |                              |
|          | llm_provider  |   +------v-------+                     |
|          +-----------+---+   | Olumie tenant|                     |
|                      |       | Everest tenant|                    |
|                      |       +--------------+                     |
|              +-------v-------+                                    |
|              | LLM Router   |                                     |
|              +---+---+------+                                     |
|                  |   |                                            |
|         +--------v+  +v---------+                                 |
|         | OpenAI  |  | Copilot  |                                 |
|         | Direct  |  | LLM API  |                                 |
|         | (Day 1) |  | (Day 2)  |                                 |
|         +---------+  +----------+                                 |
+------------------------------------------------------------------+
```

### 2.2 New Components Summary

| Component               | Location                              | Purpose                            |
| ----------------------- | ------------------------------------- | ---------------------------------- |
| MCP Server Handler      | `server.mjs` `/mcp` route             | MCP Streamable HTTP transport      |
| Copilot Webhook Handler | `server.mjs` `/copilot/webhook` route | Legacy SSE Extension protocol      |
| LLM Router              | `server.mjs` `routeLlmCall()`         | Provider selection per job/context |
| LLM Provider Config     | `config/llm_provider.json`            | Per-entity provider settings       |
| MCP Tool Definitions    | `server.mjs` (inline or module)       | Ted capabilities as MCP tools      |
| Copilot LLM Callback    | `server.mjs` `copilotLlmCall()`       | Forward to api.githubcopilot.com   |

---

## 3. MCP Server (Primary Path)

### 3.1 Protocol: Streamable HTTP

The MCP spec revision 2025-03-26 defines Streamable HTTP as the standard
transport. A single endpoint (`/mcp`) accepts JSON-RPC POSTs. The server
responds with either `Content-Type: application/json` (single response) or
`Content-Type: text/event-stream` (SSE stream for long-running operations).

### 3.2 Route Definition

```
POST /mcp
Content-Type: application/json
Authorization: Bearer <ted-engine-auth-token>

Body: JSON-RPC 2.0 request
  { "jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {} }
  { "jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": { "name": "ted_morning_brief", ... } }
  { "jsonrpc": "2.0", "id": 3, "method": "resources/list", "params": {} }
```

### 3.3 MCP Tool Definitions

Each existing Ted sidecar endpoint maps to an MCP tool. Tools are grouped by
governance tier to enforce autonomy_ladder.json rules at the MCP layer.

```
Category: READ-ONLY (no approval required)
--------------------------------------------
Tool Name                  Sidecar Route                   Description
ted_status                 GET /status                     Sidecar health check
ted_doctor                 GET /doctor                     Diagnostic payload
ted_deals_list             GET /deals/list                 List all active deals
ted_deal_detail            GET /deals/{id}                 Single deal details
ted_deal_timeline          GET /deals/{id}/timeline        Deal event history
ted_morning_brief          GET /reporting/morning-brief    Daily work briefing
ted_eod_digest             GET /reporting/eod-digest       End-of-day summary
ted_mail_list              GET /graph/{profile}/mail/list  Inbox messages
ted_calendar_list          GET /graph/{profile}/calendar/list  Calendar events
ted_triage_list            GET /triage/list                Open triage items

Category: DRAFT-ONLY (generates draft, requires Clint approval)
---------------------------------------------------------------
Tool Name                  Sidecar Route                           Description
ted_draft_email            POST /graph/{profile}/mail/draft/create Draft an email
ted_draft_generate         POST /graph/{profile}/drafts/generate   Batch draft gen
ted_calendar_event_create  POST /graph/{profile}/calendar/event/create  Create cal event
ted_deal_create            POST /deals/create                      Create a deal
ted_extraction_deadlines   POST /extraction/deadlines              Extract deadlines

Category: GOVERNANCE (restricted)
---------------------------------
Tool Name                  Sidecar Route                           Description
ted_mail_move              POST /graph/{profile}/mail/{id}/move    Move mail (approval req)
ted_triage_classify        POST /triage/classify                   Classify triage item
ted_filing_suggestion      POST /filing/suggest                    Suggest filing action
```

### 3.4 MCP Tool Schema Example

```json
{
  "name": "ted_morning_brief",
  "description": "Generate Ted's morning work briefing for Clint. Includes deadlines, meetings, inbox items, risks, and deal snapshots. Respects entity boundaries between Olumie/Everest/Prestige/Personal.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "entity_context": {
        "type": "string",
        "enum": ["olumie", "everest", "all"],
        "description": "Which entity context to generate the brief for. Default: all.",
        "default": "all"
      },
      "include_personal": {
        "type": "boolean",
        "description": "Whether to include personal calendar holds. Default: false.",
        "default": false
      }
    },
    "required": []
  }
}
```

```json
{
  "name": "ted_draft_email",
  "description": "Create an email draft in Clint's mailbox. The draft is NOT sent -- it is placed in the Drafts folder for Clint's review and approval. Entity boundary: draft is scoped to the specified M365 profile (olumie or everest).",
  "inputSchema": {
    "type": "object",
    "properties": {
      "profile_id": {
        "type": "string",
        "enum": ["olumie", "everest"],
        "description": "M365 identity to draft from."
      },
      "to": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Recipient email addresses."
      },
      "subject": { "type": "string" },
      "body_html": { "type": "string", "description": "HTML body content." }
    },
    "required": ["profile_id", "to", "subject", "body_html"]
  }
}
```

### 3.5 MCP Resources

MCP Resources expose read-only data that clients can surface to users or models:

```
Resource URI                          Description
ted://config/operator_profile         Operator profile (name, entities, timezone)
ted://config/hard_bans                Hard bans list (never_do, never_without_approval)
ted://config/autonomy_ladder          Action autonomy levels per category
ted://config/brief_config             Morning brief / EOD digest preferences
ted://config/draft_style              Email draft tone and style rules
ted://deals/{deal_id}                 Single deal JSON
ted://governance/audit/recent         Recent audit trail entries (last 50)
```

### 3.6 MCP Server Implementation in server.mjs

```javascript
// ---- MCP Streamable HTTP Handler ----
// Depends on: @modelcontextprotocol/sdk (npm)
// Depends on: @modelcontextprotocol/node (npm, for Node IncomingMessage compat)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const mcpServer = new McpServer({
  name: "ted-engine",
  version: VERSION,
});

// Register tools
mcpServer.tool("ted_status", "Get Ted sidecar health status", {}, async () => {
  const payload = buildPayload();
  return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
});

mcpServer.tool(
  "ted_morning_brief",
  "Generate Clint's morning work briefing",
  {
    entity_context: { type: "string", enum: ["olumie", "everest", "all"], default: "all" },
    include_personal: { type: "boolean", default: false },
  },
  async ({ entity_context, include_personal }) => {
    // Delegates to existing generateMorningBrief() logic
    const brief = await internalGenerateMorningBrief(entity_context, include_personal);
    return { content: [{ type: "text", text: JSON.stringify(brief, null, 2) }] };
  },
);

// Register resources
mcpServer.resource("ted://config/hard_bans", "Hard ban rules", async () => {
  const bans = readJsonFile(hardBansConfigPath);
  return { contents: [{ uri: "ted://config/hard_bans", text: JSON.stringify(bans, null, 2) }] };
});

// Route handler for /mcp
async function handleMcpRequest(req, res) {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await mcpServer.connect(transport);
  await transport.handleRequest(req, res);
}
```

### 3.7 IDE Configuration

Clint configures this in VS Code `settings.json` or `.vscode/mcp.json`:

```json
{
  "servers": {
    "ted": {
      "url": "http://127.0.0.1:48080/mcp",
      "requestInit": {
        "headers": {
          "Authorization": "Bearer ${env:TED_ENGINE_AUTH_TOKEN}"
        }
      }
    }
  }
}
```

---

## 4. Legacy Copilot Extension Webhook (Secondary Path)

### 4.1 Deprecation Context

GitHub App-based Copilot Extensions were deprecated November 10, 2025. This
path is included **only** for completeness and for environments where Clint
interacts with Ted through GitHub.com Copilot Chat (e.g., in a repo PR
conversation). It should not be the primary integration path.

### 4.2 Route Definition

```
POST /copilot/webhook
Headers:
  X-GitHub-Token: <github-user-token>
  X-Hub-Signature-256: <payload-signature>
  Content-Type: application/json

Body:
  {
    "messages": [
      { "role": "system", "content": "..." },
      { "role": "user", "content": "Show me today's morning brief" }
    ],
    "copilot_thread_id": "...",
    "agent": "ted"
  }
```

### 4.3 SSE Response Protocol

The webhook responds with `Content-Type: text/event-stream` and streams
events using the `@copilot-extensions/preview-sdk` helpers:

```
1. createAckEvent()          -- Acknowledge receipt (one time)
2. createTextEvent(chunk)    -- Markdown text chunks (repeatable)
3. createReferencesEvent([]) -- Optional: link to deal docs, audit entries
4. createErrorsEvent([])     -- Optional: governance block explanations
5. createDoneEvent()         -- Terminal event (one time)
```

### 4.4 Webhook Handler Implementation

```javascript
import {
  createAckEvent,
  createTextEvent,
  createDoneEvent,
  createErrorsEvent,
  createReferencesEvent,
  verifyAndParseRequest,
} from "@copilot-extensions/preview-sdk";

async function handleCopilotWebhook(req, res, route) {
  // Step 1: Read raw body
  const rawBody = await readRawBody(req);

  // Step 2: Verify request signature
  const signature = req.headers["github-public-key-signature"] || "";
  const keyId = req.headers["github-public-key-identifier"] || "";
  const tokenForUser = req.headers["x-github-token"] || "";

  const { isValidRequest, payload } = await verifyAndParseRequest(rawBody, signature, keyId, {
    token: tokenForUser,
  });

  if (!isValidRequest) {
    sendJson(res, 401, { error: "Invalid signature" });
    return;
  }

  // Step 3: Set SSE headers
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive",
  });

  // Step 4: Acknowledge
  res.write(createAckEvent());

  // Step 5: Route intent from last user message
  const lastMessage = payload.messages[payload.messages.length - 1];
  const userText = lastMessage?.content || "";
  const intent = classifyCopilotIntent(userText);

  // Step 6: Execute Ted function based on intent
  try {
    const result = await executeCopilotIntent(intent, tokenForUser);

    // Step 7: Apply governance filters
    const filtered = applyGovernanceFilters(result, intent);

    // Step 8: Stream response
    res.write(createTextEvent(filtered.markdown));

    if (filtered.references.length > 0) {
      res.write(createReferencesEvent(filtered.references));
    }
  } catch (err) {
    res.write(
      createErrorsEvent([
        {
          type: "agent",
          code: "TED_EXECUTION_ERROR",
          message: err.message,
          identifier: "ted-engine",
        },
      ]),
    );
  }

  // Step 9: Done
  res.write(createDoneEvent());
  res.end();
}
```

### 4.5 Intent Classification

```javascript
function classifyCopilotIntent(userText) {
  const lower = userText.toLowerCase().trim();

  // Pattern-based intent routing
  const patterns = [
    { pattern: /morning\s*brief/, intent: "morning_brief" },
    { pattern: /eod|end.?of.?day|digest/, intent: "eod_digest" },
    { pattern: /inbox|mail|email/, intent: "mail_list" },
    { pattern: /calendar|schedule|meetings?/, intent: "calendar_list" },
    { pattern: /deals?\s*(list|status|all)/, intent: "deals_list" },
    { pattern: /deal\s+(\S+)/, intent: "deal_detail" },
    { pattern: /draft\s*(email|mail|message)/, intent: "draft_email" },
    { pattern: /deadline/, intent: "deadlines" },
    { pattern: /triage/, intent: "triage_list" },
    { pattern: /status|health/, intent: "status" },
  ];

  for (const { pattern, intent } of patterns) {
    const match = lower.match(pattern);
    if (match) return { type: intent, params: match };
  }

  return { type: "general_chat", params: null };
}
```

### 4.6 Copilot LLM Callback

For intents that require LLM reasoning (not just data retrieval), the webhook
can call back to the Copilot LLM API:

```javascript
async function copilotLlmCall(messages, tokenForUser) {
  const response = await fetch("https://api.githubcopilot.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenForUser}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      model: "gpt-4.1",
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Copilot LLM call failed: ${response.status}`);
  }

  return response;
}
```

**Key differences from direct OpenAI (`llmCall()`):**

| Aspect          | `llmCall()` (OpenAI Direct)          | `copilotLlmCall()` (Copilot)             |
| --------------- | ------------------------------------ | ---------------------------------------- |
| Endpoint        | `api.openai.com/v1/chat/completions` | `api.githubcopilot.com/chat/completions` |
| Auth header     | `Bearer sk-...` (API key)            | `Bearer <X-GitHub-Token>`                |
| Auth source     | Environment variable                 | Request header from GitHub               |
| Model selection | `gpt-4.1` / `o4-mini` (direct)       | `gpt-4.1` (via Copilot proxy)            |
| Token lifetime  | Long-lived API key                   | Short-lived session token (~30 min)      |
| Billing         | Clint's OpenAI account               | Clint's GitHub Copilot subscription      |
| BAA/HIPAA       | OpenAI BAA available (Enterprise)    | **No BAA for GitHub Copilot API**        |
| Response format | OpenAI chat completion chunks        | Same SSE chunk format                    |

---

## 5. LLM Provider Router

### 5.1 Config Schema: `config/llm_provider.json`

```json
{
  "_sdd": {
    "source": "docs/ted-profile/sdd-pack/42_COPILOT_EXTENSION_ARCHITECTURE.md",
    "record_id": "llm-provider-config-2026-02-22"
  },
  "default_provider": "openai_direct",
  "providers": {
    "openai_direct": {
      "enabled": true,
      "endpoint": "https://api.openai.com/v1/chat/completions",
      "auth_env_var": "OPENAI_API_KEY",
      "default_model": "gpt-4.1",
      "hipaa_cleared": false,
      "notes": "Day 1 default. Clint's ChatGPT Pro account. No BAA in place."
    },
    "azure_openai": {
      "enabled": false,
      "endpoint": "",
      "auth_env_var": "AZURE_OPENAI_API_KEY",
      "default_model": "gpt-4.1",
      "hipaa_cleared": true,
      "notes": "Azure OpenAI with BAA. Required for Everest PHI operations."
    },
    "copilot_extension": {
      "enabled": false,
      "endpoint": "https://api.githubcopilot.com/chat/completions",
      "auth_source": "x-github-token",
      "default_model": "gpt-4.1",
      "hipaa_cleared": false,
      "notes": "Day 2. Requires Copilot subscription. No BAA available."
    }
  },
  "entity_overrides": {
    "olumie": {
      "provider": null,
      "notes": "Uses default_provider. No PHI in Olumie context."
    },
    "everest": {
      "provider": "azure_openai",
      "required_hipaa_cleared": true,
      "notes": "Everest MUST use a HIPAA-cleared provider. Falls back to blocking if azure_openai not enabled."
    }
  },
  "per_job_overrides": {}
}
```

### 5.2 Provider Selection Logic

```javascript
function selectLlmProvider(entityContext, jobId = null) {
  const config = readJsonFile(llmProviderConfigPath);
  if (!config) {
    return { provider: "disabled", reason: "llm_provider.json not found" };
  }

  // 1. Check per-job override first
  if (jobId && config.per_job_overrides?.[jobId]) {
    const override = config.per_job_overrides[jobId];
    const providerConfig = config.providers[override.provider];
    if (providerConfig?.enabled) {
      return { provider: override.provider, config: providerConfig, source: "per_job_override" };
    }
  }

  // 2. Check entity override
  if (entityContext && config.entity_overrides?.[entityContext]) {
    const entityOverride = config.entity_overrides[entityContext];
    if (entityOverride.provider) {
      const providerConfig = config.providers[entityOverride.provider];
      if (providerConfig?.enabled) {
        return {
          provider: entityOverride.provider,
          config: providerConfig,
          source: "entity_override",
        };
      }
      // Entity requires specific provider but it's not enabled -> BLOCK
      if (entityOverride.required_hipaa_cleared) {
        return {
          provider: "blocked",
          reason: `Entity ${entityContext} requires HIPAA-cleared provider ${entityOverride.provider} which is not enabled`,
          source: "entity_hipaa_block",
        };
      }
    }
  }

  // 3. Fall back to default
  const defaultProvider = config.providers[config.default_provider];
  if (defaultProvider?.enabled) {
    return { provider: config.default_provider, config: defaultProvider, source: "default" };
  }

  return { provider: "disabled", reason: "No enabled provider found" };
}
```

### 5.3 Unified LLM Call Router

```javascript
async function routeLlmCall(messages, entityContext, jobId, copilotToken) {
  const selection = selectLlmProvider(entityContext, jobId);

  appendAudit("LLM_PROVIDER_SELECTED", {
    provider: selection.provider,
    entity: entityContext,
    job_id: jobId,
    source: selection.source,
  });

  if (selection.provider === "blocked" || selection.provider === "disabled") {
    return blockedExplainability(
      "LLM_PROVIDER_UNAVAILABLE",
      `LLM call for entity=${entityContext} job=${jobId}`,
      selection.reason,
    );
  }

  switch (selection.provider) {
    case "openai_direct":
      return openaiDirectCall(messages, selection.config);
    case "azure_openai":
      return azureOpenaiCall(messages, selection.config);
    case "copilot_extension":
      if (!copilotToken) {
        return blockedExplainability(
          "COPILOT_TOKEN_MISSING",
          "copilot_extension LLM call",
          "Copilot Extension token not available in this context. Use OpenAI direct or switch provider.",
        );
      }
      return copilotLlmCall(messages, copilotToken);
    default:
      return blockedExplainability(
        "UNKNOWN_PROVIDER",
        `Provider: ${selection.provider}`,
        "Check llm_provider.json configuration.",
      );
  }
}
```

### 5.4 Flow: Sidecar -> Extension -> UI

```
+-----------+   requestTedWithTimeout    +-----------------+   callAuthenticatedTedRoute   +-----------+
|  UI       | ========================> |  Extension      | =============================> | Sidecar   |
|  ted.ts   |   "ted.llm.provider.get"  |  index.ts       |   GET /ops/llm-provider       | server.mjs|
|  ted.ts   |   "ted.llm.provider.set"  |  index.ts       |   POST /ops/llm-provider      | server.mjs|
+-----------+                           +-----------------+                                +-----------+
```

New sidecar routes:

```
GET  /ops/llm-provider              -> Returns current provider config (sanitized, no keys)
POST /ops/llm-provider              -> Update default_provider or per_job_overrides
  Body: { "default_provider": "copilot_extension" }
  Body: { "per_job_overrides": { "jc-057": { "provider": "openai_direct" } } }
```

New extension gateway methods:

```
ted.llm.provider.get     -> GET  /ops/llm-provider
ted.llm.provider.set     -> POST /ops/llm-provider
```

### 5.5 UI Toggle Design

In the Ted Workbench "Operate" tab, a new "LLM Provider" card:

```
+-------------------------------------------------------+
|  LLM Provider                                         |
|                                                       |
|  Default:  [OpenAI Direct v]   Day 1 active           |
|                                                       |
|  Olumie:   Uses default       (no PHI)                |
|  Everest:  Azure OpenAI       HIPAA required          |
|            [ ] Not configured -- set up Azure creds   |
|                                                       |
|  Per-Job Overrides:                                   |
|  JC-057 Email Drafts:  [OpenAI Direct v]              |
|  JC-058 Calendar:      [Default v]                    |
|                                                       |
|  Copilot Extension:    [x] Disabled                   |
|            Enable when GitHub Copilot configured      |
+-------------------------------------------------------+
```

---

## 6. Per-M365 Identity Strategy

### 6.1 Single Registration, Profile-Based Routing

**Recommendation: Single Copilot Extension / single MCP server with internal
profile-based routing.** Do NOT register separate extensions for Olumie and
Everest.

Rationale:

1. Ted already enforces entity boundaries in server.mjs via `operator_profile.json`
2. The `entity_separation` config has `never_mix_with` rules per context
3. Every Graph API call already requires an explicit `profile_id` parameter
4. Copilot/MCP tools accept `profile_id` as an input parameter
5. Two separate registrations would double configuration burden with no security gain

### 6.2 Entity Boundary Enforcement in Copilot/MCP Context

```
+----------------------------------------------------------+
|  Copilot/MCP Request                                      |
|  "Draft an email from Everest about facility staffing"    |
+----------------------------+-----------------------------+
                             |
                    +--------v--------+
                    | Intent Router   |
                    | profile_id =    |
                    | "everest"       |
                    +--------+--------+
                             |
                    +--------v---------+
                    | Entity Boundary  |
                    | Check            |
                    |                  |
                    | 1. Verify route  |
                    |    matches       |
                    |    profile_id    |
                    | 2. Check         |
                    |    never_mix_with|
                    | 3. PHI redaction |
                    |    if Everest    |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
     +--------v--------+         +---------v--------+
     | PASS             |         | BLOCK             |
     | Execute with     |         | Return            |
     | profile=everest  |         | blockedExplain-   |
     |                  |         | ability()         |
     +------------------+         +-------------------+
```

The existing `validateEntityBoundary()` function in server.mjs already handles
this. All MCP tool handlers and Copilot intent handlers MUST pass through this
validation before executing any Graph API call.

### 6.3 Profile Detection from Natural Language

When the user does not explicitly specify a profile, the system applies the
existing `default_classification_rule` from `operator_profile.json`:

```
"Olumie if deal-related; Everest if facility-related;
 Prestige if Prestige keyword present;
 else surface for Clint classification in daily brief triage queue"
```

For MCP tools: the `profile_id` parameter is **required** on all Graph-touching
tools. The LLM must infer it from context or ask Clint.

For Copilot Extension: if intent classification cannot determine entity context,
the webhook responds with a clarification request:

```javascript
res.write(
  createTextEvent(
    "I need to know which entity this is for. Is this:\n" +
      "- **Olumie Capital** (deal-related)\n" +
      "- **Everest Management** (facility-related)\n",
  ),
);
```

---

## 7. HIPAA Compliance Analysis

### 7.1 PHI Exposure Risk Matrix

```
LLM Provider          HIPAA BAA    PHI Safe?   Use for Everest?
-------------------   ----------   ---------   ----------------
OpenAI Direct         NO *         NO          BLOCKED
  (api.openai.com)    (* unless Enterprise BAA signed)
Azure OpenAI          YES          YES         REQUIRED
  (Clint's tenant)    (with BAA in M365 E5)
GitHub Copilot API    NO           NO          BLOCKED
  (api.githubcopilot.com)
GitHub Copilot SDK    NO           NO          BLOCKED
  (via Copilot CLI)
Local LLM (future)    N/A          YES         ALLOWED
  (on-device)
```

### 7.2 HIPAA Routing Rules

These rules are enforced at the `routeLlmCall()` level:

1. **Everest context -> LLM call**: MUST use `azure_openai` provider (BAA required)
2. **Everest context -> azure_openai not enabled**: BLOCK with explainability
3. **Olumie context -> any provider**: Allowed (no PHI in Olumie operations)
4. **PHI detection in prompt**: If `phi_auto_redact` is true for the profile
   (Everest), redact PHI fields before sending to any LLM provider
5. **Copilot Extension webhook**: Can serve Everest READ-ONLY operations
   (morning brief, status) but MUST NOT send PHI through `copilotLlmCall()`

### 7.3 PHI Redaction Before LLM Calls

```javascript
function redactPhiFromMessages(messages, entityContext) {
  const profile = getOperatorProfile();
  const entityConfig = profile?.contexts?.entity_separation?.[entityContext];

  if (!entityConfig?.phi_auto_redact) {
    return messages; // No redaction needed (e.g., Olumie)
  }

  const phiFields = profile?.confidentiality?.phi_redaction_fields || [];
  // phiFields = ["resident names", "room numbers", "medical conditions", "DOB", "SSN", "medical record numbers"]

  return messages.map((msg) => ({
    ...msg,
    content: applyPhiRedaction(msg.content, phiFields),
  }));
}
```

### 7.4 HIPAA Compliance Checklist

```
[ ] Azure OpenAI instance provisioned in Clint's Azure tenant
[ ] BAA signed with Microsoft for Azure OpenAI Service
[ ] azure_openai provider configured in llm_provider.json
[ ] Everest entity_override points to azure_openai
[ ] PHI redaction tested with sample Everest data
[ ] Audit trail captures all LLM calls with provider + entity
[ ] Copilot Extension blocked from Everest LLM calls (read-only OK)
[ ] No PHI in Copilot webhook request/response payloads
[ ] hard_bans.json rule enforced: "NEVER produce un-redacted PHI
    for non-HIPAA-cleared recipients"
```

---

## 8. Governance Integration

### 8.1 How hard_bans.json Applies to Copilot/MCP Responses

Every response generated through the Copilot webhook or MCP tool call passes
through the existing governance pipeline:

```
User request
  |
  v
Intent Classification / Tool Call
  |
  v
+-- validateRoleCard()         -- Does the operation match an authorized role?
+-- validateHardBans()         -- Does the output violate any hard ban?
|   - Never mix entity data
|   - Never send external email without approval
|   - Never produce un-redacted PHI
|   - Never execute trades
+-- validateEntityBoundary()   -- Is entity context correct?
+-- validateOutputContract()   -- Does the output meet audience restrictions?
  |
  v
Response (or blockedExplainability)
```

### 8.2 How autonomy_ladder.json Applies

The autonomy ladder determines whether a Copilot/MCP action executes
immediately or requires Clint's approval:

```javascript
function enforceAutonomyLadder(intent, entityContext) {
  const ladder = readJsonFile(autonomyLadderConfigPath);
  if (!ladder) return { allowed: true, mode: "unknown" };

  const actionMap = {
    draft_email: "Send external emails",
    calendar_create: "Create calendar holds (external attendees)",
    deal_create: "Create internal tasks",
    mail_move: "File / move documents",
    filing_suggest: "File / move documents",
  };

  const actionName = actionMap[intent.type];
  if (!actionName) return { allowed: true, mode: "autonomous" };

  const category = ladder.action_categories.find((c) => c.action === actionName);
  if (!category) return { allowed: true, mode: "autonomous" };

  switch (category.mode) {
    case "autonomous":
      return { allowed: true, mode: "autonomous" };
    case "draft_only":
      return {
        allowed: true,
        mode: "draft_only",
        note: "Draft created. Clint must review and send.",
      };
    case "propose_certify_apply":
      return {
        allowed: true,
        mode: "propose_certify_apply",
        note: "Proposal created. Requires certification.",
      };
    case "blocked":
      return { allowed: false, mode: "blocked", note: category.notes };
    case "never":
      return { allowed: false, mode: "never", note: category.notes };
    default:
      return { allowed: false, mode: "unknown" };
  }
}
```

### 8.3 Audit Trail for Copilot/MCP Calls

Every Copilot webhook and MCP tool call generates an audit entry:

```javascript
appendAudit("COPILOT_WEBHOOK_REQUEST", {
  intent: intent.type,
  entity_context: entityContext,
  copilot_thread_id: payload.copilot_thread_id,
  user_github_login: githubUser,
  provider_used: selection.provider,
  governance_result: governanceResult,
  timestamp: new Date().toISOString(),
});

appendAudit("MCP_TOOL_CALL", {
  tool_name: toolName,
  entity_context: entityContext,
  provider_used: selection.provider,
  governance_result: governanceResult,
  execution_time_ms: elapsed,
  timestamp: new Date().toISOString(),
});
```

---

## 9. Sequence Flows

### 9.1 MCP Tool Call: Morning Brief (Happy Path)

```
VS Code Copilot Chat              Ted MCP Server (:48080/mcp)
       |                                   |
       |  POST /mcp                        |
       |  {"method":"tools/call",          |
       |   "params":{"name":               |
       |   "ted_morning_brief",            |
       |   "arguments":{}}}                |
       |---------------------------------->|
       |                                   |  1. Auth check (Bearer token)
       |                                   |  2. validateEntityBoundary("all")
       |                                   |  3. selectLlmProvider("all", null)
       |                                   |     -> "openai_direct" (default)
       |                                   |  4. Gather data:
       |                                   |     - GET /reporting/morning-brief
       |                                   |     - briefConfig + urgencyRules
       |                                   |     - Graph mail/calendar (both profiles)
       |                                   |  5. Generate brief text
       |                                   |  6. appendAudit("MCP_TOOL_CALL", ...)
       |                                   |
       |  200 OK                           |
       |  {"content":[{"type":"text",      |
       |   "text":"## Morning Brief..."}]} |
       |<----------------------------------|
```

### 9.2 Legacy Copilot Webhook: Draft Email (Governance Filtered)

```
GitHub.com Copilot Chat        Ted Sidecar (:48080/copilot/webhook)
       |                                   |
       |  POST /copilot/webhook            |
       |  X-GitHub-Token: ghp_...          |
       |  Body: {messages: [...            |
       |   "Draft an email to Maurice      |
       |    about the Sunrise deal"]}      |
       |---------------------------------->|
       |                                   |  1. verifyAndParseRequest()
       |                                   |  2. Identify github user via /user
       |                                   |  3. classifyCopilotIntent()
       |                                   |     -> "draft_email"
       |                                   |  4. Entity classification:
       |                                   |     "Sunrise deal" -> Olumie
       |                                   |     "Maurice" -> Olumie privilege list
       |                                   |  5. enforceAutonomyLadder("draft_email")
       |                                   |     -> mode: "draft_only"
       |                                   |  6. validateHardBans() -> PASS
       |                                   |  7. validateEntityBoundary("olumie")
       |                                   |     -> PASS
       |                                   |  8. routeLlmCall(messages, "olumie")
       |                                   |     -> openai_direct
       |                                   |  9. Generate draft
       |                                   | 10. POST /graph/olumie/mail/draft/create
       |                                   | 11. appendAudit(...)
       |  SSE: createAckEvent()            |
       |<----------------------------------|
       |  SSE: createTextEvent(            |
       |   "Draft created in Olumie        |
       |    Drafts folder.\n\n...")         |
       |<----------------------------------|
       |  SSE: createReferencesEvent(      |
       |   [{id:"deal-sunrise",            |
       |     type:"ted.deal"}])            |
       |<----------------------------------|
       |  SSE: createDoneEvent()           |
       |<----------------------------------|
```

### 9.3 Everest PHI Block (HIPAA Enforcement)

```
VS Code Copilot Chat              Ted MCP Server (:48080/mcp)
       |                                   |
       |  POST /mcp                        |
       |  tools/call:                      |
       |  "ted_draft_email"                |
       |  profile_id: "everest"            |
       |  body: "...resident John Smith    |
       |   in room 204 needs..."           |
       |---------------------------------->|
       |                                   |  1. Auth check -> PASS
       |                                   |  2. Profile = everest
       |                                   |  3. selectLlmProvider("everest")
       |                                   |     -> entity_override: "azure_openai"
       |                                   |     -> azure_openai.enabled: false
       |                                   |     -> BLOCKED (HIPAA provider not configured)
       |                                   |  4. appendAudit("LLM_PROVIDER_BLOCKED", ...)
       |                                   |
       |  200 OK                           |
       |  {"content":[{"type":"text",      |
       |   "text":"BLOCKED: Everest        |
       |   operations require a HIPAA-     |
       |   cleared LLM provider (Azure     |
       |   OpenAI). Configure azure_openai |
       |   in llm_provider.json and        |
       |   provide BAA credentials."}]}    |
       |<----------------------------------|
```

### 9.4 Provider Toggle via UI

```
OpenClaw UI                     Extension                    Sidecar
   |                               |                            |
   |  ted.llm.provider.set         |                            |
   |  {default_provider:           |                            |
   |   "copilot_extension"}        |                            |
   |------------------------------>|                            |
   |                               |  POST /ops/llm-provider   |
   |                               |  {default_provider:        |
   |                               |   "copilot_extension"}     |
   |                               |--------------------------->|
   |                               |                            | 1. Validate provider exists
   |                               |                            | 2. Validate provider.enabled
   |                               |                            | 3. Write llm_provider.json
   |                               |                            | 4. appendAudit(
   |                               |                            |      "LLM_PROVIDER_CHANGED",
   |                               |                            |      {from:"openai_direct",
   |                               |                            |       to:"copilot_extension"})
   |                               |  200 OK                    |
   |                               |<---------------------------|
   |  respond(true, {ok:true})     |                            |
   |<------------------------------|                            |
```

---

## 10. Security Considerations

### 10.1 Loopback-Only Enforcement

The sidecar binds to `127.0.0.1:48080`. Both MCP and Copilot webhook routes
inherit this restriction. Remote MCP clients (e.g., Codespaces) would require
SSH tunneling. This is intentional -- Ted should never be network-exposed.

### 10.2 Token Handling

| Token                 | Storage              | Scope                            |
| --------------------- | -------------------- | -------------------------------- |
| TED_ENGINE_AUTH_TOKEN | Environment variable | Sidecar bearer auth              |
| X-GitHub-Token        | Request header only  | Copilot webhook, never persisted |
| OPENAI_API_KEY        | Environment variable | OpenAI direct calls              |
| AZURE_OPENAI_API_KEY  | Environment variable | Azure OpenAI calls               |
| Graph refresh_token   | token_store.mjs      | M365 Graph API per profile       |

**Rule: No LLM API keys are stored in config JSON files. All keys come from
environment variables or request headers.**

### 10.3 Copilot Token Verification

For the legacy webhook, the `@copilot-extensions/preview-sdk` `verifyAndParseRequest()`
function validates the request signature against GitHub's public key. This
prevents spoofed requests from reaching Ted's execution layer.

### 10.4 MCP Auth

The MCP endpoint uses the same `Bearer <TED_ENGINE_AUTH_TOKEN>` auth as all
other sidecar routes, enforced by the existing `validateAuth()` middleware.
EXEMPT_AUTH_ROUTES does NOT include `/mcp` -- authentication is mandatory.

---

## 11. Implementation Phases

### Phase 1: MCP Server (Week 1)

- [ ] Add `@modelcontextprotocol/sdk` dependency to ted-engine
- [ ] Implement `/mcp` route handler with Streamable HTTP transport
- [ ] Register read-only tools: ted_status, ted_morning_brief, ted_eod_digest,
      ted_deals_list, ted_deal_detail, ted_mail_list, ted_calendar_list
- [ ] Register resources: operator_profile, hard_bans, autonomy_ladder
- [ ] Write behavioral proof script: `proof_mcp_tools.sh`
- [ ] Test with VS Code MCP configuration

### Phase 2: LLM Provider Router (Week 1-2)

- [ ] Create `config/llm_provider.json` with default OpenAI direct
- [ ] Implement `selectLlmProvider()` and `routeLlmCall()` in server.mjs
- [ ] Add `/ops/llm-provider` GET/POST routes
- [ ] Add `ted.llm.provider.get` and `ted.llm.provider.set` gateway methods
- [ ] Add LLM Provider card to Ted Workbench UI
- [ ] Wire HIPAA blocking for Everest entity context
- [ ] Write proof: `proof_llm_provider.sh`

### Phase 3: Governance Integration (Week 2)

- [ ] Add MCP/Copilot audit events to appendAudit()
- [ ] Enforce autonomy_ladder on MCP tool calls
- [ ] Enforce hard_bans on all LLM responses
- [ ] Implement PHI redaction for Everest LLM calls
- [ ] Write proof: `proof_mcp_governance.sh`

### Phase 4: Draft-Capable MCP Tools (Week 2-3)

- [ ] Register draft tools: ted_draft_email, ted_calendar_event_create
- [ ] Implement governance-gated execution (draft_only mode)
- [ ] Add MCP tool for ted_extraction_deadlines
- [ ] Write proof: `proof_mcp_drafts.sh`

### Phase 5: Legacy Copilot Webhook (Week 3, if needed)

- [ ] Add `@copilot-extensions/preview-sdk` dependency
- [ ] Implement `/copilot/webhook` route
- [ ] Implement `classifyCopilotIntent()` and `copilotLlmCall()`
- [ ] Register GitHub App (if Clint uses GitHub.com Copilot Chat)
- [ ] Write proof: `proof_copilot_webhook.sh`

### Phase 6: Azure OpenAI for Everest (Blocked until credentials)

- [ ] Provision Azure OpenAI instance in Clint's tenant
- [ ] Sign BAA with Microsoft
- [ ] Configure azure_openai provider in llm_provider.json
- [ ] Enable Everest entity override
- [ ] Run full Everest PHI test suite

---

## 12. Decision Log

| Decision                                      | Rationale                                               | Date       |
| --------------------------------------------- | ------------------------------------------------------- | ---------- |
| MCP Server as primary path                    | GitHub App Extensions deprecated Nov 2025; MCP is GA    | 2026-02-22 |
| Single registration for both M365 identities  | profile_id routing already enforced; double reg = waste | 2026-02-22 |
| Copilot SDK deferred                          | Technical preview, too unstable for legal ops           | 2026-02-22 |
| Azure OpenAI required for Everest             | Only HIPAA-cleared LLM provider with BAA available      | 2026-02-22 |
| OpenAI Direct as Day 1 default                | Clint has ChatGPT Pro account, immediate availability   | 2026-02-22 |
| Copilot Extension as Day 2 optional           | Depends on Clint's GitHub Copilot subscription status   | 2026-02-22 |
| No LLM keys in JSON config files              | Security: env vars and request headers only             | 2026-02-22 |
| PHI redaction before any LLM call for Everest | Defense-in-depth even when using HIPAA-cleared provider | 2026-02-22 |
| Legacy webhook kept as secondary path         | GitHub.com Copilot Chat integration may still be useful | 2026-02-22 |

---

## 13. Dependencies

| Package                           | Version | Purpose                          |
| --------------------------------- | ------- | -------------------------------- |
| `@modelcontextprotocol/sdk`       | ^1.x    | MCP server core                  |
| `@modelcontextprotocol/node`      | ^1.x    | Node.js HTTP transport adapter   |
| `@copilot-extensions/preview-sdk` | latest  | Legacy webhook SSE helpers       |
| `zod`                             | ^3.x    | MCP tool input schema validation |

---

## 14. References

- [GitHub Copilot Extensions Organization](https://github.com/copilot-extensions)
- [Copilot Extensions Preview SDK](https://github.com/copilot-extensions/preview-sdk.js)
- [Blackbeard Extension Example](https://github.com/copilot-extensions/blackbeard-extension)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Server Build Guide](https://modelcontextprotocol.io/docs/develop/build-server)
- [GitHub Copilot SDK (Tech Preview)](https://github.com/github/copilot-sdk)
- [GitHub Copilot SDK Node.js README](https://github.com/github/copilot-sdk/blob/main/nodejs/README.md)
- [Copilot SDK npm Package](https://www.npmjs.com/package/@github/copilot-sdk)
- [GitHub MCP Server Setup Docs](https://docs.github.com/en/copilot/how-tos/use-copilot-extensions/build-a-copilot-agent/communicate-with-github)
- [MCP HTTP Quickstart](https://mcp-framework.com/docs/http-quickstart/)
- [REST API to MCP Conversion Guide](https://dzone.com/articles/transform-nodejs-rest-api-to-mcp-server)
- [Microsoft Copilot HIPAA BAA](https://www.nightfall.ai/blog/is-microsoft-copilot-hipaa-compliant)
- [Microsoft Copilot for Security BAA](https://techcommunity.microsoft.com/blog/securitycopilotblog/microsoft-copilot-for-security-now-covered-by-hipaa-business-associate-agreement/4220174)
- [HIPAA AI Safeguards Guide](https://technijian.com/compliance/hipaa-ai-what-safeguards-you-must-have-before-turning-on-copilot/)
- [Getting Started with Copilot Extensions](https://blog.openreplay.com/getting-started-github-copilot-extensions/)
- [Neon Blog: How to Build Copilot Extensions](https://neon.com/blog/how-to-build-github-copilot-extensions)
