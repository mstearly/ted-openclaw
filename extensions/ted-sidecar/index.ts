import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

const DEFAULT_BASE_URL = "http://127.0.0.1:48080";
const DEFAULT_TIMEOUT_MS = 5000;
const ALLOWED_PATHS = new Set(["/status", "/doctor"]);

type TedSidecarPluginConfig = {
  baseUrl?: string;
  timeoutMs?: number;
};

type TedHealthPayload = {
  version: string;
  uptime: number;
  profiles_count: number;
};

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}

function normalizeBaseUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Invalid ted-sidecar baseUrl");
  }

  if (!isLoopbackHost(parsed.hostname)) {
    throw new Error("ted-sidecar baseUrl must be loopback-only");
  }

  if (parsed.username || parsed.password) {
    throw new Error("ted-sidecar baseUrl must not include credentials");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("ted-sidecar baseUrl must use http or https");
  }

  parsed.pathname = "/";
  parsed.search = "";
  parsed.hash = "";
  return parsed;
}

function resolveBaseUrl(pluginConfig: TedSidecarPluginConfig | undefined): URL {
  const fromPlugin = typeof pluginConfig?.baseUrl === "string" ? pluginConfig.baseUrl.trim() : "";
  const fromEnv = process.env.TED_SIDECAR_BASE_URL?.trim() || "";
  const selected = fromPlugin || fromEnv || DEFAULT_BASE_URL;
  return normalizeBaseUrl(selected);
}

function resolveTimeoutMs(pluginConfig: TedSidecarPluginConfig | undefined): number {
  const raw = pluginConfig?.timeoutMs;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return Math.floor(raw);
  }
  return DEFAULT_TIMEOUT_MS;
}

function resolvePathFromAction(action: string): string {
  const normalized = action.trim().toLowerCase();
  if (normalized === "doctor" || normalized === "") {
    return "/doctor";
  }
  if (normalized === "status") {
    return "/status";
  }
  throw new Error("Usage: /ted doctor | /ted status");
}

function buildSafeEndpoint(baseUrl: URL, targetPath: string): URL {
  if (!ALLOWED_PATHS.has(targetPath)) {
    throw new Error(`Path blocked by allowlist: ${targetPath}`);
  }
  const endpoint = new URL(targetPath, baseUrl);
  if (!isLoopbackHost(endpoint.hostname)) {
    throw new Error("Resolved endpoint is not loopback");
  }
  if (!ALLOWED_PATHS.has(endpoint.pathname)) {
    throw new Error(`Path blocked by allowlist: ${endpoint.pathname}`);
  }
  return endpoint;
}

function formatPayload(action: string, payload: TedHealthPayload): string {
  const title = action === "status" ? "Ted sidecar status" : "Ted sidecar doctor";
  return [
    `${title}:`,
    `- version: ${payload.version}`,
    `- uptime: ${payload.uptime}`,
    `- profiles_count: ${payload.profiles_count}`,
  ].join("\n");
}

async function fetchTedPayload(endpoint: URL, timeoutMs: number): Promise<TedHealthPayload> {
  const response = await fetch(endpoint, {
    method: "GET",
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Sidecar request failed (${response.status})`);
  }

  const body = (await response.json()) as Partial<TedHealthPayload>;
  if (
    typeof body.version !== "string" ||
    typeof body.uptime !== "number" ||
    typeof body.profiles_count !== "number"
  ) {
    throw new Error("Sidecar returned invalid payload");
  }

  return {
    version: body.version,
    uptime: body.uptime,
    profiles_count: body.profiles_count,
  };
}

export default function register(api: OpenClawPluginApi) {
  api.registerCommand({
    name: "ted",
    description: "Ted sidecar health checks (/ted doctor, /ted status).",
    acceptsArgs: true,
    handler: async (ctx) => {
      try {
        const pluginConfig = (api.pluginConfig ?? {}) as TedSidecarPluginConfig;
        const baseUrl = resolveBaseUrl(pluginConfig);
        const timeoutMs = resolveTimeoutMs(pluginConfig);
        const action = ctx.args?.trim().toLowerCase() ?? "doctor";
        const targetPath = resolvePathFromAction(action);
        const endpoint = buildSafeEndpoint(baseUrl, targetPath);

        const payload = await fetchTedPayload(endpoint, timeoutMs);
        return { text: formatPayload(action || "doctor", payload) };
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown_error";
        api.logger.warn(`ted-sidecar command failed: ${message}`);
        return { text: `Ted command failed: ${message}` };
      }
    },
  });
}

export {
  buildSafeEndpoint,
  isLoopbackHost,
  normalizeBaseUrl,
  resolvePathFromAction,
};
