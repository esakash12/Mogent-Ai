import prisma from "@/lib/db";

/**
 * Checks all tenant wallets and automatically pauses AI service for those
 * with zero or negative balances, and sends notification alerts.
 */
export async function auditWalletBalancesAndPauseExhausted(): Promise<{
  checked: number;
  paused: number;
}> {
  const tenantsWithWallets = await prisma.tenant.findMany({
    include: {
      wallet: true,
      aiSetting: true,
    },
  });

  let pausedCount = 0;

  for (const tenant of tenantsWithWallets) {
    const currentBalance = tenant.wallet?.balanceBdt ?? 0;

    // If balance is 0 or less and AI is currently active, auto-pause AI service
    if (currentBalance <= 0 && tenant.aiSetting?.aiActive) {
      await prisma.$transaction([
        // 1. Pause AI
        prisma.aiSetting.upsert({
          where: { tenantId: tenant.id },
          update: { aiActive: false },
          create: {
            tenantId: tenant.id,
            aiActive: false,
          },
        }),
        // 2. Insert alert notification
        prisma.notification.create({
          data: {
            tenantId: tenant.id,
            title: "AI সার্ভিস সাময়িক স্থগিত (ব্যালেন্স শেষ)",
            message:
              "আপনার ওয়ালেট ব্যালেন্স শূন্য হয়ে যাওয়ায় স্বয়ংক্রিয় AI রিপ্লাই সাময়িক বন্ধ করা হয়েছে। সেবা পুনরায় চালু করতে ব্যালেন্স রিচার্জ করুন।",
            type: "BALANCE_ALERT",
          },
        }),
        // 3. Log activity
        prisma.activityLog.create({
          data: {
            tenantId: tenant.id,
            action: "AI_AUTO_PAUSED",
            details: `Wallet balance reached ${currentBalance} BDT. AI automatically paused by billing scheduler.`,
          },
        }),
      ]);

      pausedCount++;
    }
  }

  return {
    checked: tenantsWithWallets.length,
    paused: pausedCount,
  };
}
