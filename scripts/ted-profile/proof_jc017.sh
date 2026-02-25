#!/usr/bin/env bash
set -euo pipefail

echo "JC-017 proof: darwin packaging closure"

scripts/ted-profile/proof_jc011_mac_preflight.sh
pnpm mac:package

echo "OK: darwin packaging proof completed"
