# Upcreate — canlıya alma (EC2 + nginx + PM2)

Tek sunucu varsayımı: **landing** (3000), **panel** (3001), **API** (4000), arkada **PostgreSQL**.

## Önkoşullar

- Ubuntu 22.04+ (veya benzeri), Node **20 LTS**, `nginx`, `pm2` (`npm i -g pm2`)
- DNS: `upcreate.co` / `www` → sunucu IP ([DNS_UPCREATE.md](./DNS_UPCREATE.md))
- Repo sunucuda: örn. `/var/www/upcreate` (aşağıdaki komutlarda bu yolu kullanın)

---

## 1. Sunucuda ilk kurulum

```bash
sudo mkdir -p /var/www/upcreate && sudo chown $USER:$USER /var/www/upcreate
cd /var/www/upcreate
# Git ile klonlayın veya rsync/scp ile projeyi kopyalayın
```

---

## 2. PostgreSQL

Veritabanı ve kullanıcı oluşturun; connection string:

`DATABASE_URL=postgresql://USER:PASSWORD@127.0.0.1:5432/upcreate?schema=public`

---

## 3. Backend (`/var/www/upcreate/backend`)

```bash
cd /var/www/upcreate/backend
cp .env.example .env   # yoksa aşağıdaki değişkenleri elle oluşturun
nano .env
```

**Örnek `.env` (üretim):**

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...
JWT_SECRET=<uzun-rastgele-gizli-deger>
CORS_ORIGIN=https://upcreate.co,https://www.upcreate.co
```

```bash
npm ci
npx prisma generate
npx prisma db push
# İlk kurulumda demo veri (opsiyonel):
# npm run db:seed
npm run build
npm test
```

---

## 4. Panel (`/var/www/upcreate/panel`)

Aynı domain üzerinden API kullanmak için (önerilen):

```bash
cd /var/www/upcreate/panel
echo 'NEXT_PUBLIC_API_URL=https://upcreate.co/api/v1' > .env.production
npm ci
npm run build
```

> Alt alan adı kullanıyorsanız: `NEXT_PUBLIC_API_URL=https://api.upcreate.co/api/v1` ve `CORS_ORIGIN`’a panel origin’ini ekleyin.

---

## 5. Landing (`/var/www/upcreate/landing`)

```bash
cd /var/www/upcreate/landing
npm ci
npm run build
```

---

## 6. nginx

```bash
sudo cp /var/www/upcreate/deploy/nginx-upcreate.example.conf /etc/nginx/sites-available/upcreate
sudo ln -sf /etc/nginx/sites-available/upcreate /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**SSL (Let’s Encrypt):**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d upcreate.co -d www.upcreate.co
```

Certbot yapılandırmayı günceller; ilk denemede geçici olarak `listen 80` ile test edebilirsiniz.

---

## 7. PM2

```bash
cd /var/www/upcreate/deploy
# ecosystem içindeki cwd yollarını sunucunuza göre düzenleyin
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # çıkan komutu çalıştırın
```

```bash
pm2 status
curl -sS http://127.0.0.1:4000/api/v1/health
curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/
curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/panel/login
```

---

## 8. Her güncellemede (deploy)

Sunucuda:

```bash
cd /var/www/upcreate
git pull   # veya yeni artefaktı kopyalayın

cd backend && npm ci && npx prisma generate && npx prisma db push && npm run build && npm test
cd ../panel && npm ci && npm run build
cd ../landing && npm ci && npm run build

pm2 reload ecosystem.config.cjs --update-env
```

---

## 9. Kontrol listesi

| Madde | OK |
|-------|-----|
| `JWT_SECRET` üretimde tanımlı, varsayılan secret kullanılmıyor | ☐ |
| `DATABASE_URL` doğru | ☐ |
| `CORS_ORIGIN` canlı site URL’leri | ☐ |
| Panel `NEXT_PUBLIC_API_URL` tarayıcıdan erişilebilir API kökü | ☐ |
| Seed admin şifresi değiştirildi / seed sadece staging’de | ☐ |
| HTTPS aktif | ☐ |

---

## Sorun giderme

- **502**: PM2’de süreç çalışıyor mu (`pm2 logs`), portlar dinleniyor mu (`ss -tlnp`).
- **Panel 401 / CORS**: `NEXT_PUBLIC_API_URL` tam URL ve `/api/v1` ile bitiyor mu; nginx `/api/` bloğu 4000’e gidiyor mu.
- **Prisma**: `npx prisma db push` şema ile uyumlu mu; log’larda bağlantı hatası var mı.

Detaylı örnek dosyalar: `deploy/nginx-upcreate.example.conf`, `deploy/ecosystem.config.cjs`.

---

## Sunucuda tek komut (güncelleme)

Kod `$ROOT` altındaysa (ör. `/var/www/upcreate`):

```bash
export UPCREATE_ROOT=/var/www/upcreate
bash "$UPCREATE_ROOT/scripts/server-deploy.sh"
```

Önce `backend/.env`, `panel/.env.production` ve nginx’in kurulu olduğundan emin olun.

## Canlı doğrulama (laptop’tan)

```bash
./scripts/verify-live.sh https://upcreate.co
```

`GET /api/v1/health` **JSON** dönmeli. **Wix HTML** görürseniz DNS hâlâ Wix’e gidiyordur — bkz. `docs/DNS_UPCREATE.md` → *Seçenek B*.
