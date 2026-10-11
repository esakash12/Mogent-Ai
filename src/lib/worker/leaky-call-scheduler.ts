import prisma from "@/lib/db";

export interface LeakyCallSchedulerConfig {
  maxCallsPerMinutePerTenant: number; // typically 3-5
  maxConcurrentChannelsPerTenant: number; // typically 5
}

export interface LeakyCallDispatchResult {
  tenantId: string;
  dispatchedOrderIds: string[];
  skippedDueToCapacity: number;
}

const DEFAULT_CONFIG: LeakyCallSchedulerConfig = {
  maxCallsPerMinutePerTenant: 4,
  maxConcurrentChannelsPerTenant: 5,
};

/**
 * Pillar 5: 9:01 AM Thundering Herd Leaky Bucket Call Scheduler
 * Rate-limits morning voice confirmations to 3-5 calls/min per store,
 * prioritizing high cart value orders and respecting concurrency limits.
 */
export async function scheduleMorningLeakyCalls(
  config: LeakyCallSchedulerConfig = DEFAULT_CONFIG
): Promise<LeakyCallDispatchResult[]> {
  const results: LeakyCallDispatchResult[] = [];

  // 1. Fetch active tenants with NIGHT_PENDING orders
  const tenantsWithNightOrders = await prisma.tenant.findMany({
    where: {
      orders: {
        some: {
          status: "NIGHT_PENDING",
        },
      },
    },
    select: { id: true, name: true },
  });

  for (const tenant of tenantsWithNightOrders) {
    const tenantId = tenant.id;

    // Check active ongoing calls for this tenant
    const activeCallsCount = await prisma.order.count({
      where: {
        tenantId,
        status: "CALLING",
      },
    });

    const availableChannels = Math.max(
      0,
      config.maxConcurrentChannelsPerTenant - activeCallsCount
    );

    if (availableChannels <= 0) {
      results.push({
        tenantId,
        dispatchedOrderIds: [],
        skippedDueToCapacity: 0,
      });
      continue;
    }

    // Determine how many calls can be dispatched this minute slice
    const quotaThisCycle = Math.min(
      availableChannels,
      config.maxCallsPerMinutePerTenant
    );

    // Fetch highest-value night orders first (Priority Sorting)
    const pendingOrders = await prisma.order.findMany({
      where: {
        tenantId,
        status: "NIGHT_PENDING",
      },
      orderBy: [
        { totalAmount: "desc" }, // High cart value priority
        { createdAt: "asc" },    // First-in for equal value
      ],
      take: quotaThisCycle,
    });

    const dispatchedIds: string[] = [];

    for (const order of pendingOrders) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "CALLING",
        },
      });

      console.log(
        `[LeakyCallScheduler] Dispatched voice call for order ${order.id} (Phone: ${order.customerPhone}, Total: ৳${order.totalAmount})`
      );

      dispatchedIds.push(order.id);
    }

    const remainingPendingCount = await prisma.order.count({
      where: {
        tenantId,
        status: "NIGHT_PENDING",
      },
    });

    results.push({
      tenantId,
      dispatchedOrderIds: dispatchedIds,
      skippedDueToCapacity: remainingPendingCount,
    });
  }

  return results;
}
