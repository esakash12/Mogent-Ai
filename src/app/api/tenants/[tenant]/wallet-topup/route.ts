import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: { tenant: string } }
) {
  try {
    // 1. Session & Permission Verification
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস। অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    if (session.role !== "SUPER_ADMIN" && session.tenantSlug !== params.tenant) {
      return NextResponse.json({ error: "অননুমোদিত টেন্যান্ট অ্যাকশন নিষিদ্ধ।" }, { status: 403 });
    }

    const { amount, paymentMethod = "MANUAL", transactionId } = await request.json();
    const topupAmount = parseFloat(amount);

    if (isNaN(topupAmount) || topupAmount <= 0) {
      return NextResponse.json({ error: "সঠিক রিচার্জের পরিমাণ লিখুন।" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenant },
      include: { wallet: true },
    });

    if (!tenant || !tenant.wallet) {
      return NextResponse.json({ error: "Tenant or wallet not found" }, { status: 404 });
    }

    const currentBalance = tenant.wallet.balanceBdt;
    const newBalance = currentBalance + topupAmount;

    // Run in transaction: update wallet balance & record ledger entry
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: tenant.wallet.id },
        data: { balanceBdt: newBalance },
      }),
      prisma.ledgerEntry.create({
        data: {
          walletId: tenant.wallet.id,
          tenantId: tenant.id,
          amount: topupAmount,
          type: "TOPUP",
          description: `Manual PAYG Wallet Top-up (৳${topupAmount})`,
          balanceAfter: newBalance,
        },
      }),
      // If AI was auto-paused due to low balance, re-activate it
      prisma.aiSetting.upsert({
        where: { tenantId: tenant.id },
        update: { aiActive: true },
        create: { tenantId: tenant.id, aiActive: true },
      }),
    ]);

    return NextResponse.json({ success: true, newBalance });
  } catch (error) {
    console.error("Topup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
