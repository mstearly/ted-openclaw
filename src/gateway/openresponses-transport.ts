import { logWarn } from "../logger.js";

export type OpenResponsesTransport = "sse" | "websocket";
export type OpenResponsesTransportStatus = "completed" | "failed";

type TransportRunState = {
  runId: string;
  requestId: string;
  provider: string;
  model: string;
  selectedTransport: OpenResponsesTransport;
  startedAtMs: number;
  completedAtMs?: number;
  latencyMs?: number;
  fallbackCount: number;
  fallbackReasons: string[];
  status?: OpenResponsesTransportStatus;
};

type TransportAggregateSummary = {
  provider: string;
  model: string;
  run_count: number;
  fallback_runs: number;
  fallback_events: number;
  fallback_ratio: number;
  latency_p50_ms: number | null;
  latency_p95_ms: number | null;
  latency_avg_ms: number | null;
};

type TransportRunSummary = {
  run_id: string;
  request_id: string;
  provider: string;
  model: string;
  selected_transport: OpenResponsesTransport;
  started_at_ms: number;
  completed_at_ms?: number;
  latency_ms?: number;
  fallback_count: number;
  fallback_reasons: string[];
  status?: OpenResponsesTransportStatus;
};

export type OpenResponsesTransportRunSummary = {
  run: TransportRunSummary;
  aggregate: TransportAggregateSummary | null;
};

const MAX_COMPLETED_RUNS = 2000;
const activeRuns = new Map<string, TransportRunState>();
const completedRuns = new Map<string, TransportRunState>();
const completedRunOrder: string[] = [];

function toFiniteNonNegativeInt(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.floor(value));
}

function emitTransportTelemetry(params: {
  event: "selected" | "fallback" | "latency.sample";
  requestId: string;
  runId: string;
  provider: string;
  model: string;
  details: Record<string, unknown>;
}) {
  logWarn(
    `openresponses: llm.transport.${params.event} ${JSON.stringify({
      request_id: params.requestId,
      run_id: params.runId,
      provider: params.provider,
      model: params.model,
      ...params.details,
    })}`,
  );
}

function percentile(values: number[], percentileValue: number): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].toSorted((a, b) => a - b);
  const rank = Math.max(0, Math.ceil(sorted.length * percentileValue) - 1);
  return sorted[rank] ?? sorted[sorted.length - 1] ?? null;
}

function computeAggregate(provider: string, model: string): TransportAggregateSummary | null {
  const runs = completedRunOrder
    .map((runId) => completedRuns.get(runId))
    .filter(
      (run): run is TransportRunState => !!run && run.provider === provider && run.model === model,
    );

  if (runs.length === 0) {
    return null;
  }

  const latencies = runs
    .map((run) => run.latencyMs)
    .filter(
      (latency): latency is number => typeof latency === "number" && Number.isFinite(latency),
    );
  const fallbackRuns = runs.filter((run) => run.fallbackCount > 0).length;
  const fallbackEvents = runs.reduce((sum, run) => sum + run.fallbackCount, 0);
  const latencySum = latencies.reduce((sum, latency) => sum + latency, 0);

  return {
    provider,
    model,
    run_count: runs.length,
    fallback_runs: fallbackRuns,
    fallback_events: fallbackEvents,
    fallback_ratio: runs.length > 0 ? fallbackRuns / runs.length : 0,
    latency_p50_ms: percentile(latencies, 0.5),
    latency_p95_ms: percentile(latencies, 0.95),
    latency_avg_ms: latencies.length > 0 ? latencySum / latencies.length : null,
  };
}

function toRunSummary(run: TransportRunState): TransportRunSummary {
  return {
    run_id: run.runId,
    request_id: run.requestId,
    provider: run.provider,
    model: run.model,
    selected_transport: run.selectedTransport,
    started_at_ms: run.startedAtMs,
    completed_at_ms: run.completedAtMs,
    latency_ms: run.latencyMs,
    fallback_count: run.fallbackCount,
    fallback_reasons: [...run.fallbackReasons],
    status: run.status,
  };
}

function trimCompletedRunsIfNeeded() {
  while (completedRunOrder.length > MAX_COMPLETED_RUNS) {
    const oldestRunId = completedRunOrder.shift();
    if (!oldestRunId) {
      break;
    }
    completedRuns.delete(oldestRunId);
  }
}

