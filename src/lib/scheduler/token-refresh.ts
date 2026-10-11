import prisma from "@/lib/db";

/**
 * Checks all active Meta (Facebook/WhatsApp) channels and alerts if token is expiring within 7 days.
 */
export async function auditAndRefreshExpiringTokens(): Promise<{
  checked: number;
  expiringCount: number;
}> {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const expiringChannels = await prisma.channel.findMany({
    where: {
      isActive: true,
      tokenExpiresAt: {
        lte: sevenDaysFromNow,
      },
    },
    include: {
      tenant: true,
    },
  });

  for (const channel of expiringChannels) {
    // Alert merchant about channel expiration
    await prisma.notification.create({
      data: {
        tenantId: channel.tenantId,
        title: `${channel.type} কানেকশন রিনিউ প্রয়োজন`,
        message: `আপনার ${channel.pageName || channel.type} পেজের মেটা টোকেন আগামী ৭ দিনের মধ্যে এক্সপায়ার হবে। দয়া করে ইন্টিগ্রেশন পেজ থেকে ১-ক্লিকে পুনরায় কানেক্ট করুন।`,
        type: "SYSTEM",
      },
    });
  }

  return {
    checked: await prisma.channel.count({ where: { isActive: true } }),
    expiringCount: expiringChannels.length,
  };
}
