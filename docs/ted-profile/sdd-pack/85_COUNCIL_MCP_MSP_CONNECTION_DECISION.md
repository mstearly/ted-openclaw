# SDD 85: Council Decision - External MSP/MCP Connections

**Status:** Active  
**Version:** v1  
**Date:** 2026-02-26  
**Mandate:** Review highest-value gaps from SDD 84 and determine whether TED should add external MSP/MCP connection capability.

---

## 1. Question and Interpretation

Decision question from operator:

1. Should TED add MSP connections?
2. Should TED allow defining external MCP server connections?

Council interpretation used for this decision:

1. "MCP server connections" means TED acts as an MCP **client** to external MCP servers.
2. "MSP connections" is treated as external service-provider integrations (SaaS/system connectors), which can be delivered either as native connectors or via MCP servers.

---

## 2. Current State (Verified)

1. TED currently exposes a strong MCP **server** surface (`POST /mcp`) with large tool coverage in `sidecars/ted-engine/server.mjs`.
2. TED extension exposes 81 `ted_*` tools in `extensions/ted-sidecar/index.ts`.
3. TED does **not** currently implement an outbound MCP client path for consuming third-party MCP servers.
4. One ACP path explicitly logs that inbound `mcpServers` are ignored (`src/acp/translator.ts`).
5. SDD 84 still identifies cross-source retrieval breadth as a highest-value gap.

---

## 3. External Market Signal (2026)

Primary-source signal is strong that MCP connection capability has become mainstream:

1. Anthropic documents MCP as an open standard and offers direct MCP connector usage in the Messages API and Claude products.
2. VS Code and Visual Studio publicly document MCP-enabled agent workflows.
3. GitHub provides enterprise MCP registry and allowlist governance controls.
4. Cursor, Windsurf, and JetBrains document native MCP server configuration and management.
5. Microsoft Copilot Studio positions MCP + connector infrastructure together, including governance controls.

Conclusion: external MCP connectivity is becoming baseline expectation for enterprise agent platforms, not a niche feature.

---

## 4. Value Assessment

### 4.1 Strategic value

1. **High:** closes SDD 84 gap for broader retrieval and action surface without building every connector natively.
2. **High:** improves parity with leading co-work ecosystems where users can attach tools quickly.
3. **High:** reduces connector engineering lead time when trusted MCP servers already exist.

### 4.2 Technical leverage

1. TED already has the governance substrate needed to safely absorb this capability:
   - execution boundary policy
   - approval-gated writes
   - hard bans and autonomy ladder
   - event + audit ledger model
2. This lowers implementation risk compared with greenfield agent stacks.

### 4.3 Risk profile

1. **Primary risk:** third-party server trust and tool-invocation safety.
2. **Primary control requirement:** strict registry/allowlist and explicit tool-tier mapping before tool exposure.
3. **Operational risk:** tool sprawl and degraded tool-selection quality if uncontrolled.

Council value score: **8.6/10** (high-value, high-governance-required).

---

## 5. Council Recommendation

**Yes - this is a feature TED should consider and plan now, with controlled rollout.**

Priority recommendation:

1. **Do not preempt P0-2/P0-4** (real Graph validation remains first external-production gate).
2. Start a scoped design-and-safety wave immediately after P0 closure.
3. Implement read-only MCP connections first, then gated write-capable connections.

---

## 6. Proposed Product Shape

### Feature: Governed External MCP Connection Registry

Allow operator/admin to define external MCP server profiles post-install (not hardcoded in source), with per-server policy and per-tool gating.

Required behaviors:

1. Add/remove/test MCP server connections from an operator control surface.
2. Support `stdio` and `http` transports where appropriate.
3. Secrets never committed to repo; use runtime prompt and/or keychain-backed references.
4. Namespace imported tools (example: `ext.<server_id>.<tool_name>`) to prevent collisions.
5. Require explicit mapping of each imported tool to governance tier:
   - `READ_ONLY`
   - `CONFIRMATION_REQUIRED`
   - `DENY`

