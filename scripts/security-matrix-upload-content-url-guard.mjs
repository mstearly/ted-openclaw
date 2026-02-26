#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const targetDirs = ["src", "extensions", "sidecars", "apps"];
const skipDirNames = new Set(["node_modules", "dist", ".git", "docs", "vendor"]);
const allowedExtensions = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts"]);
const bannedCallPattern = /\buploadContentFromUrl\s*\(/;

function isCodeFile(filePath) {
  return allowedExtensions.has(path.extname(filePath));
}

function walkFiles(dirPath, out) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".github") {
      continue;
    }
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (skipDirNames.has(entry.name)) {
        continue;
      }
      walkFiles(fullPath, out);
      continue;
    }
    if (isCodeFile(fullPath)) {
      out.push(fullPath);
    }
  }
}

function collectViolations(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  const lines = src.split(/\r?\n/);
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    if (!bannedCallPattern.test(lines[i])) {
      continue;
    }
    violations.push({
      filePath,
      line: i + 1,
      text: lines[i].trim(),
    });
  }
  return violations;
}

function main() {
  const files = [];
  for (const rel of targetDirs) {
    walkFiles(path.join(rootDir, rel), files);
  }

  const violations = [];
  for (const filePath of files) {
    violations.push(...collectViolations(filePath));
  }

  if (violations.length > 0) {
    console.error("Matrix guard failed: disallowed uploadContentFromUrl callsite(s) detected.");
    for (const violation of violations) {
      const rel = path.relative(rootDir, violation.filePath).replaceAll("\\", "/");
      console.error(`- ${rel}:${violation.line} ${violation.text}`);
    }
    process.exit(1);
  }

  console.log("Matrix guard passed: no uploadContentFromUrl callsites found.");
}

main();
