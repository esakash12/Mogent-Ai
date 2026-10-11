import * as React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { SalesBarChart } from "@/components/dashboard/sales-bar-chart";
import { TopProducts } from "@/components/dashboard/top-products";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  MessageSquare,
  Package,
  Truck,
  ArrowRight,
  ShieldCheck,
  Zap,
  ShoppingBag,
  ExternalLink,
  PhoneCall,
  Plus,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);

  if (!tenant) {
    notFound();
  }

  // Calculate real-time timestamps
  const now = new Date();
  const currentHour = now.getHours();
  const greeting =
    currentHour >= 5 && currentHour < 12
      ? "শুভ সকাল"
      : currentHour >= 12 && currentHour < 17
      ? "শুভ অপরাহ্ন"
      : currentHour >= 17 && currentHour < 20
      ? "শুভ সন্ধ্যা"
      : "স্বাগতম";

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  // Real-time Sales & Orders Aggregations
  const [
    todaySalesAgg,
    yesterdaySalesAgg,
    ordersTodayCount,
    totalMessagesCount,
    aiMessagesCount,
    activeChannelsList,
    productsList,
    recentMessagesList,
    past7DaysOrdersList,
    latestOrders,
  ] = await Promise.all([
    // Today's total sales
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        tenantId: tenant.id,
        createdAt: { gte: todayStart },
      },
    }),
    // Yesterday's total sales for growth %
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        tenantId: tenant.id,
        createdAt: { gte: yesterdayStart, lt: todayStart },
      },
    }),
    // Orders today
    prisma.order.count({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: todayStart },
      },
    }),
    // Total messages
    prisma.message.count({
      where: { tenantId: tenant.id },
    }),
    // AI handled messages
    prisma.message.count({
      where: {
        tenantId: tenant.id,
        senderType: "AI",
      },
    }),
    // Active channels
    prisma.channel.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
      },
    }),
    // Top products
    prisma.product.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
      },
      orderBy: { stock: "desc" },
      take: 5,
    }),
    // Recent 24h messages for ActivityChart
    prisma.message.findMany({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { createdAt: true, senderType: true },
    }),
    // Recent 7 days orders for SalesBarChart
    prisma.order.findMany({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { createdAt: true, totalAmount: true },
    }),
    // Latest orders for Live Action Ticker
    prisma.order.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  // Compute live 24-hour message activity points
  const activityBuckets = [
    { time: "12am", ai: 0, human: 0, minHour: 0, maxHour: 3 },
    { time: "4am", ai: 0, human: 0, minHour: 4, maxHour: 7 },
    { time: "8am", ai: 0, human: 0, minHour: 8, maxHour: 11 },
    { time: "12pm", ai: 0, human: 0, minHour: 12, maxHour: 15 },
    { time: "4pm", ai: 0, human: 0, minHour: 16, maxHour: 19 },
    { time: "8pm", ai: 0, human: 0, minHour: 20, maxHour: 23 },
  ];

  for (const msg of recentMessagesList) {
    const hour = msg.createdAt.getHours();
    const bucket = activityBuckets.find((b) => hour >= b.minHour && hour <= b.maxHour);
    if (bucket) {
      if (msg.senderType === "AI") bucket.ai++;
      else bucket.human++;
    }
  }

  const activityChartData = activityBuckets.map(({ time, ai, human }) => ({
    time,
    ai,
    human,
  }));

  // Compute live 7-day sales points
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const salesMap = new Map<string, { sales: number; orders: number }>();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayLabel = dayNames[d.getDay()];
    salesMap.set(dayLabel, { sales: 0, orders: 0 });
  }

  for (const ord of past7DaysOrdersList) {
    const dayLabel = dayNames[ord.createdAt.getDay()];
    if (salesMap.has(dayLabel)) {
      const entry = salesMap.get(dayLabel)!;
      entry.sales += ord.totalAmount;
      entry.orders += 1;
    }
  }

  const salesBarChartData = Array.from(salesMap.entries()).map(([day, val]) => ({
    day,
    sales: Math.round(val.sales),
    orders: val.orders,
  }));

  const todaySales = todaySalesAgg._sum.totalAmount || 0;
  const yesterdaySales = yesterdaySalesAgg._sum.totalAmount || 0;
  const salesChangePercent =
    yesterdaySales > 0
      ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100)
      : todaySales > 0
      ? 100
      : 0;

  const aiAutomationRate =
    totalMessagesCount > 0
      ? Math.round((aiMessagesCount / totalMessagesCount) * 100)
      : 100;

  const connectedChannels = {
    facebook: activeChannelsList.some((c) => c.type === "FACEBOOK"),
    whatsapp: activeChannelsList.some((c) => c.type === "WHATSAPP"),
    instagram: activeChannelsList.some((c) => c.type === "INSTAGRAM"),
  };

  return (
    <div className="space-y-6 font-body">
      {/* 1. Hero Commerce HUD Banner (Clean Light SaaS) */}
      <div className="clean-card rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-sm font-bengali">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Mogent AI এন্টারপ্রাইজ ককপিট v15.0 • লাইভ অটোমেশন</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {greeting}, {tenant.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              আপনার স্টোরের এআই সেলস এজেন্ট গত ২৪ ঘণ্টায় <strong className="text-indigo-600 font-mono">{recentMessagesList.length}</strong> টি চ্যাট প্রসেস করেছে এবং নিশ্চিত করেছে <strong className="text-emerald-600 font-mono">{ordersTodayCount}</strong> টি নতুন অর্ডার।
            </p>
          </div>

          {/* Quick Fast Action Bar */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <Link
              href={`/${tenant.slug}/inbox`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>অমনিচ্যানেল ইনবক্স</span>
            </Link>

            <Link
              href={`/${tenant.slug}/sales/orders`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition-all shadow-2xs"
            >
              <Package className="w-4 h-4 text-slate-500" />
              <span>অর্ডার ও কুরিয়ার</span>
            </Link>

            <Link
              href={`/${tenant.slug}/calls/ai-calls`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition-all shadow-2xs"
            >
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <span>এআই কলস</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. KPI Metric Cards Grid */}
      <KpiCards
        todaySales={todaySales}
        todaySalesChangePercent={salesChangePercent}
        ordersToday={ordersTodayCount}
        aiAutomationRate={aiAutomationRate}
        connectedChannels={connectedChannels}
      />

      {/* 3. Live AI Action Ticker (Latest Orders) */}
      {latestOrders.length > 0 && (
        <div className="clean-card rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-sm font-bengali">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                লাইভ এআই অ্যাকশন ফিড (সাম্প্রতিক কনফার্মড অর্ডার)
              </span>
            </div>
            <Link
              href={`/${tenant.slug}/sales/orders`}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>সব দেখুন</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {latestOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-bold text-slate-900 block truncate">
                    {ord.customerName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5 truncate">
                    {ord.orderNumber} · {ord.channel}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-indigo-600 font-mono text-xs block">
                    ৳{ord.totalAmount}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Analytics Charts & Top Products Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Analytics Charts */}
        <div className="space-y-6 lg:col-span-2">
          <ActivityChart data={activityChartData} />
          <SalesBarChart data={salesBarChartData} />
        </div>

        {/* Right 1 Column: Top Selling Products */}
        <div className="lg:col-span-1">
          <TopProducts products={productsList} tenantSlug={tenant.slug} />
        </div>
      </div>
    </div>
  );
}
