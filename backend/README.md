# Upcreate — Backend

Creator Intelligence API (Node.js + Express + Prisma + PostgreSQL).

## Swagger UI

- **Local:** http://localhost:4000/api/v1/docs  
- **Production:** `https://<your-domain>/api/v1/docs`  
- **OpenAPI JSON:** `/api/v1/docs/openapi.json`

## Geliştirme

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run db:seed   # demo admin: admin@upcreate.demo / demo12345
npm run dev
```

Set `JWT_SECRET` in `.env` for production. Optional: `ADMIN_REGISTER_SECRET` to allow `POST /auth/register` with `role: ADMIN`.

## Build & çalıştırma

```bash
npm run build
npm start
```

`openapi.json` proje kökünde; derlenmiş `dist/` ile birlikte çalışma dizininde bulunmalı (sunucuda örn. `~/upcreate-backend/`).

Alan adı ve DNS için üst dizinde `docs/DNS_UPCREATE.md` dosyasına bakın.
