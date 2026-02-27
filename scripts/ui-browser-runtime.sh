#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UI_DIR="${ROOT_DIR}/ui"
RUNTIME_CACHE_DIR="${OPENCLAW_BROWSER_RUNTIME_CACHE_DIR:-$HOME/.cache/openclaw/playwright-runtime}"
DEB_CACHE_DIR="${RUNTIME_CACHE_DIR}/debs"
RUNTIME_ROOTFS_DIR="${RUNTIME_CACHE_DIR}/rootfs"

declare -A LIB_PACKAGE_CANDIDATES=(
  [libasound.so.2]="libasound2t64 libasound2"
  [libnspr4.so]="libnspr4"
  [libnss3.so]="libnss3"
  [libnssutil3.so]="libnss3"
  [libsmime3.so]="libnss3"
  [libssl3.so]="libnss3"
)

require_command() {
  local command_name="$1"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Missing required command: ${command_name}" >&2
    exit 1
  fi
}

find_chromium_shell() {
  if [[ -n "${PLAYWRIGHT_CHROMIUM_BINARY:-}" && -x "${PLAYWRIGHT_CHROMIUM_BINARY}" ]]; then
    echo "${PLAYWRIGHT_CHROMIUM_BINARY}"
    return 0
  fi

  find "$HOME/.cache/ms-playwright" \
    -maxdepth 4 \
    -type f \
    -path "*/chrome-headless-shell-linux64/chrome-headless-shell" \
    2>/dev/null | sort | tail -n 1
}

read_missing_libs() {
  local binary_path="$1"
  ldd "${binary_path}" | awk '/=> not found/{ print $1 }' | sort -u
}

package_available() {
  local package_name="$1"
  apt-cache show "${package_name}" >/dev/null 2>&1
}

resolve_package_for_lib() {
  local missing_lib="$1"
  local candidates="${LIB_PACKAGE_CANDIDATES[${missing_lib}]:-}"
  local package_name
  for package_name in ${candidates}; do
    if package_available "${package_name}"; then
      echo "${package_name}"
      return 0
    fi
  done
  return 1
}

download_and_extract_package() {
  local package_name="$1"
  local deb_path

  if ! compgen -G "${DEB_CACHE_DIR}/${package_name}"'_'*.deb >/dev/null; then
    (cd "${DEB_CACHE_DIR}" && apt-get -qq download "${package_name}")
  fi

  deb_path="$(ls -1t "${DEB_CACHE_DIR}/${package_name}"_*.deb | head -n 1)"
  dpkg-deb -x "${deb_path}" "${RUNTIME_ROOTFS_DIR}"
}

build_runtime_ld_library_path() {
  local lib_dirs=()
  local candidate_dir
  for candidate_dir in \
    "${RUNTIME_ROOTFS_DIR}/lib/x86_64-linux-gnu" \
    "${RUNTIME_ROOTFS_DIR}/usr/lib/x86_64-linux-gnu" \
    "${RUNTIME_ROOTFS_DIR}/lib64" \
    "${RUNTIME_ROOTFS_DIR}/usr/lib64"; do
    if [[ -d "${candidate_dir}" ]]; then
      lib_dirs+=("${candidate_dir}")
    fi
  done

  if [[ ${#lib_dirs[@]} -eq 0 ]]; then
    return 0
  fi

  local joined
  joined="$(IFS=:; echo "${lib_dirs[*]}")"
  if [[ -n "${LD_LIBRARY_PATH:-}" ]]; then
    joined="${joined}:${LD_LIBRARY_PATH}"
  fi
  echo "${joined}"
}

main() {
  require_command apt-cache
  require_command apt-get
  require_command dpkg-deb
  require_command ldd
  require_command pnpm

  mkdir -p "${DEB_CACHE_DIR}" "${RUNTIME_ROOTFS_DIR}"

  local chromium_shell
  chromium_shell="$(find_chromium_shell)"
  if [[ -z "${chromium_shell}" ]]; then
    echo "Installing Playwright chromium browser bundle..." >&2
    pnpm --dir "${UI_DIR}" exec playwright install chromium >/dev/null
    chromium_shell="$(find_chromium_shell)"
  fi
  if [[ -z "${chromium_shell}" ]]; then
    echo "Unable to locate Playwright chromium headless shell binary." >&2
    exit 1
  fi

  mapfile -t missing_libs < <(read_missing_libs "${chromium_shell}")
  if [[ ${#missing_libs[@]} -gt 0 ]]; then
    local packages=()
    local unresolved=()
    local lib_name
    local package_name

    for lib_name in "${missing_libs[@]}"; do
      if package_name="$(resolve_package_for_lib "${lib_name}")"; then
        packages+=("${package_name}")
      else
        unresolved+=("${lib_name}")
      fi
    done

    if [[ ${#unresolved[@]} -gt 0 ]]; then
      echo "No package mapping for required Playwright libs: ${unresolved[*]}" >&2
      exit 1
    fi

    mapfile -t packages < <(printf '%s\n' "${packages[@]}" | sort -u)
    for package_name in "${packages[@]}"; do
      download_and_extract_package "${package_name}"
    done
  fi

  local runtime_ld_library_path
  runtime_ld_library_path="$(build_runtime_ld_library_path || true)"
  if [[ -n "${runtime_ld_library_path}" ]]; then
    export LD_LIBRARY_PATH="${runtime_ld_library_path}"
  fi

  mapfile -t missing_libs < <(read_missing_libs "${chromium_shell}")
  if [[ ${#missing_libs[@]} -gt 0 ]]; then
    echo "Playwright chromium still has unresolved shared libs: ${missing_libs[*]}" >&2
    exit 1
  fi

  if [[ $# -eq 0 ]]; then
    set -- pnpm --dir "${UI_DIR}" exec vitest run --config vitest.config.ts src/ui/views/ted.workflow.browser.test.ts
  fi

  exec "$@"
}

main "$@"
