import prisma from "@/lib/db";

export interface ZombieStockReleaseReport {
  releasedLocksCount: number;
  restoredProductsCount: number;
  timestamp: Date;
}

/**
 * Pillar 7: 2-Hour Zombie Stock Auto-Releaser
 * Releases unverified / unconfirmed locked inventory back to active stock (Stock + quantity).
 */
export async function releaseExpiredZombieLocks(): Promise<ZombieStockReleaseReport> {
  const now = new Date();

  return await prisma.$transaction(async (tx) => {
    // 1. Find all expired, unreleased soft-locks
    const expiredLocks = await tx.stockLock.findMany({
      where: {
        isReleased: false,
        expiresAt: { lte: now },
      },
      include: { product: true },
    });

    let restoredProductsCount = 0;

    for (const lock of expiredLocks) {
      // Mark lock as released
      await tx.stockLock.update({
        where: { id: lock.id },
        data: { isReleased: true },
      });

      // Restore product stock: Stock + quantity
      if (lock.productId) {
        await tx.product.update({
          where: { id: lock.productId },
          data: { stock: { increment: lock.quantity } },
        });
        restoredProductsCount++;
      }
    }

    if (expiredLocks.length > 0) {
      console.log(
        `[ZombieStockReleaser] Released ${expiredLocks.length} expired locks across ${restoredProductsCount} products at ${now.toISOString()}`
      );
    }

    return {
      releasedLocksCount: expiredLocks.length,
      restoredProductsCount,
      timestamp: now,
    };
  });
}
