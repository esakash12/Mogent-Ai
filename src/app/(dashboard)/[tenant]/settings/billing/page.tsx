import * as React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";
import { CreditCard, Wallet, TrendingDown, TrendingUp, Clock } from "lucide-react";
import { formatCurrencyBdt, formatDate } from "@/lib/utils";

export default async function BillingPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);

  if (!tenant) {
    notFound();
  }

  const [ledgerEntries, superConfig] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.superAdminConfig.findFirst(),
  ]);

  const perMessageCost = superConfig?.perMessageCost ?? 0.25;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-indigo-600" />
          Billing & PAYG Wallet
        </h1>
        <p className="text-xs text-slate-400">
          Manage your Pay-As-You-Go wallet balance, top-up history, and per-message ledger deductions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-xs">
          <span className="text-xs font-bold text-amber-700 uppercase">Available Balance</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {formatCurrencyBdt(tenant.wallet?.balanceBdt || 0)}
          </div>
          <span className="text-[11px] text-amber-700 mt-1 block font-semibold">
            Pay As You Go (PAYG Plan)
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Per-Message AI Cost</span>
          <div className="text-3xl font-extrabold text-indigo-600 mt-2">৳{perMessageCost.toFixed(2)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            শুধুমাত্র AI রিপ্লাই ও স্টক চেকে প্রযোজ্য (হিউম্যান চ্যাট সম্পূর্ণ ফ্রি)
          </span>
        </div>
      </div>

      {/* Ledger History */}
      <div className="rounded-2xl border border-border bg-white shadow-xs dark:bg-slate-950 overflow-hidden">
        <div className="p-4 border-b border-border font-bold text-sm text-slate-900">
          Transaction & Usage Ledger
        </div>

        {ledgerEntries.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            এখনো কোনো ট্রানজ্যাকশন হিস্ট্রি নেই।
          </div>
        ) : (
          <div className="divide-y divide-border/80 text-xs">
            {ledgerEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      entry.amount > 0
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {entry.amount > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{entry.description}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(entry.createdAt)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-bold ${
                      entry.amount > 0 ? "text-emerald-600" : "text-slate-800"
                    }`}
                  >
                    {entry.amount > 0 ? `+৳${entry.amount}` : `-৳${Math.abs(entry.amount)}`}
                  </span>
                  <div className="text-[10px] text-slate-400">
                    Bal: {formatCurrencyBdt(entry.balanceAfter)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
