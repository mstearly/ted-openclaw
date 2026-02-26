#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function runStep(step) {
  console.log(`\n[context-semantics-gate] ${step.name}`);
  const result = spawnSync(step.cmd[0], step.cmd.slice(1), {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const steps = [
  {
    name: "unit policy branches",
    cmd: ["pnpm", "vitest", "run", "src/gateway/openresponses-http.context-semantics.test.ts"],
  },
  {
    name: "gateway contract e2e",
    cmd: [
      "pnpm",
      "vitest",
      "run",
      "--config",
      "vitest.e2e.config.ts",
      "src/gateway/openresponses-http.e2e.test.ts",
      "src/gateway/openresponses-parity.e2e.test.ts",
    ],
  },
];

for (const step of steps) {
  runStep(step);
}

console.log("\n[context-semantics-gate] PASS");
