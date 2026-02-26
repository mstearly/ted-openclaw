import { beforeEach, describe, expect, it } from "vitest";
import {
  completeTransportRun,
  getTransportRunSummary,
  getTransportSummarySnapshot,
  recordTransportFallback,
  resetTransportSummaryForTest,
  startTransportRun,
} from "./openresponses-transport.js";

describe("openresponses transport telemetry", () => {
  beforeEach(() => {
    resetTransportSummaryForTest();
  });

  it("tracks run-level selection and latency with per-model aggregates", () => {
    startTransportRun({
      runId: "run-a",
      requestId: "req-a",
      provider: "openresponses",
      model: "openclaw",
      transport: "sse",
      startedAtMs: 1000,
    });
    completeTransportRun({
      runId: "run-a",
      requestId: "req-a",
      provider: "openresponses",
      model: "openclaw",
      status: "completed",
      endedAtMs: 1200,
    });

    startTransportRun({
      runId: "run-b",
      requestId: "req-b",
      provider: "openresponses",
      model: "openclaw",
      transport: "sse",
      startedAtMs: 2000,
    });
    completeTransportRun({
      runId: "run-b",
      requestId: "req-b",
      provider: "openresponses",
      model: "openclaw",
      status: "completed",
      endedAtMs: 2600,
    });

    const runSummary = getTransportRunSummary("run-b");
    expect(runSummary).not.toBeNull();
    expect(runSummary?.run.selected_transport).toBe("sse");
    expect(runSummary?.run.latency_ms).toBe(600);
    expect(runSummary?.aggregate?.run_count).toBe(2);
    expect(runSummary?.aggregate?.latency_p50_ms).toBe(200);
    expect(runSummary?.aggregate?.latency_p95_ms).toBe(600);
    expect(runSummary?.aggregate?.fallback_ratio).toBe(0);
  });

  it("tracks deterministic fallback counts and ratio", () => {
    startTransportRun({
      runId: "run-fallback",
      requestId: "req-fallback",
      provider: "openresponses",
      model: "openclaw:beta",
      transport: "websocket",
      startedAtMs: 5000,
    });
    recordTransportFallback({
      runId: "run-fallback",
      requestId: "req-fallback",
      provider: "openresponses",
      model: "openclaw:beta",
      from: "websocket",
      to: "sse",
      reason: "ws_connect_failed",
    });
    completeTransportRun({
      runId: "run-fallback",
      requestId: "req-fallback",
      provider: "openresponses",
      model: "openclaw:beta",
      status: "completed",
      endedAtMs: 5200,
    });

    const summary = getTransportRunSummary("run-fallback");
    expect(summary).not.toBeNull();
    expect(summary?.run.selected_transport).toBe("sse");
    expect(summary?.run.fallback_count).toBe(1);
    expect(summary?.run.fallback_reasons).toEqual(["ws_connect_failed"]);
    expect(summary?.aggregate?.fallback_runs).toBe(1);
    expect(summary?.aggregate?.fallback_events).toBe(1);
    expect(summary?.aggregate?.fallback_ratio).toBe(1);

    const snapshot = getTransportSummarySnapshot();
    expect(snapshot.runs).toHaveLength(1);
    expect(snapshot.aggregates).toHaveLength(1);
  });
});
