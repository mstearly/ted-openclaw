import { MatrixClient } from "@vector-im/matrix-bot-sdk";
import { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "openclaw/plugin-sdk/account-id";
import { getMatrixRuntime } from "../../runtime.js";
import type { CoreConfig } from "../../types.js";
import { ensureMatrixSdkLoggingConfigured } from "./logging.js";
import type { MatrixAuth, MatrixResolvedConfig } from "./types.js";

function clean(value?: string): string {
  return value?.trim() ?? "";
}

function parseBooleanEnv(value?: string): boolean | undefined {
  const raw = value?.trim().toLowerCase();
  if (!raw) {
    return undefined;
  }
  if (["1", "true", "yes", "on"].includes(raw)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(raw)) {
    return false;
  }
  return undefined;
}

function isLocalOrPrivateHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  if (!host) {
    return false;
  }
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local")
  ) {
    return true;
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
    const parts = host.split(".").map((segment) => Number(segment));
    if (parts.some((segment) => !Number.isInteger(segment) || segment < 0 || segment > 255)) {
      return false;
    }
    if (parts[0] === 10 || parts[0] === 127) {
      return true;
    }
    if (parts[0] === 169 && parts[1] === 254) {
      return true;
    }
    if (parts[0] === 192 && parts[1] === 168) {
      return true;
    }
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
      return true;
    }
  }

  const normalizedIpv6 = host.replace(/^\[|\]$/g, "");
  if (
    normalizedIpv6.startsWith("fc") ||
    normalizedIpv6.startsWith("fd") ||
    normalizedIpv6.startsWith("fe80:")
  ) {
    return true;
  }

  return false;
}

function normalizeHomeserverUrl(params: {
  rawHomeserver: string;
  allowInsecureHomeserver: boolean;
}): string {
  let parsed: URL;
  try {
    parsed = new URL(params.rawHomeserver);
  } catch {
    throw new Error("Matrix homeserver must be a valid URL.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Matrix homeserver must use http:// or https://.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Matrix homeserver URL must not include embedded credentials.");
  }

  if (parsed.search || parsed.hash) {
    throw new Error("Matrix homeserver URL must not include query strings or URL fragments.");
  }

  if (
    parsed.protocol === "http:" &&
    !params.allowInsecureHomeserver &&
    !isLocalOrPrivateHost(parsed.hostname)
  ) {
    throw new Error(
      "Matrix homeserver must use https:// for non-local hosts. Set channels.matrix.allowInsecureHomeserver=true to bypass.",
    );
  }

  const pathname = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "");
  return `${parsed.protocol}//${parsed.host}${pathname}`;
}

/** Shallow-merge known nested config sub-objects so partial overrides inherit base values. */
function deepMergeConfig<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const merged = { ...base, ...override } as Record<string, unknown>;
  // Merge known nested objects (dm, actions) so partial overrides keep base fields
  for (const key of ["dm", "actions"] as const) {
    const b = base[key];
    const o = override[key];
    if (typeof b === "object" && b !== null && typeof o === "object" && o !== null) {
      merged[key] = { ...(b as Record<string, unknown>), ...(o as Record<string, unknown>) };
    }
  }
  return merged as T;
}

/**
 * Resolve Matrix config for a specific account, with fallback to top-level config.
 * This supports both multi-account (channels.matrix.accounts.*) and
 * single-account (channels.matrix.*) configurations.
 */
export function resolveMatrixConfigForAccount(
  cfg: CoreConfig = getMatrixRuntime().config.loadConfig() as CoreConfig,
  accountId?: string | null,
  env: NodeJS.ProcessEnv = process.env,
): MatrixResolvedConfig {
  const normalizedAccountId = normalizeAccountId(accountId);
  const matrixBase = cfg.channels?.matrix ?? {};
  const accounts = cfg.channels?.matrix?.accounts;

  // Try to get account-specific config first (direct lookup, then case-insensitive fallback)
  let accountConfig = accounts?.[normalizedAccountId];
  if (!accountConfig && accounts) {
    for (const key of Object.keys(accounts)) {
      if (normalizeAccountId(key) === normalizedAccountId) {
        accountConfig = accounts[key];
        break;
      }
    }
  }

  // Deep merge: account-specific values override top-level values, preserving
  // nested object inheritance (dm, actions, groups) so partial overrides work.
  const matrix = accountConfig ? deepMergeConfig(matrixBase, accountConfig) : matrixBase;

  const allowInsecureHomeserver =
    matrix.allowInsecureHomeserver === true ||
    parseBooleanEnv(env.MATRIX_ALLOW_INSECURE_HOMESERVER) === true;
  const homeserverRaw = clean(matrix.homeserver) || clean(env.MATRIX_HOMESERVER);
  const homeserver = homeserverRaw
    ? normalizeHomeserverUrl({ rawHomeserver: homeserverRaw, allowInsecureHomeserver })
    : "";
  const userId = clean(matrix.userId) || clean(env.MATRIX_USER_ID);
  const accessToken = clean(matrix.accessToken) || clean(env.MATRIX_ACCESS_TOKEN) || undefined;
  const password = clean(matrix.password) || clean(env.MATRIX_PASSWORD) || undefined;
  const deviceName = clean(matrix.deviceName) || clean(env.MATRIX_DEVICE_NAME) || undefined;
  const initialSyncLimit =
    typeof matrix.initialSyncLimit === "number"
      ? Math.max(0, Math.floor(matrix.initialSyncLimit))
      : undefined;
  const encryption = matrix.encryption ?? false;
  return {
    homeserver,
    userId,
    accessToken,
    password,
    deviceName,
    initialSyncLimit,
    encryption,
  };
}

