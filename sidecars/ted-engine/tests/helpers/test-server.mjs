import { spawn } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.resolve(__dirname, "..", "..");

let runtime = null;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function allocatePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (!address || typeof address === "string") {
          reject(new Error("Failed to allocate ephemeral port"));
          return;
        }
        resolve(address.port);
      });
    });
  });
}

function prepareRuntimeTree(rootDir) {
  const runtimeDir = path.join(rootDir, "ted-engine");
  fs.mkdirSync(runtimeDir, { recursive: true });

  for (const file of ["server.mjs", "server-utils.mjs", "token_store.mjs"]) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(runtimeDir, file));
  }

  for (const dir of ["config", "migrations", "modules", "prompts"]) {
    fs.cpSync(path.join(sourceDir, dir), path.join(runtimeDir, dir), { recursive: true });
  }

  return runtimeDir;
}

async function waitForReady(baseUrl, child, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Test sidecar exited early with code ${child.exitCode}`);
    }
    try {
      const response = await fetch(`${baseUrl}/status`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) {
        return;
      }
    } catch {
      // Retry until timeout.
    }
    await delay(120);
  }
  throw new Error(`Timed out waiting for test sidecar to become ready at ${baseUrl}`);
}

export async function startTestSidecar() {
  if (runtime) {
    return runtime.baseUrl;
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-ted-sidecar-"));
  const runtimeDir = prepareRuntimeTree(tempRoot);
  const port = Number(await allocatePort());
  const baseUrl = `http://127.0.0.1:${port}`;
  let output = "";

  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: runtimeDir,
    env: {
      ...process.env,
      TED_ENGINE_HOST: "127.0.0.1",
      TED_ENGINE_PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const appendOutput = (chunk) => {
    output += chunk.toString("utf8");
    if (output.length > 8000) {
      output = output.slice(-8000);
    }
  };
  child.stdout?.on("data", appendOutput);
  child.stderr?.on("data", appendOutput);

  try {
    await waitForReady(baseUrl, child);
  } catch (error) {
    child.kill("SIGKILL");
    fs.rmSync(tempRoot, { recursive: true, force: true });
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${message}\nRecent sidecar output:\n${output}`, { cause: error });
  }

  runtime = { child, tempRoot, runtimeDir, baseUrl };
  return baseUrl;
}

export async function mintTestAuthToken() {
  if (!runtime) {
    throw new Error("Test sidecar is not running");
  }
  const operatorKey = process.env.TED_ENGINE_OPERATOR_KEY?.trim() || "ted-local-operator";
  const response = await fetch(`${runtime.baseUrl}/auth/mint`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operator_key: operatorKey }),
  });
  const body = await response.json();
  if (!response.ok || typeof body?.token !== "string" || !body.token) {
    throw new Error(`Failed to mint auth token for test sidecar (status ${response.status})`);
  }
  return body.token;
}

export function getTestBaseUrl() {
  if (!runtime) {
    throw new Error("Test sidecar is not running");
  }
  return runtime.baseUrl;
}

export async function stopTestSidecar() {
  if (!runtime) {
    return;
  }

  const { child, tempRoot } = runtime;
  runtime = null;

  if (child.exitCode === null) {
    child.kill("SIGTERM");
    try {
      await Promise.race([once(child, "exit"), delay(5000)]);
    } catch {
      // no-op
    }
    if (child.exitCode === null) {
      child.kill("SIGKILL");
      try {
        await once(child, "exit");
      } catch {
        // no-op
      }
    }
  }

  fs.rmSync(tempRoot, { recursive: true, force: true });
}
