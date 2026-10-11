import * as React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";
import { BarChart3, TrendingUp, Users, MessageSquare } from "lucide-react";
import { formatCurrencyBdt } from "@/lib/utils";

export default async function AnalyticsPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);

  if (!tenant) {
    notFound();
  }

  const totalOrders = await prisma.order.count({ where: { tenantId: tenant.id } });
  const totalSalesAgg = await prisma.order.aggregate({
    _sum: { totalAmount: true },
    where: { tenantId: tenant.id },
  });
  const totalMessages = await prisma.message.count({ where: { tenantId: tenant.id } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-indigo-600" />
          Advanced Analytics & Performance
        </h1>
        <p className="text-xs text-slate-400">
          বিজনেস গ্রোথ, কনভার্সন রেট এবং AI অটোমেশনের দীর্ঘমেয়াদী পারফরম্যান্স রিপোর্ট।
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
          <span className="text-xs text-slate-400">Lifetime Sales</span>
          <div className="text-2xl font-extrabold text-indigo-600 mt-2">
            {formatCurrencyBdt(totalSalesAgg._sum.totalAmount || 0)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
          <span className="text-xs text-slate-400">Lifetime Orders</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalOrders}</div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
          <span className="text-xs text-slate-400">Total Conversations</span>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{totalMessages}</div>
        </div>
      </div>
    </div>
  );
}
