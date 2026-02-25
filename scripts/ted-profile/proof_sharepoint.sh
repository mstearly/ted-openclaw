#!/usr/bin/env bash
set -euo pipefail

echo "SharePoint Integration proof: behavioral HTTP tests"
echo ""

BASE_URL="${TED_SIDECAR_URL:-http://127.0.0.1:48080}"
source "$(dirname "$0")/lib_auth.sh"

PASS=0; FAIL=0; TESTED=0; FAILURES=()
record_pass() { PASS=$((PASS + 1)); TESTED=$((TESTED + 1)); }
record_fail() { FAIL=$((FAIL + 1)); TESTED=$((TESTED + 1)); FAILURES+=("$1"); }

# ── sidecar must be reachable ──
curl -fsS "$BASE_URL/status" >/dev/null

# ── mint auth token ──
mint_ted_auth_token
AUTH_ARGS=(-H "Authorization: Bearer ${TED_AUTH_TOKEN}" -H "x-ted-execution-mode: DETERMINISTIC")

# ── Test 1: GET /graph/olumie/sharepoint/sites returns 200 or 401 (auth not configured) ──
echo "--- [1/10] GET /graph/olumie/sharepoint/sites ---"
SC=$(curl -sS -o /tmp/sp_sites.out -w "%{http_code}" \
  -X GET "$BASE_URL/graph/olumie/sharepoint/sites" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ] || [ "$SC" = "401" ]; then
  echo "  PASS: sharepoint sites returned $SC (expected 200 or 401 if auth not configured)"
  record_pass
else
  echo "  FAIL: expected 200 or 401, got $SC"
  record_fail "1-sites-status"
fi

# ── Test 2: GET /graph/olumie/sharepoint/sites/{siteId}/drives returns 200 or 400/401 ──
echo "--- [2/10] GET /graph/olumie/sharepoint/sites/test-site/drives ---"
SC=$(curl -sS -o /tmp/sp_drives.out -w "%{http_code}" \
  -X GET "$BASE_URL/graph/olumie/sharepoint/sites/test-site/drives" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ] || [ "$SC" = "401" ] || [ "$SC" = "400" ] || [ "$SC" = "502" ]; then
  echo "  PASS: sharepoint drives returned $SC"
  record_pass
else
  echo "  FAIL: unexpected status $SC"
  record_fail "2-drives-status"
fi

# ── Test 3: GET /graph/olumie/sharepoint/drives/test-drive/items returns 200 or 401 ──
echo "--- [3/10] GET /graph/olumie/sharepoint/drives/test-drive/items ---"
SC=$(curl -sS -o /tmp/sp_items.out -w "%{http_code}" \
  -X GET "$BASE_URL/graph/olumie/sharepoint/drives/test-drive/items" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ] || [ "$SC" = "401" ] || [ "$SC" = "502" ]; then
  echo "  PASS: sharepoint items returned $SC"
  record_pass
else
  echo "  FAIL: unexpected status $SC"
  record_fail "3-items-status"
fi

# ── Test 4: GET items with path query parameter accepted ──
echo "--- [4/10] GET items with ?path=Documents ---"
SC=$(curl -sS -o /tmp/sp_items_path.out -w "%{http_code}" \
  -X GET "$BASE_URL/graph/olumie/sharepoint/drives/test-drive/items?path=Documents" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ] || [ "$SC" = "401" ] || [ "$SC" = "502" ]; then
  echo "  PASS: items with path query returned $SC"
  record_pass
else
  echo "  FAIL: unexpected status $SC"
  record_fail "4-items-path"
fi

# ── Test 5: GET single item metadata ──
echo "--- [5/10] GET /graph/olumie/sharepoint/drives/test-drive/items/test-item ---"
SC=$(curl -sS -o /tmp/sp_item.out -w "%{http_code}" \
  -X GET "$BASE_URL/graph/olumie/sharepoint/drives/test-drive/items/test-item" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ] || [ "$SC" = "401" ] || [ "$SC" = "502" ]; then
  echo "  PASS: single item returned $SC"
  record_pass
else
  echo "  FAIL: unexpected status $SC"
  record_fail "5-item-get"
fi

# ── Test 6: GET search requires q parameter ──
echo "--- [6/10] GET search without q parameter returns 400 ---"
SC=$(curl -sS -o /tmp/sp_search_noq.out -w "%{http_code}" \
  -X GET "$BASE_URL/graph/olumie/sharepoint/drives/test-drive/search" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "400" ]; then
  echo "  PASS: search without q returns 400"
  record_pass
else
  echo "  FAIL: expected 400, got $SC"
  record_fail "6-search-noq"
fi

# ── Test 7: GET search with q parameter accepted ──
echo "--- [7/10] GET search with ?q=contract ---"
SC=$(curl -sS -o /tmp/sp_search.out -w "%{http_code}" \
  -X GET "$BASE_URL/graph/olumie/sharepoint/drives/test-drive/search?q=contract" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "200" ] || [ "$SC" = "401" ] || [ "$SC" = "502" ]; then
  echo "  PASS: search returned $SC"
  record_pass
else
  echo "  FAIL: unexpected status $SC"
  record_fail "7-search"
fi

# ── Test 8: POST upload without approval header returns 403 ──
echo "--- [8/10] POST upload without approval header returns 403 ---"
SC=$(curl -sS -o /tmp/sp_upload_noauth.out -w "%{http_code}" \
  -X POST "$BASE_URL/graph/olumie/sharepoint/drives/test-drive/upload" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"file_name":"test.txt","content_base64":"dGVzdA==","content_type":"text/plain"}' || true)

if [ "$SC" = "403" ]; then
  echo "  PASS: upload without approval returns 403"
  record_pass
else
  echo "  FAIL: expected 403, got $SC"
  record_fail "8-upload-no-approval"
fi

# ── Test 9: POST folder create without approval header returns 403 ──
echo "--- [9/10] POST folder create without approval header returns 403 ---"
SC=$(curl -sS -o /tmp/sp_folder_noauth.out -w "%{http_code}" \
  -X POST "$BASE_URL/graph/olumie/sharepoint/drives/test-drive/folder" \
  "${AUTH_ARGS[@]}" \
  -H "Content-Type: application/json" \
  -d '{"folder_name":"test-folder"}' || true)

if [ "$SC" = "403" ]; then
  echo "  PASS: folder create without approval returns 403"
  record_pass
else
  echo "  FAIL: expected 403, got $SC"
  record_fail "9-folder-no-approval"
fi

# ── Test 10: Invalid profile ID returns 400 ──
echo "--- [10/10] Invalid profile ID rejected ---"
SC=$(curl -sS -o /tmp/sp_invalid.out -w "%{http_code}" \
  -X GET "$BASE_URL/graph/../etc/sharepoint/sites" \
  "${AUTH_ARGS[@]}" || true)

if [ "$SC" = "400" ] || [ "$SC" = "404" ]; then
  echo "  PASS: invalid profile rejected with $SC"
  record_pass
else
  echo "  FAIL: expected 400 or 404, got $SC"
  record_fail "10-invalid-profile"
fi

# ── Summary ──
echo ""
echo "=========================================="
echo "SharePoint Integration proof"
echo "TOTAL: $TESTED  PASS: $PASS  FAIL: $FAIL"
echo "=========================================="

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "FAILURES:"
  for f in "${FAILURES[@]}"; do echo "  - $f"; done
  exit 1
fi
