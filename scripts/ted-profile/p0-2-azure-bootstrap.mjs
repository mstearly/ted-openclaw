#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseArgs(argv) {
  const out = {
    apply: false,
    envOnly: false,
    config: "sidecars/ted-engine/config/graph.profiles.json",
    profiles: ["olumie", "everest"],
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--apply") {
      out.apply = true;
      continue;
    }
    if (arg === "--env-only") {
      out.envOnly = true;
      continue;
    }
    if (arg === "--config") {
      out.config = argv[++i] || out.config;
      continue;
    }
    if (arg === "--profiles") {
      const raw = argv[++i] || "";
      out.profiles = raw
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      continue;
    }
  }
  return out;
}

function envName(profileId, field) {
  return `TED_${profileId.toUpperCase()}_${field}`;
}

function getEnvGuid(profileId, field) {
  const canonicalName = envName(profileId, field);
  const compatName = `TED_GRAPH_${profileId.toUpperCase()}_${field}`;
  const canonicalValue = process.env[canonicalName]?.trim() || "";
  const compatValue = process.env[compatName]?.trim() || "";
  if (compatValue) {
    return { name: compatName, value: compatValue, aliases: [canonicalName] };
  }
  return { name: canonicalName, value: canonicalValue, aliases: [compatName] };
}

function ensureGuid(value, label) {
  if (!value) {
    throw new Error(`${label} is empty`);
  }
  if (!GUID_RE.test(value)) {
    throw new Error(`${label} must be a GUID`);
  }
}

function main() {
  const { apply, envOnly, config, profiles } = parseArgs(process.argv.slice(2));
  const configPath = path.resolve(config);
  if (!envOnly && !fs.existsSync(configPath)) {
    console.error(`Missing config file: ${configPath}`);
    console.error(
      "Create it from sidecars/ted-engine/config/graph.profiles.example.json and keep it local-only.",
    );
    process.exit(2);
  }

  let parsed = { profiles: {} };
  if (!envOnly) {
    const raw = fs.readFileSync(configPath, "utf8");
    parsed = JSON.parse(raw);
    const profileMap =
      parsed?.profiles && typeof parsed.profiles === "object" ? parsed.profiles : null;
    if (!profileMap) {
      console.error(`Invalid graph profile config shape in ${configPath}`);
      process.exit(2);
    }
  }
  const profileMap =
    parsed?.profiles && typeof parsed.profiles === "object" ? parsed.profiles : null;

  let changed = false;
  let hasErrors = false;

  const mode = envOnly ? "env-only" : apply ? "apply" : "check-only";
  console.log(`P0-2 bootstrap (${mode})`);
  console.log(`Config: ${envOnly ? "n/a (runtime env only)" : configPath}`);
  console.log("");

  for (const profileId of profiles) {
    const profile = profileMap?.[profileId] || {};
    if (!envOnly && (!profile || typeof profile !== "object")) {
      console.error(`- ${profileId}: missing profile entry`);
      hasErrors = true;
      continue;
    }

    const currentTenant = typeof profile.tenant_id === "string" ? profile.tenant_id.trim() : "";
    const currentClient = typeof profile.client_id === "string" ? profile.client_id.trim() : "";
    const tenantEnv = getEnvGuid(profileId, "TENANT_ID");
    const clientEnv = getEnvGuid(profileId, "CLIENT_ID");

    const effectiveTenant = tenantEnv.value || currentTenant;
    const effectiveClient = clientEnv.value || currentClient;
    let nextTenant = currentTenant;
    let nextClient = currentClient;

    if (apply) {
      if (tenantEnv.value) {
        try {
          ensureGuid(tenantEnv.value, tenantEnv.name);
          nextTenant = tenantEnv.value;
        } catch (err) {
          console.error(`- ${profileId}: ${err.message}`);
          hasErrors = true;
        }
      }
      if (clientEnv.value) {
        try {
          ensureGuid(clientEnv.value, clientEnv.name);
          nextClient = clientEnv.value;
        } catch (err) {
          console.error(`- ${profileId}: ${err.message}`);
          hasErrors = true;
        }
      }
      if (nextTenant !== currentTenant || nextClient !== currentClient) {
        profile.tenant_id = nextTenant;
        profile.client_id = nextClient;
        changed = true;
      }
    }

    const tenantOk = GUID_RE.test(apply ? nextTenant : effectiveTenant);
    const clientOk = GUID_RE.test(apply ? nextClient : effectiveClient);
    const status = tenantOk && clientOk ? "ready" : "blocked";
    console.log(`- ${profileId}: ${status}`);
    console.log(`  tenant_id: ${tenantOk ? "set" : "missing/invalid"}`);
    console.log(`  client_id: ${clientOk ? "set" : "missing/invalid"}`);
    if (tenantEnv.value || clientEnv.value) {
      console.log(
        `  source: runtime env (${tenantEnv.name}/${clientEnv.name}${tenantEnv.aliases?.[0] ? `; aliases: ${tenantEnv.aliases[0]}, ${clientEnv.aliases[0]}` : ""})`,
      );
    }
    if (!tenantOk || !clientOk) {
      console.log(`  required env for apply: ${tenantEnv.name}, ${clientEnv.name}`);
      hasErrors = true;
    }
  }

  if (apply && changed) {
    fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2) + "\n", "utf8");
    console.log("");
    console.log("Updated graph profile config.");
  }

  console.log("");
  console.log("Next runbook steps:");
  console.log("1. Start sidecar.");
  console.log("2. POST /graph/{profile}/auth/device/start");
  console.log("3. Complete Microsoft device login.");
  console.log("4. POST /graph/{profile}/auth/device/poll");
  console.log("5. GET /graph/{profile}/status and verify authenticated state.");

  if (hasErrors) {
    process.exit(1);
  }
}

main();
