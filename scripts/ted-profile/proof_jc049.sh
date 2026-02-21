#!/usr/bin/env bash
set -euo pipefail
rg -n "approval_ledger|buildApprovalLedger" extensions/ted-sidecar/index.ts ui/src/ui/types.ts >/dev/null
rg -n "Decision Impact Ledger|linked cards" ui/src/ui/views/ted.ts >/dev/null
echo "JC-049 proof placeholder: approval ledger correlation wiring present"
