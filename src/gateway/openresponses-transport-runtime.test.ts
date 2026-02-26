import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OpenResponsesTransportSelection } from "./openresponses-transport-config.js";
import {
  executeOpenResponsesWithTransport,
  resetOpenResponsesTransportRuntimeForTest,
} from "./openresponses-transport-runtime.js";

function websocketSelection(): OpenResponsesTransportSelection {
  return {
    requestedMode: "websocket",
    selectedTransport: "websocket",
    capability: {
      provider: "openai",
      model: "openclaw",
      websocketMode: true,
      streaming: true,
      continuationSemantics: true,
      knownFallbackTriggers: ["ws_connect_failed"],
    },
  };
}

describe("openresponses transport runtime", () => {
  beforeEach(() => {
    resetOpenResponsesTransportRuntimeForTest();
  });

  it("executes SSE immediately when selector is already SSE", async () => {
    const runSse = vi.fn().mockResolvedValue("ok");
    const runWebsocket = vi.fn().mockResolvedValue("ws");

    const result = await executeOpenResponsesWithTransport({
      provider: "openresponses",
      model: "openclaw",
      selection: {
        requestedMode: "sse",
        selectedTransport: "sse",
        capability: null,
      },
      policy: {
        forceSseOnErrorCode: ["ws_connect_failed"],
        maxWsRetries: 1,
      },
      runSse,
      runWebsocket,
    });

    expect(result.result).toBe("ok");
    expect(result.transportUsed).toBe("sse");
    expect(result.websocketAttempts).toBe(0);
    expect(result.fallbackReason).toBeUndefined();
    expect(runSse).toHaveBeenCalledTimes(1);
    expect(runWebsocket).not.toHaveBeenCalled();
  });

  it("returns websocket transport when first websocket attempt succeeds", async () => {
    const runSse = vi.fn().mockResolvedValue("sse");
    const runWebsocket = vi.fn().mockResolvedValue("ws");

    const result = await executeOpenResponsesWithTransport({
      provider: "openresponses",
      model: "openclaw",
      selection: websocketSelection(),
      policy: {
        forceSseOnErrorCode: ["ws_connect_failed"],
        maxWsRetries: 2,
      },
      runSse,
      runWebsocket,
    });

    expect(result.result).toBe("ws");
    expect(result.transportUsed).toBe("websocket");
    expect(result.websocketAttempts).toBe(1);
    expect(result.fallbackReason).toBeUndefined();
    expect(runWebsocket).toHaveBeenCalledTimes(1);
    expect(runSse).not.toHaveBeenCalled();
  });

  it("forces SSE fallback when configured error code is hit", async () => {
    const runSse = vi.fn().mockResolvedValue("sse");
    const runWebsocket = vi.fn().mockRejectedValue(new Error("connect failed"));

    const result = await executeOpenResponsesWithTransport({
      provider: "openresponses",
      model: "openclaw",
      selection: websocketSelection(),
      policy: {
        forceSseOnErrorCode: ["WS_CONNECT_FAILED"],
        maxWsRetries: 2,
      },
      runSse,
      runWebsocket,
    });

    expect(result.result).toBe("sse");
    expect(result.transportUsed).toBe("sse");
    expect(result.websocketAttempts).toBe(1);
    expect(result.fallbackReason).toBe("ws_connect_failed");
    expect(runWebsocket).toHaveBeenCalledTimes(1);
    expect(runSse).toHaveBeenCalledTimes(1);
  });

  it("falls back after retry budget is exhausted", async () => {
    const runSse = vi.fn().mockResolvedValue("sse");
    const runWebsocket = vi.fn().mockRejectedValue(new Error("websocket meltdown"));

    const result = await executeOpenResponsesWithTransport({
      provider: "openresponses",
      model: "openclaw",
      selection: websocketSelection(),
      policy: {
        forceSseOnErrorCode: [],
        maxWsRetries: 1,
      },
      runSse,
      runWebsocket,
    });

    expect(result.result).toBe("sse");
    expect(result.transportUsed).toBe("sse");
    expect(result.websocketAttempts).toBe(2);
    expect(result.fallbackReason).toBe("ws_transport_error");
    expect(runWebsocket).toHaveBeenCalledTimes(2);
    expect(runSse).toHaveBeenCalledTimes(1);
  });

  it("opens a circuit breaker after repeated websocket failures", async () => {
    const runSse = vi.fn().mockResolvedValue("sse");
    const runWebsocket = vi.fn().mockRejectedValue(new Error("connect failed"));

    for (let i = 0; i < 3; i += 1) {
      const result = await executeOpenResponsesWithTransport({
        provider: "openresponses",
        model: "openclaw",
        selection: websocketSelection(),
        policy: {
          forceSseOnErrorCode: ["ws_connect_failed"],
          maxWsRetries: 0,
        },
        runSse,
        runWebsocket,
      });
      expect(result.transportUsed).toBe("sse");
      expect(result.fallbackReason).toBe("ws_connect_failed");
    }

    const breakerResult = await executeOpenResponsesWithTransport({
      provider: "openresponses",
      model: "openclaw",
      selection: websocketSelection(),
      policy: {
        forceSseOnErrorCode: ["ws_connect_failed"],
        maxWsRetries: 0,
      },
      runSse,
      runWebsocket,
    });

    expect(breakerResult.transportUsed).toBe("sse");
    expect(breakerResult.fallbackReason).toBe("circuit_breaker_open");
    expect(breakerResult.websocketAttempts).toBe(0);
    expect(runWebsocket).toHaveBeenCalledTimes(3);
    expect(runSse).toHaveBeenCalledTimes(4);
  });
});
