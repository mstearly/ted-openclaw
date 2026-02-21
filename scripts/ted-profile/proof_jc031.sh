#!/usr/bin/env bash
set -euo pipefail

echo "JC-031 proof: UI surface inventory and gap map"

test -f docs/ted-profile/sdd-pack/22_TED_UI_SURFACE_INVENTORY.md
test -f docs/ted-profile/job-cards/JC-031-ui-surface-inventory-and-gap-map.md
rg -n "Current:\\s*DONE" docs/ted-profile/job-cards/JC-031-ui-surface-inventory-and-gap-map.md >/dev/null
rg -n "UI Surface Inventory|Gap" docs/ted-profile/sdd-pack/22_TED_UI_SURFACE_INVENTORY.md >/dev/null

echo "OK: inventory and gap map are documented and promoted"
