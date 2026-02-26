#!/usr/bin/env node
import { spawn } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const sidecarSourceDir = path.join(repoRoot, "sidecars", "ted-engine");

function parseArgs(argv) {
  const out = {
    outputPath: path.join(repoRoot, "artifacts", "replay", "ci_release_gate_summary.json"),
    timeoutMs: 20_000,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output") {
      out.outputPath = path.resolve(repoRoot, argv[index + 1] || "");
      index += 1;
      continue;
    }
    if (arg === "--timeout-ms") {
      const parsed = Number.parseInt(argv[index + 1] || "", 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        out.timeoutMs = parsed;
      }
      index += 1;
    }
  }
  return out;
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

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
          reject(new Error("failed to allocate ephemeral port"));
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
    fs.copyFileSync(path.join(sidecarSourceDir, file), path.join(runtimeDir, file));
  }
  for (const dir of ["config", "migrations", "modules", "prompts"]) {
    fs.cpSync(path.join(sidecarSourceDir, dir), path.join(runtimeDir, dir), { recursive: true });
  }
  return runtimeDir;
}

async function waitForReady(baseUrl, child, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`sidecar exited early with code ${child.exitCode}`);
    }
    try {
      const response = await fetch(`${baseUrl}/status`, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) {
        return;
      }
    } catch {
      // retry until timeout
    }
    await delay(120);
  }
  throw new Error(`timed out waiting for sidecar readiness at ${baseUrl}`);
}

async function mintToken(baseUrl, operatorKey) {
  const response = await fetch(`${baseUrl}/auth/mint`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operator_key: operatorKey }),
    signal: AbortSignal.timeout(5_000),
  });
  const body = await response.json();
  if (!response.ok || typeof body?.token !== "string" || body.token.trim().length === 0) {
    throw new Error(`auth mint failed (status=${response.status})`);
  }
  return body.token;
}

function appendStepSummary(text) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    return;
  }
  fs.appendFileSync(summaryPath, text + "\n", "utf8");
}

function summaryMarkdown(summary, outputPath) {
  const replay = summary.replay || {};
  const releaseGate = replay.release_gate || {};
  const rollout = summary.rollout || {};
  return [
    "### Replay Release Gate",
    `- status: ${summary.gate_status}`,
    `- run_id: ${replay.run_id || "n/a"}`,
    `- replay_pass_rate: ${replay.summary?.pass_rate ?? "n/a"}`,
    `- release_gate_passed: ${releaseGate.pass === true ? "true" : "false"}`,
    `- replay_contract_version: ${replay.replay_gate_contract_version || "n/a"}`,
    `- rollout_policy_version: ${rollout.policy_version || "n/a"}`,
    `- rollout_selected: ${rollout.decision?.selected === true ? "true" : "false"}`,
    `- summary_artifact: ${outputPath}`,
  ].join("\n");
}

async function stopChild(child) {
  if (!child || child.exitCode !== null) {
    return;
  }
  child.kill("SIGTERM");
  try {
    await Promise.race([once(child, "exit"), delay(5_000)]);
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  ensureParentDir(args.outputPath);

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-rf3-gate-"));
  const runtimeDir = prepareRuntimeTree(tempRoot);
  const port = Number(await allocatePort());
  const baseUrl = `http://127.0.0.1:${port}`;
  let output = "";
  let child = null;

  try {
    child = spawn(process.execPath, ["server.mjs"], {
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
      if (output.length > 8_000) {
        output = output.slice(-8_000);
      }
    };
    child.stdout?.on("data", appendOutput);
    child.stderr?.on("data", appendOutput);

    await waitForReady(baseUrl, child, args.timeoutMs);
    const operatorKey = process.env.TED_ENGINE_OPERATOR_KEY?.trim() || "ted-local-operator";
    const token = await mintToken(baseUrl, operatorKey);
    const authHeaders = {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    };

    const replayResponse = await fetch(`${baseUrl}/ops/replay/run`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ include: "all" }),
      signal: AbortSignal.timeout(15_000),
    });
    const replayBody = await replayResponse.json();
    if (!replayResponse.ok) {
      throw new Error(`replay run failed (status=${replayResponse.status})`);
    }

    const activeReasonCodes = [];
    if (replayBody?.release_gate?.pass !== true) {
      activeReasonCodes.push("replay_gate_failed");
    }
    const rolloutQuery = new URLSearchParams({
      operator_id: "ci-release-gate",
      workflow_id: "rf3-release-gate",
      route_key: "/ops/replay/run",
      mode: "transport_canary",
      active_reason_codes: activeReasonCodes.join(","),
    });
    const rolloutResponse = await fetch(
      `${baseUrl}/ops/rollout-policy?${rolloutQuery.toString()}`,
      {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      },
    );
    const rolloutBody = await rolloutResponse.json();
    if (!rolloutResponse.ok) {
      throw new Error(`rollout policy query failed (status=${rolloutResponse.status})`);
    }

    const summary = {
      generated_at: new Date().toISOString(),
      gate_status: replayBody?.release_gate?.pass === true ? "pass" : "fail",
      replay: {
        run_id: replayBody?.run_id || null,
        replay_gate_contract_version: replayBody?.replay_gate_contract_version || null,
        summary: replayBody?.summary || null,
        release_gate: replayBody?.release_gate || null,
      },
      rollout: {
        policy_version: rolloutBody?.policy?.version || null,
        decision: rolloutBody?.decision || null,
        rollback: rolloutBody?.rollback || null,
      },
    };

    fs.writeFileSync(args.outputPath, JSON.stringify(summary, null, 2) + "\n", "utf8");

    const evidenceSourcePath = path.join(
      runtimeDir,
      "artifacts",
      "replay",
      "release_evidence.jsonl",
    );
    if (fs.existsSync(evidenceSourcePath)) {
      const evidenceOutputPath = args.outputPath.replace(/\.json$/u, ".release_evidence.jsonl");
      ensureParentDir(evidenceOutputPath);
      fs.copyFileSync(evidenceSourcePath, evidenceOutputPath);
      summary.replay.release_evidence_path = evidenceOutputPath;
      fs.writeFileSync(args.outputPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
    }

    const markdown = summaryMarkdown(summary, args.outputPath);
    console.log(markdown);
    appendStepSummary(markdown);

    if (summary.gate_status !== "pass") {
      const blockers = Array.isArray(summary.replay?.release_gate?.blockers)
        ? summary.replay.release_gate.blockers.join(", ")
        : "unknown";
      throw new Error(`replay release gate failed: ${blockers}`);
    }
  } catch (error) {
    console.error(`[ci-replay-rollout-gate] ${error?.message || String(error)}`);
    if (output.trim().length > 0) {
      console.error("--- sidecar output ---");
      console.error(output);
    }
    process.exitCode = 1;
  } finally {
    await stopChild(child);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

await main();
