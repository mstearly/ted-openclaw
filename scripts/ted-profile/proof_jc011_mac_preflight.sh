#!/usr/bin/env bash
set -euo pipefail

echo "JC-011 proof: mac packaging preflight"

if [ "$(uname -s)" != "Darwin" ]; then
  echo "BLOCKED: macOS required for installer packaging (current: $(uname -s))."
  echo "NEXT: run this proof on a macOS runner with Xcode command line tools installed."
  exit 1
fi

if ! command -v swift >/dev/null 2>&1; then
  echo "BLOCKED: swift toolchain not found."
  echo "NEXT: install Xcode + Command Line Tools, then retry."
  exit 1
fi

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "BLOCKED: xcodebuild not found."
  echo "NEXT: install Xcode + Command Line Tools, then retry."
  exit 1
fi

echo "OK: platform and toolchain preflight checks passed."
echo "NEXT: run pnpm mac:package and attach artifact evidence."
