import cron from "node-cron";
import { ingestAllConnected } from "./services/ingestion";
import { prisma } from "./config/db";

/**
 * Cron jobs for automated data refresh.
 * Runs in the same process as the API server.
 */

export function startCronJobs() {
  // --- Daily Instagram Ingest ---
  // Runs every day at 02:00 AM server time
  // Fetches posts + comments for all connected IG accounts
  cron.schedule("0 2 * * *", async () => {
    console.log("[cron] Starting daily Instagram ingest...");
    try {
      const result = await ingestAllConnected("INSTAGRAM");
      console.log(
        `[cron] Daily IG ingest complete: ${result.success}/${result.total} accounts OK` +
          (result.tokenExpired ? " ⚠️ Token expired — manual refresh needed" : ""),
      );
    } catch (err) {
      console.error("[cron] Daily IG ingest failed:", (err as Error).message);
    }
  });

  // --- Token Expiry Warning Check ---
  // Runs every day at 08:00 AM
  // Logs accounts whose tokens expire within 7 days so the admin knows to refresh
  cron.schedule("0 8 * * *", async () => {
    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const expiringSoon = await prisma.socialAccount.findMany({
        where: {
          tokenExpiresAt: { lte: sevenDaysFromNow, gt: new Date() },
          isConnected: true,
        },
        select: { username: true, tokenExpiresAt: true, platform: true },
      });

      const expired = await prisma.socialAccount.findMany({
        where: {
          tokenExpiresAt: { lte: new Date() },
          isConnected: true,
        },
        select: { username: true, tokenExpiresAt: true, platform: true },
      });

      if (expired.length > 0) {
        console.warn(`[cron] ⚠️ EXPIRED TOKENS (${expired.length}): ${expired.map((a) => `@${a.username}`).join(", ")}`);
      }
      if (expiringSoon.length > 0) {
        console.warn(
          `[cron] ⏰ Tokens expiring within 7 days (${expiringSoon.length}): ` +
            expiringSoon
              .map((a) => {
                const days = a.tokenExpiresAt
                  ? Math.floor((a.tokenExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : "?";
                return `@${a.username} (${days}d)`;
              })
              .join(", "),
        );
      }
    } catch (err) {
      console.error("[cron] Token check failed:", (err as Error).message);
    }
  });

  console.log("[cron] Scheduled jobs started: daily ingest @02:00, token check @08:00");
}
