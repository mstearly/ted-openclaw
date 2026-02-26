import type {
  GatewayHttpResponsesConfig,
  GatewayHttpResponsesTransportCapabilityEntry,
  GatewayHttpResponsesTransportMode,
} from "../config/types.gateway.js";

export type OpenResponsesTransportCapability = {
  provider: string;
  model: string;
  websocketMode: boolean;
  streaming: boolean;
  continuationSemantics: boolean;
  knownFallbackTriggers: string[];
};

export type OpenResponsesTransportPolicy = {
  mode: GatewayHttpResponsesTransportMode;
  canaryPercent: number;
  forceSseOnErrorCode: string[];
  maxWsRetries: number;
};

export type OpenResponsesTransportConfig = {
  policy: OpenResponsesTransportPolicy;
  capabilities: OpenResponsesTransportCapability[];
};

export type OpenResponsesTransportSelection = {
  requestedMode: GatewayHttpResponsesTransportMode;
  selectedTransport: "sse" | "websocket";
  fallbackReason?: string;
  capability: OpenResponsesTransportCapability | null;
};

function normalizeNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeFallbackReasons(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((entry) => normalizeNonEmptyString(entry))
    .filter((entry): entry is string => Boolean(entry));
}

function normalizeCapabilities(
  entries: GatewayHttpResponsesTransportCapabilityEntry[] | undefined,
): OpenResponsesTransportCapability[] {
  if (!entries || entries.length === 0) {
    return [];
  }
  const normalized: OpenResponsesTransportCapability[] = [];
  for (const entry of entries) {
    const provider = normalizeNonEmptyString(entry.provider);
    const model = normalizeNonEmptyString(entry.model);
    if (!provider || !model) {
      continue;
    }
    normalized.push({
      provider,
      model,
      websocketMode: entry.websocketMode ?? false,
      streaming: entry.streaming ?? true,
      continuationSemantics: entry.continuationSemantics ?? false,
      knownFallbackTriggers: normalizeFallbackReasons(entry.knownFallbackTriggers),
    });
  }
  return normalized;
}

export function normalizeOpenResponsesTransportConfig(
  config: GatewayHttpResponsesConfig | undefined,
): OpenResponsesTransportConfig {
  const policyRaw = config?.transportPolicy;
  const mode = policyRaw?.mode ?? "sse";
  const canaryPercent = policyRaw?.canaryPercent ?? 0;
  const maxWsRetries = policyRaw?.maxWsRetries ?? 0;
  const forceSseOnErrorCode = normalizeFallbackReasons(policyRaw?.forceSseOnErrorCode);
  const capabilities = normalizeCapabilities(config?.transportCapabilityMatrix?.entries);

  return {
    policy: {
      mode,
      canaryPercent,
      forceSseOnErrorCode,
      maxWsRetries,
    },
    capabilities,
  };
}

function capabilityKey(capability: OpenResponsesTransportCapability): string {
  return `${capability.provider}::${capability.model}`;
}

function hasWebsocketCapability(capabilities: OpenResponsesTransportCapability[]): boolean {
  return capabilities.some((capability) => capability.websocketMode);
}

function modeRequiresMatrix(mode: GatewayHttpResponsesTransportMode): boolean {
  return mode === "websocket" || mode === "auto";
}

export function validateOpenResponsesTransportConfig(
  config: GatewayHttpResponsesConfig | undefined,
): { ok: true } | { ok: false; errors: string[] } {
  const normalized = normalizeOpenResponsesTransportConfig(config);
  const { policy, capabilities } = normalized;
  const errors: string[] = [];

  const seen = new Set<string>();
  for (const capability of capabilities) {
    const key = capabilityKey(capability);
    if (seen.has(key)) {
      errors.push(`duplicate transport capability entry: ${key}`);
      continue;
    }
    seen.add(key);
  }

  if (modeRequiresMatrix(policy.mode) && capabilities.length === 0) {
    errors.push(
      `responses.transportPolicy.mode=${policy.mode} requires responses.transportCapabilityMatrix.entries`,
    );
  }
  if (policy.mode === "websocket" && !hasWebsocketCapability(capabilities)) {
    errors.push(
      "responses.transportPolicy.mode=websocket requires at least one capability with websocketMode=true",
    );
  }
  if (policy.mode === "auto" && policy.canaryPercent > 0 && !hasWebsocketCapability(capabilities)) {
    errors.push(
      "responses.transportPolicy.canaryPercent > 0 requires at least one websocket-capable model in transportCapabilityMatrix",
    );
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}

function findCapability(
  capabilities: OpenResponsesTransportCapability[],
  model: string,
): OpenResponsesTransportCapability | null {
  const exact = capabilities.find((capability) => capability.model === model);
  if (exact) {
    return exact;
  }
  if (model.includes(":")) {
    const base = model.split(":")[0] ?? "";
    const prefix = capabilities.find((capability) => capability.model === base);
    if (prefix) {
      return prefix;
    }
  }
  return null;
}

function hashToPercent(seed: string): number {
  let hash = 5381;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33) ^ seed.charCodeAt(index);
  }
  const normalized = Math.abs(hash >>> 0);
  return normalized % 100;
}

export function resolveOpenResponsesTransportSelection(params: {
  config: GatewayHttpResponsesConfig | undefined;
  model: string;
  requestKey?: string;
}): OpenResponsesTransportSelection {
  const normalized = normalizeOpenResponsesTransportConfig(params.config);
  const capability = findCapability(normalized.capabilities, params.model);
  const mode = normalized.policy.mode;

  if (mode === "sse") {
    return {
      requestedMode: mode,
      selectedTransport: "sse",
      capability,
    };
  }

  if (!capability) {
    return {
      requestedMode: mode,
      selectedTransport: "sse",
      fallbackReason: "model_not_in_capability_matrix",
      capability: null,
    };
  }

  if (!capability.websocketMode) {
    return {
      requestedMode: mode,
      selectedTransport: "sse",
      fallbackReason: "model_not_websocket_capable",
      capability,
    };
  }

  if (mode === "websocket") {
    return {
      requestedMode: mode,
      selectedTransport: "websocket",
      capability,
    };
  }

  const canaryPercent = Math.max(0, Math.min(100, normalized.policy.canaryPercent));
  if (canaryPercent === 0) {
    return {
      requestedMode: mode,
      selectedTransport: "sse",
      fallbackReason: "auto_canary_disabled",
      capability,
    };
  }

  const bucket = hashToPercent(
    `${params.requestKey ?? "default"}::${params.model}::${capability.provider}`,
  );
  if (bucket < canaryPercent) {
    return {
      requestedMode: mode,
      selectedTransport: "websocket",
      capability,
    };
  }
  return {
    requestedMode: mode,
    selectedTransport: "sse",
    fallbackReason: "auto_canary_not_selected",
    capability,
  };
}
