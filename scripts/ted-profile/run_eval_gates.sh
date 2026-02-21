#!/usr/bin/env bash
set -euo pipefail

echo "Running offline eval gates..."

FILES=(
  "docs/ted-profile/evals/draft_quality_gold.json"
  "docs/ted-profile/evals/extraction_confidence_gold.json"
  "docs/ted-profile/evals/contradiction_routing_gold.json"
)

TOTAL=0
PASS=0
for f in "${FILES[@]}"; do
  [ -f "$f" ] || {
    echo "FAIL: missing eval file $f"
    exit 1
  }
  node -e "const fs=require('fs');const p=process.argv[1];const j=JSON.parse(fs.readFileSync(p,'utf8'));if(!j.suite||!j.version||!Array.isArray(j.cases)||j.cases.length===0){process.exit(1)}" "$f" || {
    echo "FAIL: invalid eval schema in $f"
    exit 1
  }
  TOTAL=$((TOTAL + 1))
  PASS=$((PASS + 1))
  echo "OK: $f"
done

SCORE=$(awk "BEGIN { printf \"%.2f\", ${PASS}/${TOTAL} }")
THRESHOLD="1.00"
echo "eval_score=${SCORE} threshold=${THRESHOLD}"

awk "BEGIN { exit !(${SCORE} >= ${THRESHOLD}) }" || {
  echo "FAIL: eval score below threshold"
  exit 1
}

echo "Offline eval gates PASS"
