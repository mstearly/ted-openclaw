# JC-017 Darwin Runbook and Execution Checklist

**Generated:** 2026-02-20
**Purpose:** close `JC-017` by running the packaging gate on macOS (Darwin) with reproducible evidence.

## Scope

This runbook is only for `JC-017` and must be executed on a macOS host with Xcode command line tooling.

## Preconditions

- macOS host (`uname -s` => `Darwin`)
- Node 22+
- `pnpm` installed
- Xcode + command line tools installed (`swift`, `xcodebuild` available)
- Repo checked out at target commit

## Environment

```bash
cd /home/mattstearly/GitRepos/ted-openclaw
export JC017_EVIDENCE_DIR="/tmp/jc017-evidence-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$JC017_EVIDENCE_DIR"
```

## Exact Execution Checklist

1. Capture host/toolchain baseline.

```bash
{
  echo "date=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "uname=$(uname -a)"
  echo "node=$(node -v)"
  echo "pnpm=$(pnpm -v)"
  echo "swift=$(swift --version | head -n 1)"
  echo "xcodebuild=$(xcodebuild -version | tr '\n' ' | ')"
} | tee "$JC017_EVIDENCE_DIR/00_host_baseline.txt"
```

2. Run SDD/documentation and code quality gates.

```bash
specify check | tee "$JC017_EVIDENCE_DIR/01_specify_check.txt"
pnpm check:docs | tee "$JC017_EVIDENCE_DIR/02_check_docs.txt"
pnpm check | tee "$JC017_EVIDENCE_DIR/03_check.txt"
```

3. Run recursive runtime proof chain up to `JC-016`.

```bash
set -euo pipefail
node sidecars/ted-engine/server.mjs >"$JC017_EVIDENCE_DIR/sidecar.log" 2>&1 &
SIDECAR_PID=$!
cleanup(){ kill "$SIDECAR_PID" >/dev/null 2>&1 || true; }
trap cleanup EXIT
sleep 1
for s in 006 007 008 009 010 012 013 014 015 016; do
  scripts/ted-profile/proof_jc${s}.sh | tee "$JC017_EVIDENCE_DIR/proof_jc${s}.txt"
done
```

4. Run Darwin packaging preflight (`JC-011` prerequisite).

```bash
scripts/ted-profile/proof_jc011_mac_preflight.sh | tee "$JC017_EVIDENCE_DIR/04_proof_jc011.txt"
```

5. Execute `JC-017` packaging proof.

```bash
scripts/ted-profile/proof_jc017.sh | tee "$JC017_EVIDENCE_DIR/05_proof_jc017.txt"
```

6. Capture packaging outputs and hashes.

```bash
ls -la dist | tee "$JC017_EVIDENCE_DIR/06_dist_listing.txt"
find dist -maxdepth 2 -type f \( -name '*.app' -o -name '*.dmg' -o -name '*.zip' \) -print \
  | tee "$JC017_EVIDENCE_DIR/07_artifact_paths.txt"

# If artifacts exist, hash them
if [ -s "$JC017_EVIDENCE_DIR/07_artifact_paths.txt" ]; then
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    shasum -a 256 "$p"
  done < "$JC017_EVIDENCE_DIR/07_artifact_paths.txt" | tee "$JC017_EVIDENCE_DIR/08_artifact_sha256.txt"
fi
```

7. Optional notarization/signing evidence (if enabled for this release stage).

```bash
# Follow docs/platforms/mac/release.md for full notarization flow.
# Record outputs in:
# $JC017_EVIDENCE_DIR/09_notary.txt
```

8. Operator validation checklist evidence.

```bash
cat > "$JC017_EVIDENCE_DIR/10_operator_validation.txt" <<'VAL'
Operator validation:
- [ ] Installable artifact opens successfully
- [ ] OpenClaw UI launches
- [ ] Ted sidecar status reachable
- [ ] Setup/Doctor path is non-blocking
- [ ] One draft workflow executes in draft-only mode
- [ ] Restart persistence validated
VAL
```

## Pass/Fail Criteria

`JC-017` is **PASS** only if all are true:

- `proof_jc011_mac_preflight.sh` passes on Darwin.
- `proof_jc017.sh` passes.
- Packaging artifacts are present and captured.
- Evidence bundle includes host baseline + proof logs + artifact listing/hashes.

`JC-017` is **BLOCKED** if any of the above fail.

## Evidence Handoff

Attach the entire `$JC017_EVIDENCE_DIR` bundle to release evidence and reference it in:

- `docs/ted-profile/job-cards/JC-017-darwin-packaging-closure.md`
- `docs/ted-profile/sdd-pack/17_COUNCIL_INTERROGATION_CYCLE_001.md`
