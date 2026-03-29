#!/usr/bin/env bash
# Yerel veya CI'dan canlı site kontrolü. Kullanım: ./scripts/verify-live.sh [BASE_URL]
set -euo pipefail
BASE="${1:-https://upcreate.co}"
echo "=== Upcreate canlı kontrol: $BASE ==="
code() { curl -sS -m 20 -o /dev/null -w "%{http_code}" "$1" || echo "ERR"; }
echo "GET /              → HTTP $(code "$BASE/")"
echo "GET /panel/login   → HTTP $(code "$BASE/panel/login")"
echo "GET /api/v1/health → HTTP $(code "$BASE/api/v1/health")"
echo "--- health body (ilk 200 karakter) ---"
curl -sS -m 20 "$BASE/api/v1/health" 2>/dev/null | head -c 200 || true
echo ""
echo "=== Bitti ==="
