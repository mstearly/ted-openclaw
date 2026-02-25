#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..", "..");
const matrixDir = path.join(rootDir, "extensions", "matrix");
const matrixSrcDir = path.join(matrixDir, "src");
const matrixPkgPath = path.join(matrixDir, "package.json");

function parseArgs(argv) {
  const out = {
    outPath: "",
    format: "md",
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--out") {
      out.outPath = argv[++i] || "";
      continue;
    }
    if (arg === "--format") {
      out.format = argv[++i] || out.format;
      continue;
    }
  }
  return out;
}

function run(cmd, args, cwd = rootDir) {
  try {
    const stdout = execFileSync(cmd, args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, stdout: stdout.trim() };
  } catch (err) {
    const stderr =
      err && typeof err === "object" && "stderr" in err && typeof err.stderr === "string"
        ? err.stderr.trim()
        : "";
    return {
      ok: false,
      stdout: "",
      stderr: stderr || String(err),
    };
  }
}

function walkFiles(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, out);
      continue;
    }
    if (/\.(ts|tsx|mts|cts)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function collectSdkUsage(files) {
  const importFileSet = new Set();
  const symbolCounts = new Map();

  const captureSymbols = (raw) => {
    for (const part of raw.split(",")) {
      const token = part.trim().replace(/^type\s+/, "");
      if (!token) {
        continue;
      }
      const [left] = token.split(/\s+as\s+/i);
      if (!left) {
        continue;
      }
      symbolCounts.set(left, (symbolCounts.get(left) || 0) + 1);
    }
  };

  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    if (!src.includes("@vector-im/matrix-bot-sdk")) {
      continue;
    }
    importFileSet.add(file);

    const braceImport = src.matchAll(
      /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["']@vector-im\/matrix-bot-sdk["']/g,
    );
    for (const match of braceImport) {
      captureSymbols(match[1] || "");
    }

    const defaultImport = src.matchAll(
      /import\s+(?:type\s+)?([A-Za-z_$][\w$]*)\s+from\s+["']@vector-im\/matrix-bot-sdk["']/g,
    );
    for (const match of defaultImport) {
      captureSymbols(match[1] || "");
    }
  }

  const symbols = [...symbolCounts.entries()]
    .toSorted((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return {
    importFiles: [...importFileSet].toSorted((a, b) => a.localeCompare(b)),
    symbols,
  };
}

function classifyArea(relPath) {
  if (relPath.includes(".test.")) {
    return "tests";
  }
  if (relPath.includes("/send/")) {
    return "send";
  }
  if (relPath.includes("/monitor/")) {
    return "monitor";
  }
  if (relPath.includes("/actions/")) {
    return "actions";
  }
  if (
    relPath.includes("/client/") ||
    relPath.endsWith("/deps.ts") ||
    relPath.endsWith("/active-client.ts")
  ) {
    return "client-core";
  }
  if (relPath.endsWith("/onboarding.ts") || relPath.endsWith("/types.ts")) {
    return "onboarding-and-types";
  }
  return "other";
}

function collectAreaBreakdown(files) {
  const areaToCount = new Map();
  for (const file of files) {
    const rel = path.relative(rootDir, file).replaceAll("\\", "/");
    const area = classifyArea(rel);
    areaToCount.set(area, (areaToCount.get(area) || 0) + 1);
  }
  return [...areaToCount.entries()]
    .toSorted((a, b) => b[1] - a[1])
    .map(([area, count]) => ({ area, count }));
}

function buildReport() {
  const pkg = JSON.parse(fs.readFileSync(matrixPkgPath, "utf8"));
  const sdkVersion = pkg.dependencies?.["@vector-im/matrix-bot-sdk"] || "unknown";
  const allTsFiles = walkFiles(matrixSrcDir);
  const usage = collectSdkUsage(allTsFiles);
  const areaBreakdown = collectAreaBreakdown(usage.importFiles);

  const whySdk = run("pnpm", ["--dir", "extensions/matrix", "why", "@vector-im/matrix-bot-sdk"]);
  const whyRequest = run("pnpm", ["--dir", "extensions/matrix", "why", "request"]);
  const whyAjv = run("pnpm", ["--dir", "extensions/matrix", "why", "ajv"]);
  const npmView = run("npm", [
    "view",
    "@vector-im/matrix-bot-sdk",
    "dist-tags",
    "version",
    "--json",
  ]);
  const matrixSdkVersion = run("npm", ["view", "matrix-js-sdk", "version", "--json"]);

  const requestPresent =
    (whyRequest.ok && /\brequest\b/.test(whyRequest.stdout)) ||
    /request/.test(whyRequest.stderr || "");
  const ajv6Present =
    (whyAjv.ok && /\bajv 6\./.test(whyAjv.stdout)) || /\bajv 6\./.test(whyAjv.stderr || "");

  const topSymbols = usage.symbols.slice(0, 12);

  const strategy = {
    generated_at: new Date().toISOString(),
    matrix_sdk_version: sdkVersion,
    matrix_js_sdk_latest: matrixSdkVersion.ok
      ? matrixSdkVersion.stdout.replaceAll('"', "")
      : "unknown",
    sdk_import_files: usage.importFiles.length,
    sdk_area_breakdown: areaBreakdown,
    sdk_import_file_examples: usage.importFiles.slice(0, 20).map((f) => path.relative(rootDir, f)),
    top_sdk_symbols: topSymbols,
    dependency_findings: {
      sdk_present: whySdk.ok,
      request_present: requestPresent,
      ajv6_present: ajv6Present,
      npm_view_ok: npmView.ok,
    },
    options: [
      {
        id: "MDO-1",
        title: "Contain and monitor current chain",
        readiness: "ready-now",
        effort_weeks: 0.5,
        security_delta: "low-positive",
        feature_impact: "none",
        notes: [
          "Keep ajv@6 override in place.",
          "Accept request as transitive residual risk until upstream replacement exists.",
          "Add matrix plugin regression lane in CI/release checks.",
        ],
      },
      {
        id: "MDO-2",
        title: "Add SDK adapter seam before larger changes",
        readiness: "ready-now",
        effort_weeks: 1.5,
        security_delta: "medium-positive",
        feature_impact: "low",
        notes: [
          "Move direct matrix-bot-sdk imports behind a local adapter API.",
          "Add adapter contract tests to preserve message and room behavior.",
          "Reduces blast radius for any future fork or SDK migration.",
        ],
      },
      {
        id: "MDO-3",
        title: "Maintain a minimal matrix-bot-sdk fork",
        readiness: "requires-approved-scope",
        effort_weeks: 2.5,
        security_delta: "high-positive",
        feature_impact: "medium",
        notes: [
          "Patch out request dependency in a maintained fork.",
          "Keep plugin API compatible with current code.",
          "Adds long-term maintenance ownership burden.",
        ],
      },
      {
        id: "MDO-4",
        title: "Migrate plugin to matrix-js-sdk",
        readiness: "not-ready",
        effort_weeks: 4,
        security_delta: "high-positive",
        feature_impact: "high",
        notes: [
          "Highest long-term control over dependency chain.",
          "Largest immediate regression risk across send/monitor/event flows.",
          "Best attempted only after adapter seam and expanded test fixtures.",
        ],
      },
    ],
    recommendation: {
      decision:
        "Proceed with MDO-1 and MDO-2 now; defer MDO-3/MDO-4 decision to a scoped follow-up.",
      rationale: [
        "Current chain has no upstream request patch path, so full elimination is not immediate.",
        "Adapter seam reduces migration risk and protects feature behavior.",
        "Matrix import surface is broad enough to justify staged execution over direct migration.",
      ],
      tasks: [
        {
          id: "MDS-T1",
          owner: "Council",
          title: "Create matrix SDK adapter module with typed interface",
          acceptance: "All non-test matrix SDK imports route through adapter entrypoints.",
        },
        {
          id: "MDS-T2",
          owner: "Council",
          title: "Add adapter contract tests for send, monitor, and room actions",
          acceptance:
            "Matrix test lane passes with direct SDK imports removed from feature modules.",
        },
        {
          id: "MDS-T3",
          owner: "Operator+Council",
          title: "Decide fork versus migration after adapter milestone",
          acceptance: "Signed decision with effort estimate and regression gate plan.",
        },
      ],
    },
    phases: [
      {
        id: "MDS-1",
        title: "Stabilize and contain",
        horizon: "now",
        actions: [
          "Keep the applied ajv@6 override and monitor audit deltas in CI.",
          "Track unresolved request advisory as accepted transitive risk.",
          "Add Matrix-specific regression lane to release checklist (send, receive, room actions).",
        ],
      },
      {
        id: "MDS-2",
        title: "Introduce SDK adapter seam",
        horizon: "next sprint",
        actions: [
          "Create a narrow adapter module for Matrix SDK calls used by plugin code.",
          "Move direct SDK imports behind adapter interfaces.",
          "Add contract tests around adapter to preserve behavior during future SDK swap/fork.",
        ],
      },
      {
        id: "MDS-3",
        title: "Dependency risk reduction path",
        horizon: "2-3 sprints",
        actions: [
          "Evaluate maintaining a minimal fork of matrix-bot-sdk replacing request chain.",
          "Evaluate direct matrix-js-sdk migration for covered feature set.",
          "Choose path by effort/risk matrix and run one production-like pilot channel.",
        ],
      },
    ],
  };

  return {
    strategy,
    raw: {
      why_sdk: whySdk.ok ? whySdk.stdout : whySdk.stderr,
      why_request: whyRequest.ok ? whyRequest.stdout : whyRequest.stderr,
      why_ajv: whyAjv.ok ? whyAjv.stdout : whyAjv.stderr,
      npm_view: npmView.ok ? npmView.stdout : npmView.stderr,
      matrix_js_sdk_version: matrixSdkVersion.ok
        ? matrixSdkVersion.stdout
        : matrixSdkVersion.stderr,
    },
  };
}

function renderMarkdown(report) {
  const { strategy } = report;
  const lines = [];
  lines.push("# Matrix Dependency Strategy Report");
  lines.push("");
  lines.push(`Generated: ${strategy.generated_at}`);
  lines.push(`Matrix SDK version: ${strategy.matrix_sdk_version}`);
  lines.push(`Files importing SDK: ${strategy.sdk_import_files}`);
  lines.push("");
  lines.push("## Top SDK Symbols");
  lines.push("");
  for (const sym of strategy.top_sdk_symbols) {
    lines.push(`- ${sym.name}: ${sym.count}`);
  }
  lines.push("");
  lines.push("## SDK Surface Breakdown");
  lines.push("");
  for (const area of strategy.sdk_area_breakdown) {
    lines.push(`- ${area.area}: ${area.count}`);
  }
  lines.push("");
  lines.push("## Dependency Findings");
  lines.push("");
  lines.push(
    `- matrix-bot-sdk present in graph: ${String(strategy.dependency_findings.sdk_present)}`,
  );
  lines.push(`- request present in chain: ${String(strategy.dependency_findings.request_present)}`);
  lines.push(`- ajv@6 present in chain: ${String(strategy.dependency_findings.ajv6_present)}`);
  lines.push(`- npm view reachable: ${String(strategy.dependency_findings.npm_view_ok)}`);
  lines.push(`- matrix-js-sdk latest: ${strategy.matrix_js_sdk_latest}`);
  lines.push("");
  lines.push("## Option Matrix");
  lines.push("");
  for (const option of strategy.options) {
    lines.push(`### ${option.id} - ${option.title}`);
    lines.push("");
    lines.push(`- readiness: ${option.readiness}`);
    lines.push(`- effort_weeks: ${option.effort_weeks}`);
    lines.push(`- security_delta: ${option.security_delta}`);
    lines.push(`- feature_impact: ${option.feature_impact}`);
    for (const note of option.notes) {
      lines.push(`- ${note}`);
    }
    lines.push("");
  }
  lines.push("## Recommendation");
  lines.push("");
  lines.push(`- decision: ${strategy.recommendation.decision}`);
  for (const reason of strategy.recommendation.rationale) {
    lines.push(`- rationale: ${reason}`);
  }
  lines.push("");
  lines.push("## Execution Tasks");
  lines.push("");
  for (const task of strategy.recommendation.tasks) {
    lines.push(`- ${task.id} (${task.owner}): ${task.title}`);
    lines.push(`  acceptance: ${task.acceptance}`);
  }
  lines.push("");
  lines.push("## Strategy Phases");
  lines.push("");
  for (const phase of strategy.phases) {
    lines.push(`### ${phase.id} - ${phase.title} (${phase.horizon})`);
    lines.push("");
    for (const action of phase.actions) {
      lines.push(`- ${action}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function main() {
  const { outPath, format } = parseArgs(process.argv.slice(2));
  const report = buildReport();
  const rendered =
    format === "json" ? JSON.stringify(report.strategy, null, 2) : renderMarkdown(report);

  if (outPath) {
    const resolvedOut = path.resolve(outPath);
    fs.mkdirSync(path.dirname(resolvedOut), { recursive: true });
    fs.writeFileSync(resolvedOut, rendered + "\n", "utf8");
    console.log(`Wrote strategy report to ${resolvedOut}`);
  } else {
    console.log(rendered);
  }
}

main();
