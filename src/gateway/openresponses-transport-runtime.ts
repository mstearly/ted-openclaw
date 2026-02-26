import type { OpenResponsesTransportSelection } from "./openresponses-transport-config.js";

type RuntimePolicy = {
  maxWsRetries: number;
  forceSseOnErrorCode: string[];
};

type RuntimeBreakerState = {
  failures: number;
  disabledUntilMs: number;
};

const breakerState = new Map<string, RuntimeBreakerState>();
const BREAKER_FAILURE_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 5 * 60 * 1000;

function nowMs() {
  return Date.now();
}

function modelKey(provider: string, model: string): string {
  return `${provider}::${model}`;
}

function normalizeErrorCode(err: unknown): string {
  const maybeCode = (err && typeof err === "object" && "code" in err ? err.code : undefined) as
    | string
    | undefined;
  if (typeof maybeCode === "string" && maybeCode.trim().length > 0) {
    return maybeCode.trim();
  }

  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : err && typeof err === "object" && "message" in err && typeof err.message === "string"
          ? err.message
          : "";
  const text = message.toLowerCase();
  if (text.includes("auth")) {
    return "ws_auth_failed";
  }
  if (text.includes("timeout")) {
    return "ws_timeout";
  }
  if (text.includes("connect")) {
    return "ws_connect_failed";
  }
  return "ws_transport_error";
}

function normalizeReasonCodeList(values: string[]): Set<string> {
  const normalized = new Set<string>();
  for (const value of values) {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length > 0) {
      normalized.add(trimmed);
    }
  }
  return normalized;
}

function shouldUseCircuitBreaker(key: string, currentMs: number): boolean {
  const state = breakerState.get(key);
  if (!state) {
    return false;
  }
  if (state.disabledUntilMs <= 0) {
    return false;
  }
  if (currentMs >= state.disabledUntilMs) {
    breakerState.delete(key);
    return false;
  }
  return true;
}

function recordWebsocketFailure(key: string, currentMs: number) {
  const state = breakerState.get(key) ?? { failures: 0, disabledUntilMs: 0 };
  state.failures += 1;
  if (state.failures >= BREAKER_FAILURE_THRESHOLD) {
    state.disabledUntilMs = currentMs + BREAKER_COOLDOWN_MS;
    state.failures = BREAKER_FAILURE_THRESHOLD;
  }
  breakerState.set(key, state);
}

function resetWebsocketFailure(key: string) {
  breakerState.delete(key);
}

type ExecuteWithTransportParams<T> = {
  provider: string;
  model: string;
  selection: OpenResponsesTransportSelection;
  policy: RuntimePolicy;
  runSse: () => Promise<T>;
  runWebsocket: () => Promise<T>;
};

export type ExecuteWithTransportResult<T> = {
  result: T;
  transportUsed: "sse" | "websocket";
  websocketAttempts: number;
  fallbackReason?: string;
};

export async function executeOpenResponsesWithTransport<T>(
  params: ExecuteWithTransportParams<T>,
): Promise<ExecuteWithTransportResult<T>> {
  if (params.selection.selectedTransport !== "websocket") {
    const result = await params.runSse();
    return {
      result,
      transportUsed: "sse",
      websocketAttempts: 0,
    };
  }

  const key = modelKey(params.provider, params.model);
  const currentMs = nowMs();
  if (shouldUseCircuitBreaker(key, currentMs)) {
    const result = await params.runSse();
    return {
      result,
      transportUsed: "sse",
      websocketAttempts: 0,
      fallbackReason: "circuit_breaker_open",
    };
  }

  const maxAttempts = Math.max(1, Math.floor(params.policy.maxWsRetries) + 1);
  const forceSseReasonCodes = normalizeReasonCodeList(params.policy.forceSseOnErrorCode);
  let fallbackReason = "ws_transport_error";
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await params.runWebsocket();
      resetWebsocketFailure(key);
      return {
        result,
        transportUsed: "websocket",
        websocketAttempts: attempt,
      };
    } catch (err) {
      fallbackReason = normalizeErrorCode(err);
      recordWebsocketFailure(key, nowMs());
      const forceFallback = forceSseReasonCodes.has(fallbackReason);
      const exhausted = attempt === maxAttempts;
      if (forceFallback || exhausted) {
        const result = await params.runSse();
        return {
          result,
          transportUsed: "sse",
          websocketAttempts: attempt,
          fallbackReason,
        };
      }
    }
  }

  const result = await params.runSse();
  return {
    result,
    transportUsed: "sse",
    websocketAttempts: maxAttempts,
    fallbackReason,
  };
}

export function resetOpenResponsesTransportRuntimeForTest() {
  breakerState.clear();
}
