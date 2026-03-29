/**
 * PM2 — sunucuda yolları kendi dizininize göre düzenleyin.
 * Kullanım: cd /var/www/upcreate/deploy && pm2 start ecosystem.config.cjs
 */
const root = process.env.UPCREATE_ROOT || "/var/www/upcreate";

module.exports = {
  apps: [
    {
      name: "upcreate-api",
      cwd: `${root}/backend`,
      script: "dist/index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
    {
      name: "upcreate-landing",
      cwd: `${root}/landing`,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "upcreate-panel",
      cwd: `${root}/panel`,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
