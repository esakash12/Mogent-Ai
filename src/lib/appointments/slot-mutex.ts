import prisma from "@/lib/db";

export interface LockSlotInput {
  tenantId: string;
  providerName: string;
  startTime: Date;
  endTime: Date;
  customerPhone: string;
}

export interface LockSlotResult {
  success: boolean;
  message: string;
  slotId?: string;
  lockedUntil?: Date;
}

/**
 * Pillar 10: 5-Minute Atomic Slot Mutex for Clinics & Salons
 * Prevents race conditions and double-booking using atomic database transactions.
 */
export async function acquireAppointmentSlotMutex(
  input: LockSlotInput
): Promise<LockSlotResult> {
  const { tenantId, providerName, startTime, endTime, customerPhone } = input;
  const now = new Date();
  const mutexLockExpiry = new Date(now.getTime() + 5 * 60 * 1000); // 5-minute mutex window

  return await prisma.$transaction(async (tx) => {
    // 1. Check if slot already exists and is locked or booked
    const existingSlot = await tx.appointmentSlot.findUnique({
      where: {
        tenantId_providerName_startTime: {
          tenantId,
          providerName,
          startTime,
        },
      },
    });

    if (existingSlot) {
      if (existingSlot.isBooked) {
        return {
          success: false,
          message: `দুঃখিত! এই সময়ে (${providerName}-এর) অ্যাপয়েন্টমেন্ট ইতিমধ্যে বুক করা হয়ে গেছে।`,
        };
      }

      // Check if another customer currently holds an active 5-minute mutex lock
      if (
        existingSlot.lockedUntil &&
        existingSlot.lockedUntil > now &&
        existingSlot.customerPhone !== customerPhone
      ) {
        return {
          success: false,
          message: "এই স্লটটি অন্য একজন রোগী/গ্রাহক কনফার্ম করছেন। অনুগ্রহ করে অন্য কোনো সময় নির্বাচন করুন।",
        };
      }

      // Renew / acquire mutex lock
      const updated = await tx.appointmentSlot.update({
        where: { id: existingSlot.id },
        data: {
          lockedUntil: mutexLockExpiry,
          customerPhone,
        },
      });

      return {
        success: true,
        message: "অ্যাপয়েন্টমেন্ট স্লটটি আগামী ৫ মিনিটের জন্য সাময়িকভাবে সংরক্ষিত করা হয়েছে।",
        slotId: updated.id,
        lockedUntil: mutexLockExpiry,
      };
    }

    // 2. Create fresh slot with 5-minute mutex
    const newSlot = await tx.appointmentSlot.create({
      data: {
        tenantId,
        providerName,
        startTime,
        endTime,
        isBooked: false,
        lockedUntil: mutexLockExpiry,
        customerPhone,
      },
    });

    return {
      success: true,
      message: "অ্যাপয়েন্টমেন্ট স্লটটি আগামী ৫ মিনিটের জন্য সংরক্ষিত হয়েছে।",
      slotId: newSlot.id,
      lockedUntil: mutexLockExpiry,
    };
  });
}

/**
 * Confirm and permanently book an appointment slot after payment / confirmation
 */
export async function confirmAppointmentSlot(
  slotId: string,
  tenantId: string,
  customerPhone: string
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.appointmentSlot.update({
      where: { id: slotId },
      data: {
        isBooked: true,
        lockedUntil: null,
        customerPhone,
      },
    });

    return {
      success: true,
      message: "অ্যাপয়েন্টমেন্ট বুকিং সফলভাবে সম্পন্ন হয়েছে!",
    };
  } catch (err: any) {
    return {
      success: false,
      message: `বুকিং নিশ্চিত করতে ত্রুটি হয়েছে: ${err.message}`,
    };
  }
}