---

## 7. Architecture Impact (Planes, Ledgers, Events)

### Plane impact

1. **Plane 1 (Experience):** operator UI for connection setup, status, and tool enablement.
2. **Plane 2 (Control):** outbound MCP client runtime, policy gate, allowlist enforcement.
3. **Plane 3 (Contract):** imported tool schema validation and invocation constraints.
4. **Plane 4 (Connector):** remote server transport and auth handling.
5. **Plane 5 (State):** persistent audit and health history.

### Ledger additions (proposed)

1. `mcp_connections_ledger` (server definitions, status, last health check)
2. `mcp_tool_registry_ledger` (imported tools, tier mapping, enabled state)
3. existing `audit_ledger` + `event_log` for execution trace

### Event additions (proposed)

1. `mcp.external.server.registered`
2. `mcp.external.server.health_checked`
3. `mcp.external.tool.invoked`
4. `mcp.external.tool.blocked`
5. `mcp.external.server.disabled`

---

## 8. Execution Plan

### Wave M1 - Decision and Safety Baseline (1 week)

1. Finalize threat model for external MCP ingestion.
2. Define allowlist model (trusted registry, per-server enable).
3. Define auth profile model (OAuth/env/keychain reference only).
4. Add proof gates for policy-blocked and allowlisted flows.

Exit criteria:

1. Signed security design.
2. Failing tests for disallowed server/tool execution.

### Wave M2 - Read-Only Pilot (1 sprint)

1. Implement outbound MCP client adapter.
2. Add connection registry APIs and operator controls.
3. Onboard 1-2 read-only pilot servers.
4. Log all calls to event/audit ledgers.

Exit criteria:

1. Read-only imported tools callable through TED governance.
2. No write-capable tool exposure in this wave.

### Wave M3 - Gated Write Expansion (next sprint)

1. Add confirmation-gated write tool execution path.
2. Add per-tool policy simulation and dry-run review screen.
3. Add rollback/disable controls at server and tool level.

Exit criteria:

1. Every write-capable external tool requires explicit approval path.
2. Kill switch disables a server in one action.

---

## 9. Final Decision

1. **Should we consider this feature?** Yes.
2. **Should we ship immediately before P0-2/P0-4?** No.
3. **Recommended posture:** begin design now; implement immediately after live Graph validation closes.

---

## 10. Primary External Sources

1. Anthropic MCP overview: https://docs.anthropic.com/en/docs/mcp
2. Anthropic MCP connector (Messages API): https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector
3. Anthropic Claude Code MCP docs: https://docs.anthropic.com/en/docs/claude-code/mcp
4. MCP authorization spec: https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization
5. MCP security best practices: https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices
6. GitHub Copilot MCP extension docs: https://docs.github.com/en/copilot/customizing-copilot/extending-copilot-chat-with-mcp
7. GitHub MCP registry config: https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-mcp-usage/configure-mcp-registry
8. GitHub MCP allowlist enforcement: https://docs.github.com/en/copilot/reference/mcp-allowlist-enforcement
9. VS Code MCP integration blog: https://code.visualstudio.com/blogs/2025/05/12/agent-mode-meets-mcp
10. Visual Studio agent mode with MCP: https://devblogs.microsoft.com/visualstudio/agent-mode-is-now-generally-available-with-mcp-support/
11. Cursor MCP docs: https://docs.cursor.com/context/mcp
12. JetBrains Rider MCP server docs: https://www.jetbrains.com/help/rider/MCP_Server.html
13. Windsurf MCP docs: https://docs.windsurf.com/windsurf/cascade/mcp
14. Microsoft Copilot Studio MCP announcement: https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/introducing-model-context-protocol-mcp-in-copilot-studio-simplified-integration-with-ai-apps-and-agents/
15. Microsoft Learn DLP policy reference including MCP connectors: https://learn.microsoft.com/en-us/power-platform/admin/wp-data-loss-prevention
