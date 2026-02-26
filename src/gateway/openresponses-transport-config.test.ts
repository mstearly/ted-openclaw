import { describe, expect, it } from "vitest";
import {
  normalizeOpenResponsesTransportConfig,
  resolveOpenResponsesTransportSelection,
  validateOpenResponsesTransportConfig,
} from "./openresponses-transport-config.js";

describe("openresponses transport config", () => {
  it("normalizes defaults to SSE policy", () => {
    const normalized = normalizeOpenResponsesTransportConfig(undefined);
    expect(normalized.policy.mode).toBe("sse");
    expect(normalized.policy.canaryPercent).toBe(0);
    expect(normalized.policy.maxWsRetries).toBe(0);
    expect(normalized.capabilities).toEqual([]);
  });

  it("rejects duplicate matrix entries", () => {
    const validation = validateOpenResponsesTransportConfig({
      enabled: true,
      transportCapabilityMatrix: {
        entries: [
          { provider: "openai", model: "openclaw", websocketMode: true },
          { provider: "openai", model: "openclaw", websocketMode: true },
        ],
      },
      transportPolicy: { mode: "auto", canaryPercent: 10 },
    });
    expect(validation.ok).toBe(false);
    if (validation.ok) {
      return;
    }
    expect(validation.errors[0]).toContain("duplicate transport capability entry");
  });

  it("selects websocket when policy mode is websocket and model is capable", () => {
    const selection = resolveOpenResponsesTransportSelection({
      config: {
        enabled: true,
        transportCapabilityMatrix: {
          entries: [
            {
              provider: "openai",
              model: "openclaw",
              websocketMode: true,
              streaming: true,
              continuationSemantics: true,
            },
          ],
        },
        transportPolicy: {
          mode: "websocket",
          canaryPercent: 100,
          maxWsRetries: 2,
        },
      },
      model: "openclaw",
    });
    expect(selection.requestedMode).toBe("websocket");
    expect(selection.selectedTransport).toBe("websocket");
    expect(selection.fallbackReason).toBeUndefined();
  });

  it("falls back deterministically when auto canary is disabled", () => {
    const selection = resolveOpenResponsesTransportSelection({
      config: {
        enabled: true,
        transportCapabilityMatrix: {
          entries: [{ provider: "openai", model: "openclaw", websocketMode: true }],
        },
        transportPolicy: {
          mode: "auto",
          canaryPercent: 0,
        },
      },
      model: "openclaw",
      requestKey: "req-fixed",
    });
    expect(selection.requestedMode).toBe("auto");
    expect(selection.selectedTransport).toBe("sse");
    expect(selection.fallbackReason).toBe("auto_canary_disabled");
  });

  it("selects websocket when auto canary is 100 percent", () => {
    const selection = resolveOpenResponsesTransportSelection({
      config: {
        enabled: true,
        transportCapabilityMatrix: {
          entries: [{ provider: "openai", model: "openclaw", websocketMode: true }],
        },
        transportPolicy: {
          mode: "auto",
          canaryPercent: 100,
        },
      },
      model: "openclaw",
      requestKey: "req-fixed",
    });
    expect(selection.requestedMode).toBe("auto");
    expect(selection.selectedTransport).toBe("websocket");
    expect(selection.fallbackReason).toBeUndefined();
  });
});
