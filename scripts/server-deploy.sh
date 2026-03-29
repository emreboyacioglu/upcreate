#!/usr/bin/env bash
# EC2 sunucuda çalıştırın: bash scripts/server-deploy.sh
# Önkoşul: kod $UPCREATE_ROOT altında, PostgreSQL ayarlı, .env dosyaları hazır.
set -euo pipefail
ROOT="${UPCREATE_ROOT:-/var/www/upcreate}"
cd "$ROOT"

echo ">>> Backend"
cd "$ROOT/backend"
npm ci
npx prisma generate
npx prisma db push
npm run build
npm test

echo ">>> Panel (.env.production içinde NEXT_PUBLIC_API_URL olduğundan emin olun)"
cd "$ROOT/panel"
npm ci
npm run build

echo ">>> Landing"
cd "$ROOT/landing"
npm ci
npm run build

echo ">>> PM2"
cd "$ROOT/deploy"
pm2 reload ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
pm2 save

echo ">>> nginx (yapılandırma değiştiyse)"
sudo nginx -t && sudo systemctl reload nginx || true

echo ">>> Yerel port testi"
curl -sS http://127.0.0.1:4000/api/v1/health | head -c 120 && echo "" || echo "API yanıt vermiyor"
curl -sS -o /dev/null -w "landing :3000 → %{http_code}\n" http://127.0.0.1:3000/ || true
curl -sS -o /dev/null -w "panel  :3001 → %{http_code}\n" http://127.0.0.1:3001/panel/login || true

echo "Bitti. Dışarıdan: curl -sS https://upcreate.co/api/v1/health"