export function startTransportRun(params: {
  runId: string;
  requestId: string;
  provider: string;
  model: string;
  transport: OpenResponsesTransport;
  startedAtMs?: number;
}) {
  const now = Date.now();
  const startedAtMs = toFiniteNonNegativeInt(params.startedAtMs ?? now, now);
  const run: TransportRunState = {
    runId: params.runId,
    requestId: params.requestId,
    provider: params.provider,
    model: params.model,
    selectedTransport: params.transport,
    startedAtMs,
    fallbackCount: 0,
    fallbackReasons: [],
  };
  activeRuns.set(params.runId, run);
  emitTransportTelemetry({
    event: "selected",
    requestId: params.requestId,
    runId: params.runId,
    provider: params.provider,
    model: params.model,
    details: { transport: params.transport },
  });
}

export function recordTransportFallback(params: {
  runId: string;
  requestId: string;
  provider: string;
  model: string;
  from: OpenResponsesTransport;
  to: OpenResponsesTransport;
  reason: string;
}) {
  const now = Date.now();
  const run =
    activeRuns.get(params.runId) ??
    ({
      runId: params.runId,
      requestId: params.requestId,
      provider: params.provider,
      model: params.model,
      selectedTransport: params.from,
      startedAtMs: now,
      fallbackCount: 0,
      fallbackReasons: [],
    } satisfies TransportRunState);

  run.selectedTransport = params.to;
  run.fallbackCount += 1;
  run.fallbackReasons.push(params.reason);
  activeRuns.set(params.runId, run);

  emitTransportTelemetry({
    event: "fallback",
    requestId: params.requestId,
    runId: params.runId,
    provider: params.provider,
    model: params.model,
    details: {
      from: params.from,
      to: params.to,
      reason: params.reason,
      fallback_count: run.fallbackCount,
    },
  });
}

export function completeTransportRun(params: {
  runId: string;
  requestId: string;
  provider: string;
  model: string;
  status: OpenResponsesTransportStatus;
  endedAtMs?: number;
}) {
  const now = Date.now();
  const endedAtMs = toFiniteNonNegativeInt(params.endedAtMs ?? now, now);
  const existingCompleted = completedRuns.get(params.runId);
  if (existingCompleted) {
    return;
  }

  const run =
    activeRuns.get(params.runId) ??
    ({
      runId: params.runId,
      requestId: params.requestId,
      provider: params.provider,
      model: params.model,
      selectedTransport: "sse",
      startedAtMs: endedAtMs,
      fallbackCount: 0,
      fallbackReasons: [],
    } satisfies TransportRunState);

  run.completedAtMs = endedAtMs;
  run.status = params.status;
  run.latencyMs = Math.max(0, endedAtMs - run.startedAtMs);
  activeRuns.delete(params.runId);
  completedRuns.set(params.runId, run);
  completedRunOrder.push(params.runId);
  trimCompletedRunsIfNeeded();

  emitTransportTelemetry({
    event: "latency.sample",
    requestId: params.requestId,
    runId: params.runId,
    provider: params.provider,
    model: params.model,
    details: {
      transport: run.selectedTransport,
      latency_ms: run.latencyMs,
      status: params.status,
      fallback_count: run.fallbackCount,
    },
  });
}

export function getTransportRunSummary(runId: string): OpenResponsesTransportRunSummary | null {
  const run = completedRuns.get(runId) ?? activeRuns.get(runId);
  if (!run) {
    return null;
  }
  return {
    run: toRunSummary(run),
    aggregate: computeAggregate(run.provider, run.model),
  };
}

export function getTransportSummarySnapshot() {
  const runs = completedRunOrder
    .map((runId) => completedRuns.get(runId))
    .filter((run): run is TransportRunState => Boolean(run));
  const aggregateKeySet = new Set(runs.map((run) => `${run.provider}::${run.model}`));
  const aggregates = [...aggregateKeySet]
    .map((key) => {
      const [provider, model] = key.split("::");
      return computeAggregate(provider ?? "", model ?? "");
    })
    .filter((summary): summary is TransportAggregateSummary => Boolean(summary));

  return {
    runs: runs.map((run) => toRunSummary(run)),
    aggregates,
  };
}

export function resetTransportSummaryForTest() {
  activeRuns.clear();
  completedRuns.clear();
  completedRunOrder.length = 0;
}
