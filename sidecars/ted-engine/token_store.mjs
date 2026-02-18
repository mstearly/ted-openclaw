import { spawnSync } from "node:child_process";

const SERVICE_NAME = process.env.TED_GRAPH_TOKEN_SERVICE?.trim() || "openclaw.ted.graph";
const memoryStore = new Map();

function hasSecurityCli() {
  const probe = spawnSync("security", ["-h"], { encoding: "utf8" });
  return probe.status === 0;
}

const keychainAvailable = hasSecurityCli();

function keychainSet(profileId, jsonValue) {
  const result = spawnSync(
    "security",
    ["add-generic-password", "-a", profileId, "-s", SERVICE_NAME, "-w", jsonValue, "-U"],
    { encoding: "utf8" },
  );
  return result.status === 0;
}

function keychainGet(profileId) {
  const result = spawnSync(
    "security",
    ["find-generic-password", "-a", profileId, "-s", SERVICE_NAME, "-w"],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    return null;
  }
  return result.stdout.trim();
}

function keychainDelete(profileId) {
  const result = spawnSync(
    "security",
    ["delete-generic-password", "-a", profileId, "-s", SERVICE_NAME],
    { encoding: "utf8" },
  );
  return result.status === 0;
}

export function getTokenRecord(profileId) {
  if (keychainAvailable) {
    const secret = keychainGet(profileId);
    if (!secret) {
      return null;
    }
    try {
      return JSON.parse(secret);
    } catch {
      return null;
    }
  }
  const raw = memoryStore.get(profileId);
  return raw || null;
}

export function storeTokenRecord(profileId, tokenRecord) {
  if (keychainAvailable) {
    const jsonValue = JSON.stringify(tokenRecord);
    return keychainSet(profileId, jsonValue);
  }
  memoryStore.set(profileId, tokenRecord);
  return true;
}

export function revokeTokenRecord(profileId) {
  let removed = false;
  if (keychainAvailable) {
    removed = keychainDelete(profileId) || removed;
  }
  if (memoryStore.has(profileId)) {
    memoryStore.delete(profileId);
    removed = true;
  }
  return removed;
}

export function getAuthStoreLabel(profileId) {
  if (keychainAvailable && keychainGet(profileId)) {
    return "KEYCHAIN";
  }
  if (memoryStore.has(profileId)) {
    return "MEMORY_ONLY";
  }
  return "NONE";
}
