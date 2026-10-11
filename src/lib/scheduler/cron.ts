import cron from "node-cron";
import { auditWalletBalancesAndPauseExhausted } from "./billing-cycle";
import { auditAndRefreshExpiringTokens } from "./token-refresh";

let isSchedulerRunning = false;

/**
 * Initializes and starts all background scheduled cron jobs for the platform.
 */
export function initCronJobs() {
  if (isSchedulerRunning) {
    return;
  }

  // 1. Every 15 minutes: Check all merchant wallets for zero-balance and auto-pause AI if depleted
  cron.schedule("*/15 * * * *", async () => {
    console.log("[CRON] Running 15-min wallet balance audit...");
    try {
      const result = await auditWalletBalancesAndPauseExhausted();
      console.log(`[CRON] Wallet audit complete. Checked: ${result.checked}, Paused: ${result.paused}`);
    } catch (error) {
      console.error("[CRON] Error during wallet balance audit:", error);
    }
  });

  // 2. Daily at 02:00 AM: Audit expiring Meta / WhatsApp channel tokens
  cron.schedule("0 2 * * *", async () => {
    console.log("[CRON] Running daily Meta token expiration check...");
    try {
      const result = await auditAndRefreshExpiringTokens();
      console.log(`[CRON] Token audit complete. Checked: ${result.checked}, Expiring: ${result.expiringCount}`);
    } catch (error) {
      console.error("[CRON] Error during token audit:", error);
    }
  });

  isSchedulerRunning = true;
  console.log("[SCHEDULER] All cron jobs initialized successfully.");
}
