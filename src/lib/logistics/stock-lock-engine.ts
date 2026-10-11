import prisma from "@/lib/db";

export interface CreateStockLockInput {
  tenantId: string;
  productId: string;
  customerPhone: string;
  quantity?: number;
  isPrepaid?: boolean;
}

export interface StockLockResult {
  success: boolean;
  message: string;
  lockId?: string;
  expiresAt?: Date;
  lockType?: string;
  availableStock?: number;
}

/**
 * Check if the current time in Bangladesh (UTC+6) falls within Night DND (10:00 PM - 9:00 AM).
 */
export function isNightDndWindow(date: Date = new Date()): boolean {
  // Compute Bangladesh local hour (UTC+6)
  const utcHours = date.getUTCHours();
  const bdHours = (utcHours + 6) % 24;
  return bdHours >= 22 || bdHours < 9;
}

/**
 * Calculate lock expiration:
 * - Day Orders: 2 hours TTL
 * - Night DND Orders: Extended until 9:30 AM BD time the following morning
 */
export function calculateLockExpiration(isPrepaid: boolean, now: Date = new Date()): { expiresAt: Date; lockType: string } {
  if (isPrepaid) {
    // Prepaid orders get a confirmed 24h lock until warehouse dispatch
    return {
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      lockType: "prepaid_confirmed",
    };
  }

  if (isNightDndWindow(now)) {
    // Extend until 9:30 AM Bangladesh Time
    const target = new Date(now);
    const utcHours = now.getUTCHours();
    const bdHours = (utcHours + 6) % 24;

    // Set to 09:30 BD time (03:30 UTC)
    target.setUTCHours(3, 30, 0, 0);
    // If order placed between 10 PM and midnight, target is next calendar day
    if (bdHours >= 22) {
      target.setUTCDate(target.getUTCDate() + 1);
    }
    return {
      expiresAt: target,
      lockType: "cod_night_dnd",
    };
  }

  // Standard Day COD lock: 2 hours TTL
  return {
    expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    lockType: "cod_day",
  };
}

/**
 * Pillar 4 & 5: Context-Aware Soft-Locking with 50% Night Cap
 */
export async function acquireStockLock(
  input: CreateStockLockInput
): Promise<StockLockResult> {
  const { tenantId, productId, customerPhone, quantity = 1, isPrepaid = false } = input;
  const now = new Date();

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch Product with current stock
    const product = await tx.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product || !product.isActive) {
      return { success: false, message: "পণ্যটি বর্তমানে উপলভ্য নয়।" };
    }

    // 2. Count all active (non-released, unexpired) soft-locks
    const activeLocks = await tx.stockLock.findMany({
      where: {
        productId,
        tenantId,
        isReleased: false,
        expiresAt: { gt: now },
      },
    });

    const currentlyLockedCount = activeLocks.reduce((acc, l) => acc + l.quantity, 0);
    const availableForLock = product.stock - currentlyLockedCount;

    if (availableForLock < quantity) {
      return {
        success: false,
        message: `দুঃখিত! এই পণ্যটির মাত্র ${Math.max(0, availableForLock)} টি স্টকে খালি আছে।`,
        availableStock: availableForLock,
      };
    }

    // 3. 50% Night Lock Cap Enforcement for unconfirmed COD orders
    if (!isPrepaid && isNightDndWindow(now)) {
      const nightCap = Math.floor(product.stock * 0.5);
      const activeNightCodLocks = activeLocks
        .filter((l) => l.lockType === "cod_night_dnd")
        .reduce((acc, l) => acc + l.quantity, 0);

      if (activeNightCodLocks + quantity > nightCap) {
        return {
          success: false,
          message: "রাতের আনকনফার্মড অর্ডারের ৫০% কোটা পূর্ণ হয়ে গেছে। সরাসরি বিকাশ পেমেন্টে কনফার্ম করুন অথবা সকাল ৯টায় পুনরায় চেষ্টা করুন।",
          availableStock: availableForLock,
        };
      }
    }

    // 4. Calculate Expiration and Create Lock
    const { expiresAt, lockType } = calculateLockExpiration(isPrepaid, now);

    const lock = await tx.stockLock.create({
      data: {
        tenantId,
        productId,
        customerPhone,
        quantity,
        lockType,
        expiresAt,
        isReleased: false,
      },
    });

    return {
      success: true,
      message: "পণ্যটির স্টক সফলভাবে সাময়িকভাবে লক করা হয়েছে।",
      lockId: lock.id,
      expiresAt,
      lockType,
      availableStock: availableForLock - quantity,
    };
  });
}

/**
 * Instant Payer Pre-emption ("Cash is King")
 * When Customer B pays 100% via bKash/Nagad and stock is low,
 * Customer B's payment pre-empts and invalidates unconfirmed night COD locks.
 */
export async function preEmptCodStockLock(
  tenantId: string,
  productId: string,
  prepaidOrderId: string,
  requiredQuantity: number = 1
): Promise<{ preEmptedCount: number; affectedPhones: string[] }> {
  const now = new Date();

  return await prisma.$transaction(async (tx) => {
    // Find oldest unconfirmed COD night/day locks
    const codLocks = await tx.stockLock.findMany({
      where: {
        tenantId,
        productId,
        isReleased: false,
        expiresAt: { gt: now },
        lockType: { in: ["cod_night_dnd", "cod_day"] },
      },
      orderBy: { createdAt: "asc" },
      take: requiredQuantity,
    });

    const affectedPhones: string[] = [];

    for (const lock of codLocks) {
      await tx.stockLock.update({
        where: { id: lock.id },
        data: {
          isReleased: true,
          preemptedBy: prepaidOrderId,
        },
      });
      affectedPhones.push(lock.customerPhone);
    }

    return {
      preEmptedCount: codLocks.length,
      affectedPhones,
    };
  });
}
