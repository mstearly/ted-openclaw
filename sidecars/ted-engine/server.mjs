#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOST = "127.0.0.1";
const PORT = 48080;
const STARTED_AT_MS = Date.now();
const VERSION = process.env.TED_ENGINE_VERSION?.trim() || "0.1.0";
const PROFILES_COUNT_RAW = Number.parseInt(process.env.TED_ENGINE_PROFILES_COUNT || "0", 10);
const PROFILES_COUNT = Number.isFinite(PROFILES_COUNT_RAW) && PROFILES_COUNT_RAW >= 0 ? PROFILES_COUNT_RAW : 0;

const logsDir = path.join(__dirname, "logs");
fs.mkdirSync(logsDir, { recursive: true });
const logFile = path.join(logsDir, "ted-engine.log");
const logStream = fs.createWriteStream(logFile, { flags: "a" });

function logLine(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  logStream.write(line);
}

function buildPayload() {
  return {
    version: VERSION,
    uptime: Math.floor((Date.now() - STARTED_AT_MS) / 1000),
    profiles_count: PROFILES_COUNT,
  };
}

function sendJson(res, statusCode, body) {
  const json = JSON.stringify(body);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(json),
    "cache-control": "no-store",
  });
  res.end(json);
}

const server = http.createServer((req, res) => {
  const method = (req.method || "").toUpperCase();
  const parsed = new URL(req.url || "/", `http://${HOST}:${PORT}`);
  const route = parsed.pathname;

  if (method !== "GET") {
    sendJson(res, 405, { error: "method_not_allowed" });
    logLine(`${method} ${route} -> 405`);
    return;
  }

  if (route === "/status" || route === "/doctor") {
    const payload = buildPayload();
    sendJson(res, 200, payload);
    logLine(`${method} ${route} -> 200`);
    return;
  }

  sendJson(res, 404, { error: "not_found" });
  logLine(`${method} ${route} -> 404`);
});

server.listen(PORT, HOST, () => {
  logLine(`ted-engine listening on http://${HOST}:${PORT}`);
  process.stdout.write(`ted-engine listening on http://${HOST}:${PORT}\n`);
});

server.on("error", (err) => {
  logLine(`server_error ${err.message}`);
  process.stderr.write(`ted-engine error: ${err.message}\n`);
  process.exitCode = 1;
});

const shutdown = () => {
  logLine("shutdown");
  server.close(() => {
    logStream.end();
    process.exit(0);
  });
  setTimeout(() => {
    logStream.end();
    process.exit(1);
  }, 2000).unref();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