/**
 * Single-account function for backward compatibility - resolves default account config.
 */
export function resolveMatrixConfig(
  cfg: CoreConfig = getMatrixRuntime().config.loadConfig() as CoreConfig,
  env: NodeJS.ProcessEnv = process.env,
): MatrixResolvedConfig {
  return resolveMatrixConfigForAccount(cfg, DEFAULT_ACCOUNT_ID, env);
}

export async function resolveMatrixAuth(params?: {
  cfg?: CoreConfig;
  env?: NodeJS.ProcessEnv;
  accountId?: string | null;
}): Promise<MatrixAuth> {
  const cfg = params?.cfg ?? (getMatrixRuntime().config.loadConfig() as CoreConfig);
  const env = params?.env ?? process.env;
  const resolved = resolveMatrixConfigForAccount(cfg, params?.accountId, env);
  if (!resolved.homeserver) {
    throw new Error("Matrix homeserver is required (matrix.homeserver)");
  }

  const {
    loadMatrixCredentials,
    saveMatrixCredentials,
    credentialsMatchConfig,
    touchMatrixCredentials,
  } = await import("../credentials.js");

  const accountId = params?.accountId;
  const cached = loadMatrixCredentials(env, accountId);
  const cachedCredentials =
    cached &&
    credentialsMatchConfig(cached, {
      homeserver: resolved.homeserver,
      userId: resolved.userId || "",
    })
      ? cached
      : null;

  // If we have an access token, we can fetch userId via whoami if not provided
  if (resolved.accessToken) {
    let userId = resolved.userId;
    if (!userId) {
      // Fetch userId from access token via whoami
      ensureMatrixSdkLoggingConfigured();
      const tempClient = new MatrixClient(resolved.homeserver, resolved.accessToken);
      const whoami = await tempClient.getUserId();
      userId = whoami;
      // Save the credentials with the fetched userId
      saveMatrixCredentials(
        {
          homeserver: resolved.homeserver,
          userId,
          accessToken: resolved.accessToken,
        },
        env,
        accountId,
      );
    } else if (cachedCredentials && cachedCredentials.accessToken === resolved.accessToken) {
      touchMatrixCredentials(env, accountId);
    }
    return {
      homeserver: resolved.homeserver,
      userId,
      accessToken: resolved.accessToken,
      deviceName: resolved.deviceName,
      initialSyncLimit: resolved.initialSyncLimit,
      encryption: resolved.encryption,
    };
  }

  if (cachedCredentials) {
    touchMatrixCredentials(env, accountId);
    return {
      homeserver: cachedCredentials.homeserver,
      userId: cachedCredentials.userId,
      accessToken: cachedCredentials.accessToken,
      deviceName: resolved.deviceName,
      initialSyncLimit: resolved.initialSyncLimit,
      encryption: resolved.encryption,
    };
  }

  if (!resolved.userId) {
    throw new Error("Matrix userId is required when no access token is configured (matrix.userId)");
  }

  if (!resolved.password) {
    throw new Error(
      "Matrix password is required when no access token is configured (matrix.password)",
    );
  }

  // Login with password using HTTP API
  const loginResponse = await fetch(`${resolved.homeserver}/_matrix/client/v3/login`, {
    method: "POST",
    redirect: "error",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "m.login.password",
      identifier: { type: "m.id.user", user: resolved.userId },
      password: resolved.password,
      initial_device_display_name: resolved.deviceName ?? "OpenClaw Gateway",
    }),
  });

  if (!loginResponse.ok) {
    const errorText = await loginResponse.text();
    throw new Error(`Matrix login failed: ${errorText}`);
  }

  const login = (await loginResponse.json()) as {
    access_token?: string;
    user_id?: string;
    device_id?: string;
  };

  const accessToken = login.access_token?.trim();
  if (!accessToken) {
    throw new Error("Matrix login did not return an access token");
  }

  const auth: MatrixAuth = {
    homeserver: resolved.homeserver,
    userId: login.user_id ?? resolved.userId,
    accessToken,
    deviceName: resolved.deviceName,
    initialSyncLimit: resolved.initialSyncLimit,
    encryption: resolved.encryption,
  };

  saveMatrixCredentials(
    {
      homeserver: auth.homeserver,
      userId: auth.userId,
      accessToken: auth.accessToken,
      deviceId: login.device_id,
    },
    env,
    accountId,
  );

  return auth;
}
