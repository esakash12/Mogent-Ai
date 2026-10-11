import prisma from "@/lib/db";

export interface RefundSweeperReport {
  sweptCount: number;
  processedIds: string[];
  timestamp: Date;
}

/**
 * Pillar 6 & 7: 12-Hour Abandoned Partial Advance & Refund Ledger Sweeper
 * Automatically sweeps unclaimed partial advance payments older than 12 hours.
 * Dispatches merchant notifications and prepares voucher / refund workflows.
 */
export async function sweepAbandonedAdvanceLedger(): Promise<RefundSweeperReport> {
  const cutoffTime = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago
  const now = new Date();

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch unclaimed records older than 12 hours
    const staleAdvances = await tx.refundLedger.findMany({
      where: {
        status: "unclaimed",
        createdAt: { lte: cutoffTime },
      },
    });

    const processedIds: string[] = [];

    for (const record of staleAdvances) {
      // Update status to 'voucher_issued' or flag for merchant intervention
      await tx.refundLedger.update({
        where: { id: record.id },
        data: {
          status: "voucher_issued",
          expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 day voucher validity
        },
      });

      // Create a merchant audit notification
      await tx.notification.create({
        data: {
          tenantId: record.tenantId,
          type: "REFUND_VOUCHER_ISSUED",
          title: "Abandoned Advance Swept",
          message: `Customer ${record.customerPhone} had an unclaimed partial advance of ৳${record.amount} (TrxID: ${record.sourceTrxId || "N/A"}). Converted to 30-day store credit voucher.`,
        },
      });

      processedIds.push(record.id);
    }

    if (processedIds.length > 0) {
      console.log(
        `[RefundLedgerSweeper] Swept ${processedIds.length} abandoned advance records at ${now.toISOString()}`
      );
    }

    return {
      sweptCount: processedIds.length,
      processedIds,
      timestamp: now,
    };
  });
}
