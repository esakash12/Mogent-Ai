import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Strict Security Guard: Only authenticated SUPER_ADMIN can adjust balances
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র সুপার অ্যাডমিন এই পরিবর্তন করতে পারবেন।" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { tenantId, amount, type = "CREDIT", description } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "মার্চেন্ট আইডি প্রদান করা আবশ্যক।" }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "টাকার পরিমাণ একটি ধনাত্মক সংখ্যা (Positive Number) হতে হবে।" },
        { status: 400 }
      );
    }

    // 2. Fetch merchant wallet or create one if not yet initialized
    let wallet = await prisma.wallet.findUnique({
      where: { tenantId },
      include: { tenant: true },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          tenantId,
          balanceBdt: 0.0,
        },
        include: { tenant: true },
      });
    }

    const currentBalance = wallet.balanceBdt;
    if (type !== "CREDIT" && type !== "DEBIT") {
      return NextResponse.json({ error: "অবৈধ অ্যাডজাস্টমেন্ট টাইপ।" }, { status: 400 });
    }

    const note = description?.trim() || (type === "CREDIT" ? "সুপার অ্যাডমিন ম্যানুয়াল টপ-আপ" : "সুপার অ্যাডমিন ব্যালেন্স ডেবিট");
    const ledgerAmount = type === "CREDIT" ? numAmount : -numAmount;

    // 3. Atomically update wallet balance with concurrency safety and audit ledger entry
    const result = await prisma.$transaction(async (tx) => {
      const freshWallet = await tx.wallet.findUnique({
        where: { id: wallet.id },
      });
      if (!freshWallet) {
        throw new Error("ওয়ালেট পাওয়া যায়নি।");
      }

      if (type === "DEBIT" && freshWallet.balanceBdt < numAmount) {
        throw new Error(`মার্চেন্টের পর্যাপ্ত ব্যালেন্স নেই। বর্তমান ব্যালেন্স: ৳${freshWallet.balanceBdt.toFixed(2)}`);
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balanceBdt: type === "CREDIT"
            ? { increment: numAmount }
            : { decrement: numAmount },
        },
      });

      const ledger = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          tenantId,
          amount: ledgerAmount,
          type: type === "CREDIT" ? "TOPUP" : "SUBSCRIPTION_FEE",
          description: `[SUPER ADMIN] ${note}`,
          balanceAfter: updatedWallet.balanceBdt,
        },
      });

      return { updatedWallet, ledger };
    });

    return NextResponse.json({
      success: true,
      message: `মার্চেন্ট "${wallet.tenant.name}"-এর ওয়ালেটে ৳${numAmount.toFixed(2)} সফলভাবে ${type === "CREDIT" ? "যুক্ত" : "কর্তন"} করা হয়েছে।`,
      balanceBdt: result.updatedWallet.balanceBdt,
      tenantId,
    });
  } catch (error: any) {
    console.error("Admin balance adjust error:", error);
    return NextResponse.json({ error: error.message || "সার্ভার এরর।" }, { status: 500 });
  }
}
